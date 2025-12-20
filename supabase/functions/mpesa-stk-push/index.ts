import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 1. Define CORS headers to allow your website to talk to this function
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // 2. Handle Browser Preflight (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, amount } = await req.json()

    // Clean data for Safaricom
    const cleanPhone = phone.replace('+', '').trim()
    const cleanAmount = Math.round(Number(amount))

    // 3. Get Credentials from your Supabase Secrets
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const shortCode = Deno.env.get('MPESA_SHORTCODE')
    const passkey = Deno.env.get('MPESA_PASSKEY')
    const callbackUrl = `https://llbbrcfpvnrcojolzeuz.supabase.co/functions/v1/mpesa-callback`

    // 4. Get Safaricom Access Token
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenResponse = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${auth}` }
    })
    const { access_token } = await tokenResponse.json()

    // 5. Generate Password & Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = btoa(`${shortCode}${passkey}${timestamp}`)

    // 6. Request STK Push
    const stkResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        BusinessShortCode: shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: cleanAmount,
        PartyA: cleanPhone,
        PartyB: shortCode,
        PhoneNumber: cleanPhone,
        CallBackURL: callbackUrl,
        AccountReference: "NitNitCereals",
        TransactionDesc: "Payment"
      })
    })

    const result = await stkResponse.json()

    // 7. Return the result to your website
    return new Response(JSON.stringify(result), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error("Internal Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})