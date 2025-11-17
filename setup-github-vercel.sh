#!/bin/bash

# GitHub and Vercel Setup Script
# This script helps you push code to GitHub and prepare for Vercel deployment

echo "🚀 GitHub & Vercel Setup for Aamodha Elma Sync"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Git is not initialized${NC}"
    echo "Initializing git repository..."
    git init
    git branch -M main
fi

# Check current remote
echo "📡 Current Git Remote:"
git remote -v
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    echo ""
    echo "Files ready to commit:"
    git status --short | head -20
    echo ""
    read -p "Do you want to commit these changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Add performance improvements and prepare for deployment"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
else
    echo -e "${GREEN}✅ All changes are committed${NC}"
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. CREATE GITHUB REPOSITORY:"
echo "   - Go to https://github.com/new"
echo "   - Repository name: aamodha-elma-sync (or your choice)"
echo "   - Choose Private or Public"
echo "   - DO NOT initialize with README, .gitignore, or license"
echo "   - Click 'Create repository'"
echo ""
echo "2. CONNECT TO GITHUB:"
echo "   Run these commands (replace YOUR_USERNAME with your GitHub username):"
echo ""
echo "   git remote remove origin  # If you want to change remote"
echo "   git remote add origin https://github.com/YOUR_USERNAME/aamodha-elma-sync.git"
echo "   git push -u origin main"
echo ""
echo "3. DEPLOY TO VERCEL:"
echo "   - Go to https://vercel.com"
echo "   - Sign up/Login with GitHub"
echo "   - Click 'Add New' → 'Project'"
echo "   - Select your repository"
echo "   - Add environment variables:"
echo "     * VITE_SUPABASE_URL"
echo "     * VITE_SUPABASE_ANON_KEY"
echo "   - Click 'Deploy'"
echo ""
echo "4. CUSTOM DOMAIN (Optional):"
echo "   - In Vercel: Settings → Domains"
echo "   - Add your domain"
echo "   - Configure DNS as instructed"
echo ""
echo "📚 For detailed instructions, see DEPLOYMENT_GUIDE.md"
echo ""

# Check if .env exists and warn
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  WARNING: .env file exists${NC}"
    echo "Make sure .env is in .gitignore (it should be)"
    echo "Never commit .env files to GitHub!"
    echo ""
fi

# Check gitignore
if grep -q "\.env" .gitignore; then
    echo -e "${GREEN}✅ .env is in .gitignore${NC}"
else
    echo -e "${RED}❌ .env is NOT in .gitignore${NC}"
    echo "Adding .env to .gitignore..."
    echo ".env" >> .gitignore
    echo -e "${GREEN}✅ Added${NC}"
fi

echo ""
echo "✅ Setup script complete!"
echo ""

