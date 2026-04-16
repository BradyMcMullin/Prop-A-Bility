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
    // getUser() validates the ES256 signature against your project's active keys
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // --- SECURE ZONE ---
    // If the code reaches here, the user is 100% authenticated.
    
    // 4. Extract your FormData image
    const formData = await req.formData()
    const file = formData.get('images')
    
    const plantNetFormData = new FormData();
    plantNetFormData.append('images', file);
    plantNetFormData.append('organs', 'auto');

    const apiKey = Deno.env.get('PLANTNET_API_KEY'); 
    const plantNetApiUrl = `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}`;

    const plantNetResponse = await fetch(plantNetApiUrl, {
      method: 'POST',
      body: formData // or however you are formatting it for PlantNet
    })
    
    const plantNetData = await plantNetResponse.json()

    // 6. THE MISSING PIECE: Actually return the data!
    return new Response(JSON.stringify(plantNetData), {
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
