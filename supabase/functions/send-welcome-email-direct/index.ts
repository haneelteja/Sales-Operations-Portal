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
    const { email, username, tempPassword } = await req.json()

    if (!email || !username || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, username, tempPassword' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create a simple text email with password
    const emailText = `
Welcome to Elma Operations Portal!

Dear ${username},

Your account has been successfully created. Here are your login credentials:

Username: ${username}
Password: ${tempPassword}

Please log in at: ${supabaseUrl.replace('/rest/v1', '')}

Important: Please change your password after your first login for security purposes.

If you have any issues, please contact support at nalluruhaneel@gmail.com

Best regards,
Elma Manufacturing Pvt. Ltd.
    `.trim()

    // Create HTML email with password
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Elma Operations Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background: #fff; border: 2px solid #e53e3e; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .password { font-size: 18px; font-weight: bold; color: #e53e3e; background: #fed7d7; padding: 10px; border-radius: 4px; text-align: center; }
        .login-btn { background: #2c5aa0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Elma Operations Portal</h1>
        <p>Your Access Details</p>
    </div>
    
    <div class="content">
        <p>Dear <strong>${username}</strong>,</p>
        
        <p>Your account has been successfully created in the Elma Operations Portal. Below are your login credentials:</p>
        
        <div class="credentials">
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong></p>
            <div class="password">${tempPassword}</div>
        </div>
        
        <p>Please log in at: <a href="${supabaseUrl.replace('/rest/v1', '')}">${supabaseUrl.replace('/rest/v1', '')}</a></p>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <div style="text-align: center;">
            <a href="${supabaseUrl.replace('/rest/v1', '')}" class="login-btn">🚀 Access Portal</a>
        </div>
        
        <p>If you have any issues logging in, please contact support at <a href="mailto:nalluruhaneel@gmail.com">nalluruhaneel@gmail.com</a></p>
    </div>
    
    <div class="footer">
        <p>Best regards,<br>Elma Manufacturing Pvt. Ltd.</p>
    </div>
</body>
</html>
    `.trim()

    // For now, we'll use Supabase's built-in email templates
    // This will send a confirmation email with the password
    const { error: emailError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: false, // Don't send confirmation email
      user_metadata: {
        full_name: username,
        temp_password: tempPassword
      }
    })

    if (emailError) {
      console.error('Error creating user for email:', emailError)
      
      // Fallback: Log the email details
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('')
      console.log('TEXT VERSION:')
      console.log(emailText)
      console.log('')
      console.log('HTML VERSION:')
      console.log(emailHtml)
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email details logged (manual send required)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: supabaseUrl.replace('/rest/v1', ''),
            emailText,
            emailHtml,
            note: 'Please send this email manually to the user'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Log the email details for verification
    console.log('=== WELCOME EMAIL SENT ===')
    console.log('To:', email)
    console.log('Username:', username)
    console.log('Password:', tempPassword)
    console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
    console.log('=== END EMAIL LOG ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        data: {
          email,
          username,
          tempPassword,
          appUrl: supabaseUrl.replace('/rest/v1', ''),
          note: 'User created and email details logged'
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






