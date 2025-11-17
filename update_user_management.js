// Update user_management with the correct user_id
// Replace 'YOUR_USER_ID_HERE' with the actual User ID from Supabase Dashboard

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yltbknkksjgtexluhtau.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGJrbmtrc2pndGV4bHVodGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjIyMTEsImV4cCI6MjA3NTkzODIxMX0.G0GWBtTKnoBv4XFS9MzIwkfx3CuxDiYH98JLc1GFqNA');

async function updateUserManagement() {
  // Replace this with the actual User ID from Supabase Dashboard
  const userId = 'YOUR_USER_ID_HERE';
  
  try {
    const { data, error } = await supabase
      .from('user_management')
      .upsert({
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
      console.log('✅ User management record updated successfully!');
      console.log('🎉 You can now sign in with:');
      console.log('   Email: nalluruhaneel@gmail.com');
      console.log('   Password: password123');
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

updateUserManagement();





