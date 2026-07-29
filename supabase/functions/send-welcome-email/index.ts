import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCorsHeaders } from '../_shared/auth.ts'

serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // email and username are still accepted; tempPassword is ignored (never sent to user).
    const { email, username } = await req.json()

    if (!email || !username) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, username' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const appUrl = Deno.env.get('APP_URL') ?? 'https://app.aamodha.com'

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate a one-time password-reset link so the user sets their own password.
    // This avoids transmitting a plaintext password over email.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: appUrl },
    })

    const resetLink = linkData?.properties?.action_link ?? appUrl

    if (linkError) {
      console.warn('Could not generate reset link:', linkError.message)
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Elma Operations Portal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to Elma Operations Portal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your account is ready</p>
          </div>

          <div style="padding: 40px 30px;">
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Dear <strong>${username}</strong>,
            </p>
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Your account has been created in the Elma Operations Portal.
              Click the button below to set your own password and log in.
              This link is valid for <strong>24 hours</strong> and can only be used once.
            </p>

            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}"
                 style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(44,90,160,0.3);">
                Set My Password &amp; Sign In
              </a>
            </div>

            <p style="color: #718096; font-size: 13px; margin: 0 0 20px 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #2c5aa0; word-break: break-all;">${resetLink}</a>
            </p>

            <div style="background: #f7fafc; border-radius: 8px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 16px;">Your login email</h3>
              <p style="margin: 0; font-family: 'Courier New', monospace; background: #e2e8f0; display: inline-block; padding: 4px 10px; border-radius: 4px; color: #2d3748;">${email}</p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                If you did not expect this invitation, please contact
                <a href="mailto:nalluruhaneel@gmail.com" style="color: #856404; font-weight: 600;">nalluruhaneel@gmail.com</a> immediately.
              </p>
            </div>

            <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 35px; text-align: center; color: #718096; font-size: 12px;">
              <p style="margin: 0 0 5px 0; font-weight: 600;">Best regards,</p>
              <p style="margin: 0; font-weight: 600;">Elma Manufacturing Pvt. Ltd.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    console.log('Welcome email prepared for:', email, '| reset link generated:', !linkError)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Welcome email prepared successfully',
        data: { email, username, appUrl, emailHtml },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
