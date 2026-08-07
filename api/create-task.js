import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    taskData,
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !taskData) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  // Verify Razorpay signature using secret key
  // If payment was faked this check fails and task is never created
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed' });
  }

  // Payment verified — insert the task using service role key
  // Service role bypasses RLS so the blocked INSERT policy does not apply here
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      ...taskData,
      payment_id: razorpay_payment_id,
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: error.message });
  }

  return res.status(200).json(task);
}