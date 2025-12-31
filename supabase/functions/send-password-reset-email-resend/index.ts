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
    const { email, resetUrl, username } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          message: 'RESEND_API_KEY environment variable is missing'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the actual reset URL - prefer provided one, otherwise use production URL
    // Default to production Vercel URL if not provided
    const productionAppUrl = Deno.env.get('PRODUCTION_APP_URL') || 'https://sales-operations-portal.vercel.app'
    const appResetUrl = resetUrl || `${productionAppUrl}/reset-password`
    
    // Generate password reset token using Supabase Admin API
    // This creates a proper reset link that Supabase will recognize
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: appResetUrl // This should be /reset-password
      }
    })

    if (resetError || !resetData) {
      console.error('Error generating reset link:', resetError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate reset link',
          details: resetError?.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // ALWAYS rebuild the link to ensure it uses /reset-password, not /verify
    // Supabase's generateLink might use Site URL from config which could be /verify
    let finalResetUrl = resetData.properties?.action_link || appResetUrl
    
    // Extract token from the generated link
    const urlMatch = finalResetUrl.match(/token=([^&]+)/)
    const token = urlMatch ? urlMatch[1] : null
    
    if (token) {
      // Rebuild the reset link with production URL ALWAYS pointing to /reset-password
      const baseSupabaseUrl = supabaseUrl.replace('/rest/v1', '')
      // Force redirect_to to be /reset-password (not /verify)
      finalResetUrl = `${baseSupabaseUrl}/auth/v1/verify?token=${token}&type=recovery&redirect_to=${encodeURIComponent(appResetUrl)}`
      console.log('Rebuilt reset URL - redirect_to:', appResetUrl)
      console.log('Final reset URL:', finalResetUrl)
    } else {
      console.warn('Could not extract token from reset link, using provided URL')
      finalResetUrl = appResetUrl
    }

    // Get user's full name from database if available
    let userFullName = username || 'User'
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', email)
        .single()
      
      if (profile?.full_name) {
        userFullName = profile.full_name
      }
    } catch (error) {
      console.log('Could not fetch user profile:', error)
    }

    // Create beautiful, interactive HTML email template
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Elma Operations Portal</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f7fa;
            padding: 20px;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
            color: #ffffff;
            padding: 50px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .email-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        .logo-circle {
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            margin: 0 auto 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.3);
            position: relative;
            z-index: 1;
        }
        .logo-circle span {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
        }
        .email-header h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 0 0 10px 0;
            position: relative;
            z-index: 1;
        }
        .email-header p {
            font-size: 18px;
            opacity: 0.95;
            margin: 0;
            position: relative;
            z-index: 1;
        }
        .email-content {
            padding: 45px 35px;
        }
        .greeting {
            font-size: 18px;
            color: #2d3748;
            margin-bottom: 25px;
            font-weight: 500;
        }
        .greeting strong {
            color: #2c5aa0;
            font-weight: 600;
        }
        .intro-text {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        .cta-button-container {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%);
            color: #ffffff !important;
            padding: 18px 45px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: 600;
            font-size: 18px;
            box-shadow: 0 6px 20px rgba(44, 90, 160, 0.4);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(44, 90, 160, 0.5);
        }
        .link-fallback {
            background: #f8f9fa;
            border: 2px dashed #cbd5e0;
            border-radius: 10px;
            padding: 25px;
            margin: 30px 0;
        }
        .link-fallback-title {
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        .link-fallback-title::before {
            content: '🔗';
            margin-right: 8px;
            font-size: 16px;
        }
        .link-fallback-url {
            font-size: 13px;
            color: #2c5aa0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            background: #e2e8f0;
            padding: 12px;
            border-radius: 6px;
            line-height: 1.6;
        }
        .security-notice {
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border-left: 4px solid #f59e0b;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
        }
        .security-notice-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        .security-notice-icon {
            font-size: 24px;
            margin-right: 12px;
        }
        .security-notice-title {
            color: #92400e;
            font-size: 16px;
            font-weight: 700;
            margin: 0;
        }
        .security-notice-text {
            color: #78350f;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        .security-notice-text a {
            color: #92400e;
            text-decoration: underline;
            font-weight: 600;
        }
        .info-box {
            background: #e6f3ff;
            border-left: 4px solid #2c5aa0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        .info-box-title {
            color: #1e3a8a;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
        }
        .info-box-title::before {
            content: 'ℹ️';
            margin-right: 8px;
        }
        .info-box-text {
            color: #2c5aa0;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
        }
        .email-footer {
            background: #f8f9fa;
            border-top: 1px solid #e2e8f0;
            padding: 30px;
            text-align: center;
        }
        .footer-signature {
            color: #4a5568;
            font-size: 14px;
            margin-bottom: 15px;
        }
        .footer-signature strong {
            color: #2d3748;
            font-weight: 600;
        }
        .footer-company {
            color: #2c5aa0;
            font-size: 16px;
            font-weight: 700;
            margin: 0;
        }
        .footer-support {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #718096;
            font-size: 12px;
        }
        .footer-support a {
            color: #2c5aa0;
            text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                border-radius: 0;
            }
            .email-header {
                padding: 40px 20px;
            }
            .email-content {
                padding: 30px 20px;
            }
            .cta-button {
                padding: 16px 35px;
                font-size: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header Section -->
        <div class="email-header">
            <div class="logo-circle">
                <span>E</span>
            </div>
            <h1>Password Reset Request</h1>
            <p>Elma Operations Portal</p>
        </div>

        <!-- Content Section -->
        <div class="email-content">
            <p class="greeting">
                Hello <strong>${userFullName}</strong>,
            </p>

            <p class="intro-text">
                We received a request to reset your password for your Elma Operations Portal account. 
                If you made this request, click the button below to create a new secure password.
            </p>
            
            <p class="intro-text" style="margin-top: 20px; font-size: 15px; color: #718096;">
                This link will allow you to securely reset your password and regain access to your account.
            </p>

            <!-- Call-to-Action Button -->
            <div class="cta-button-container">
                <a href="${finalResetUrl}" class="cta-button">
                    🔐 Reset My Password
                </a>
            </div>

            <!-- Link Fallback -->
            <div class="link-fallback">
                <div class="link-fallback-title">
                    Button not working? Copy this link:
                </div>
                <div class="link-fallback-url">
                    ${finalResetUrl}
                </div>
            </div>

            <!-- Security Notice -->
            <div class="security-notice">
                <div class="security-notice-header">
                    <span class="security-notice-icon">⚠️</span>
                    <h3 class="security-notice-title">Security Reminder</h3>
                </div>
                <p class="security-notice-text">
                    <strong>Important:</strong> This password reset link will expire in <strong>24 hours</strong> for your security. 
                    For your protection, please do not share this link with anyone.
                </p>
                <p class="security-notice-text" style="margin-top: 12px;">
                    If you didn't request this password reset, please ignore this email. Your account remains secure. 
                    If you have concerns about your account security, contact our support team immediately at 
                    <a href="mailto:nalluruhaneel@gmail.com">nalluruhaneel@gmail.com</a>.
                </p>
            </div>

            <!-- Info Box -->
            <div class="info-box">
                <div class="info-box-title">Password Security Tips</div>
                <p class="info-box-text">
                    When creating your new password, remember to:<br><br>
                    ✓ Use at least 8 characters (longer is better)<br>
                    ✓ Include a mix of uppercase and lowercase letters<br>
                    ✓ Add numbers and special characters (!@#$%^&*)<br>
                    ✓ Avoid using personal information or common words<br>
                    ✓ Never share your password with anyone<br>
                    ✓ Consider using a password manager for better security<br><br>
                    After resetting, you'll be automatically logged in and can access all portal features.
                </p>
            </div>
            
            <!-- Additional Help Section -->
            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <div style="color: #0369a1; font-size: 14px; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="margin-right: 8px;">💡</span>
                    Need Help?
                </div>
                <p style="color: #0c4a6e; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you're having trouble resetting your password or have any questions, our support team is here to help. 
                    Simply reply to this email or contact us at 
                    <a href="mailto:nalluruhaneel@gmail.com" style="color: #0369a1; text-decoration: underline; font-weight: 600;">nalluruhaneel@gmail.com</a>.
                </p>
            </div>
        </div>

        <!-- Footer Section -->
        <div class="email-footer">
            <p class="footer-signature">
                <strong>Best regards,</strong>
            </p>
            <p class="footer-company">
                Elma Manufacturing Pvt. Ltd.
            </p>
            <div class="footer-support">
                Need help? Contact us at 
                <a href="mailto:nalluruhaneel@gmail.com">nalluruhaneel@gmail.com</a>
            </div>
        </div>
    </div>
</body>
</html>
    `.trim()

    // Check if email is the account owner (for Resend free tier limitation)
    const accountOwnerEmail = Deno.env.get('RESEND_ACCOUNT_OWNER_EMAIL') || 'nalluruhaneel@gmail.com'
    const isAccountOwner = email.toLowerCase() === accountOwnerEmail.toLowerCase()

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Elma Operations <onboarding@resend.dev>', // Using Resend's verified domain
        to: [email],
        subject: '🔐 Reset Your Password - Elma Operations Portal',
        html: emailHtml,
      }),
    })

    const emailData = await emailResponse.json()

    if (!emailResponse.ok) {
      console.error('Resend API error:', emailData)
      
      // Log email details for manual sending if Resend fails
      console.log('=== PASSWORD RESET EMAIL DETAILS (MANUAL SEND REQUIRED) ===')
      console.log('To:', email)
      console.log('Subject: 🔐 Reset Your Password - Elma Operations Portal')
      console.log('Reset URL:', finalResetUrl)
      console.log('HTML Length:', emailHtml.length)
      console.log('===========================================================')

      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to send email',
          details: emailData,
          emailDetails: {
            to: email,
            subject: '🔐 Reset Your Password - Elma Operations Portal',
            resetUrl: finalResetUrl,
            html: emailHtml
          },
          note: 'Email details logged above. Check Resend API key configuration.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Password reset email sent successfully via Resend:', emailData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email sent successfully',
        data: {
          emailId: emailData.id,
          email,
          resetUrl: finalResetUrl,
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
