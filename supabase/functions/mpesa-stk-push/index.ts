import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const { phone, amount } = await req.json()

    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const shortCode = Deno.env.get('MPESA_SHORTCODE')
    const passkey = Deno.env.get('MPESA_PASSKEY')
    const callbackUrl = `https://llbbrcfpvnrcojolzeuz.supabase.co/functions/v1/mpesa-callback`

    // Get Access Token
    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenResponse = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${auth}` }
    })
    const { access_token } = await tokenResponse.json()

    // Generate Password & Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = btoa(`${shortCode}${passkey}${timestamp}`)

    // STK Push Request
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
        Amount: Math.round(amount),
        PartyA: phone.replace('+', ''),
        PartyB: shortCode,
        PhoneNumber: phone.replace('+', ''),
        CallBackURL: callbackUrl,
        AccountReference: "NitNitCereals",
        TransactionDesc: "Payment"
      })
    })

    const result = await stkResponse.json()
    return new Response(JSON.stringify(result), { status: 200 })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})