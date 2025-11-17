#!/bin/bash

# Redis Setup Script for Aamodha Elma Sync Application
# This script helps set up Redis for local development

echo "🚀 Redis Setup for Aamodha Elma Sync Application"
echo "================================================"
echo ""

# Check if Redis is installed
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis is installed"
    
    # Check if Redis is running
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
        echo ""
        echo "Redis connection test:"
        redis-cli ping
    else
        echo "⚠️  Redis is installed but not running"
        echo ""
        echo "To start Redis:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  brew services start redis"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "  sudo systemctl start redis-server"
        else
            echo "  redis-server"
        fi
    fi
else
    echo "❌ Redis is not installed"
    echo ""
    echo "To install Redis:"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install redis"
        echo "  brew services start redis"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  sudo apt-get update"
        echo "  sudo apt-get install redis-server"
        echo "  sudo systemctl start redis-server"
    else
        echo "  Please install Redis from: https://redis.io/download"
    fi
fi

echo ""
echo "📝 Environment Variables"
echo "======================"
echo ""
echo "Create a .env file in the project root with:"
echo ""
echo "VITE_REDIS_HOST=localhost"
echo "VITE_REDIS_PORT=6379"
echo "VITE_REDIS_PASSWORD="
echo ""
echo "Or copy .env.example to .env and update values:"
echo "  cp .env.example .env"
echo ""
echo "📚 For more details, see REDIS_SETUP_GUIDE.md"
echo ""

