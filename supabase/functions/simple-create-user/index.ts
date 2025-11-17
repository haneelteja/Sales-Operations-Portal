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
    console.log('Simple create user function called')
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    console.log('Authorization header:', authHeader)
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const requestData = await req.json()
    console.log('Request data:', requestData)

    // Hardcode the Supabase URL and service key for testing
    const supabaseUrl = 'https://qkvmdrtfhpcvwvqjuyuu.supabase.co'
    const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdm1kcnRmaHBjdnd2cWp1eXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTIyODIxOCwiZXhwIjoyMDc0ODA0MjE4fQ.DJeoI0LFeMArVs5s6DV2HP0kYnjWcIVLQEbiCQr97CE'
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    console.log('Supabase client created')

    // Test basic functionality
    const { data: testData, error: testError } = await supabase
      .from('user_management')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('Database test error:', testError)
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed', 
          details: testError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Database test successful:', testData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Simple function working',
        data: {
          requestData,
          databaseTest: testData
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

