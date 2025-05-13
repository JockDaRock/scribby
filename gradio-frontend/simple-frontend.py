import os
import time
import requests
import json
import gradio as gr

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
SUPPORTED_AUDIO_FORMATS = [".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"]
DEFAULT_OUTPUT_DIR = "outputs"
POLLING_INTERVAL = 2  # Time in seconds between status checks

# Ensure output directory exists
os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)

def api_request(endpoint, method="get", data=None, files=None, params=None, timeout=30):
    """Make a request to the backend API"""
    url = f"{API_BASE_URL}/{endpoint}"
    
    try:
        if method.lower() == "get":
            response = requests.get(url, params=params, timeout=timeout)
        elif method.lower() == "post":
            if files:
                response = requests.post(url, files=files, data=params, timeout=timeout)
            else:
                response = requests.post(url, json=data, timeout=timeout)
        else:
            return {"error": f"Unsupported method: {method}"}
        
        if response.status_code == 200:
            return response.json()
        else:
            error_detail = response.json().get("detail", "Unknown error") if response.content else "Unknown error"
            return {"error": f"API request failed with status {response.status_code}: {error_detail}"}
            
    except Exception as e:
        print(f"API request error ({endpoint}): {str(e)}")
        return {"error": f"Error: {str(e)}"}

def download_file(job_id, output_dir=DEFAULT_OUTPUT_DIR):
    """Download the result file from the API"""
    try:
        url = f"{API_BASE_URL}/download/{job_id}"
        response = requests.get(url, stream=True, timeout=60)
        
        if response.status_code != 200:
            return None
            
        # Get filename from content-disposition header or use job ID
        content_disposition = response.headers.get('content-disposition', '')
        filename = ""
        if 'filename=' in content_disposition:
            filename = content_disposition.split('filename=')[1].strip('"\'')
        else:
            filename = f"{job_id}.json"
            
        file_path = os.path.join(output_dir, filename)
        
        # Save the file
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                
        return file_path
        
    except Exception as e:
        print(f"Error downloading file: {str(e)}")
        return None

def process_file(api_key_val, file, model_val, language, translate, timestamp, progress=gr.Progress()):
    """Process file submission"""
    if not api_key_val:
        return "Please provide an API key", None, "Error: No API key provided"
    
    if not file:
        return "Please upload an audio file", None, "Error: No file uploaded"
    
    # Update progress
    progress(0, "Starting file processing...")
    
    try:
        file_size_mb = os.path.getsize(file.name) / (1024 * 1024)
        progress_msg = f"File size: {file_size_mb:.2f} MB"
        progress(0.1, progress_msg)
        
        # Prepare the file upload
        with open(file.name, 'rb') as f:
            files = {'file': (os.path.basename(file.name), f, 'audio/mpeg')}
            
            # Prepare form data
            form_data = {
                'api_key': api_key_val,
                'model': model_val,
                'language': language,
                'translate': str(translate).lower(),
                'timestamp': str(timestamp).lower()
            }
            
            progress(0.2, "Uploading file to API...")
            
            # Send request to API
            response = requests.post(
                f"{API_BASE_URL}/transcribe/file",
                files=files,
                data=form_data,
                timeout=300
            )
        
        if response.status_code != 200:
            error_message = response.json().get("detail", "Unknown error") if response.content else "Unknown error"
            return f"API request failed: {error_message}", None, f"Error: {error_message}"
        
        result = response.json()
        job_id = result.get("job_id")
        
        if not job_id:
            return "Failed to get job ID from API response", None, "Error: No job ID in response"
        
        progress(0.3, f"File uploaded, job ID: {job_id}")
        
        # Poll for job completion
        poll_count = 0
        while True:
            poll_count += 1
            progress_val = min(0.3 + (poll_count * 0.05), 0.9)  # Cap at 90%
            
            status_result = api_request(f"status/{job_id}")
            
            if "error" in status_result:
                return f"Error checking job status: {status_result['error']}", None, f"Error: {status_result['error']}"
                
            status = status_result.get("status", "unknown")
            message = status_result.get("message", "No status message")
            
            progress(progress_val, f"Status: {status} - {message}")
                
            if status == "completed":
                # Download the file
                progress(0.95, "Downloading result file...")
                file_path = download_file(job_id)
                
                if not file_path:
                    return "Transcription completed but failed to download the result file", None, "Error: Failed to download result file"
                    
                # Read the first 2000 characters of the file for preview
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read(2000)
                        if len(content) >= 2000:
                            content += "..."
                except Exception as e:
                    content = f"File saved but couldn't read content: {str(e)}"
                
                progress(1.0, "Transcription completed!")
                return f"Transcription completed! JSON file is in the outputs folder.\n\n{content}", file_path, "Completed successfully!"
                
            elif status == "error":
                return f"Error in transcription: {message}", None, f"Error: {message}"
                
            # Wait before checking again
            time.sleep(POLLING_INTERVAL)
            
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        return error_msg, None, error_msg

def extract_video_id(youtube_url):
    """Extract the video ID from a YouTube URL"""
    import re
    
    # Common YouTube URL patterns
    patterns = [
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)',  # Standard watch URL
        r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\?\s]+)',             # Shortened youtu.be URL
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\?\s]+)',   # Embed URL
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([^\?\s]+)',       # Old embed URL
        r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/[^\/]+\/\?v=([^\&\s]+)'  # User page with video
    ]
    
    for pattern in patterns:
        match = re.search(pattern, youtube_url)
        if match:
            return match.group(1)
    
    return None

def get_direct_thumbnail_url(youtube_url):
    """Get the thumbnail URL directly from the video ID"""
    video_id = extract_video_id(youtube_url)
    if not video_id:
        return None
    
    return f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"

def process_youtube_info(youtube_url):
    """Get information about a YouTube video"""
    if not youtube_url:
        return None, "Please enter a YouTube URL"
    
    # First try to get a direct thumbnail URL for instant display
    direct_thumbnail = get_direct_thumbnail_url(youtube_url)
    if direct_thumbnail:
        # Only show thumbnail initially, then fetch title from backend
        print(f"Using direct thumbnail URL: {direct_thumbnail}")
    
    try:
        print(f"Fetching YouTube info for: {youtube_url}")
        # Increase timeout to 60 seconds for YouTube info
        result = api_request("youtube-info", params={"url": youtube_url}, timeout=60)
        
        if "error" in result:
            print(f"YouTube info error: {result['error']}")
            # If backend call fails but we have a direct thumbnail, still show it
            if direct_thumbnail:
                return direct_thumbnail, "Title not available (loading...)"
            return None, f"Error: {result['error']}"
        
        thumbnail_url = result.get("thumbnail_url", direct_thumbnail)
        title = result.get("title", "YouTube Video")
        
        print(f"Successfully retrieved YouTube info: Title='{title}', Thumbnail={thumbnail_url}")
        
        return thumbnail_url, title
        
    except Exception as e:
        print(f"Exception in process_youtube_info: {str(e)}")
        # If exception occurs but we have a direct thumbnail, still show it
        if direct_thumbnail:
            return direct_thumbnail, "Title not available (error occurred)"
        return None, f"Error: {str(e)}"

def process_youtube(api_key_val, youtube_url, model_val, language, translate, timestamp, progress=gr.Progress()):
    """Process YouTube transcription"""
    if not api_key_val:
        return "Please provide an API key", None, "Error: No API key provided"
            
    if not youtube_url:
        return "Please provide a YouTube URL", None, "Error: No YouTube URL provided"
    
    progress(0, "Starting YouTube processing...")
    
    try:
        # Prepare request data
        request_data = {
            "api_key": api_key_val,
            "youtube_url": youtube_url,
            "model": model_val,
            "language": language,
            "translate": translate,
            "timestamp": timestamp
        }
        
        progress(0.1, "Sending request to API...")
        
        # Send request to API
        result = api_request("transcribe/youtube", method="post", data=request_data)
        
        if "error" in result:
            return f"API request failed: {result['error']}", None, f"Error: {result['error']}"
        
        job_id = result.get("job_id")
        
        if not job_id:
            return "Failed to get job ID from API response", None, "Error: No job ID in response"
        
        progress(0.2, f"Request sent, job ID: {job_id}")
        
        # Poll for job completion
        poll_count = 0
        while True:
            poll_count += 1
            progress_val = min(0.2 + (poll_count * 0.05), 0.9)  # Cap at 90%
            
            status_result = api_request(f"status/{job_id}")
            
            if "error" in status_result:
                return f"Error checking job status: {status_result['error']}", None, f"Error: {status_result['error']}"
                
            status = status_result.get("status", "unknown")
            message = status_result.get("message", "No status message")
            
            progress(progress_val, f"Status: {status} - {message}")
                
            if status == "completed":
                # Download the file
                progress(0.95, "Downloading result file...")
                file_path = download_file(job_id)
                
                if not file_path:
                    return "Transcription completed but failed to download the result file", None, "Error: Failed to download result file"
                    
                # Read the first 2000 characters of the file for preview
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read(2000)
                        if len(content) >= 2000:
                            content += "..."
                except Exception as e:
                    content = f"File saved but couldn't read content: {str(e)}"
                
                progress(1.0, "Transcription completed!")
                return f"Transcription completed! JSON file is in the outputs folder.\n\n{content}", file_path, "Completed successfully!"
                
            elif status == "error":
                return f"Error in transcription: {message}", None, f"Error: {message}"
                
            # Wait before checking again
            time.sleep(POLLING_INTERVAL)
                
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        return error_msg, None, error_msg

def process_mic(api_key_val, audio_path, model_val, language, translate, timestamp, progress=gr.Progress()):
    """Process microphone recording transcription"""
    if not api_key_val:
        return "Please provide an API key", None
            
    if not audio_path:
        return "Please record audio with the microphone", None
    
    progress(0, "Starting microphone recording processing...")
    
    try:
        # Prepare the file upload
        with open(audio_path, 'rb') as f:
            files = {'file': (os.path.basename(audio_path), f, 'audio/wav')}
            
            # Prepare form data
            form_data = {
                'api_key': api_key_val,
                'model': model_val,
                'language': language,
                'translate': str(translate).lower(),
                'timestamp': str(timestamp).lower()
            }
            
            progress(0.2, "Uploading recording to API...")
            
            # Send request to API
            response = requests.post(
                f"{API_BASE_URL}/transcribe/file",
                files=files,
                data=form_data,
                timeout=300
            )
        
        if response.status_code != 200:
            error_message = response.json().get("detail", "Unknown error") if response.content else "Unknown error"
            return f"API request failed: {error_message}", None
        
        result = response.json()
        job_id = result.get("job_id")
        
        if not job_id:
            return "Failed to get job ID from API response", None
        
        progress(0.3, f"Recording uploaded, job ID: {job_id}")
        
        # Poll for job completion
        poll_count = 0
        while True:
            poll_count += 1
            progress_val = min(0.3 + (poll_count * 0.05), 0.9)  # Cap at 90%
            
            status_result = api_request(f"status/{job_id}")
            
            if "error" in status_result:
                return f"Error checking job status: {status_result['error']}", None
                
            status = status_result.get("status", "unknown")
            message = status_result.get("message", "No status message")
            
            progress(progress_val, f"Status: {status} - {message}")
                
            if status == "completed":
                # Download the file
                progress(0.95, "Downloading result file...")
                file_path = download_file(job_id)
                
                if not file_path:
                    return "Transcription completed but failed to download the result file", None
                    
                # Read the first 2000 characters of the file for preview
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read(2000)
                        if len(content) >= 2000:
                            content += "..."
                except Exception as e:
                    content = f"File saved but couldn't read content: {str(e)}"
                
                progress(1.0, "Transcription completed!")
                return f"Transcription completed! JSON file is in the outputs folder.\n\n{content}", file_path
                
            elif status == "error":
                return f"Error in transcription: {message}", None
                
            # Wait before checking again
            time.sleep(POLLING_INTERVAL)
            
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        return error_msg, None

def open_output_folder():
    """Open the output folder"""
    try:
        if os.name == 'nt':  # Windows
            os.startfile(DEFAULT_OUTPUT_DIR)
        elif os.name == 'posix':  # macOS, Linux
            os.system(f"xdg-open {DEFAULT_OUTPUT_DIR} || open {DEFAULT_OUTPUT_DIR}")
    except Exception as e:
        print(f"Error opening folder: {e}")

def create_interface():
    with gr.Blocks(title="Whisper API Transcription App") as app:
        api_key = gr.Textbox(
            label="OpenAI API Key", 
            placeholder="Enter your OpenAI API key", 
            type="password"
        )

        model = gr.Dropdown(
            choices=["whisper-1", "groq/distil-whisper-large-v3-en", "groq/whisper-large-v3-turbo", "groq/whisper-large-v3"],
            value="groq/distil-whisper-large-v3-en",
            label="Model"
        )
        
        with gr.Tabs():
            with gr.TabItem("File"):
                with gr.Column():
                    file_input = gr.File(label="Upload File here", file_types=SUPPORTED_AUDIO_FORMATS)
                    
                    file_params = gr.Column()
                    with file_params:
                        lang = gr.Dropdown(
                            choices=["Automatic Detection", "English", "Spanish", "French", "German", 
                                    "Italian", "Portuguese", "Dutch", "Russian", "Japanese", 
                                    "Chinese", "Arabic", "Korean", "Hindi"],
                            value="Automatic Detection",
                            label="Language"
                        )
                        translate = gr.Checkbox(label="Translate to English?", value=False)
                        timestamp = gr.Checkbox(label="Add timestamp to filename", value=True)
                        
                        # Add chunking settings
                        gr.Markdown("### Large File Settings")
                        chunk_size = gr.Slider(
                            minimum=1, 
                            maximum=30, 
                            value=30, 
                            step=1, 
                            label="Chunk Size (minutes)"
                        )
                
                with gr.Row():
                    file_btn = gr.Button("GENERATE JSON FILE", variant="primary")
                
                with gr.Row():
                    file_output = gr.Textbox(label="Output", lines=10)
                    file_download = gr.File(label="Downloadable output file", interactive=False)
                    file_folder_btn = gr.Button("📂")
                
                # Add progress indicator for chunked files
                with gr.Row():
                    file_progress = gr.Textbox(label="Processing Status", interactive=False)
            
            with gr.TabItem("Youtube"):
                with gr.Row():
                    youtube_link = gr.Textbox(label="Youtube Link")
                
                with gr.Row(equal_height=True):
                    with gr.Column():
                        youtube_thumbnail = gr.Image(label="Youtube Thumbnail", interactive=False)
                    with gr.Column():
                        youtube_title = gr.Textbox(label="Youtube Title", interactive=False)
                
                youtube_params = gr.Column()
                with youtube_params:
                    yt_lang = gr.Dropdown(
                        choices=["Automatic Detection", "English", "Spanish", "French", "German", 
                                "Italian", "Portuguese", "Dutch", "Russian", "Japanese", 
                                "Chinese", "Arabic", "Korean", "Hindi"],
                        value="Automatic Detection",
                        label="Language"
                    )
                    yt_translate = gr.Checkbox(label="Translate to English?", value=False)
                    yt_timestamp = gr.Checkbox(label="Add timestamp to filename", value=True)
                    
                    # Add chunking settings for YouTube
                    gr.Markdown("### Large File Settings")
                    yt_chunk_size = gr.Slider(
                        minimum=1, 
                        maximum=30, 
                        value=30, 
                        step=1, 
                        label="Chunk Size (minutes)"
                    )
                
                with gr.Row():
                    youtube_btn = gr.Button("GENERATE JSON FILE", variant="primary")
                
                with gr.Row():
                    youtube_output = gr.Textbox(label="Output", lines=10)
                    youtube_download = gr.File(label="Downloadable output file", interactive=False)
                    youtube_folder_btn = gr.Button("📂")
                
                # Add progress indicator for YouTube
                with gr.Row():
                    youtube_progress = gr.Textbox(label="Processing Status", interactive=False)
            
            with gr.TabItem("Mic"):
                with gr.Column():
                    mic_input = gr.Audio(label="Record with Mic", type="filepath")
                
                mic_params = gr.Column()
                with mic_params:
                    mic_lang = gr.Dropdown(
                        choices=["Automatic Detection", "English", "Spanish", "French", "German", 
                                "Italian", "Portuguese", "Dutch", "Russian", "Japanese", 
                                "Chinese", "Arabic", "Korean", "Hindi"],
                        value="Automatic Detection",
                        label="Language"
                    )
                    mic_translate = gr.Checkbox(label="Translate to English?", value=False)
                    mic_timestamp = gr.Checkbox(label="Add timestamp to filename", value=True)
                
                with gr.Row():
                    mic_btn = gr.Button("GENERATE JSON FILE", variant="primary")
                
                with gr.Row():
                    mic_output = gr.Textbox(label="Output", lines=10)
                    mic_download = gr.File(label="Downloadable output file", interactive=False)
                    mic_folder_btn = gr.Button("📂")
        
        # Set up event handlers
        # File tab
        file_btn.click(
            fn=process_file,
            inputs=[api_key, file_input, model, lang, translate, timestamp],
            outputs=[file_output, file_download, file_progress]
        )
        
        # YouTube tab
        youtube_link.change(
            fn=process_youtube_info,
            inputs=[youtube_link],
            outputs=[youtube_thumbnail, youtube_title]
        )
        
        youtube_btn.click(
            fn=process_youtube,
            inputs=[api_key, youtube_link, model, yt_lang, yt_translate, yt_timestamp],
            outputs=[youtube_output, youtube_download, youtube_progress]
        )
        
        # Mic tab
        mic_btn.click(
            fn=process_mic,
            inputs=[api_key, mic_input, model, mic_lang, mic_translate, mic_timestamp],
            outputs=[mic_output, mic_download]
        )
        
        # Folder buttons
        file_folder_btn.click(fn=open_output_folder)
        youtube_folder_btn.click(fn=open_output_folder)
        mic_folder_btn.click(fn=open_output_folder)
        
    return app

# Launch the interface if run directly
if __name__ == "__main__":
    app = create_interface()
    app.queue()
    app.launch()