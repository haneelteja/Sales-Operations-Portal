import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts"

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

    // Get SMTP configuration from environment variables
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com'
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465')
    const smtpUser = Deno.env.get('SMTP_USER')
    const smtpPass = Deno.env.get('SMTP_PASS')
    const fromEmail = Deno.env.get('SMTP_FROM_EMAIL') || smtpUser || 'noreply@example.com'
    const fromName = Deno.env.get('SMTP_FROM_NAME') || 'Elma Operations'

    if (!smtpUser || !smtpPass) {
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('SMTP not configured. Please set SMTP_USER and SMTP_PASS environment variables.')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'https://sales-operations-portal.vercel.app')
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email details logged (SMTP not configured)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
            note: 'Please configure SMTP_USER and SMTP_PASS environment variables or send email manually'
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
            
            <p>Please log in at: <a href="${appUrl || 'https://sales-operations-portal.vercel.app'}">${appUrl || 'https://sales-operations-portal.vercel.app'}</a></p>
            
            <div style="text-align: center;">
                <a href="${appUrl || 'https://sales-operations-portal.vercel.app'}" class="login-btn">🚀 Access Elma Operations Portal</a>
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

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPass,
        },
      },
    })

    console.log('Sending email via SMTP...')
    console.log('SMTP Host:', smtpHost)
    console.log('SMTP Port:', smtpPort)
    console.log('From:', `${fromName} <${fromEmail}>`)
    console.log('To:', email)

    try {
      // Send email
      await client.send({
        from: `${fromName} <${fromEmail}>`,
        to: email,
        subject: 'Welcome to Elma Operations Portal - Your Login Credentials',
        content: emailHtml,
        html: emailHtml,
      })

      console.log('✅ Email sent successfully via SMTP to:', email)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email sent successfully via SMTP',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (smtpError) {
      console.error('❌ SMTP error:', smtpError)
      
      // Fallback: Log email details
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Welcome to Elma Operations Portal - Your Login Credentials')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'https://sales-operations-portal.vercel.app')
      console.log('SMTP Error:', smtpError.message)
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email details logged (SMTP error)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
            error: smtpError.message,
            note: 'Please send this email manually to the user'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } finally {
      // Close SMTP connection
      await client.close()
    }

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
