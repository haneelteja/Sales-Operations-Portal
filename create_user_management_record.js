// Create user_management record
// This will work by trying to sign in first to get the user ID

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yltbknkksjgtexluhtau.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGJrbmtrc2pndGV4bHVodGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjIyMTEsImV4cCI6MjA3NTkzODIxMX0.G0GWBtTKnoBv4XFS9MzIwkfx3CuxDiYH98JLc1GFqNA');

async function createUserManagementRecord() {
  try {
    console.log('🔐 Attempting to sign in to get user ID...');
    
    // Try to sign in to get the user ID
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'nalluruhaneel@gmail.com',
      password: 'password123' // You may need to change this to the actual password
    });
    
    if (authError) {
      console.log('❌ Auth error:', authError.message);
      console.log('💡 Please check the password or create the user in Supabase Dashboard');
      return;
    }
    
    if (authData?.user?.id) {
      console.log('✅ User signed in successfully!');
      console.log('📋 User ID:', authData.user.id);
      
      // Now create the user_management record
      const { data, error } = await supabase
        .from('user_management')
        .insert({
          user_id: authData.user.id,
          username: 'nalluruhaneel@gmail.com',
          email: 'nalluruhaneel@gmail.com',
          associated_clients: [],
          associated_branches: [],
          status: 'active',
          role: 'admin'
        });
      
      if (error) {
        console.log('❌ Error creating user_management record:', error.message);
      } else {
        console.log('✅ User management record created successfully!');
        console.log('🎉 You can now use the application!');
      }
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

createUserManagementRecord();





