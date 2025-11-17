#!/bin/bash

# Create authentication user using Supabase CLI
echo "🔐 Creating authentication user..."

# This will create a user in Supabase Auth
supabase auth signup --email nalluruhaneel@gmail.com --password password123

echo "✅ User created! Now you can sign in with:"
echo "   Email: nalluruhaneel@gmail.com"
echo "   Password: password123"





