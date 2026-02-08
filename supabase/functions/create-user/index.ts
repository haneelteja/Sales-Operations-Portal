import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    console.log('Create user function called')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing')
    
    // In development, allow requests without auth header or with anon key
    // The function uses service role key internally, so it doesn't need client auth
    if (!authHeader) {
      console.log('No authorization header found - allowing in development mode')
      // Continue - the function uses service role key internally
    }
    
    let requestData;
    try {
      requestData = await req.json()
      console.log('Request data received:', requestData)
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { 
      email, 
      username, 
      password, 
      role, 
      associatedClients, 
      associatedBranches, 
      createdBy 
    } = requestData

    console.log('Parsed data:', { email, username, role, associatedClients, associatedBranches, createdBy })
    console.log('Role received:', role, 'Type:', typeof role)
    console.log('Role validation - is admin?', role === 'admin')
    console.log('Role validation - is manager?', role === 'manager')
    console.log('Role validation - is client?', role === 'client')

    if (!email || !username || !password || !role) {
      console.log('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, username, password, role' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Validate role is one of the allowed values
    if (!['admin', 'manager', 'client'].includes(role)) {
      console.error('Invalid role provided:', role)
      return new Response(
        JSON.stringify({ error: `Invalid role: ${role}. Must be one of: admin, manager, client` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // SECURITY: Use environment variables only - never hardcode credentials
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase URL:', supabaseUrl)
    console.log('Service key exists:', !!supabaseServiceKey)
    console.log('All env vars:', Object.keys(Deno.env.toObject()))
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      console.error('Available env vars:', Object.keys(Deno.env.toObject()))
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created')

    // Check if user already exists in user_management table
    const { data: existingUser, error: checkError } = await supabase
      .from('user_management')
      .select('email, username, role, user_id')
      .eq('email', email)
      .single()

    if (existingUser && !checkError) {
      console.log('Found existing user in user_management:', existingUser.email, 'ID:', existingUser.user_id);
      
      // Delete existing user from user_management table first
      try {
        console.log('Deleting existing user from user_management:', existingUser.user_id);
        const { error: deleteUserError } = await supabase
          .from('user_management')
          .delete()
          .eq('user_id', existingUser.user_id);
        
        if (deleteUserError) {
          console.error('Failed to delete existing user from user_management:', deleteUserError);
          return new Response(
            JSON.stringify({ 
              error: `User with email "${email}" already exists and could not be deleted from user_management. Please delete the user manually first.`,
              details: deleteUserError.message
            }),
            { 
              status: 409, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        console.log('Successfully deleted existing user from user_management');
      } catch (deleteError) {
        console.error('Exception deleting existing user from user_management:', deleteError);
        return new Response(
          JSON.stringify({ 
            error: `User with email "${email}" already exists and could not be deleted. Please delete the user manually first.`,
            details: deleteError instanceof Error ? deleteError.message : String(deleteError)
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Also delete the associated auth user if it exists
      if (existingUser.user_id) {
        try {
          console.log('Deleting associated auth user:', existingUser.user_id);
          const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(existingUser.user_id);
          if (deleteAuthError) {
            console.warn('Failed to delete associated auth user (may not exist):', deleteAuthError);
            // Continue anyway - auth user might not exist
          } else {
            console.log('Successfully deleted associated auth user');
          }
        } catch (authDeleteError) {
          console.warn('Exception deleting associated auth user (may not exist):', authDeleteError);
          // Continue anyway - auth user might not exist
        }
      }
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Check if user already exists in auth.users (even if not in user_management)
    let existingAuthUser = null;
    try {
      const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
      if (!listError && authUsers?.users) {
        existingAuthUser = authUsers.users.find(u => u.email === email);
        if (existingAuthUser) {
          console.log('Found existing auth user with email:', email, 'ID:', existingAuthUser.id);
          // Delete the existing auth user first
          try {
            console.log('Deleting existing auth user:', existingAuthUser.id);
            const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAuthUser.id);
            if (deleteError) {
              console.error('Failed to delete existing auth user:', deleteError);
              return new Response(
                JSON.stringify({ 
                  error: `User with email "${email}" already exists in auth system and could not be deleted. Please delete the user manually first.`,
                  details: deleteError.message
                }),
                { 
                  status: 409, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              );
            }
            console.log('Successfully deleted existing auth user');
            // Wait a moment for cleanup
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (deleteError) {
            console.error('Exception deleting existing auth user:', deleteError);
            return new Response(
              JSON.stringify({ 
                error: `User with email "${email}" already exists and could not be deleted. Please delete the user manually first.`,
                details: deleteError instanceof Error ? deleteError.message : String(deleteError)
              }),
              { 
                status: 409, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
        }
      }
    } catch (listError) {
      console.warn('Could not check existing auth users (may require admin privileges):', listError);
      // Continue - we'll try to create and handle the error if it fails
    }

    // Create user in auth.users using admin API
    // Mark user as requiring password reset on first login
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Email is confirmed, but password reset is still required
      user_metadata: {
        full_name: username,
        temp_password: password,
        requires_password_reset: true, // Flag to force password reset on first login
        password_changed_at: null, // Will be set when user changes password
        first_login: true // Track if this is first login
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      // Check if it's an email exists error
      if (authError.message?.includes('already been registered') || authError.message?.includes('email_exists')) {
        return new Response(
          JSON.stringify({ 
            error: `User with email "${email}" already exists in the authentication system. Please delete the existing user first or use a different email.`,
            code: 'email_exists',
            hint: 'The user may exist in auth.users but not in user_management. Check Supabase Auth dashboard.'
          }),
          { 
            status: 409, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      return new Response(
        JSON.stringify({ 
          error: `Failed to create auth user: ${authError.message}`,
          code: authError.status || 'unknown'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ 
          error: 'User creation failed - no user data returned' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Wait a moment for the user to be fully created in the auth system
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create user management record
    console.log('Inserting user_management record with role:', role)
    console.log('Associated clients:', associatedClients, 'Type:', Array.isArray(associatedClients))
    console.log('Associated branches:', associatedBranches, 'Type:', Array.isArray(associatedBranches))
    
    // Ensure arrays are valid (not null/undefined)
    const safeClients = Array.isArray(associatedClients) ? associatedClients : [];
    const safeBranches = Array.isArray(associatedBranches) ? associatedBranches : [];
    
    // For admin/manager roles, empty arrays are acceptable - they'll have access to all clients
    console.log('Using safe arrays - clients:', safeClients.length, 'branches:', safeBranches.length)
    
    const insertData = {
      user_id: authData.user.id,
      username: username,
      email: email,
      associated_clients: safeClients,
      associated_branches: safeBranches,
      role: role, // Explicitly set role from request
      status: 'active',
      created_by: createdBy || null
    };
    
    console.log('Insert data:', { 
      ...insertData, 
      created_by: createdBy || 'null',
      associated_clients_count: insertData.associated_clients.length,
      associated_branches_count: insertData.associated_branches.length
    })
    
    const { data: userRecord, error: userError } = await supabase
      .from("user_management")
      .insert(insertData)
      .select()
      .single()
    
    console.log('User record created:', userRecord)
    console.log('Created user role:', userRecord?.role)

    if (userError) {
      console.error('User management creation error:', userError)
      console.error('Error code:', userError.code)
      console.error('Error message:', userError.message)
      console.error('Error details:', userError.details)
      console.error('Error hint:', userError.hint)
      
      // If user_management creation fails, try to clean up the auth user
      try {
        console.log('Attempting to cleanup auth user:', authData.user.id)
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('Auth user cleaned up successfully')
      } catch (cleanupError) {
        console.warn('Failed to cleanup auth user:', cleanupError)
      }
      
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user management record: ${userError.message}`,
          details: userError.details,
          hint: userError.hint,
          code: userError.code
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send welcome email with username and password
    try {
      console.log('Attempting to send welcome email to:', email)
      const appUrl = Deno.env.get('APP_URL') || 'https://sales-operations-portal.vercel.app'
      
      // Try sending via SMTP first (no domain verification needed)
      console.log('Trying SMTP email function first...')
      let emailResponse = null
      let emailError = null
      
      try {
        const smtpResult = await supabase.functions.invoke('send-welcome-email-smtp', {
          body: {
            email: email,
            username: username,
            tempPassword: password,
            appUrl: appUrl
          }
        })
        emailResponse = smtpResult.data
        emailError = smtpResult.error
        
        if (!emailError && emailResponse?.success) {
          console.log('✅ Email sent successfully via SMTP')
        } else {
          throw new Error('SMTP function failed, trying Resend...')
        }
      } catch (smtpErr) {
        console.log('SMTP function not available or failed, trying Resend...')
        // Fallback to Resend if SMTP is not configured
        const resendResult = await supabase.functions.invoke('send-welcome-email-resend', {
          body: {
            email: email,
            username: username,
            tempPassword: password,
            appUrl: appUrl
          }
        })
        emailResponse = resendResult.data
        emailError = resendResult.error
        
        // Validate Resend response - if it failed, log details for manual sending
        if (emailError || !emailResponse?.success) {
          console.error('❌ Resend fallback also failed')
          if (emailError) {
            console.error('Resend error:', emailError)
          }
          if (emailResponse && !emailResponse.success) {
            console.error('Resend returned success: false')
          }
          // Log email details for manual sending
          console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
          console.log('To:', email)
          console.log('Subject: Your Access to Elma Operations Portal')
          console.log('Username:', username)
          console.log('Temporary Password:', password)
          console.log('App URL:', appUrl)
          if (emailResponse) {
            console.log('Response:', JSON.stringify(emailResponse, null, 2))
          }
          console.log('=== END EMAIL DETAILS ===')
        } else {
          console.log('✅ Welcome email sent successfully via Resend to:', email)
          if (emailResponse.data?.resendId) {
            console.log('Resend Email ID:', emailResponse.data.resendId)
          }
        }
      }
      
      console.log('Email function response:', JSON.stringify(emailResponse, null, 2))
      console.log('Email function error:', emailError)
      
      // If no response and no error, log details for manual sending
      if (!emailResponse && !emailError) {
        console.warn('⚠️ No response from email function')
        // Log email details for manual sending
        console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
        console.log('To:', email)
        console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
        console.log('Username:', username)
        console.log('Temporary Password:', password)
        console.log('App URL:', appUrl)
        console.log('=== END EMAIL DETAILS ===')
      }
    } catch (emailError) {
      console.error('❌ Exception sending welcome email:', emailError)
      console.error('Exception details:', emailError instanceof Error ? emailError.message : JSON.stringify(emailError))
      // Log email details for manual sending
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Temporary Password:', password)
      console.log('App URL:', Deno.env.get('APP_URL') || 'https://sales-operations-portal.vercel.app')
      console.log('=== END EMAIL DETAILS ===')
    }

    console.log('User created successfully:', userRecord)

    // Only log email details if email sending failed
    if (!emailResponse?.success && emailError) {
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Password:', password)
      console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
      console.log('=== END EMAIL DETAILS ===')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        data: {
          user: userRecord,
          authUser: authData.user,
          welcomeEmail: {
            email: email,
            username: username,
            password: password,
            appUrl: supabaseUrl.replace('/rest/v1', ''),
            message: 'Please send welcome email manually with the above credentials'
          }
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})