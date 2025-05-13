import os
import tempfile
import shutil
import json
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn
from transcriber import WhisperAPITranscriber, log

# Configuration management
CONFIG_FILE = "transcription_config.json"

# Default configuration
DEFAULT_CONFIG = {
    "base_url": os.getenv("BASE_URL", "https://api.openai.com/v1"),
    "models": ["whisper-1", "distil-whisper-large-v3-en"],
    "default_model": "whisper-1"
}

# Load or create configuration
def load_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        else:
            # Create default config file
            with open(CONFIG_FILE, "w") as f:
                json.dump(DEFAULT_CONFIG, f, indent=2)
            return DEFAULT_CONFIG
    except Exception as e:
        log(f"Error loading config: {str(e)}")
        return DEFAULT_CONFIG

# Save configuration
def save_config(config):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        log(f"Error saving config: {str(e)}")
        return False

# Load initial configuration
config = load_config()
BASE_URL = config["base_url"]

# Configuration
DEBUG = True
DEFAULT_OUTPUT_DIR = "outputs"
SUPPORTED_AUDIO_FORMATS = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"]
os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="Whisper Transcription API",
    description="API for transcribing audio files using Whisper",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Cache-Control"],
)

# In-memory store for job status
job_status = {}

# Models for API requests and responses
class TranscriptionRequest(BaseModel):
    api_key: str
    model: Optional[str] = None  # Use default_model from config if not specified
    base_url: Optional[str] = None  # Optional base URL override
    language: Optional[str] = "Automatic Detection"
    translate: Optional[bool] = False
    timestamp: Optional[bool] = True

class YouTubeRequest(BaseModel):
    api_key: str
    youtube_url: str
    model: Optional[str] = None  # Use default_model from config if not specified
    base_url: Optional[str] = None  # Optional base URL override
    language: Optional[str] = "Automatic Detection"
    translate: Optional[bool] = False
    timestamp: Optional[bool] = True

class TranscriptionResponse(BaseModel):
    job_id: str
    status: str
    message: str

class TranscriptionStatusResponse(BaseModel):
    status: str
    message: str
    result: Optional[Dict[str, Any]] = None

class ConfigModel(BaseModel):
    base_url: Optional[str] = None
    models: Optional[List[str]] = None
    default_model: Optional[str] = None

# Helper functions
def generate_job_id():
    """Generate a unique job ID"""
    import uuid
    return str(uuid.uuid4())

def update_job_status(job_id: str, status: str, message: str, result=None):
    """Update the status of a job"""
    job_status[job_id] = {
        "status": status,
        "message": message,
        "result": result
    }

# Background task functions
def process_file_transcription(job_id: str, file_path: str, api_key: str, model: str, 
                              base_url: Optional[str], language: str, translate: bool, timestamp: bool):
    """Process file transcription in the background"""
    try:
        update_job_status(job_id, "processing", "Transcription in progress...")
        
        # Use provided base_url or from config
        actual_base_url = base_url if base_url else config["base_url"]
        log(f"Using base URL: {actual_base_url}")
        
        transcriber = WhisperAPITranscriber(api_key, actual_base_url)
        result = transcriber.transcribe_file(
            file_path, model, language, translate, timestamp
        )
        
        if "error" in result:
            update_job_status(job_id, "error", f"Error: {result['error']}")
            return
        
        update_job_status(
            job_id, 
            "completed", 
            f"Transcription completed in {result['elapsed_time']:.2f} seconds",
            result
        )
    except Exception as e:
        log(f"Error in process_file_transcription: {str(e)}")
        update_job_status(job_id, "error", f"Error: {str(e)}")
    finally:
        # Clean up temporary file if it exists
        try:
            if os.path.exists(file_path) and tempfile.gettempdir() in file_path:
                os.remove(file_path)
                log(f"Removed temporary file: {file_path}")
        except Exception as e:
            log(f"Error removing temporary file: {str(e)}")

def process_youtube_transcription(job_id: str, youtube_url: str, api_key: str, model: str, 
                                 base_url: Optional[str], language: str, translate: bool, timestamp: bool):
    """Process YouTube transcription in the background"""
    try:
        update_job_status(job_id, "processing", "Downloading YouTube video...")
        
        # Use provided base_url or from config
        actual_base_url = base_url if base_url else config["base_url"]
        log(f"Using base URL: {actual_base_url}")
        
        transcriber = WhisperAPITranscriber(api_key, actual_base_url)
        result = transcriber.transcribe_youtube(
            youtube_url, model, language, translate, timestamp
        )
        
        if "error" in result:
            update_job_status(job_id, "error", f"Error: {result['error']}")
            return
        
        update_job_status(
            job_id, 
            "completed", 
            f"Transcription completed in {result['elapsed_time']:.2f} seconds",
            result
        )
    except Exception as e:
        log(f"Error in process_youtube_transcription: {str(e)}")
        update_job_status(job_id, "error", f"Error: {str(e)}")

# API Endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Whisper Transcription API is running"}

@app.get("/models")
async def get_models():
    """Get available models"""
    return {"models": config["models"]}

@app.get("/languages")
async def get_languages():
    """Get available languages"""
    languages = [
        "Automatic Detection", "English", "Spanish", "French", "German", 
        "Italian", "Portuguese", "Dutch", "Russian", "Japanese", 
        "Chinese", "Arabic", "Korean", "Hindi"
    ]
    return {"languages": languages}

@app.post("/transcribe/file", response_model=TranscriptionResponse)
async def transcribe_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    api_key: str = Form(...),
    model: Optional[str] = Form(None),
    base_url: Optional[str] = Form(None),
    language: Optional[str] = Form("Automatic Detection"),
    translate: Optional[bool] = Form(False),
    timestamp: Optional[bool] = Form(True)
):
    """Transcribe an audio file"""
    try:
        # Generate a job ID
        job_id = generate_job_id()
        
        # Check file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in SUPPORTED_AUDIO_FORMATS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file format. Supported formats: {', '.join(SUPPORTED_AUDIO_FORMATS)}"
            )
            
        # Use default model if not specified
        actual_model = model if model else config["default_model"]
            
        # Validate model exists in configured models if not using custom base_url
        if not base_url and actual_model not in config["models"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model. Available models: {', '.join(config['models'])}"
            )
        
        # Save uploaded file to a temporary location
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=file_ext)
        temp_file_path = temp_file.name
        
        # Write content to temporary file
        with open(temp_file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        
        # Start background processing
        update_job_status(job_id, "queued", "Job queued for processing")
        
        background_tasks.add_task(
            process_file_transcription,
            job_id, temp_file_path, api_key, actual_model, base_url, language, translate, timestamp
        )
        
        return {"job_id": job_id, "status": "queued", "message": "Transcription job has been queued"}
        
    except Exception as e:
        log(f"Error in transcribe_file endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe/youtube", response_model=TranscriptionResponse)
async def transcribe_youtube(background_tasks: BackgroundTasks, request: YouTubeRequest):
    """Transcribe a YouTube video"""
    try:
        # Generate a job ID
        job_id = generate_job_id()
        
        # Use default model if not specified
        model = request.model or config["default_model"]
        
        # Validate model exists in configured models if not using custom base_url
        if not request.base_url and model not in config["models"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model. Available models: {', '.join(config['models'])}"
            )
        
        # Start background processing
        update_job_status(job_id, "queued", "Job queued for processing")
        
        background_tasks.add_task(
            process_youtube_transcription,
            job_id, request.youtube_url, request.api_key, model,
            request.base_url, request.language, request.translate, request.timestamp
        )
        
        return {"job_id": job_id, "status": "queued", "message": "YouTube transcription job has been queued"}
        
    except Exception as e:
        log(f"Error in transcribe_youtube endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{job_id}", response_model=TranscriptionStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a transcription job"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Add cache control headers to prevent caching
    response = JSONResponse(content=job_status[job_id])
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/download/{job_id}")
async def download_result(job_id: str):
    """Download the transcription result"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_status[job_id]
    
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")
    
    if "result" not in job or "file_path" not in job["result"]:
        raise HTTPException(status_code=400, detail="No file available for download")
    
    file_path = job["result"]["file_path"]
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path, media_type="application/json", filename=os.path.basename(file_path))

@app.get("/youtube-info")
async def get_youtube_info(url: str):
    """Get information about a YouTube video"""
    try:
        transcriber = WhisperAPITranscriber("dummy_key", config["base_url"])  # API key not needed for this operation
        result = transcriber.download_youtube(url)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Clean up the downloaded file
        if "temp_dir" in result:
            try:
                shutil.rmtree(result["temp_dir"], ignore_errors=True)
            except Exception as e:
                log(f"Error removing temporary directory: {str(e)}")
        
        return {
            "title": result.get("title", "YouTube Video"),
            "thumbnail_url": result.get("thumbnail_url", None)
        }
        
    except Exception as e:
        log(f"Error in get_youtube_info endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# New Configuration Endpoints
@app.get("/config")
async def get_config():
    """Get current API configuration"""
    return config

@app.post("/config")
async def update_config(new_config: ConfigModel):
    """Update API configuration"""
    global config, BASE_URL
    
    # Update only provided fields
    if new_config.base_url is not None:
        config["base_url"] = new_config.base_url
        BASE_URL = new_config.base_url
        
    if new_config.models is not None:
        config["models"] = new_config.models
        
    if new_config.default_model is not None:
        # Ensure default model is in the list of models
        if new_config.default_model in config["models"]:
            config["default_model"] = new_config.default_model
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Default model must be in the list of available models: {', '.join(config['models'])}"
            )
    
    # Save to file
    if save_config(config):
        return {"message": "Configuration updated successfully", "config": config}
    else:
        raise HTTPException(status_code=500, detail="Failed to save configuration")

# Start server if this script is run directly
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)