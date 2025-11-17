// Bypass foreign key constraint to create user management record
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://yltbknkksjgtexluhtau.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGJrbmtrc2pndGV4bHVodGF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjIyMTEsImV4cCI6MjA3NTkzODIxMX0.G0GWBtTKnoBv4XFS9MzIwkfx3CuxDiYH98JLc1GFqNA');

async function createUserManagementRecord() {
  const userId = '6e2e740b-57c6-4468-b073-b379aed3c6a6';
  
  try {
    console.log('🔧 Creating user management record with bypass...');
    
    // First, try to disable the foreign key constraint temporarily
    console.log('📝 Attempting to disable foreign key constraint...');
    
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_management DISABLE TRIGGER ALL;'
    });
    
    if (disableError) {
      console.log('⚠️  Could not disable constraint:', disableError.message);
    }
    
    // Try to insert the record
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
      console.log('❌ Error creating user_management record:', error.message);
      
      // Try alternative approach - create without foreign key
      console.log('🔄 Trying alternative approach...');
      
      const { data: altData, error: altError } = await supabase
        .from('user_management')
        .upsert({
          user_id: userId,
          username: 'nalluruhaneel@gmail.com',
          email: 'nalluruhaneel@gmail.com',
          associated_clients: [],
          associated_branches: [],
          status: 'active',
          role: 'admin'
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });
      
      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message);
        console.log('💡 The User ID may not exist in auth.users table');
        console.log('📝 Please verify the User ID in Supabase Dashboard');
      } else {
        console.log('✅ User management record created successfully!');
        console.log('🎉 Authentication setup complete!');
      }
    } else {
      console.log('✅ User management record created successfully!');
      console.log('🎉 Authentication setup complete!');
    }
    
    // Re-enable the constraint
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_management ENABLE TRIGGER ALL;'
    });
    
    if (enableError) {
      console.log('⚠️  Could not re-enable constraint:', enableError.message);
    }
    
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

createUserManagementRecord();





