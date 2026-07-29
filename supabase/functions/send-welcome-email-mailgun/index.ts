import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { buildCorsHeaders } from '../_shared/auth.ts';

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
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

    // Get Mailgun configuration from environment variables
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY')
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN')
    const fromEmail = Deno.env.get('MAILGUN_FROM_EMAIL') || `noreply@${mailgunDomain || 'example.com'}`
    const fromName = Deno.env.get('MAILGUN_FROM_NAME') || 'Elma Operations'
    
    if (!mailgunApiKey || !mailgunDomain) {
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('Mailgun not configured. Please set MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables.')
      console.log('To:', email)
      console.log('Subject: Your Access to Elma Operations Portal')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'https://sales-operations-portal.vercel.app')
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Welcome email details logged (Mailgun not configured)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
            note: 'Please configure MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables or send email manually'
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
<title>Welcome to Elma Operations Portal</title>
<style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;color:#333;}
.container{max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,0.1);}
.header{background:#1e3a8a;color:#ffffff;padding:30px;text-align:center;}
.content{padding:30px;}
.credentials{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:20px;margin:20px 0;}
.password{font-size:18px;font-weight:bold;color:#b91c1c;background:#fee2e2;padding:10px;border-radius:4px;text-align:center;}
.btn{display:inline-block;margin-top:20px;padding:12px 30px;background:#1e3a8a;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;}
.warning{background:#fff7ed;border:1px solid #fed7aa;border-radius:6px;padding:12px;margin-top:20px;color:#7c2d12;font-size:14px;}
.footer{text-align:center;font-size:13px;color:#6b7280;padding:20px;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h2>Welcome to Elma Operations Portal</h2>
  </div>
  <div class="content">
    <p>Dear <strong>${username}</strong>,</p>
    <p>Your user account has been successfully created. Please find your login credentials below:</p>
    <div class="credentials">
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Temporary Password:</strong></p>
      <div class="password">${tempPassword}</div>
    </div>
    <div class="warning">
      For security reasons, please change your password immediately after your first login.
    </div>
    <p>
      Access the portal using the link below:
      <br>
      <a href="${appUrl || 'https://sales-operations-portal.vercel.app'}">
        ${appUrl || 'https://sales-operations-portal.vercel.app'}
      </a>
    </p>
    <div style="text-align:center;">
      <a class="btn" href="${appUrl || 'https://sales-operations-portal.vercel.app'}">
        Login to Portal
      </a>
    </div>
    <p style="margin-top:25px;">
      If you require any assistance, please contact support at
      <a href="mailto:nalluruhaneel@gmail.com">nalluruhaneel@gmail.com</a>.
    </p>
  </div>
  <div class="footer">
    Regards,<br>
    <strong>Elma Manufacturing Pvt. Ltd.</strong>
  </div>
</div>
</body>
</html>
    `.trim()

    // Mailgun API endpoint
    const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`
    
    // Create form data for Mailgun API
    const formData = new FormData()
    formData.append('from', `${fromName} <${fromEmail}>`)
    formData.append('to', email)
    formData.append('subject', 'Your Access to Elma Operations Portal')
    formData.append('html', emailHtml)
    formData.append('text', `Welcome to Elma Operations Portal\n\nUsername: ${username}\nPassword: ${tempPassword}\n\nPlease log in at: ${appUrl || 'https://sales-operations-portal.vercel.app'}\n\nPlease change your password after your first login.`)

    console.log('Sending email via Mailgun...')
    console.log('Mailgun Domain:', mailgunDomain)
    console.log('From:', `${fromName} <${fromEmail}>`)
    console.log('To:', email)

    try {
      // Send email using Mailgun API
      const mailgunResponse = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: formData,
      })

      const mailgunData = await mailgunResponse.json()

      if (!mailgunResponse.ok) {
        throw new Error(`Mailgun API error: ${JSON.stringify(mailgunData)}`)
      }

      console.log('✅ Email sent successfully via Mailgun to:', email)
      console.log('Mailgun Message ID:', mailgunData.id)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email sent successfully via Mailgun',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
            mailgunId: mailgunData.id
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } catch (mailgunError) {
      console.error('❌ Mailgun error:', mailgunError)
      
      // Fallback: Log email details
      console.log('=== WELCOME EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: Your Access to Elma Operations Portal')
      console.log('Username:', username)
      console.log('Password:', tempPassword)
      console.log('App URL:', appUrl || 'https://sales-operations-portal.vercel.app')
      console.log('Mailgun Error:', mailgunError.message)
      console.log('=== END EMAIL DETAILS ===')
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Welcome email details logged (Mailgun error)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: appUrl || 'https://sales-operations-portal.vercel.app',
            error: mailgunError.message,
            note: 'Please send this email manually to the user'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
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
