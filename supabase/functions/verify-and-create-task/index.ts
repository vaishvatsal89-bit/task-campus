import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const body    = orderId + '|' + paymentId
  const encoder = new TextEncoder()
  const key     = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const expectedSig    = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0')).join('')
  return expectedSig === signature
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1 — Verify user is logged in
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { payment_id, order_id, signature, task } = await req.json()

    if (!payment_id || !order_id || !signature || !task) {
      throw new Error('Missing required fields')
    }

    const key_id     = Deno.env.get('RAZORPAY_KEY_ID')!
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')!

    // 2 — Verify Razorpay signature (proves payment actually happened)
    const isValid = await verifyRazorpaySignature(order_id, payment_id, signature, key_secret)
    if (!isValid) throw new Error('Invalid payment signature — possible tampering detected')

    // 3 — Fetch payment from Razorpay and verify amount
    const paymentRes = await fetch(`https://api.razorpay.com/v1/payments/${payment_id}`, {
      headers: { 'Authorization': 'Basic ' + btoa(`${key_id}:${key_secret}`) }
    })
    const payment = await paymentRes.json()

    if (payment.error)              throw new Error('Could not verify payment with Razorpay')
    if (payment.status !== 'captured') throw new Error('Payment not captured yet')

    // Amount in Razorpay is paise (₹1 = 100 paise)
    const expectedPaise = task.amount * 100
    if (payment.amount !== expectedPaise) {
      throw new Error(
        `Payment mismatch: paid ₹${payment.amount / 100} but task costs ₹${task.amount}`
      )
    }

    // 4 — All checks passed — create task using service role (bypasses RLS safely)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: newTask, error: taskError } = await supabaseAdmin
      .from('tasks')
      .insert({
        ...task,
        poster_id:  user.id,
        payment_id: payment_id,
        status:     'open',
      })
      .select()
      .single()

    if (taskError) throw taskError

    return new Response(
      JSON.stringify({ success: true, task: newTask }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})