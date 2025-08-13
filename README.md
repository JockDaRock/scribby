# Whisper Transcription Application

This application allows you to transcribe audio files, YouTube videos, and microphone recordings using the Whisper API. The application has been split into two components:

1. **Backend**: A RESTful API server that handles all transcription functionality
2. **Frontend**: A React web interface that communicates with the backend API
3. **Agent**: An AI-powered content generation service for creating social media posts and blog content

## Project Structure

```
scribby/
├── backend/                  # Transcription API (FastAPI)
│   ├── api.py               # FastAPI server implementation
│   ├── transcriber.py       # Transcription functionality
│   ├── requirements.txt     # Backend dependencies
│   └── Dockerfile.backend   # Backend container definition
├── backend-agent/           # Content generation API (FastAPI)
│   ├── agent.py            # Agent API implementation
│   ├── requirements.txt    # Agent dependencies
│   └── Dockerfile.agent    # Agent container definition
├── agent-frontend/          # React frontend
│   ├── src/                # React source code
│   ├── package.json        # Frontend dependencies
│   └── Dockerfile.agent.frontend # Frontend container definition
├── outputs/                 # Shared directory for transcription outputs
├── docker-compose.yml       # Development deployment
├── docker-compose.production.yml # Production deployment with published images
└── .github/workflows/       # GitHub Actions for CI/CD
```

## Features

### Transcription Features
- Transcribe audio files (MP3, MP4, WAV, etc.)
- Transcribe YouTube videos by URL
- Transcribe microphone recordings
- Language detection or selection
- Translation to English option
- Large file handling with automatic chunking
- Background processing for long-running tasks

### Content Generation Features  
- AI-powered social media post generation
- Blog post creation
- Multi-platform content optimization (LinkedIn, Twitter, Instagram, etc.)
- Content revision and editing
- Document assistance

## Quick Start

### Option 1: Use Published Images (Recommended for Production)

```bash
# Start with pre-built images from GitHub Container Registry
./docker.sh start --prod

# Or manually
docker-compose -f docker-compose.production.yml up -d
```

### Option 2: Build Locally (Development)

```bash
# Build and start all services
./docker.sh start

# Or manually
docker-compose up -d --build
```

### Option 3: Local Development Setup

```bash
# Run all services locally without Docker
python startup.py
```

## Access the Application

Once started, the application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Agent API**: http://localhost:8001
- **API Documentation**: http://localhost:8000/docs (Backend), http://localhost:8001/docs (Agent)

## Installation and Setup

### Using Docker (Recommended)

1. **Prerequisites:**
   - Docker and Docker Compose installed
   - Git

2. **Clone and run:**
   ```bash
   git clone <repository-url>
   cd scribby
   ./docker.sh start
   ```

### Manual Setup

For detailed manual setup instructions, see the individual service directories:
- [Backend Setup](./backend/)
- [Agent Setup](./backend-agent/)
- [Frontend Setup](./agent-frontend/)

## Configuration

### API Keys
Configure your API keys through the frontend settings page:
- **Transcription API Key**: For Whisper/OpenAI transcription
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

## Deployment

### Production Deployment

For production deployments, use the published Docker images:

```bash
# Use production compose file with published images
docker-compose -f docker-compose.production.yml up -d
```

See [GitHub Container Registry Guide](./README.ghcr.md) for detailed information about using published images.

### Custom Deployment

The application can be deployed on:
- Docker Swarm
- Kubernetes  
- Cloud platforms (AWS, GCP, Azure)
- VPS servers

See [Docker Documentation](./README.docker.md) for deployment details.

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
4. Test with `./docker.sh start`
5. Submit a pull request

### Local Development Commands

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

## Documentation

- [Docker Setup Guide](./README.docker.md)
- [GitHub Container Registry](./README.ghcr.md)
- [API Documentation](http://localhost:8000/docs) (when running)

## License

This project is licensed under the MIT License - see the LICENSE file for details.