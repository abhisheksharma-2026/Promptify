import Razorpay from 'razorpay';

function getRazorpayCredentials(): { key_id: string; key_secret: string } {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables are required');
  }
  return { key_id, key_secret };
}

export function getRazorpayClient(): Razorpay {
  const { key_id, key_secret } = getRazorpayCredentials();
  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayKeyId(): string {
  const key_id = process.env.RAZORPAY_KEY_ID;
  if (!key_id) throw new Error('RAZORPAY_KEY_ID not set');
  return key_id;
}
