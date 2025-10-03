#!/bin/bash

# Hair Clinic Docker Stop Script

echo "=========================================="
echo "  Stopping Hair Clinic Application"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Warning: Docker is not running"
    exit 0
fi

# Ask user if they want to preserve data
read -p "Do you want to keep your data? (Y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "⚠️  Stopping services and removing all data..."
    docker-compose down -v
    echo ""
    echo "✓ All services stopped and data removed"
else
    echo "Stopping services (data will be preserved)..."
    docker-compose down
    echo ""
    echo "✓ All services stopped (data preserved)"
fi

echo ""
echo "To start again, run:"
echo "  ./start.sh"
echo ""
