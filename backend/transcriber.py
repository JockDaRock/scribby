import os
import time
import tempfile
import subprocess
import json
import traceback
import requests
import sys
from datetime import datetime

# Constants
DEFAULT_OUTPUT_DIR = "outputs"
MAX_FILE_SIZE_MB = 25  # Maximum file size in MB for API processing
CHUNK_SIZE_MINUTES = 10  # Size of chunks in minutes
DEBUG = True  # Enable detailed logging

# Setup logging
def log(message):
    """Print debug messages if DEBUG is enabled"""
    if DEBUG:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")

# Ensure output directories exist
os.makedirs(DEFAULT_OUTPUT_DIR, exist_ok=True)

class WhisperAPITranscriber:
    def __init__(self, api_key, base_url, output_dir=DEFAULT_OUTPUT_DIR):
        self.api_key = api_key
        self.base_url = base_url
        self.output_dir = output_dir
        
    def transcribe_file(self, file_path, model, language=None,
                        translate=False, timestamp=True):
        """Transcribe an audio file using Whisper API"""
        try:
            start_time = time.time()
            
            # Check file size
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            if file_size_mb > MAX_FILE_SIZE_MB:
                log(f"File size ({file_size_mb:.2f} MB) exceeds limit of {MAX_FILE_SIZE_MB} MB. Using chunking.")
                return self._transcribe_large_file(file_path, model, language, translate, timestamp)
            
            log(f"Sending file to API: {file_path}")
            log(f"File size: {file_size_mb:.2f} MB")
            log(f"Model: {model}, Format: verbose_json, Language: {language}")
            
            # Prepare the API URL
            api_url = f"{self.base_url}/audio/transcriptions"
            
            # Prepare files and data for the request
            files = {
                "file": (os.path.basename(file_path), open(file_path, "rb"), "audio/mpeg")
            }
            
            # Prepare data payload
            data = {
                "model": model,
                "response_format": "verbose_json"
            }
            
            # Add optional parameters
            if language and language != "Automatic Detection":
                data["language"] = language
                
            if translate:
                data["prompt"] = "Please transcribe this audio and translate to English if needed."
            
            # Set up headers
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            
            # Make the API request
            log(f"Making API request to {api_url}")
            log(f"Request data: {data}")
            
            response = requests.post(
                api_url,
                headers=headers,
                data=data,
                files=files,
                timeout=300  # 5-minute timeout
            )
            
            # Log the full response for debugging
            log(f"Response status code: {response.status_code}")
            log(f"Response headers: {response.headers}")
            
            # Check for successful response
            if response.status_code != 200:
                error_msg = f"API request failed with status code {response.status_code}: {response.text}"
                log(error_msg)
                return {"error": error_msg}
            
            # Log response content
            log(f"Response content type: {response.headers.get('Content-Type', 'unknown')}")
            log(f"Raw response (first 500 chars): {response.text[:500]}")
            
            # Generate output file path
            file_name = os.path.basename(file_path)
            base_name, _ = os.path.splitext(file_name)
            
            if timestamp:
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_name = f"{base_name}_{timestamp_str}.json"
            else:
                output_name = f"{base_name}.json"
            
            output_path = os.path.join(self.output_dir, output_name)
            
            # Process and save the response
            content = self._process_response(response, output_path)
            
            elapsed_time = time.time() - start_time
            log(f"Transcription completed in {elapsed_time:.2f} seconds")
            
            return {
                "content": content,
                "file_path": output_path,
                "elapsed_time": elapsed_time
            }
            
        except Exception as e:
            log(f"Error in transcribe_file: {str(e)}")
            log(traceback.format_exc())
            return {"error": str(e)}
    
    def _process_response(self, response, output_path):
        """Process API response and save to file"""
        try:
            # Handle JSON formats
            try:
                json_data = response.json()
                log(f"JSON response keys: {list(json_data.keys()) if isinstance(json_data, dict) else 'not a dict'}")
                
                # Create a simplified version with only the fields we want
                simplified_json = {
                    "text": json_data.get("text", ""),
                    "language": json_data.get("language", ""),
                    "duration": json_data.get("duration", 0),
                }
                
                # Process segments if they exist
                if "segments" in json_data and isinstance(json_data["segments"], list):
                    simplified_segments = []
                    for segment in json_data["segments"]:
                        # Keep only essential segment information
                        simplified_segment = {
                            "id": segment.get("id", 0),
                            "start": segment.get("start", 0),
                            "end": segment.get("end", 0),
                            "text": segment.get("text", "")
                        }
                        # Optionally add seek if it exists
                        if "seek" in segment:
                            simplified_segment["seek"] = segment["seek"]
                        simplified_segments.append(simplified_segment)
                    
                    simplified_json["segments"] = simplified_segments
                
                # Write formatted JSON to file
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(simplified_json, f, indent=2)
                
                # Set content for return
                content = json.dumps(simplified_json, indent=2)
                
            except ValueError as json_error:
                log(f"Error parsing JSON response: {str(json_error)}")
                # Fall back to raw text
                content = response.text
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(content)
            
            log(f"Successfully wrote output to {output_path}")
            return content
            
        except Exception as e:
            log(f"Error processing response: {str(e)}")
            log(traceback.format_exc())
            # Return raw response as fallback
            return response.text
    
    def _transcribe_large_file(self, file_path, model, language=None,
                               translate=False, timestamp=True):
        """Handle transcription of files larger than the API limit by chunking"""
        try:
            start_time = time.time()
            
            # Create a temporary directory for chunks
            temp_dir = tempfile.mkdtemp()
            log(f"Created temporary directory for chunks: {temp_dir}")
            log(f"Processing large file: {file_path}")
            
            # Get audio duration using ffprobe
            log("Getting audio duration with ffprobe...")
            duration = self._get_audio_duration(file_path)
            if duration is None:
                log("ERROR: Could not determine audio duration")
                return {"error": "Could not determine audio duration"}
                
            log(f"Audio duration: {duration:.2f} seconds")
            
            # Calculate number of chunks needed
            chunk_size_seconds = CHUNK_SIZE_MINUTES * 60
            num_chunks = max(1, int(duration / chunk_size_seconds) + (1 if duration % chunk_size_seconds > 0 else 0))
            log(f"Splitting into {num_chunks} chunks of {CHUNK_SIZE_MINUTES} minutes each")
            
            # Split audio into chunks
            log("Starting audio splitting process...")
            chunk_files = self._split_audio_into_chunks(file_path, temp_dir, chunk_size_seconds, num_chunks)
            if not chunk_files:
                log("ERROR: Failed to split audio file into chunks")
                return {"error": "Failed to split audio file into chunks"}
            
            log(f"Successfully split audio into {len(chunk_files)} chunks")
            
            # Process each chunk
            chunk_results = []
            chunk_output_files = []  # Track chunk output files for cleanup
            
            for i, chunk_file in enumerate(chunk_files):
                log(f"Transcribing chunk {i+1}/{len(chunk_files)}: {chunk_file}")
                log(f"Time offset for this chunk: {i * chunk_size_seconds} seconds")
                
                # Calculate time offset for this chunk
                time_offset = i * chunk_size_seconds
                
                # Transcribe the chunk
                log(f"Sending chunk {i+1} to transcribe_file method...")
                chunk_result = self.transcribe_file(
                    chunk_file, model, language, translate, False
                )
                
                log(f"Chunk {i+1} transcription complete")
                if "error" in chunk_result:
                    log(f"ERROR in chunk {i+1}: {chunk_result['error']}")
                else:
                    log(f"Chunk {i+1} processed successfully, content length: {len(chunk_result.get('content', ''))}")
                    # Track output file for later cleanup
                    if "file_path" in chunk_result:
                        chunk_output_files.append(chunk_result["file_path"])
                
                if "error" in chunk_result:
                    log(f"Error in chunk {i+1}: {chunk_result['error']}")
                    continue
                
                # Add this chunk's result with time offset information
                chunk_result["time_offset"] = time_offset
                chunk_results.append(chunk_result)
            
            # Generate output file name
            file_name = os.path.basename(file_path)
            base_name, _ = os.path.splitext(file_name)
            
            if timestamp:
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_name = f"{base_name}_{timestamp_str}.json"
            else:
                output_name = f"{base_name}.json"
            
            output_path = os.path.join(self.output_dir, output_name)
            
            # Merge the chunks
            merged_content = self._merge_transcriptions(chunk_results)
            
            # Write the final output
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(merged_content)
            
            # Clean up temporary files
            try:
                # Clean up individual chunk output files
                log(f"Cleaning up {len(chunk_output_files)} chunk output files")
                for chunk_file in chunk_output_files:
                    if os.path.exists(chunk_file):
                        os.remove(chunk_file)
                        log(f"Removed chunk output file: {chunk_file}")
                
                # Clean up temporary directory with audio chunks
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                log(f"Removed temporary directory: {temp_dir}")
            except Exception as cleanup_error:
                log(f"Warning: Failed to remove some temporary files: {cleanup_error}")
            
            elapsed_time = time.time() - start_time
            
            return {
                "content": merged_content[:2000] + "..." if len(merged_content) > 2000 else merged_content,
                "file_path": output_path,
                "elapsed_time": elapsed_time
            }
            
        except Exception as e:
            log(f"Error in transcribe_large_file: {str(e)}")
            log(traceback.format_exc())
            return {"error": str(e)}
            
    def _get_audio_duration(self, file_path):
        """Get the duration of an audio file in seconds using ffprobe"""
        try:
            result = subprocess.run(
                [
                    "ffprobe", 
                    "-v", "error", 
                    "-show_entries", "format=duration", 
                    "-of", "default=noprint_wrappers=1:nokey=1", 
                    file_path
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            if result.returncode != 0:
                log(f"ffprobe error: {result.stderr}")
                return None
                
            duration = float(result.stdout.strip())
            return duration
            
        except Exception as e:
            log(f"Error getting audio duration: {str(e)}")
            return None
    
    def _split_audio_into_chunks(self, file_path, temp_dir, chunk_size_seconds, num_chunks):
        """Split an audio file into chunks of specified length"""
        try:
            chunk_files = []
            
            for i in range(num_chunks):
                start_time = i * chunk_size_seconds
                output_chunk = os.path.join(temp_dir, f"chunk_{i:03d}.mp3")
                
                # For the last chunk, don't specify duration to get until the end
                if i == num_chunks - 1:
                    cmd = [
                        "ffmpeg",
                        "-i", file_path,
                        "-ss", str(start_time),
                        "-c:a", "libmp3lame",
                        "-q:a", "4",
                        "-y",
                        output_chunk
                    ]
                else:
                    cmd = [
                        "ffmpeg",
                        "-i", file_path,
                        "-ss", str(start_time),
                        "-t", str(chunk_size_seconds),
                        "-c:a", "libmp3lame",
                        "-q:a", "4",
                        "-y",
                        output_chunk
                    ]
                
                log(f"Running ffmpeg command: {' '.join(cmd)}")
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                if result.returncode != 0:
                    log(f"ffmpeg error: {result.stderr}")
                    continue
                    
                chunk_files.append(output_chunk)
                
            return chunk_files
            
        except Exception as e:
            log(f"Error splitting audio: {str(e)}")
            return []
    
    def _merge_transcriptions(self, chunk_results):
        """Merge transcription results from multiple chunks"""
        if not chunk_results:
            return ""
            
        # Verbose JSON with segments that have timestamps
        time_offset_ms = 0
        all_segments = []
        merged_text = ""
        language = None
        duration = 0
        
        for chunk in chunk_results:
            if "content" in chunk:
                try:
                    content_json = json.loads(chunk["content"])
                    time_offset_ms = int(chunk["time_offset"] * 1000)  # Convert to milliseconds
                    
                    # Collect text
                    if "text" in content_json:
                        merged_text += content_json["text"] + " "
                    
                    # Get language from first chunk that has it
                    if language is None and "language" in content_json:
                        language = content_json["language"]
                    
                    # Sum up durations
                    if "duration" in content_json:
                        duration += content_json["duration"]
                    
                    # Process segments
                    if "segments" in content_json:
                        for segment in content_json["segments"]:
                            # Create simplified segment with adjusted timestamps
                            simplified_segment = {
                                "id": segment.get("id", 0),
                                "start": segment.get("start", 0) + time_offset_ms/1000,
                                "end": segment.get("end", 0) + time_offset_ms/1000,
                                "text": segment.get("text", "")
                            }
                            
                            # Optionally add seek if it exists
                            if "seek" in segment:
                                simplified_segment["seek"] = segment["seek"]
                                
                            all_segments.append(simplified_segment)
                except json.JSONDecodeError:
                    log(f"Warning: Could not parse JSON content from chunk")
        
        # Create final verbose JSON with all segments
        result = {
            "text": merged_text.strip(),
            "language": language or "Unknown",
            "duration": duration,
            "segments": all_segments
        }
        
        return json.dumps(result, indent=2)
    
    def download_youtube(self, youtube_link):
        """Download a YouTube video's audio and return the path to the file"""
        try:
            # Create temporary directory for the downloads
            temp_dir = tempfile.mkdtemp()
            temp_filename = f"youtube_audio_{int(time.time())}.mp3"
            temp_path = os.path.join(temp_dir, temp_filename)
            
            log(f"Attempting to download YouTube video: {youtube_link}")
            log(f"Temporary file path: {temp_path}")
            
            # Get video title and thumbnail using direct extraction
            video_title = "YouTube Video"
            thumbnail_url = None
            
            # Extract video ID from URL
            import re
            video_id = None
            patterns = [
                r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)',
                r'(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^\?\s]+)',
                r'(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\?\s]+)'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, youtube_link)
                if match:
                    video_id = match.group(1)
                    break
            
            if video_id:
                thumbnail_url = f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
                log(f"Generated thumbnail URL from video ID: {thumbnail_url}")
            
            # Try to use yt-dlp with error handling
            try:
                log("Getting YouTube metadata with yt-dlp...")
                # Use a more resilient command line approach for Windows
                import subprocess
                
                # Add python executable to ensure proper environment
                python_exe = sys.executable  # Get the current Python executable
                
                # Use Python to run yt-dlp as a module
                title_cmd = [
                    python_exe, "-m", "yt_dlp", 
                    "--skip-download",
                    "--print", "title",
                    youtube_link
                ]
                
                # Set shell=True on Windows for better path handling
                use_shell = os.name == 'nt'
                
                title_process = subprocess.run(
                    title_cmd,
                    capture_output=True,
                    text=True,
                    check=False,  # Don't raise exception on non-zero exit
                    shell=use_shell
                )
                
                if title_process.returncode == 0:
                    video_title = title_process.stdout.strip()
                    log(f"Video title from yt-dlp: {video_title}")
                else:
                    log(f"Error getting title with yt-dlp: {title_process.stderr}")
                    log(f"Return code: {title_process.returncode}")
                    # Continue with default title
                
                # Download the audio
                log("Running yt-dlp to download audio...")
                
                # Use Python to run yt-dlp as a module for download
                download_cmd = [
                    python_exe, "-m", "yt_dlp", 
                    "--verbose",
                    "--extract-audio",
                    "--audio-format", "mp3",
                    "--audio-quality", "0",
                    "-o", temp_path,
                    youtube_link
                ]
                
                download_process = subprocess.run(
                    download_cmd,
                    capture_output=True,
                    text=True,
                    check=False,
                    shell=use_shell
                )
                
                if download_process.returncode != 0:
                    log(f"yt-dlp download error: {download_process.stderr}")
                    log(f"Return code: {download_process.returncode}")
                    raise subprocess.CalledProcessError(
                        download_process.returncode, 
                        download_cmd,
                        download_process.stdout,
                        download_process.stderr
                    )
                    
                log("yt-dlp download completed successfully")
                
            except Exception as e:
                log(f"Error using yt-dlp: {str(e)}")
                # If we have a thumbnail but download failed, return error
                if thumbnail_url:
                    return {
                        "error": f"Failed to download YouTube audio: {str(e)}",
                        "title": video_title,
                        "thumbnail_url": thumbnail_url
                    }
                else:
                    return {"error": f"Failed to process YouTube video: {str(e)}"}
                    
            # Wait a moment to ensure file is fully written
            time.sleep(2)
            
            # Check if file exists and has content
            if not os.path.exists(temp_path):
                log(f"Error: File does not exist at {temp_path}")
                # Look for any file that might have been created
                files = os.listdir(temp_dir)
                log(f"Files in temp directory: {files}")
                
                if files:
                    # Use the first file we find
                    temp_path = os.path.join(temp_dir, files[0])
                    log(f"Using alternative file: {temp_path}")
                else:
                    # Return thumbnail and title even if download failed
                    if thumbnail_url:
                        return {
                            "error": "Failed to download YouTube video - no file created",
                            "title": video_title,
                            "thumbnail_url": thumbnail_url
                        }
                    else:
                        return {"error": "Failed to download YouTube video - no file created"}
            
            file_size = os.path.getsize(temp_path)
            log(f"Downloaded file size: {file_size} bytes")
            
            if file_size == 0:
                if thumbnail_url:
                    return {
                        "error": "Downloaded file is empty (0 bytes)",
                        "title": video_title,
                        "thumbnail_url": thumbnail_url
                    }
                else:
                    return {"error": "Downloaded file is empty (0 bytes)"}
                    
            return {
                "file_path": temp_path,
                "title": video_title,
                "thumbnail_url": thumbnail_url,
                "temp_dir": temp_dir
            }
                
        except Exception as e:
            log(f"Error downloading YouTube video: {str(e)}")
            log(traceback.format_exc())
            return {"error": f"Failed to process YouTube video: {str(e)}"}
    
    def transcribe_youtube(self, youtube_link, model, language=None, 
                      translate=False, timestamp=True):
        """Download a YouTube video and transcribe its audio"""
        try:
            download_result = self.download_youtube(youtube_link)
            
            if "error" in download_result:
                return download_result
                
            temp_path = download_result["file_path"]
            temp_dir = download_result["temp_dir"]
            video_title = download_result["title"]
            thumbnail_url = download_result["thumbnail_url"]
            
            # Transcribe the downloaded audio
            log(f"Starting transcription of downloaded file: {temp_path}")
            transcription_result = self.transcribe_file(
                temp_path, model, language, 
                translate, timestamp
            )
            
            # Clean up - wait a moment to ensure file is not in use
            time.sleep(2)
            try:
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                log(f"Temporary directory removed: {temp_dir}")
            except Exception as cleanup_error:
                log(f"Warning: Failed to remove temporary directory: {cleanup_error}")
            
            # Add YouTube info to result
            if "error" not in transcription_result:
                transcription_result["title"] = video_title
                transcription_result["thumbnail_url"] = thumbnail_url
            
            return transcription_result
                
        except Exception as e:
            log(f"Error in transcribe_youtube: {str(e)}")
            log(traceback.format_exc())
            return {"error": f"Failed to process YouTube video: {str(e)}"}