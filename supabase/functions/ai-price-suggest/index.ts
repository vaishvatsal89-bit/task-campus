import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { title, description, category, deadline } = await req.json()

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('API key not configured')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `You are a pricing assistant for a campus task marketplace in India where college students post tasks for other students to complete for money.

Task title: ${title}
Description: ${description}
Category: ${category}
Deadline: ${deadline}

Suggest a fair price in Indian Rupees. Consider:
- This is a small campus task between students
- Minimum is ₹30, typical tasks are ₹50-300
- Factor in effort, time, and urgency

Respond ONLY in this exact JSON format with no other text:
{"min": 80, "max": 120, "reason": "One line explanation"}`
        }]
      })
    })

    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})