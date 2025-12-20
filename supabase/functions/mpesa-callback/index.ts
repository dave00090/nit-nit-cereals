import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Setup Supabase Client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const body = await req.json()
    console.log("Received Callback:", JSON.stringify(body, null, 2))

    const result = body.Body.stkCallback
    
    // Check if payment was successful (ResultCode 0)
    const callbackData = {
      checkout_request_id: result.CheckoutRequestID,
      result_code: result.ResultCode,
      result_desc: result.ResultDesc,
      // Extract data from the CallbackMetadata array
      mpesa_receipt_number: result.CallbackMetadata?.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value,
      amount: result.CallbackMetadata?.Item.find((i: any) => i.Name === 'Amount')?.Value,
      phone_number: result.CallbackMetadata?.Item.find((i: any) => i.Name === 'PhoneNumber')?.Value,
    }

    // Insert into your database table
    const { error } = await supabase.from('mpesa_callbacks').insert([callbackData])
    if (error) throw error

    return new Response(JSON.stringify({ message: "Success" }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })
  } catch (err) {
    console.error("Callback Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    })
  }
})