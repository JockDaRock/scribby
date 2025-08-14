import subprocess
import os

# Paths to each service directory
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), 'agent-frontend')
BACKEND_DIR = os.path.join(os.path.dirname(__file__), 'backend')
AGENT_DIR = os.path.join(os.path.dirname(__file__), 'backend-agent')

processes = []

def start_frontend():
    print('Starting agent-frontend...')
    return subprocess.Popen(['npm', 'start'], cwd=FRONTEND_DIR)

def start_backend():
    print('Starting backend...')
    python_path = os.path.join(BACKEND_DIR, '.venv', 'bin', 'python')
    return subprocess.Popen([
        python_path, '-m', 'uvicorn', 'api:app', '--host', '0.0.0.0', '--port', '8000'
    ], cwd=BACKEND_DIR)

def start_agent():
    print('Starting backend-agent...')
    python_path = os.path.join(AGENT_DIR, '.venv', 'bin', 'python')
    return subprocess.Popen([
        python_path, '-m', 'uvicorn', 'agent:app', '--host', '0.0.0.0', '--port', '8001'
    ], cwd=AGENT_DIR)

if __name__ == '__main__':
    try:
        processes.append(start_frontend())
        processes.append(start_backend())
        processes.append(start_agent())
        print('All services started. Press Ctrl+C to stop.')
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print('Shutting down services...')
        for p in processes:
            p.terminate()
        print('All services stopped.')
