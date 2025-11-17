#!/bin/bash

# Email Setup Script for Elma Operations Portal
# This script helps you set up automatic email sending

echo "🚀 Setting up Email Sending for Elma Operations Portal"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed"
    echo "Please install it first: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"

# Deploy the email function
echo "📧 Deploying email function..."
cd supabase
npx supabase functions deploy send-welcome-email-resend

if [ $? -eq 0 ]; then
    echo "✅ Email function deployed successfully!"
else
    echo "❌ Failed to deploy email function"
    exit 1
fi

cd ..

echo ""
echo "🎉 Email Setup Complete!"
echo "======================="
echo ""
echo "Next steps:"
echo "1. Choose an email service (Resend recommended)"
echo "2. Get your API key from the service"
echo "3. Add it to Supabase Edge Functions environment:"
echo "   - Go to Supabase Dashboard → Settings → Edge Functions"
echo "   - Add environment variable: RESEND_API_KEY"
echo "   - Value: your_api_key_here"
echo ""
echo "4. Test by creating a new user"
echo ""
echo "For detailed instructions, see: EMAIL_SETUP_GUIDE.md"
echo ""
echo "The system will work with or without email service -"
echo "it will show email details for manual sending if needed."






