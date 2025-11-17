// Final user setup - Replace YOUR_USER_ID_HERE with the actual User ID from Supabase Dashboard
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yltbknkksjgtexluhtau.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGJrbmtrc2pndGV4bHVodGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjIyMTEsImV4cCI6MjA3NTkzODIxMX0.G0GWBtTKnoBv4XFS9MzIwkfx3CuxDiYH98JLc1GFqNA');

async function createUserManagementRecord() {
  // REPLACE THIS WITH THE ACTUAL USER ID FROM SUPABASE DASHBOARD
  const userId = '6e2e740b-57c6-4468-b073-b379aed3c6a6';
  
  if (userId === 'YOUR_USER_ID_HERE') {
    console.log('❌ Please replace YOUR_USER_ID_HERE with the actual User ID from Supabase Dashboard');
    console.log('📝 Steps:');
    console.log('1. Go to: https://supabase.com/dashboard');
    console.log('2. Select project: yltbknkksjgtexluhtau');
    console.log('3. Go to: Authentication → Users');
    console.log('4. Find: nalluruhaneel@gmail.com');
    console.log('5. Copy the User ID');
    console.log('6. Replace YOUR_USER_ID_HERE in this file with the actual User ID');
    return;
  }
  
  try {
    console.log('🔧 Creating user management record...');
    
    const { data, error } = await supabase
      .from('user_management')
      .insert({
        user_id: userId,
        username: 'nalluruhaneel@gmail.com',
        email: 'nalluruhaneel@gmail.com',
        associated_clients: [],
        associated_branches: [],
        status: 'active',
        role: 'admin'
      });
    
    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ User management record created successfully!');
      console.log('🎉 Authentication setup complete!');
      console.log('🚀 You can now sign in to the application!');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

createUserManagementRecord();
