#!/bin/bash

# Hair Clinic Docker Startup Script
# This script helps you start the application with proper checks

set -e

echo "=========================================="
echo "  Hair Clinic Application Startup"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "✓ Docker is running"

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: docker-compose is not installed"
    echo "Please install docker-compose and try again"
    exit 1
fi

echo "✓ Docker Compose is available"
echo ""

# Stop existing containers if any
echo "Stopping existing containers (if any)..."
docker-compose down 2>/dev/null || true
echo ""

# Build and start services
echo "Building and starting services..."
echo "This may take a few minutes on first run..."
echo ""

docker-compose up -d --build

echo ""
echo "Waiting for services to be healthy..."
echo ""

# Wait for database
echo -n "⏳ Waiting for database..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec -T db pg_isready -U postgres -d hair_clinic > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo " ❌"
    echo ""
    echo "Database failed to start. Checking logs:"
    docker-compose logs db
    exit 1
fi

# Wait for backend
echo -n "⏳ Waiting for backend..."
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo " ❌"
    echo ""
    echo "Backend failed to start. Checking logs:"
    docker-compose logs backend
    exit 1
fi

# Wait for frontend
echo -n "⏳ Waiting for frontend..."
counter=0
while [ $counter -lt $timeout ]; do
    if curl -s http://localhost > /dev/null 2>&1; then
        echo " ✓"
        break
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo " ❌"
    echo ""
    echo "Frontend failed to start. Checking logs:"
    docker-compose logs frontend
    exit 1
fi

echo ""
echo "=========================================="
echo "  🎉 Application Started Successfully!"
echo "=========================================="
echo ""
echo "Access points:"
echo "  📱 Frontend:      http://localhost"
echo "  🔌 Backend API:   http://localhost:3001"
echo "  💚 Health Check:  http://localhost:3001/health"
echo "  🗄️  PostgreSQL:    localhost:5432"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
echo "Stop application:"
echo "  docker-compose down"
echo ""
echo "=========================================="
