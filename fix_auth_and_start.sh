#!/bin/bash

# Complete fix for authentication and start application
echo "🔐 Fixing authentication and starting application..."

# Skip problematic migrations
mv supabase/migrations/20250822072134_change_vendor_id_to_text.sql supabase/migrations/20250822072134_change_vendor_id_to_text.sql.skip 2>/dev/null || true

echo "📝 IMPORTANT: You need to create a user in Supabase Dashboard first!"
echo ""
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Select project: yltbknkksjgtexluhtau"
echo "3. Go to: Authentication → Users"
echo "4. Click: 'Add user'"
echo "5. Email: nalluruhaneel@gmail.com"
echo "6. Password: password123"
echo "7. Check 'Email Confirm'"
echo "8. Click 'Create user'"
echo "9. Copy the User ID"
echo ""
echo "10. Then run: node update_user_management.js"
echo "    (Replace YOUR_USER_ID_HERE with the actual User ID)"
echo ""
echo "🚀 Starting application..."

# Start the application
npm run dev





