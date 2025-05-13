# Whisper Transcription Application

This application allows you to transcribe audio files, YouTube videos, and microphone recordings using the Whisper API. The application has been split into two components:

1. **Backend**: A RESTful API server that handles all transcription functionality
2. **Frontend**: A Gradio web interface that communicates with the backend API

## Project Structure

```
scribby/
├── backend/
│   ├── api.py                # FastAPI server implementation
│   ├── transcriber.py        # Transcription functionality
│   ├── requirements.txt      # Backend dependencies
│   └── Dockerfile            # Backend container definition
├── frontend/
│   ├── frontend.py           # Gradio interface
│   ├── requirements.txt      # Frontend dependencies
│   └── Dockerfile            # Frontend container definition
├── outputs/                  # Shared directory for transcription outputs
└── docker-compose.yml        # Configuration for running both services
```

## Features

- Transcribe audio files (MP3, MP4, WAV, etc.)
- Transcribe YouTube videos by URL
- Transcribe microphone recordings
- Language detection or selection
- Translation to English option
- Large file handling with automatic chunking
- Background processing for long-running tasks

## Installation and Setup

### Option 1: Using Docker Compose (Recommended)

1. Make sure you have Docker and Docker Compose installed
2. Clone this repository
3. Create the directory structure and place the files in their respective locations
4. Run the application:

```bash
docker-compose up -d
```

The frontend will be available at http://localhost:7860, and the backend API at http://localhost:8000.

### Option 2: Manual Setup

#### Backend Setup

1. Create a virtual environment and activate it:

```bash
python -m venv backend-env
source backend-env/bin/activate  # On Windows: backend-env\Scripts\activate
```

2. Install dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Install system dependencies:
   - ffmpeg: For audio processing
   - yt-dlp: For YouTube video downloading

4. Run the backend:

```bash
uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup

1. Create a virtual environment and activate it:

```bash
python -m venv frontend-env
source frontend-env/bin/activate  # On Windows: frontend-env\Scripts\activate
```

2. Install dependencies:

```bash
cd frontend
pip install -r requirements.txt
```

3. Set the API_BASE_URL environment variable to point to your backend:

```bash
# Linux/Mac
export API_BASE_URL=http://localhost:8000

# Windows
set API_BASE_URL=http://localhost:8000
```

4. Run the frontend:

```bash
python frontend.py
```

The Gradio interface will be available at http://localhost:7860.

## Using the API

The backend provides the following endpoints:

- `GET /models`: Get available transcription models
- `GET /languages`: Get available languages
- `POST /transcribe/file`: Transcribe an audio file
- `POST /transcribe/youtube`: Transcribe a YouTube video
- `GET /status/{job_id}`: Check the status of a transcription job
- `GET /download/{job_id}`: Download the transcription result
- `GET /youtube-info`: Get information about a YouTube video

For more details, access the Swagger documentation at http://localhost:8000/docs when the backend is running.

## Environment Variables

### Backend

- `BASE_URL`: Base URL for the Whisper API (default: `https://litellm.darock.io/v1`)
- `DEBUG`: Enable detailed logging (default: `true`)

### Frontend

- `API_BASE_URL`: URL of the backend API (default: `http://localhost:8000`)

## License

This project is licensed under the MIT License - see the LICENSE file for details.