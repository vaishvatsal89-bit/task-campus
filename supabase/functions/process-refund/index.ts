import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { task_id } = await req.json()
    if (!task_id) throw new Error('Missing task_id')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2 — Get the task and validate
    const { data: task, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .single()

    if (taskError || !task)       throw new Error('Task not found')
    if (task.poster_id !== user.id) throw new Error('Not authorized')
    if (task.status !== 'open')   throw new Error('Only open tasks can be cancelled')

    // 3 — Cancel the task immediately
    await supabaseAdmin
      .from('tasks')
      .update({ status: 'cancelled', refund_status: 'pending' })
      .eq('id', task_id)

    // 4 — No payment? Just cancel, no refund needed (old tasks before Razorpay)
    if (!task.payment_id) {
      await supabaseAdmin
        .from('tasks')
        .update({ refund_status: 'none' })
        .eq('id', task_id)

      return new Response(
        JSON.stringify({ success: true, refunded: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5 — Process Razorpay refund
    const key_id     = Deno.env.get('RAZORPAY_KEY_ID')!
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET')!

    const refundRes = await fetch(
      `https://api.razorpay.com/v1/payments/${task.payment_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': 'Basic ' + btoa(`${key_id}:${key_secret}`),
        },
        body: JSON.stringify({ amount: task.amount * 100 }), // paise — full refund
      }
    )

    const refund = await refundRes.json()

    if (refund.error) {
      await supabaseAdmin
        .from('tasks')
        .update({ refund_status: 'failed' })
        .eq('id', task_id)

      throw new Error(refund.error.description || 'Refund failed')
    }

    // 6 — Save refund ID
    await supabaseAdmin
      .from('tasks')
      .update({ refund_id: refund.id, refund_status: 'processed' })
      .eq('id', task_id)

    return new Response(
      JSON.stringify({ success: true, refunded: true, refund_id: refund.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})