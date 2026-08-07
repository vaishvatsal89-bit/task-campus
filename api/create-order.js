import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id:     process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { amount } = req.body;

  if (!amount || amount < 30) {
    return res.status(400).json({ message: 'Minimum amount is ₹30' });
  }

  try {
    const order = await razorpay.orders.create({
      amount:   amount * 100,
      currency: 'INR',
      receipt:  `task_${Date.now()}`,
    });

    return res.status(200).json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}