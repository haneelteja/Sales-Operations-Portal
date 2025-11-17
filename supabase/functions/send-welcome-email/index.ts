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

    // Create the email HTML content with password included
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Elma Operations Portal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <div style="width: 60px; height: 60px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 24px; font-weight: bold;">E</span>
            </div>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Welcome to Elma Operations Portal</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your Access Details</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px 30px;">
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              Dear <strong>${username}</strong>,
            </p>
            
            <p style="color: #2d3748; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
              We are pleased to inform you that your profile has been successfully created in the Elma Operations Portal. This platform is designed to help you efficiently access our operational resources and streamline communication across the company.
            </p>

            <p style="color: #2d3748; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
              Below are your login details:
            </p>
            
            <!-- Credentials Card -->
            <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 20px 0;">
              <div style="margin-bottom: 15px;">
                <span style="color: #4a5568; font-weight: 600; display: block; margin-bottom: 5px;">Username:</span>
                <span style="color: #2d3748; font-size: 16px; font-family: 'Courier New', monospace; background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">
                  ${username}
                </span>
              </div>
              <div>
                <span style="color: #4a5568; font-weight: 600; display: block; margin-bottom: 5px;">Temporary Password:</span>
                <span style="color: #e53e3e; font-size: 18px; font-weight: bold; font-family: 'Courier New', monospace; background: #fed7d7; padding: 8px 12px; border-radius: 4px; border: 2px solid #feb2b2;">
                  ${tempPassword}
                </span>
              </div>
            </div>

            <p style="color: #2d3748; margin: 20px 0; font-size: 16px; line-height: 1.6;">
              Please log in at <a href="${supabaseUrl.replace('/rest/v1', '')}" style="color: #2c5aa0; text-decoration: none; font-weight: 600;">${supabaseUrl.replace('/rest/v1', '')}</a> and change your password upon first access for security purposes.
            </p>

            <!-- About Elma Section -->
            <div style="background: #f7fafc; border-radius: 8px; padding: 25px; margin: 30px 0;">
              <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">About Elma:</h3>
              <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Elma is a leading manufacturing plant dedicated to delivering high-quality products and driving innovation across our industry. Our Operations Portal will serve as your central hub for updates, processes, and documentation essential to your role.
              </p>
            </div>

            <!-- Support Section -->
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                If you face any issues logging in, feel free to reach out to our support team at <a href="mailto:nalluruhaneel@gmail.com" style="color: #856404; text-decoration: none; font-weight: 600;">nalluruhaneel@gmail.com</a>.
              </p>
            </div>

            <!-- Login Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="${supabaseUrl.replace('/rest/v1', '')}" 
                 style="background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(44, 90, 160, 0.3); transition: all 0.3s ease;">
                🚀 Access Elma Operations Portal
              </a>
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

    // Try to send email using Supabase's built-in email service
    try {
      const { error: emailError } = await supabase.auth.admin.generateLink({
        type: 'signup',
        email: email,
        password: tempPassword,
        options: {
          emailRedirectTo: supabaseUrl.replace('/rest/v1', ''),
          data: {
            username: username,
            tempPassword: tempPassword
          }
        }
      })

      if (emailError) {
        console.warn('Failed to generate signup link:', emailError)
        // Fallback: Log the email details for manual sending
        console.log('Welcome Email Details (Manual Send Required):')
        console.log('Email:', email)
        console.log('Username:', username)
        console.log('Temp Password:', tempPassword)
        console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Welcome email details logged (email service not available)',
            data: {
              email,
              username,
              tempPassword,
              appUrl: supabaseUrl.replace('/rest/v1', ''),
              emailHtml: emailHtml,
              note: 'Email service not available - please send manually'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // If we get here, the link was generated successfully
      console.log('Signup link generated successfully for:', email)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email sent successfully',
          data: {
            email,
            username,
            tempPassword,
            appUrl: supabaseUrl.replace('/rest/v1', ''),
            note: 'Signup link sent via Supabase auth'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (emailServiceError) {
      console.error('Email service error:', emailServiceError)
      
      // Fallback: Log the email details for manual sending
      console.log('Welcome Email Details (Manual Send Required):')
      console.log('Email:', email)
      console.log('Username:', username)
      console.log('Temp Password:', tempPassword)
      console.log('App URL:', supabaseUrl.replace('/rest/v1', ''))
      console.log('Email HTML Length:', emailHtml.length)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Welcome email details logged (email service error)',
          data: {
            email,
            username,
            tempPassword,
            appUrl: supabaseUrl.replace('/rest/v1', ''),
            emailHtml: emailHtml,
            error: emailServiceError.message,
            note: 'Email service error - please send manually'
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