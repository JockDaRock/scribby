#!/bin/bash

# Scribby Docker Management Script
set -e

DOCKER_COMPOSE_FILE="docker_compose.yml"
PRODUCTION_COMPOSE_FILE="docker-compose.production.yml"

show_help() {
    echo "Scribby Docker Management Script"
    echo ""
    echo "Usage: ./docker.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services (build if needed)"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  build     Build all services"
    echo "  logs      Show logs for all services"
    echo "  status    Show status of all services"
    echo "  clean     Stop services and remove containers/volumes"
    echo "  prod      Use production images (from ghcr.io)"
    echo "  help      Show this help message"
    echo ""
    echo "Options:"
    echo "  --prod    Use production compose file with published images"
    echo ""
    echo "Examples:"
    echo "  ./docker.sh start            # Build and start local development"
    echo "  ./docker.sh start --prod     # Start using published images"
    echo "  ./docker.sh prod start       # Start using published images"
    echo "  ./docker.sh logs"
    echo "  ./docker.sh clean"
}

# Check for production flag
USE_PRODUCTION=false
if [[ "$1" == "prod" ]] || [[ "$2" == "--prod" ]] || [[ "$1" == "--prod" ]]; then
    USE_PRODUCTION=true
    # Remove prod/--prod from arguments
    if [[ "$1" == "prod" ]]; then
        shift
    elif [[ "$1" == "--prod" ]]; then
        shift
    elif [[ "$2" == "--prod" ]]; then
        set -- "$1" "${@:3}"
    fi
fi

# Set compose file based on mode
if [[ "$USE_PRODUCTION" == "true" ]]; then
    COMPOSE_FILE="$PRODUCTION_COMPOSE_FILE"
    echo "🚀 Using production images from ghcr.io"
else
    COMPOSE_FILE="$DOCKER_COMPOSE_FILE"
    echo "🔨 Using local build mode"
fi

start_services() {
    echo "Starting Scribby services..."
    if [[ "$USE_PRODUCTION" == "true" ]]; then
        docker-compose -f $COMPOSE_FILE pull
        docker-compose -f $COMPOSE_FILE up -d
    else
        docker-compose -f $COMPOSE_FILE up -d --build
    fi
    echo "Services started successfully!"
    echo ""
    echo "Access the application at:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000"
    echo "  Agent API: http://localhost:8001"
}

stop_services() {
    echo "Stopping Scribby services..."
    docker-compose -f $COMPOSE_FILE down
    echo "Services stopped successfully!"
}

restart_services() {
    echo "Restarting Scribby services..."
    stop_services
    start_services
}

build_services() {
    if [[ "$USE_PRODUCTION" == "true" ]]; then
        echo "Production mode: Pulling latest images instead of building..."
        docker-compose -f $COMPOSE_FILE pull
    else
        echo "Building Scribby services..."
        docker-compose -f $COMPOSE_FILE build
    fi
    echo "Build/Pull completed successfully!"
}

show_logs() {
    echo "Showing logs for all services (press Ctrl+C to exit)..."
    docker-compose -f $COMPOSE_FILE logs -f
}

show_status() {
    echo "Service status:"
    docker-compose -f $COMPOSE_FILE ps
}

clean_services() {
    echo "Cleaning up Scribby services..."
    docker-compose -f $COMPOSE_FILE down -v --remove-orphans
    docker system prune -f
    echo "Cleanup completed successfully!"
}

show_production_info() {
    echo "🚀 Production Mode Information"
    echo ""
    echo "This will use pre-built images from GitHub Container Registry:"
    echo "  - ghcr.io/jockdarock/scribby-agent-frontend:latest"
    echo "  - ghcr.io/jockdarock/scribby-backend:latest"
    echo "  - ghcr.io/jockdarock/scribby-backend-agent:latest"
    echo ""
    echo "To use a specific version, edit docker-compose.production.yml"
    echo "and replace 'latest' with the desired tag (e.g., main-abcd123)"
    echo ""
    read -p "Continue with production deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
}

# Main script logic
case "${1:-help}" in
    start)
        if [[ "$USE_PRODUCTION" == "true" ]]; then
            show_production_info
        fi
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        if [[ "$USE_PRODUCTION" == "true" ]]; then
            show_production_info
        fi
        restart_services
        ;;
    build)
        build_services
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    clean)
        clean_services
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
