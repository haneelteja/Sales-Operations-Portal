import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, username, tempPassword, appUrl } = await req.json()

    if (!email || !username || !tempPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, username, tempPassword' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      // Fallback: Log email details for manual sending
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'http://localhost:8080')
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Welcome email details logged (RESEND_API_KEY not configured)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'http://localhost:8080',
            note: 'Please configure RESEND_API_KEY environment variable or send email manually'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create HTML email
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Elma Operations Portal</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5; }
        .container { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 40px 30px; text-align: center; }
        .content { padding: 40px 30px; }
        .credentials { background: #f8f9fa; border: 2px solid #e53e3e; border-radius: 8px; padding: 25px; margin: 25px 0; }
        .password { font-size: 20px; font-weight: bold; color: #e53e3e; background: #fed7d7; padding: 15px; border-radius: 6px; text-align: center; margin: 10px 0; }
        .login-btn { background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 25px 0; font-weight: 600; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Welcome to Elma Operations Portal</h1>
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
            
            <div class="warning">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
            </div>
            
            <p>Please log in at: <a href="${appUrl || 'http://localhost:8080'}">${appUrl || 'http://localhost:8080'}</a></p>
            
            <div style="text-align: center;">
                <a href="${appUrl || 'http://localhost:8080'}" class="login-btn">🚀 Access Elma Operations Portal</a>
            </div>
            
            <p>If you have any issues logging in, please contact support at <a href="mailto:nalluruhaneel@gmail.com">nalluruhaneel@gmail.com</a></p>
        </div>
        
        <div class="footer">
            <p><strong>Best regards,</strong><br>Elma Manufacturing Pvt. Ltd.</p>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Get the from address - use environment variable if set, otherwise use Resend's test domain
    // To send to any email (including Gmail), you need to verify YOUR OWN domain in Resend
    // Then set RESEND_FROM_EMAIL environment variable to: "Elma Operations <noreply@yourdomain.com>"
    // Example: If you verify "elma.com", use: "Elma Operations <noreply@elma.com>"
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Elma Operations <onboarding@resend.dev>'
    
    console.log('Sending email from:', fromEmail)
    console.log('Sending email to:', email)
    
    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail, // Configurable via RESEND_FROM_EMAIL environment variable
        to: [email],
        subject: 'Welcome to Elma Operations Portal - Your Login Credentials',
        html: emailHtml,
      }),
    })

    const emailData = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData)
      
      // Fallback: Log email details
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'http://localhost:8080')
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Welcome email details logged (Resend API error)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'http://localhost:8080',
            error: emailData,
            note: 'Please send this email manually to the user'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('=== WELCOME EMAIL SENT VIA RESEND ===')
    console.log('To:', email)
    console.log('Username:', username)
    console.log('Password:', tempPassword)
    console.log('Resend ID:', emailData.id)
    console.log('=== END EMAIL LOG ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully via Resend',
        data: {
          email,
          username,
          tempPassword,
          appUrl: appUrl || 'http://localhost:8080',
          resendId: emailData.id
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
