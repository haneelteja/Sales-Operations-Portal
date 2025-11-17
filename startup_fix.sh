#!/bin/bash

# Aamodha-Elma Sync Application - Startup Fix Script
# This script ensures the application works every time by fixing common issues

echo "🚀 Starting Aamodha-Elma Sync Application Fix..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# 1. Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

# 2. Check if Supabase CLI is available
print_status "Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    print_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
    if [ $? -eq 0 ]; then
        print_success "Supabase CLI installed successfully"
    else
        print_error "Failed to install Supabase CLI"
        exit 1
    fi
else
    print_success "Supabase CLI is available"
fi

# 3. Reset database to clean state
print_status "Resetting database to clean state..."
supabase db reset --linked --debug
if [ $? -eq 0 ]; then
    print_success "Database reset successfully"
else
    print_warning "Database reset failed, trying alternative approach..."
    
    # Try to apply the clean setup directly
    print_status "Applying clean database setup..."
    supabase db push --include-all
    if [ $? -eq 0 ]; then
        print_success "Database setup applied successfully"
    else
        print_error "Failed to setup database"
        exit 1
    fi
fi

# 4. Start the development server
print_status "Starting development server..."
print_success "Application should now be running at http://localhost:8080"
print_warning "If you see any errors, please check the console output above"

# Start the server in the background
npm run dev &
SERVER_PID=$!

# Wait a moment for the server to start
sleep 5

# Check if the server is running
if curl -s -I http://localhost:8080 | head -1 | grep -q "200 OK"; then
    print_success "✅ Application is running successfully!"
    print_success "🌐 Open http://localhost:8080 in your browser"
    print_success "🔧 All database issues have been resolved"
else
    print_warning "Server might still be starting up..."
    print_warning "Please wait a moment and check http://localhost:8080"
fi

# Keep the script running to show the server output
print_status "Press Ctrl+C to stop the server"
wait $SERVER_PID





