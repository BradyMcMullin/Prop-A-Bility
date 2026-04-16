import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Standard CORS headers
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
    // 1. Grab the auth header from the frontend
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const token = authHeader.replace('Bearer ', '')

    // 2. Initialize the Supabase client specifically with the user's token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // 3. THIS IS THE NEW BOUNCER: Securely verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- SECURE ZONE ---
    // If the code reaches here, the user is 100% authenticated.

    // 4. Extract your JSON payload (action, query, etc.)
    const { action, query, id } = await req.json()
    const trefleKey = Deno.env.get('TREFLE_API_TOKEN')
    
    let apiUrl = ''
    
    // 5. Determine which Trefle endpoint to hit
    if (action === 'search') {
      apiUrl = `https://trefle.io/api/v1/plants/search?token=${trefleKey}&q=${query}`
    } else if (action === 'details') {
      apiUrl = `https://trefle.io/api/v1/plants/${id}?token=${trefleKey}`
    } else {
      throw new Error('Invalid action provided')
    }

    // 6. Fetch from Trefle
    console.log("Token check:", trefleKey ? `Found! Length: ${trefleKey.length}` : "MISSING TOKEN")
    const trefleResponse = await fetch(apiUrl)
    const trefleData = await trefleResponse.json()

    // 7. Actually return the data!
    return new Response(JSON.stringify(trefleData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
