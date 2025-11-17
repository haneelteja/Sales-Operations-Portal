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

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the actual reset URL from Supabase
    const finalResetUrl = resetUrl || `${supabaseUrl.replace('/rest/v1', '')}/reset-password`

    // Create the email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Elma Operations Portal – Password Reset Instructions</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Elma Operations Portal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Password Reset Instructions</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Dear <strong>${username || 'User'}</strong>,
            </p>
            
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              You have requested to reset your password for the Elma Operations Portal. Please click the link below to create a new password:
            </p>

            <!-- Reset Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${finalResetUrl}" 
                 style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(44, 90, 160, 0.3); transition: all 0.3s ease;">
                🔐 Reset Your Password
              </a>
            </div>

            <!-- Alternative Link -->
            <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; font-weight: 600;">If the button doesn't work, copy and paste this link:</p>
              <p style="margin: 0; color: #2c5aa0; font-size: 12px; word-break: break-all; font-family: 'Courier New', monospace; background: #e2e8f0; padding: 8px; border-radius: 4px;">
                ${finalResetUrl}
              </p>
            </div>

            <!-- Security Notice -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 20px; margin-right: 10px;">⚠️</span>
                <h3 style="color: #856404; margin: 0; font-size: 16px;">Important Security Notice</h3>
              </div>
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                For security reasons, this link will expire in 24 hours. If you did not request this change, please contact our support team immediately at <a href="mailto:nalluruhaneel@gmail.com" style="color: #856404; text-decoration: none; font-weight: 600;">nalluruhaneel@gmail.com</a>.
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 35px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0 0 5px 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 0; font-weight: 600;">Elma Manufacturing Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // For development/testing, we'll log the reset details instead of sending
    console.log('Password Reset Email Details:')
    console.log('Email:', email)
    console.log('Username:', username || 'User')
    console.log('Reset URL:', finalResetUrl)
    console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
    console.log('Email HTML Length:', emailHtml.length)

    // In production, you would integrate with an email service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Or use Supabase's built-in email service (requires setup)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset email with template logged successfully (email service not configured)',
        data: {
          email,
          username: username || 'User',
          resetUrl: finalResetUrl,
          appUrl: supabaseUrl.replace('/rest/v1', ''),
          emailHtml: emailHtml, // Include the HTML content
          note: 'In production, integrate with email service to send actual emails'
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
