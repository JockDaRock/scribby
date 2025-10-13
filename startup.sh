#!/bin/zsh

# Scribby Developer Startup Script
# Based on Option 3: Local Development Setup from README.md

echo "Starting Scribby developer environments..."

# Function to start backend
start_backend() {
    echo "Setting up backend..."
    cd backend
    uv venv --python 3.13
    source .venv/bin/activate
    uv pip install -r requirements.txt
    echo "Starting backend on port 8000..."
    python -m uvicorn api:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
}

# Function to start backend-agent
start_agent() {
    echo "Setting up backend-agent..."
    cd backend-agent
    uv venv --python 3.13
    source .venv/bin/activate
    uv pip install -r requirements.txt
    echo "Starting backend-agent on port 8001..."
    python -m uvicorn agent:app --host 0.0.0.0 --port 8001 &
    AGENT_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "Setting up agent-frontend..."
    cd agent-frontend
    npm install
    echo "Starting frontend on port 3000..."
    npm start &
    FRONTEND_PID=$!
    cd ..
}

# Start all services
start_backend
start_agent
start_frontend

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "Agent API: http://localhost:8001"
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait $BACKEND_PID $AGENT_PID $FRONTEND_PID</content>
<parameter name="filePath">/Users/jocreed/jock-projects/scribby/startup.sh
