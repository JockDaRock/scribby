import os
import json
import requests
import time
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import uvicorn

# Configuration management
CONFIG_FILE = "agent_config.json"

# Default configuration
DEFAULT_CONFIG = {
    "base_url": os.getenv("LLM_API_URL", "https://api.openai.com/v1"),
    "models": ["gpt-4.1-nano", "gpt-4o-mini"],
    "default_model": "gpt-4o-mini"
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
        print(f"Error loading config: {str(e)}")
        return DEFAULT_CONFIG

# Save configuration
def save_config(config):
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving config: {str(e)}")
        return False

# Load initial configuration
config = load_config()

# Configuration
DEBUG = True
TRANSCRIPTION_API_URL = os.getenv("TRANSCRIPTION_API_URL", "http://localhost:8000")
DEFAULT_LLM_MODEL = config["default_model"]

# Create FastAPI app
app = FastAPI(
    title="Scribby API",
    description="API for generating social media content from transcribed audio/video",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "Cache-Control"],
)

# In-memory store for job status
job_status = {}

# Models
class SocialMediaRequest(BaseModel):
    transcription_job_id: Optional[str] = None
    youtube_url: Optional[str] = None
    file_upload_id: Optional[str] = None
    api_key: str
    llm_api_key: str
    llm_model: Optional[str] = None  # Use default from config if not specified
    llm_base_url: Optional[str] = None  # Optional base URL override
    transcription_base_url: Optional[str] = None  # Optional transcription base URL override 
    content_type: Optional[str] = "social_media"  # 'social_media' or 'blog'
    platforms: List[str]
    context: Optional[str] = ""
    audience: Optional[str] = ""
    tags: Optional[List[str]] = []

class GenerationResponse(BaseModel):
    job_id: str
    status: str
    message: str

class GenerationStatusResponse(BaseModel):
    status: str
    message: str
    result: Optional[Dict[str, Any]] = None

class PromptTemplate(BaseModel):
    template: str

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

def log(message):
    """Print debug messages if DEBUG is enabled"""
    if DEBUG:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")

# Background processing function
async def process_content_generation(
    job_id: str, 
    transcription_job_id: Optional[str], 
    youtube_url: Optional[str],
    file_upload_id: Optional[str],
    api_key: str,
    llm_api_key: str,
    llm_model: str,
    llm_base_url: Optional[str],
    transcription_base_url: Optional[str],
    content_type: str,
    platforms: List[str],
    context: str,
    audience: str,
    tags: List[str]
):
    """Process content generation in the background"""
    try:
        update_job_status(job_id, "processing", "Starting content generation process...")
        transcription_data = None
        
        # Define transcription API URL to use
        transcription_url = TRANSCRIPTION_API_URL
        
        # Step 1: Get transcription data if job ID is provided
        if transcription_job_id:
            update_job_status(job_id, "processing", "Retrieving transcription data...")
            transcription_status_url = f"{transcription_url}/status/{transcription_job_id}"
            
            # Poll for completion
            max_attempts = 30
            for attempt in range(max_attempts):
                response = requests.get(
                    transcription_status_url,
                    headers={
                        "Cache-Control": "no-cache, no-store",
                        "Pragma": "no-cache"
                    }
                )
                if response.status_code != 200:
                    log(f"Error fetching transcription status: {response.text}")
                    update_job_status(job_id, "error", f"Error fetching transcription status: {response.text}")
                    return
                
                status_data = response.json()
                if status_data["status"] == "completed":
                    # Get transcription result
                    if "result" in status_data and "file_path" in status_data["result"]:
                        download_url = f"{transcription_url}/download/{transcription_job_id}"
                        download_response = requests.get(download_url)
                        if download_response.status_code == 200:
                            transcription_data = download_response.json()
                        else:
                            log(f"Error downloading transcription: {download_response.text}")
                            update_job_status(job_id, "error", f"Error downloading transcription: {download_response.text}")
                            return
                    break
                elif status_data["status"] == "error":
                    update_job_status(job_id, "error", f"Transcription error: {status_data['message']}")
                    return
                
                # Wait and try again
                log(f"Transcription in progress, attempt {attempt+1}/{max_attempts}")
                update_job_status(job_id, "processing", f"Transcription in progress ({attempt+1}/{max_attempts})...")
                time.sleep(10)  # Poll every 10 seconds
            
            if not transcription_data:
                update_job_status(job_id, "error", "Transcription timed out or failed to complete")
                return
        
        # Step 2: If no transcription job ID but YouTube URL is provided, start a new transcription
        elif youtube_url:
            try:
                update_job_status(job_id, "processing", "Starting new YouTube transcription...")
                log(f"Making request to transcription API at {transcription_url}")
                
                transcription_request = {
                    "api_key": api_key,
                    "youtube_url": youtube_url,
                    "model": None,  # Use default model on transcription server
                    "language": "Automatic Detection",
                    "translate": False,
                    "timestamp": True
                }
                
                # Add base_url if provided
                if transcription_base_url:
                    transcription_request["base_url"] = transcription_base_url
                
                response = requests.post(
                    f"{transcription_url}/transcribe/youtube", 
                    json=transcription_request,
                    timeout=30  # Add a timeout
                )
                
                log(f"Received response from transcription API: Status {response.status_code}")
                
                if response.status_code != 200:
                    error_msg = f"Error starting YouTube transcription: Status {response.status_code}, Body: {response.text}"
                    log(error_msg)
                    update_job_status(job_id, "error", error_msg)
                    return
                
                new_transcription_job = response.json()
                new_job_id = new_transcription_job["job_id"]
                
                # Poll for completion
                transcription_status_url = f"{transcription_url}/status/{new_job_id}"
                max_attempts = 30
                
                for attempt in range(max_attempts):
                    update_job_status(job_id, "processing", f"Transcribing YouTube video ({attempt+1}/{max_attempts})...")
                    response = requests.get(
                        transcription_status_url,
                        headers={
                            "Cache-Control": "no-cache, no-store",
                            "Pragma": "no-cache"
                        }
                    )
                    
                    if response.status_code != 200:
                        log(f"Error fetching transcription status: {response.text}")
                        update_job_status(job_id, "error", f"Error fetching transcription status: {response.text}")
                        return
                    
                    status_data = response.json()
                    if status_data["status"] == "completed":
                        # Get transcription result
                        download_url = f"{transcription_url}/download/{new_job_id}"
                        download_response = requests.get(download_url)
                        
                        if download_response.status_code == 200:
                            transcription_data = download_response.json()
                        else:
                            log(f"Error downloading transcription: {download_response.text}")
                            update_job_status(job_id, "error", f"Error downloading transcription: {download_response.text}")
                            return
                        break
                    elif status_data["status"] == "error":
                        update_job_status(job_id, "error", f"Transcription error: {status_data['message']}")
                        return
                    
                    # Wait and try again
                    time.sleep(10)  # Poll every 10 seconds
                
                if not transcription_data:
                    update_job_status(job_id, "error", "Transcription timed out or failed to complete")
                    return
                
            except requests.exceptions.ConnectionError as conn_err:
                error_msg = f"Connection error to transcription API: {str(conn_err)}"
                if "Failed to resolve 'transcription-api'" in str(conn_err):
                    error_msg += "\nTry changing TRANSCRIPTION_API_URL to 'http://localhost:8000' in your settings or environment variables."
                log(error_msg)
                update_job_status(job_id, "error", error_msg)
                return
            except requests.exceptions.Timeout:
                log("Timeout connecting to transcription API")
                update_job_status(job_id, "error", "Timeout connecting to transcription API. Check if the service is running.")
                return
            except requests.exceptions.RequestException as req_err:
                log(f"Request error: {str(req_err)}")
                update_job_status(job_id, "error", f"Error connecting to transcription API: {str(req_err)}")
                return
        
        # Step 3: If no transcription job ID and no YouTube URL but file_upload_id is provided
        elif file_upload_id:
            # This would be handled by the frontend - uploading file first then getting a job ID
            update_job_status(job_id, "error", "Direct file upload processing not implemented in this endpoint")
            return
            
        else:
            update_job_status(job_id, "error", "No transcription source provided")
            return
        
        # Step 4: Process with LLM
        update_job_status(job_id, "processing", "Processing with LLM...")
        
        # Format the transcription
        transcript_text = "No text found in transcription."
        if transcription_data and "text" in transcription_data:
            transcript_text = transcription_data["text"]
            
        # Generate prompt for LLM
        prompt = generate_social_media_prompt(
            transcript_text, 
            platforms, 
            context, 
            audience, 
            tags,
            content_type
        )
        
        # Call LLM API
        llm_response = call_llm_api(prompt, llm_api_key, llm_model, llm_base_url)
        
        if "error" in llm_response:
            update_job_status(job_id, "error", f"LLM API error: {llm_response['error']}")
            return
            
        # Process LLM response
        parsed_content = parse_llm_response(llm_response, platforms, content_type)
        
        if "error" in parsed_content:
            log(f"Error in parsed content: {parsed_content['error']}")
            update_job_status(job_id, "error", f"Error parsing LLM response: {parsed_content['error']}")
            return
            
        # Debug logging to see the parsed content
        log(f"Content type: {content_type}")
        log(f"Parsed content structure: {json.dumps(parsed_content, indent=2)}")
        
        # Final result
        result = {
            "content_type": content_type,
            "platforms": platforms,
            "transcript": transcript_text,
            "prompt": prompt
        }
        
        # Add content based on content_type
        if content_type == "blog":
            if "blog_content" in parsed_content:
                result["blog_content"] = parsed_content["blog_content"]
            else:
                # Fallback in case the LLM didn't use the expected structure
                result["blog_content"] = {
                    "text": "[No blog content generated]",
                    "character_count": 0
                }
                log("Warning: Blog content not found in parsed response, using fallback")
        else:  # social_media
            result["content"] = parsed_content
        
        update_job_status(job_id, "completed", "Content generation completed successfully", result)
        
    except Exception as e:
        import traceback
        log(f"Error in process_content_generation: {str(e)}")
        log(traceback.format_exc())
        update_job_status(job_id, "error", f"Error: {str(e)}")

def generate_social_media_prompt(transcript_text, platforms, context, audience, tags, content_type="social_media"):
    """Generate a prompt for the LLM"""
    
    # Create a comma-separated list of platforms
    platforms_str = ", ".join(platforms)
    
    # Create a formatted list of tags if provided
    tags_str = ""
    if tags and len(tags) > 0:
        formatted_tags = []
        for tag in tags:
            # Ensure tags have @ symbol if they're names/handles
            if not tag.startswith('@') and not tag.startswith('#'):
                formatted_tags.append(f"@{tag}")
            else:
                formatted_tags.append(tag)
        tags_str = ", ".join(formatted_tags)
    
    # For blog post generation
    if content_type == "blog":
        prompt = f"""You are an expert content creator with deep experience creating engaging blog posts.

TASK: Create a comprehensive blog post based on the transcribed content provided below.

TRANSCRIPTION:
```
{transcript_text}
```

ADDITIONAL CONTEXT:
{context}

TARGET AUDIENCE:
{audience}

PEOPLE/ACCOUNTS TO REFERENCE:
{tags_str}

INSTRUCTIONS:
1. Create a well-structured, engaging blog post that expands on the key ideas from the transcription.
2. The blog post should include:
   - An attention-grabbing headline
   - An introduction that hooks the reader
   - Well-organized body paragraphs with subheadings where appropriate
   - A conclusion that summarizes the main points
3. Use a professional tone that resonates with the target audience.
4. Incorporate the people/accounts to reference when relevant.
5. Format your response as JSON with the following structure:

```json
{{
  "blog_content": {{
    "text": "Your complete blog post content here, including headline",
    "character_count": 123
  }}
}}
```

Create a comprehensive, well-written blog post that truly captures the essence of the transcribed content while being engaging and valuable to readers.
"""
        return prompt
    
    # Default to social media prompt
    prompt = f"""You are an expert social media manager with deep experience creating engaging content for various platforms.

TASK: Create optimized social media posts based on the transcribed content provided below.

TRANSCRIPTION:
```
{transcript_text}
```

TARGET PLATFORMS: {platforms_str}

ADDITIONAL CONTEXT:
{context}

TARGET AUDIENCE:
{audience}

PEOPLE/ACCOUNTS TO TAG:
{tags_str}

INSTRUCTIONS:
1. For each platform, create a post that is optimized for that platform's specific style, length limits, and audience expectations.
2. Use appropriate emojis, formatting, and hashtags for each platform.
3. Incorporate the tags provided when relevant.
4. Ensure the posts capture the key messages from the transcription.
5. Format your response as JSON with the following structure:

```json
{{
  "LinkedIn": {{
    "text": "Your LinkedIn post content here",
    "character_count": 123
  }},
  "Twitter": {{
    "text": "Your Twitter post content here",
    "character_count": 123
  }},
  ... (and so on for each requested platform)
}}
```

LENGTH CONSTRAINTS:
- LinkedIn: 3,000 characters
- Twitter/X: 280 characters
- BlueSky: 300 characters
- Instagram: 2,200 characters
- Facebook: 63,206 characters
- TikTok: 2,200 characters

Only generate content for the platforms specified in the TARGET PLATFORMS section.
"""
    
    return prompt

def call_llm_api(prompt, api_key, model, base_url=None):
    """Call the LLM API with the prompt"""
    try:
        # If model is not specified, use default from config
        if not model:
            model = config["default_model"]
            
        # Check if model is in the available models if not using custom base_url
        if not base_url and model not in config["models"]:
            return {"error": f"Invalid model. Available models: {', '.join(config['models'])}"}
        
        # Use provided base URL or fall back to config
        api_base_url = base_url if base_url else config["base_url"]
        log(f"Using LLM API base URL: {api_base_url}")
        log(f"Using model: {model}")
            
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an expert social media content creator."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        # Log request details (without sensitive info)
        log(f"Sending request to: {api_base_url}/chat/completions")
        
        response = requests.post(
            f"{api_base_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=120  # 2-minute timeout
        )
        
        if response.status_code != 200:
            error_msg = f"API request failed with status code {response.status_code}: {response.text}"
            log(error_msg)
            return {"error": error_msg}
        
        response_data = response.json()
        
        if "choices" in response_data and len(response_data["choices"]) > 0:
            content = response_data["choices"][0]["message"]["content"]
            return {"content": content}
        else:
            return {"error": "Invalid response format from LLM API"}
            
    except Exception as e:
        import traceback
        log(f"Error calling LLM API: {str(e)}")
        log(traceback.format_exc())
        return {"error": f"Error: {str(e)}"}

def parse_llm_response(llm_response, platforms, content_type="social_media"):
    """Parse the LLM response to extract content for each platform"""
    try:
        if "content" not in llm_response:
            return {"error": "No content in LLM response"}
            
        content = llm_response["content"]
        
        # Extract JSON from the content
        # Look for JSON block in markdown format ```json ... ```
        import re
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', content)
        
        if json_match:
            json_str = json_match.group(1)
        else:
            # If not in markdown code block, try to find JSON within the text
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            
            if start_idx >= 0 and end_idx > start_idx:
                json_str = content[start_idx:end_idx]
            else:
                return {"error": "Could not find JSON in LLM response"}
        
        # Parse the JSON
        try:
            result = json.loads(json_str)
            log(f"Parsed JSON structure: {json.dumps(result, indent=2)}")
        except json.JSONDecodeError as e:
            log(f"JSON decode error: {str(e)}")
            # Try some basic cleanup before failing
            json_str = json_str.replace('\n', '').replace('\r', '')
            try:
                result = json.loads(json_str)
                log(f"Parsed JSON after cleanup: {json.dumps(result, indent=2)}")
            except Exception as e:
                log(f"Failed to parse JSON even after cleanup: {str(e)}")
                return {"error": "Invalid JSON in LLM response"}
        
        # For blog content
        if content_type == "blog":
            # Check if blog_content is present
            if "blog_content" not in result:
                # Create a default blog content response
                result["blog_content"] = {
                    "text": "[No blog content generated]",
                    "character_count": 0
                }
            # Ensure character_count is present and accurate for blog content
            if "text" in result["blog_content"]:
                result["blog_content"]["character_count"] = len(result["blog_content"]["text"])
            return result
        
        # For social media content (default)
        # Verify all requested platforms are included
        for platform in platforms:
            if platform not in result:
                result[platform] = {
                    "text": f"[No content generated for {platform}]",
                    "character_count": 0
                }
            
            # Ensure character_count is present and accurate
            if "text" in result[platform]:
                result[platform]["character_count"] = len(result[platform]["text"])
                
        return result
        
    except Exception as e:
        import traceback
        log(f"Error parsing LLM response: {str(e)}")
        log(traceback.format_exc())
        return {"error": f"Error parsing response: {str(e)}"}        

# API endpoints
@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Scribby API is running"}

@app.post("/generate", response_model=GenerationResponse)
async def generate_content(background_tasks: BackgroundTasks, request: SocialMediaRequest):
    """Generate social media content from transcribed audio/video"""
    try:
        # Generate a job ID
        job_id = generate_job_id()
        
        # Validate request
        if not request.transcription_job_id and not request.youtube_url and not request.file_upload_id:
            raise HTTPException(
                status_code=400, 
                detail="At least one source (transcription_job_id, youtube_url, or file_upload_id) must be provided"
            )
        
        if not request.platforms or len(request.platforms) == 0:
            raise HTTPException(
                status_code=400, 
                detail="At least one platform must be selected"
            )
            
        # Use provided model or default
        model = request.llm_model or config["default_model"]
        
        # Validate model if using default base URL
        if not request.llm_base_url and model not in config["models"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model. Available models: {', '.join(config['models'])}"
            )
        
        # Start background processing
        update_job_status(job_id, "queued", "Job queued for processing")
        
        background_tasks.add_task(
            process_content_generation,
            job_id=job_id,
            transcription_job_id=request.transcription_job_id,
            youtube_url=request.youtube_url,
            file_upload_id=request.file_upload_id,
            api_key=request.api_key,
            llm_api_key=request.llm_api_key,
            llm_model=model,
            llm_base_url=request.llm_base_url,
            transcription_base_url=request.transcription_base_url,
            content_type=request.content_type,
            platforms=request.platforms,
            context=request.context,
            audience=request.audience,
            tags=request.tags
        )
        
        return {"job_id": job_id, "status": "queued", "message": "Content generation job has been queued"}
        
    except Exception as e:
        log(f"Error in generate_content endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/status/{job_id}", response_model=GenerationStatusResponse)
async def get_job_status(job_id: str):
    """Get the status of a content generation job"""
    if job_id not in job_status:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Add cache control headers to prevent caching
    response = JSONResponse(content=job_status[job_id])
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/platforms")
async def get_platforms():
    """Get available social media platforms"""
    platforms = [
        {"id": "LinkedIn", "name": "LinkedIn", "max_length": 3000},
        {"id": "Twitter", "name": "X (Twitter)", "max_length": 280},
        {"id": "BlueSky", "name": "BlueSky", "max_length": 300},
        {"id": "Instagram", "name": "Instagram", "max_length": 2200},
        {"id": "Facebook", "name": "Facebook", "max_length": 63206},
        {"id": "TikTok", "name": "TikTok", "max_length": 2200}
    ]
    return {"platforms": platforms}

@app.get("/models")
async def get_models():
    """Get available LLM models"""
    models = [
        {"id": model, "name": model, "provider": "Default"} for model in config["models"]
    ]
    return {"models": models}

# Configuration Endpoints
@app.get("/config")
async def get_config():
    """Get current API configuration"""
    return config

@app.post("/config")
async def update_config(new_config: ConfigModel):
    """Update API configuration"""
    global config
    
    # Update only provided fields
    if new_config.base_url is not None:
        config["base_url"] = new_config.base_url
        
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
    uvicorn.run("agent:app", host="0.0.0.0", port=8001, reload=True)