# Scribby - AI Assisted Content Creator

**Browser-Based Transcription + AI Content Generation**

Scribby transforms audio/video into engaging social media content and blog posts using:
1. **Frontend**: React web app with **browser-based transcription** (Whisper ONNX models via transformers.js)
2. **Backend-Agent**: FastAPI service for AI-powered content generation using LLMs

## 🚀 Key Features

### ✨ Privacy-First Browser Transcription
- **100% Client-Side Processing**: Audio never leaves your device
- **Offline Capability**: Works offline after initial model download
- **Multiple Model Sizes**: Choose between speed (tiny) and accuracy (large)
- **WebGPU Acceleration**: Hardware-accelerated transcription when available
- **Local Storage**: Transcription history saved in browser (IndexedDB)

### 📝 Transcription Features
- Upload audio files (MP3, MP4, WAV, FLAC, WebM)
- Microphone recording with real-time transcription
- YouTube video transcription (with optional server-side audio extraction)
- Word-level timestamps
- Multi-language support (100+ languages)

### PreReqs for Deployment
* docker and docker-compose or equivalent
* Modern web browser (Chrome 90+, Firefox 89+, Safari 15+, Edge 90+)

### PreReqs for Development
* Python 3.11+
* UV - Python package and project manager
* Node.js 14+
* npm or yarn

## Project Structure

```
scribby/
├── backend-agent/           # Content generation API (FastAPI)
│   ├── agent.py            # LLM-powered content generation
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile.agent    # Container definition
├── agent-frontend/          # React frontend with browser transcription
│   ├── src/
│   │   ├── workers/        # Web Workers for transcription
│   │   │   └── whisper.worker.js  # Whisper ONNX model worker
│   │   ├── services/       # Service layer
│   │   │   ├── transcription.service.js
│   │   │   └── storage.service.js (IndexedDB)
│   │   ├── hooks/          # React hooks
│   │   │   └── useTranscription.js
│   │   ├── components/     # React components
│   │   └── utils/          # Utilities (audio, browser checks)
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile.agent.frontend
├── docker-compose.yml       # Simplified deployment (2 services)
├── MIGRATION_GUIDE.md       # Detailed integration guide
└── .github/workflows/       # CI/CD

REMOVED:
├── backend/                 # ❌ Old transcription API (no longer needed)
```

## Features

### Transcription Features (Browser-Based)
- ✅ Transcribe audio files (MP3, MP4, WAV, FLAC, WebM, OGG)
- ✅ Microphone recording and transcription
- ✅ Privacy-first: Audio never sent to servers
- ✅ Offline mode after model download
- ✅ Multiple Whisper model sizes (tiny to large-v3-turbo)
- ✅ Word-level timestamps
- ✅ Progress tracking with model download status
- ✅ Transcription history (stored locally in IndexedDB)

### Content Generation Features
- Turn transcribed content into promotional content
- AI-powered social media post generation
- Blog post creation
- Multi-platform content optimization (LinkedIn, Twitter, Instagram, etc.)
- Content revision and editing
- Document assistance

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/JockDaRock/scribby
cd scribby

# Start services (backend-agent + frontend)
docker-compose up --build

# Access the app at http://localhost:3000
```

**What's Running:**
- Frontend (React): http://localhost:3000 - Browser-based transcription + UI
- Backend-Agent (FastAPI): http://localhost:8001 - LLM content generation

### Option 2: Local Development Setup

**Prerequisites:**
- Python 3.11+
- Node.js 14+
- UV package manager

```bash
git clone https://github.com/JockDaRock/scribby
cd scribby
```

> Open 2 terminal windows (transcription happens in browser now!)

```bash
# Terminal 1: Backend-Agent (LLM content generation)
cd backend-agent

uv venv --python 3.13

source .venv/bin/activate

uv pip install -r requirements.txt

python -m uvicorn agent:app --host 0.0.0.0 --port 8001
```

```bash
# Terminal 2: Frontend (React with browser transcription)
cd agent-frontend

npm install

npm start
```

## Access the Application

Once started, the application will be available at:
- **Frontend**: http://localhost:3000 (Transcription + Content Generation UI)
- **Backend-Agent API**: http://localhost:8001 (LLM content generation)
- **API Documentation**: http://localhost:8001/docs

**Note:** Transcription now happens entirely in your browser! No backend transcription API needed.

## Configuration

### Browser Requirements

For optimal performance, use a modern browser:
- **Chrome/Edge 90+** (Recommended - best WebAssembly performance)
- **Firefox 89+** (Good support, may require enabling Web Workers)
- **Safari 15+** (Works, but slower WASM performance)

### Whisper Model Selection

Choose a model based on your needs:

| Model | Size | Speed | Accuracy | Languages | Recommended For |
|-------|------|-------|----------|-----------|-----------------|
| `Xenova/whisper-tiny.en` | 150 MB | Very Fast | Good | English only | Quick transcriptions, testing |
| `Xenova/whisper-base` | 290 MB | Fast | Better | 100+ | General use, multilingual |
| `Xenova/whisper-small` | 970 MB | Medium | Great | 100+ | Better accuracy needed |
| `onnx-community/whisper-large-v3-turbo` | 1.6 GB | Slow | Best | 100+ | Production, highest accuracy |

Configure in Settings → Whisper Model

## Configuration

### API Keys
Configure your API keys through the frontend settings page:
- ~~**Transcription API Key**~~: No longer needed! Transcription happens in browser
- **LLM API Key**: For content generation (OpenAI/custom LLM)

### Environment Variables

#### Backend
- `BASE_URL`: Whisper API endpoint (default: `https://api.openai.com/v1`)
- `DEBUG`: Enable detailed logging (default: `true`)

#### Agent
- `TRANSCRIPTION_API_URL`: Internal transcription service URL
- `LLM_API_URL`: LLM API endpoint (default: `https://api.openai.com/v1`)
- `DEBUG`: Enable debug logging (default: `true`)

#### Frontend
- `REACT_APP_TRANSCRIPTION_API_URL`: Backend API URL
- `REACT_APP_AGENT_API_URL`: Agent API URL
> this can be changed in the frontend web app, under settings, if these are not set

### Custom Deployment

The application can be deployed on:
- Docker Swarm
- Kubernetes  
- Cloud platforms (AWS, GCP, Azure)
- VPS servers

## API Usage

The backend provides RESTful APIs for transcription and content generation:

### Transcription API Endpoints
- `GET /models`: Get available transcription models
- `GET /languages`: Get available languages
- `POST /transcribe/file`: Transcribe an audio file
- `POST /transcribe/youtube`: Transcribe a YouTube video
- `GET /status/{job_id}`: Check transcription job status
- `GET /download/{job_id}`: Download transcription result

### Agent API Endpoints
- `POST /generate`: Generate content from transcription
- `GET /status/{job_id}`: Check generation job status
- `GET /platforms`: Get available social media platforms
- `POST /revise`: Revise existing content
- `POST /document-assist`: AI document assistance

For complete API documentation, visit the Swagger docs at `/docs` when the services are running.

## Development

### GitHub Actions CI/CD

The project includes automated GitHub Actions workflows that:
- Build Docker images for all services
- Push images to GitHub Container Registry
- Run tests and security scans
- Support multi-platform builds (AMD64, ARM64)

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test
5. Submit a pull request

### Local Development Commands - WIP Not working - looking at making a script to make development and builds a bit easier

```bash
# Start development environment
./docker.sh start

# View logs
./docker.sh logs

# Rebuild services
./docker.sh build

# Clean up
./docker.sh clean

# Use production images
./docker.sh start --prod
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 8000, and 8001 are available
2. **API key errors**: Configure API keys in the frontend settings
3. **Docker issues**: Try `./docker.sh clean` and restart
4. **Build failures**: Check the GitHub Actions logs

### Debug Mode

Enable debug logging by setting `DEBUG=true` in environment variables.

### Getting Help

- Check the [GitHub Issues](https://github.com/jockdarock/scribby/issues)
- Review service logs: `./docker.sh logs`
- Consult the API documentation at `/docs`

## License

This project is licensed under the MIT License - see the LICENSE file for details.
