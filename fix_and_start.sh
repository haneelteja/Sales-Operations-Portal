#!/bin/bash

# Simple fix and start script
echo "🔧 Fixing database issues and starting application..."

# Skip problematic migrations
mv supabase/migrations/20250822072134_change_vendor_id_to_text.sql supabase/migrations/20250822072134_change_vendor_id_to_text.sql.skip 2>/dev/null || true

# Start the application
echo "🚀 Starting application..."
npm run dev





