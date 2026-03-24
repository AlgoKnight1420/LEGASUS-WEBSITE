/* global Buffer, process */

import crypto from 'node:crypto'

const RAZORPAY_API_BASE_URL = 'https://api.razorpay.com/v1'

const getRazorpayConfig = () => ({
  keyId: String(process.env.RAZORPAY_KEY_ID ?? '').trim(),
  keySecret: String(process.env.RAZORPAY_KEY_SECRET ?? '').trim(),
  webhookSecret: String(process.env.RAZORPAY_WEBHOOK_SECRET ?? '').trim(),
  brandName: String(process.env.RAZORPAY_BRAND_NAME ?? 'Legasus Store').trim(),
  brandDescription: String(process.env.RAZORPAY_BRAND_DESCRIPTION ?? 'Secure checkout powered by Razorpay').trim(),
  brandLogo: String(process.env.RAZORPAY_BRAND_LOGO ?? '').trim(),
})

const isRazorpayConfigured = () => Boolean(getRazorpayConfig().keyId && getRazorpayConfig().keySecret)
const isRazorpayWebhookConfigured = () => Boolean(getRazorpayConfig().webhookSecret)

const createAuthHeader = () => {
  const config = getRazorpayConfig()

  if (!config.keyId || !config.keySecret) {
    throw new Error('Razorpay credentials are not configured.')
  }

  return `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString('base64')}`
}

const razorpayRequest = async (path, options = {}) => {
  const response = await fetch(`${RAZORPAY_API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: createAuthHeader(),
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    body: options.body,
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const errorMessage =
      payload?.error?.description ?? payload?.error?.reason ?? payload?.message ?? 'Razorpay request failed.'
    throw new Error(errorMessage)
  }

  return payload
}

const createRazorpayOrder = async ({ amountPaise, receipt, notes = {} }) =>
  razorpayRequest('/orders', {
    method: 'POST',
    body: JSON.stringify({
      amount: Math.max(100, Number(amountPaise) || 0),
      currency: 'INR',
      receipt: String(receipt ?? '').slice(0, 40),
      notes,
    }),
  })

const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const config = getRazorpayConfig()

  if (!config.keySecret) {
    throw new Error('Razorpay credentials are not configured.')
  }

  const generatedSignature = crypto
    .createHmac('sha256', config.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  return generatedSignature === String(razorpaySignature ?? '')
}

const verifyRazorpayWebhookSignature = ({ rawBody, signature }) => {
  const config = getRazorpayConfig()

  if (!config.webhookSecret) {
    throw new Error('Razorpay webhook secret is not configured.')
  }

  const generatedSignature = crypto.createHmac('sha256', config.webhookSecret).update(String(rawBody ?? '')).digest('hex')

  return generatedSignature === String(signature ?? '')
}

export {
  createRazorpayOrder,
  getRazorpayConfig,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
}
