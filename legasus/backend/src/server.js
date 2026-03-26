/* global process */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { fileURLToPath } from 'node:url'
import { requestLoginOtp, verifyLoginOtp } from './lib/authOtp.js'
import {
  MAX_HOME_BANNERS,
  MAX_PRODUCT_IMAGES,
  applyRazorpayWebhookEvent,
  applyShiprocketTrackingUpdate,
  createProduct,
  deleteProductRecord,
  deleteUser,
  getBootstrapPayload,
  getOrderById,
  loginOrRegisterGoogleUser,
  loginUser,
  loginUserWithOtp,
  placeCheckoutOrders,
  quoteCheckoutPricing,
  refreshOrderTracking,
  registerUser,
  replaceDepartmentBanners,
  updateOrderStatus,
  updateProduct,
  updateProductStock,
  updateUser,
} from './lib/workbookStore.js'
import {
  createRazorpayOrder,
  getRazorpayConfig,
  isRazorpayConfigured,
  isRazorpayWebhookConfigured,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} from './lib/razorpay.js'
import {
  generateShiprocketDocument,
  getShiprocketConfig,
  isShiprocketConfigured,
  validateWebhookToken,
} from './lib/shiprocket.js'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const currentFilePath = fileURLToPath(import.meta.url)
const backendDirectory = path.resolve(path.dirname(currentFilePath), '..')
const distDirectory = path.resolve(backendDirectory, '..', 'dist')

app.use(
  express.json({
    limit: '50mb',
    verify: (request, _response, buffer) => {
      request.rawBody = buffer.toString('utf8')
    },
  }),
)

const sendError = (response, error, status = 400) => {
  response.status(status).json({
    error: error instanceof Error ? error.message : 'Something went wrong.',
  })
}

const fetchGoogleUserProfile = async (accessToken) => {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error('Unable to verify your Google account right now.')
  }

  if (!payload.email || payload.email_verified === false) {
    throw new Error('Your Google account must have a verified email address.')
  }

  const fullName = String(payload.name ?? '').trim()
  const [fallbackFirstName = '', ...fallbackLastName] = fullName.split(/\s+/).filter(Boolean)

  return {
    email: String(payload.email).trim().toLowerCase(),
    firstName: String(payload.given_name ?? fallbackFirstName).trim(),
    lastName: String(payload.family_name ?? fallbackLastName.join(' ')).trim(),
  }
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.get('/api/bootstrap', async (_request, response) => {
  try {
    const payload = await getBootstrapPayload()
    const config = getShiprocketConfig()
    response.json({
      ...payload,
      shipping: {
        provider: 'shiprocket',
        enabled: isShiprocketConfigured(),
        pickupLocation: config.pickupLocation || '',
      },
      payments: {
        provider: 'razorpay',
        enabled: isRazorpayConfigured(),
        keyId: getRazorpayConfig().keyId,
        brandName: getRazorpayConfig().brandName,
      },
    })
  } catch (error) {
    sendError(response, error, 500)
  }
})

app.post('/api/auth/register', async (request, response) => {
  try {
    const { firstName, lastName, email, password, birthdate, phone, gender } = request.body ?? {}

    if (!String(firstName ?? '').trim() || !String(lastName ?? '').trim()) {
      return sendError(response, 'Please fill all required registration fields.')
    }

    if (!String(email ?? '').trim() || !String(password ?? '').trim()) {
      return sendError(response, 'Please enter your email and password.')
    }

    if (String(email).trim().toLowerCase() === 'admin@legasus.com') {
      return sendError(response, 'This email is reserved for the admin account.')
    }

    if (String(password).length < 6) {
      return sendError(response, 'Password must be at least 6 characters long.')
    }

    if (String(phone ?? '').trim().length !== 10) {
      return sendError(response, 'Please enter a valid 10-digit mobile number.')
    }

    const user = await registerUser({ firstName, lastName, email, password, birthdate, phone, gender })
    response.status(201).json({ user })
  } catch (error) {
    sendError(response, error)
  }
})

app.post('/api/auth/login', async (request, response) => {
  try {
    const { email, password } = request.body ?? {}

    if (!String(email ?? '').trim() || !String(password ?? '').trim()) {
      return sendError(response, 'Please enter your email and password.')
    }

    const user = await loginUser(email, password)
    response.json({ user })
  } catch (error) {
    sendError(response, error, 401)
  }
})

app.post('/api/auth/google', async (request, response) => {
  try {
    const { accessToken } = request.body ?? {}

    if (!String(accessToken ?? '').trim()) {
      return sendError(response, 'Google sign-in could not be completed. Please try again.')
    }

    const profile = await fetchGoogleUserProfile(String(accessToken).trim())
    const user = await loginOrRegisterGoogleUser(profile)
    response.json({ user })
  } catch (error) {
    sendError(response, error, 401)
  }
})

app.post('/api/auth/login/request-otp', async (request, response) => {
  try {
    const { email, password } = request.body ?? {}

    if (!String(email ?? '').trim() || !String(password ?? '').trim()) {
      return sendError(response, 'Please enter your email and password.')
    }

    const user = await loginUser(email, password)

    if (user.role !== 'customer') {
      return sendError(response, 'OTP login is only required for customer accounts. Please continue with password login.')
    }

    const payload = await requestLoginOtp({ email, user })
    response.json(payload)
  } catch (error) {
    const statusCode = error instanceof Error && Number.isInteger(error.statusCode) ? error.statusCode : 401
    sendError(response, error, statusCode)
  }
})

app.post('/api/auth/login/verify-otp', async (request, response) => {
  try {
    const { email, otp } = request.body ?? {}

    if (!String(email ?? '').trim() || !String(otp ?? '').trim()) {
      return sendError(response, 'Please enter your email and OTP.')
    }

    await verifyLoginOtp({ email, otp })
    const user = await loginUserWithOtp(email)
    response.json({ user })
  } catch (error) {
    const statusCode = error instanceof Error && Number.isInteger(error.statusCode) ? error.statusCode : 401
    sendError(response, error, statusCode)
  }
})

app.patch('/api/users/:userId', async (request, response) => {
  try {
    const nextAddresses = request.body?.addresses

    if (nextAddresses !== undefined && !Array.isArray(nextAddresses)) {
      return sendError(response, 'Addresses must be an array.')
    }

    if (request.body?.newPassword && String(request.body.newPassword).length < 6) {
      return sendError(response, 'New password must be at least 6 characters long.')
    }

    const user = await updateUser(request.params.userId, request.body ?? {})
    response.json({ user })
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.delete('/api/users/:userId', async (request, response) => {
  try {
    await deleteUser(request.params.userId)
    response.status(204).end()
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.post('/api/admin/products', async (request, response) => {
  try {
    const images = request.body?.images ?? []

    if (!String(request.body?.title ?? '').trim()) {
      return sendError(response, 'Product title is required.')
    }

    if (!Array.isArray(images) || !images.length) {
      return sendError(response, 'Upload at least one product image.')
    }

    if (images.length > MAX_PRODUCT_IMAGES) {
      return sendError(response, `Each product can contain up to ${MAX_PRODUCT_IMAGES} images only.`)
    }

    const product = await createProduct(request.body ?? {})
    response.status(201).json({ product })
  } catch (error) {
    sendError(response, error)
  }
})

app.patch('/api/admin/products/:productId', async (request, response) => {
  try {
    const images = request.body?.images ?? []

    if (!String(request.body?.title ?? '').trim()) {
      return sendError(response, 'Product title is required.')
    }

    if (!Array.isArray(images) || !images.length) {
      return sendError(response, 'Upload at least one product image.')
    }

    if (images.length > MAX_PRODUCT_IMAGES) {
      return sendError(response, `Each product can contain up to ${MAX_PRODUCT_IMAGES} images only.`)
    }

    const product = await updateProduct(request.params.productId, request.body ?? {})
    response.json({ product })
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.delete('/api/admin/products/:productId', async (request, response) => {
  try {
    await deleteProductRecord(request.params.productId)
    response.status(204).end()
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.patch('/api/admin/products/:productId/stock', async (request, response) => {
  try {
    const quantity = Number(request.body?.quantity)

    if (Number.isNaN(quantity) || quantity < 0) {
      return sendError(response, 'Please provide a valid stock quantity.')
    }

    const product = await updateProductStock(request.params.productId, quantity)
    response.json({ product })
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.put('/api/admin/banners/:department', async (request, response) => {
  try {
    const banners = request.body?.banners ?? []

    if (!Array.isArray(banners)) {
      return sendError(response, 'Banners must be provided as an array.')
    }

    if (banners.length > MAX_HOME_BANNERS) {
      return sendError(response, `You can upload up to ${MAX_HOME_BANNERS} home banners only.`)
    }

    if (banners.some((banner) => !String(banner?.image ?? '').trim())) {
      return sendError(response, 'Each banner must include an image.')
    }

    const nextBanners = await replaceDepartmentBanners(request.params.department, banners)
    response.json({ banners: nextBanners })
  } catch (error) {
    sendError(response, error)
  }
})

app.patch('/api/admin/orders/:orderId/status', async (request, response) => {
  try {
    const nextStatus = String(request.body?.status ?? '').trim()

    if (!nextStatus) {
      return sendError(response, 'Order status is required.')
    }

    const payload = await updateOrderStatus(request.params.orderId, nextStatus)
    response.json(payload)
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.get('/api/orders/:orderId/tracking', async (request, response) => {
  try {
    const order = await refreshOrderTracking(request.params.orderId)
    response.json({ order })
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.post('/api/admin/orders/:orderId/documents/:documentType', async (request, response) => {
  try {
    const documentType = String(request.params.documentType ?? '').trim().toLowerCase()

    if (!['label', 'invoice', 'manifest'].includes(documentType)) {
      return sendError(response, 'Unsupported document requested.')
    }

    const order = await getOrderById(request.params.orderId)
    const url = await generateShiprocketDocument(order, documentType)

    response.json({
      order,
      documentType,
      url,
    })
  } catch (error) {
    sendError(response, error, 404)
  }
})

app.post('/api/payments/razorpay/order', async (request, response) => {
  try {
    const { customerId, paymentMethod, items, giftWrapEnabled = false } = request.body ?? {}

    if (!isRazorpayConfigured()) {
      return sendError(response, 'Razorpay is not configured on the server.', 503)
    }

    if (!String(customerId ?? '').trim()) {
      return sendError(response, 'Customer account is required.')
    }

    if (!Array.isArray(items) || !items.length) {
      return sendError(response, 'No items selected for checkout.')
    }

    const pricing = await quoteCheckoutPricing({
      items,
      paymentMethod: String(paymentMethod ?? 'razorpay'),
      giftWrapEnabled: Boolean(giftWrapEnabled),
    })

    const razorpayOrder = await createRazorpayOrder({
      amountPaise: pricing.totalPaise,
      receipt: `legasus-${Date.now()}`,
      notes: {
        customerId: String(customerId),
        paymentMethod: String(paymentMethod ?? 'razorpay'),
      },
    })

    response.status(201).json({
      order: razorpayOrder,
      pricing,
      keyId: getRazorpayConfig().keyId,
      brandName: getRazorpayConfig().brandName,
      brandDescription: getRazorpayConfig().brandDescription,
      brandLogo: getRazorpayConfig().brandLogo,
    })
  } catch (error) {
    sendError(response, error)
  }
})

app.post('/api/payments/razorpay/verify', async (request, response) => {
  try {
    const {
      customerId,
      paymentMethod,
      items,
      address,
      giftWrapEnabled = false,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = request.body ?? {}

    if (!String(customerId ?? '').trim()) {
      return sendError(response, 'Customer account is required.')
    }

    if (!String(razorpayOrderId ?? '').trim() || !String(razorpayPaymentId ?? '').trim() || !String(razorpaySignature ?? '').trim()) {
      return sendError(response, 'Razorpay payment details are incomplete.')
    }

    const isSignatureValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })

    if (!isSignatureValid) {
      return sendError(response, 'Payment verification failed.', 400)
    }

    const payload = await placeCheckoutOrders({
      customerId,
      paymentMethod: String(paymentMethod ?? 'razorpay'),
      items,
      address,
      giftWrapEnabled: Boolean(giftWrapEnabled),
      paymentRecord: {
        orderId: String(razorpayOrderId),
        paymentId: String(razorpayPaymentId),
        signature: String(razorpaySignature),
      },
    })

    response.status(201).json(payload)
  } catch (error) {
    sendError(response, error)
  }
})

app.post('/api/checkout/place-order', async (request, response) => {
  try {
    const { customerId, paymentMethod, items, address, giftWrapEnabled = false } = request.body ?? {}

    if (!String(customerId ?? '').trim()) {
      return sendError(response, 'Customer account is required.')
    }

    if (!String(paymentMethod ?? '').trim()) {
      return sendError(response, 'Payment method is required.')
    }

    if (!Array.isArray(items) || !items.length) {
      return sendError(response, 'No items selected for checkout.')
    }

    if (!address || typeof address !== 'object') {
      return sendError(response, 'Shipping address is required.')
    }

    const payload = await placeCheckoutOrders({ customerId, paymentMethod, items, address, giftWrapEnabled })
    response.status(201).json(payload)
  } catch (error) {
    sendError(response, error)
  }
})

app.post('/api/webhooks/delivery-updates', async (request, response) => {
  try {
    const requestToken = request.headers['x-api-key'] ?? request.headers['x-webhook-token'] ?? ''

    if (!validateWebhookToken(String(requestToken))) {
      return sendError(response, 'Unauthorized webhook request.', 401)
    }

    const order = await applyShiprocketTrackingUpdate(request.body ?? {})
    response.json({
      ok: true,
      updated: Boolean(order),
    })
  } catch (error) {
    sendError(response, error, 400)
  }
})

app.post('/api/webhooks/payments', async (request, response) => {
  try {
    if (!isRazorpayWebhookConfigured()) {
      return sendError(response, 'Razorpay webhook secret is not configured.', 503)
    }

    const signature = String(request.headers['x-razorpay-signature'] ?? '').trim()

    if (!signature) {
      return sendError(response, 'Missing Razorpay webhook signature.', 401)
    }

    const isValidSignature = verifyRazorpayWebhookSignature({
      rawBody: request.rawBody ?? JSON.stringify(request.body ?? {}),
      signature,
    })

    if (!isValidSignature) {
      return sendError(response, 'Invalid Razorpay webhook signature.', 401)
    }

    const payload = await applyRazorpayWebhookEvent(request.body ?? {})
    response.json({
      ok: true,
      ...payload,
    })
  } catch (error) {
    sendError(response, error, 400)
  }
})

if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory))

  app.get(/^\/(?!api).*/, (_request, response) => {
    response.sendFile(path.join(distDirectory, 'index.html'))
  })
}

app.listen(port, () => {
  console.log(`Legasus backend listening on http://localhost:${port}`)
})
