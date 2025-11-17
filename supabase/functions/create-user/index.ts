import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Create user function called')
    console.log('Request method:', req.method)
    console.log('Request headers:', Object.fromEntries(req.headers.entries()))
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    console.log('Authorization header:', authHeader)
    
    if (!authHeader) {
      console.log('No authorization header found')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://qkvmdrtfhpcvwvqjuyuu.supabase.co'
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
    
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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('user_management')
      .select('email, username, role')
      .eq('email', email)
      .single()

    if (existingUser && !checkError) {
      return new Response(
        JSON.stringify({ 
          error: `User with email "${email}" already exists in the system. Username: ${existingUser.username}, Role: ${existingUser.role}` 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create user in auth.users using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: username,
        temp_password: password
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return new Response(
        JSON.stringify({ 
          error: `Failed to create auth user: ${authError.message}` 
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
    const { data: userRecord, error: userError } = await supabase
      .from("user_management")
      .insert({
        user_id: authData.user.id,
        username: username,
        email: email,
        associated_clients: associatedClients || [],
        associated_branches: associatedBranches || [],
        role: role,
        status: 'active',
        created_by: createdBy
      })
      .select()
      .single()

    if (userError) {
      console.error('User management creation error:', userError)
      // If user_management creation fails, try to clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.warn('Failed to cleanup auth user:', cleanupError)
      }
      return new Response(
        JSON.stringify({ 
          error: `Failed to create user management record: ${userError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send welcome email with username and password
    try {
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email-direct', {
        body: {
          email: email,
          username: username,
          tempPassword: password
        }
      })

      if (emailError) {
        console.warn('Failed to send welcome email:', emailError)
        // Don't throw error, user creation was successful
      } else {
        console.log('Welcome email sent successfully to:', email)
      }
    } catch (emailError) {
      console.warn('Failed to send welcome email:', emailError)
      // Don't throw error, user creation was successful
    }

    console.log('User created successfully:', userRecord)

    // Log the welcome email details for manual sending
    console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
    console.log('To:', email)
    console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
    console.log('Username:', username)
    console.log('Password:', password)
    console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
    console.log('=== END EMAIL DETAILS ===')

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
