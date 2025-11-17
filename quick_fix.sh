#!/bin/bash

# Quick Fix Script - Run this every time you start the application
echo "🔧 Quick Fix: Resolving database issues..."

# Reset database and start application
supabase db reset --linked --debug && npm run dev





