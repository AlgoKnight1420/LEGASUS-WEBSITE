/* global process */

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in'
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000

let cachedToken = null
let cachedTokenExpiry = 0

const toNumber = (value, fallbackValue) => {
  const nextValue = Number(value)
  return Number.isFinite(nextValue) ? nextValue : fallbackValue
}

const getShiprocketConfig = () => ({
  email: process.env.SHIPROCKET_EMAIL ?? '',
  password: process.env.SHIPROCKET_PASSWORD ?? '',
  pickupLocation: process.env.SHIPROCKET_PICKUP_LOCATION ?? '',
  pickupPostcode: process.env.SHIPROCKET_PICKUP_POSTCODE ?? '',
  defaultWeight: toNumber(process.env.SHIPROCKET_DEFAULT_WEIGHT, 0.5),
  defaultLength: toNumber(process.env.SHIPROCKET_DEFAULT_LENGTH, 10),
  defaultBreadth: toNumber(process.env.SHIPROCKET_DEFAULT_BREADTH, 10),
  defaultHeight: toNumber(process.env.SHIPROCKET_DEFAULT_HEIGHT, 2),
  webhookToken: process.env.SHIPROCKET_WEBHOOK_TOKEN ?? '',
})

const isShiprocketConfigured = () => {
  const config = getShiprocketConfig()
  return Boolean(config.email && config.password && config.pickupLocation && config.pickupPostcode)
}

const safeParseJson = async (response) => {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

const shiprocketRequest = async (path, { method = 'GET', body, token } = {}) => {
  const response = await fetch(`${SHIPROCKET_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = await safeParseJson(response)

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? payload.status ?? 'Shiprocket request failed.')
  }

  return payload
}

const getAuthToken = async () => {
  if (cachedToken && Date.now() < cachedTokenExpiry - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken
  }

  const config = getShiprocketConfig()
  const payload = await shiprocketRequest('/v1/external/auth/login', {
    method: 'POST',
    body: {
      email: config.email,
      password: config.password,
    },
  })

  cachedToken = payload.token
  cachedTokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000
  return cachedToken
}

const extractAvailableCouriers = (payload) =>
  payload?.data?.available_courier_companies ??
  payload?.available_courier_companies ??
  payload?.data ??
  []

const extractShipmentId = (payload) =>
  payload?.shipment_id ?? payload?.data?.shipment_id ?? payload?.payload?.shipment_id ?? payload?.shipmentId ?? null

const extractShiprocketOrderId = (payload) =>
  payload?.order_id ?? payload?.data?.order_id ?? payload?.payload?.order_id ?? null

const extractAwbCode = (payload) =>
  payload?.awb_code ??
  payload?.response?.data?.awb_code ??
  payload?.data?.awb_code ??
  payload?.data?.awb_assign_status?.awb_code ??
  null

const extractCourierName = (payload) =>
  payload?.courier_name ??
  payload?.response?.data?.courier_name ??
  payload?.data?.courier_name ??
  null

const extractPickupToken = (payload) =>
  payload?.pickup_token_number ??
  payload?.data?.pickup_token_number ??
  payload?.response?.pickup_token_number ??
  null

const extractTrackingUrl = (payload) =>
  payload?.tracking_url ??
  payload?.track_url ??
  payload?.data?.tracking_url ??
  payload?.data?.track_url ??
  payload?.tracking_data?.tracking_url ??
  payload?.tracking_data?.track_url ??
  null

const buildAddressLine = (address) => [address.flat, address.street].filter(Boolean).join(', ')

const buildAddressLineTwo = (address) => address.landmark ?? ''

const normalizeShippingState = (status) => String(status ?? '').trim().toLowerCase().replace(/\s+/g, '-')

const normalizeTrackingEvent = (entry) => {
  const timestamp =
    entry?.date ??
    entry?.event_time ??
    entry?.created_at ??
    entry?.current_timestamp ??
    entry?.sr_status_date ??
    entry?.status_date ??
    ''
  const location = [entry?.location, entry?.city].filter(Boolean).join(', ')
  const note = [entry?.activity, entry?.status, location, timestamp].filter(Boolean).join(' | ')

  return {
    status:
      entry?.sr_status ??
      entry?.activity ??
      entry?.status ??
      entry?.current_status ??
      'Update Received',
    note: note || timestamp || 'Tracking update received.',
    at: String(timestamp || ''),
  }
}

const ensureTrackingEvents = (payload) => {
  const trackingData = payload?.tracking_data ?? payload?.data?.tracking_data ?? payload?.tracking ?? payload?.data ?? {}
  const activities =
    trackingData?.shipment_track_activities ??
    trackingData?.shipment_track ??
    trackingData?.track_status ??
    trackingData?.tracking_data ??
    []

  return Array.isArray(activities) ? activities.map(normalizeTrackingEvent) : []
}

const attemptShiprocketPostVariants = async (path, bodies, token) => {
  let lastError = null

  for (const body of bodies) {
    try {
      return await shiprocketRequest(path, {
        method: 'POST',
        token,
        body,
      })
    } catch (error) {
      lastError = error
    }
  }

  throw lastError ?? new Error('Shiprocket request failed.')
}

const extractDocumentUrl = (payload) => {
  const queue = [payload]

  while (queue.length) {
    const value = queue.shift()

    if (!value) continue

    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
      return value
    }

    if (Array.isArray(value)) {
      queue.push(...value)
      continue
    }

    if (typeof value === 'object') {
      for (const [key, nextValue] of Object.entries(value)) {
        if (typeof nextValue === 'string' && /^https?:\/\//i.test(nextValue) && /(label|invoice|manifest|print|pdf|url)/i.test(key)) {
          return nextValue
        }

        if (nextValue && typeof nextValue === 'object') {
          queue.push(nextValue)
        }
      }
    }
  }

  return null
}

const buildShiprocketOrderPayload = ({ order, customer, address, product, config }) => ({
  order_id: order.id,
  order_date: `${order.createdAt} 12:00`,
  pickup_location: config.pickupLocation,
  channel_id: '',
  comment: 'Placed from Legasus storefront',
  billing_customer_name: customer.firstName || order.customerName,
  billing_last_name: customer.lastName || '',
  billing_address: buildAddressLine(address),
  billing_address_2: buildAddressLineTwo(address),
  billing_city: address.city,
  billing_pincode: address.pincode,
  billing_state: address.state,
  billing_country: address.country || 'India',
  billing_email: customer.email,
  billing_phone: address.phone || customer.phone,
  shipping_is_billing: true,
  order_items: [
    {
      name: product.title,
      sku: product.id,
      units: Number(order.quantity),
      selling_price: Number(product.price),
      discount: 0,
      tax: 0,
      hsn: '',
    },
  ],
  payment_method: order.paymentStatus === 'pending' ? 'COD' : 'Prepaid',
  shipping_charges: 0,
  giftwrap_charges: 0,
  transaction_charges: 0,
  total_discount: 0,
  sub_total: Number(order.amount),
  length: config.defaultLength,
  breadth: config.defaultBreadth,
  height: config.defaultHeight,
  weight: config.defaultWeight,
})

const createShipmentForOrder = async ({ order, customer, address, product, token, config }) => {
  const cod = order.paymentStatus === 'pending' ? 1 : 0

  const serviceability = await shiprocketRequest(
    `/v1/external/courier/serviceability/?pickup_postcode=${encodeURIComponent(config.pickupPostcode)}&delivery_postcode=${encodeURIComponent(address.pincode)}&weight=${encodeURIComponent(config.defaultWeight)}&cod=${cod}`,
    { token },
  )

  const [selectedCourier] = extractAvailableCouriers(serviceability)

  if (!selectedCourier?.courier_company_id) {
    throw new Error(`Shiprocket could not find a courier partner for ${product.title}.`)
  }

  const createdOrder = await shiprocketRequest('/v1/external/orders/create/adhoc', {
    method: 'POST',
    token,
    body: buildShiprocketOrderPayload({ order, customer, address, product, config }),
  })

  const shipmentId = extractShipmentId(createdOrder)
  if (!shipmentId) {
    throw new Error(`Shiprocket did not return a shipment ID for ${product.title}.`)
  }

  const awbResponse = await shiprocketRequest('/v1/external/courier/assign/awb', {
    method: 'POST',
    token,
    body: {
      shipment_id: shipmentId,
      courier_id: selectedCourier.courier_company_id,
    },
  })

  return {
    ...order,
    shippingProvider: 'shiprocket',
    shippingStatus: 'awb-assigned',
    shiprocketOrderId: extractShiprocketOrderId(createdOrder),
    shiprocketShipmentId: shipmentId,
    awbCode: extractAwbCode(awbResponse),
    courierName: extractCourierName(awbResponse) ?? selectedCourier.courier_name ?? '',
    pickupRequested: false,
    pickupToken: '',
    shippingError: '',
    trackingEvents: [],
    trackingUrl: '',
    shippingAddress: address,
  }
}

const bookShiprocketShipments = async ({ orders, customer, address, products }) => {
  if (!isShiprocketConfigured()) {
    return orders.map((order) => ({
      ...order,
      shippingProvider: 'manual',
      shippingStatus: 'order-placed',
      shiprocketOrderId: '',
      shiprocketShipmentId: '',
      awbCode: '',
      courierName: '',
      pickupRequested: false,
      pickupToken: '',
      shippingError: '',
      trackingEvents: [],
      trackingUrl: '',
      shippingAddress: address,
    }))
  }

  const token = await getAuthToken()
  const config = getShiprocketConfig()
  const shipments = []

  for (const order of orders) {
    const product = products.find((entry) => entry.id === order.productId)

    if (!product) {
      throw new Error('Product data missing during Shiprocket booking.')
    }

    const shipment = await createShipmentForOrder({
      order,
      customer,
      address,
      product,
      token,
      config,
    })

    shipments.push(shipment)
  }

  if (shipments.length) {
    const updatedShipments = []

    for (const shipment of shipments) {
      const pickupResponse = await shiprocketRequest('/v1/external/courier/generate/pickup', {
        method: 'POST',
        token,
        body: {
          shipment_id: shipment.shiprocketShipmentId,
        },
      })

      const pickupToken = extractPickupToken(pickupResponse)

      updatedShipments.push({
        ...shipment,
        shippingStatus: shipment.awbCode ? 'pickup-scheduled' : shipment.shippingStatus,
        pickupRequested: true,
        pickupToken: pickupToken ?? '',
      })
    }

    return updatedShipments
  }

  return shipments
}

const formatTrackingPayload = (payload) => {
  if (!payload) return []

  if (Array.isArray(payload)) return payload

  return [payload]
}

const buildTrackingUpdateFromWebhook = (payload) => {
  const [entry] = formatTrackingPayload(payload)
  const shipmentId =
    entry?.shipment_id ??
    entry?.shipment?.shipment_id ??
    entry?.data?.shipment_id ??
    entry?.data?.shipment?.shipment_id ??
    ''
  const awbCode =
    entry?.awb ??
    entry?.awb_code ??
    entry?.data?.awb ??
    entry?.data?.awb_code ??
    entry?.shipment?.awb ??
    ''
  const currentStatus =
    entry?.current_status ??
    entry?.shipment_status ??
    entry?.data?.current_status ??
    entry?.data?.shipment_status ??
    ''
  const courierName =
    entry?.courier_name ??
    entry?.data?.courier_name ??
    entry?.shipment?.courier_name ??
    ''

  const trackingEvent = {
    status: currentStatus || 'Update Received',
    note:
      entry?.current_timestamp ??
      entry?.status_date ??
      entry?.data?.current_timestamp ??
      entry?.data?.status_date ??
      new Date().toISOString(),
    at:
      entry?.current_timestamp ??
      entry?.status_date ??
      entry?.data?.current_timestamp ??
      entry?.data?.status_date ??
      new Date().toISOString(),
  }

  return {
    shipmentId: String(shipmentId),
    awbCode: String(awbCode),
    shippingStatus: normalizeShippingState(currentStatus || 'update-received'),
    courierName: String(courierName),
    trackingUrl: extractTrackingUrl(entry) ?? '',
    trackingEvent,
  }
}

const fetchShiprocketTracking = async (order) => {
  if (!order?.awbCode) {
    throw new Error('Tracking is unavailable until Shiprocket assigns an AWB.')
  }

  const token = await getAuthToken()
  const payload = await shiprocketRequest(`/v1/external/courier/track/awb/${encodeURIComponent(order.awbCode)}`, {
    token,
  })
  const events = ensureTrackingEvents(payload)
  const trackingData = payload?.tracking_data ?? payload?.data?.tracking_data ?? {}
  const latestEvent = events[events.length - 1] ?? null

  return {
    shippingStatus: normalizeShippingState(
      trackingData?.shipment_status ??
        trackingData?.current_status ??
        payload?.current_status ??
        payload?.shipment_status ??
        latestEvent?.status ??
        order.shippingStatus,
    ),
    courierName:
      trackingData?.shipment_track?.[0]?.courier_name ??
      trackingData?.courier_name ??
      payload?.courier_name ??
      order.courierName,
    awbCode:
      trackingData?.shipment_track?.[0]?.awb_code ??
      trackingData?.awb_code ??
      payload?.awb_code ??
      order.awbCode,
    trackingUrl: extractTrackingUrl(payload) ?? order.trackingUrl ?? '',
    trackingEvents: events,
  }
}

const buildShipmentIdBodies = (shipmentId) => [{ shipment_id: [shipmentId] }, { shipment_id: shipmentId }]

const buildOrderIdBodies = (orderId) => [{ ids: [orderId] }, { ids: orderId }, { order_ids: [orderId] }, { order_ids: orderId }]

const generateShiprocketDocument = async (order, type) => {
  if (!order?.shippingProvider || order.shippingProvider !== 'shiprocket') {
    throw new Error('Shiprocket document is available only for Shiprocket orders.')
  }

  const token = await getAuthToken()
  let payload = null

  if (type === 'label') {
    if (!order.shiprocketShipmentId) {
      throw new Error('Shipment ID is missing for this order.')
    }

    payload = await attemptShiprocketPostVariants(
      '/v1/external/courier/generate/label',
      buildShipmentIdBodies(order.shiprocketShipmentId),
      token,
    )
  } else if (type === 'invoice') {
    if (!order.shiprocketOrderId) {
      throw new Error('Shiprocket order ID is missing for this order.')
    }

    payload = await attemptShiprocketPostVariants(
      '/v1/external/orders/print/invoice',
      buildOrderIdBodies(order.shiprocketOrderId),
      token,
    )
  } else if (type === 'manifest') {
    if (!order.shiprocketShipmentId) {
      throw new Error('Shipment ID is missing for this order.')
    }

    await attemptShiprocketPostVariants(
      '/v1/external/manifests/generate',
      buildShipmentIdBodies(order.shiprocketShipmentId),
      token,
    )

    payload = await attemptShiprocketPostVariants(
      '/v1/external/manifests/print',
      buildShipmentIdBodies(order.shiprocketShipmentId),
      token,
    )
  } else {
    throw new Error('Unsupported Shiprocket document requested.')
  }

  const url = extractDocumentUrl(payload)

  if (!url) {
    throw new Error(`Shiprocket did not return a ${type} URL.`)
  }

  return url
}

const validateWebhookToken = (requestToken) => {
  const config = getShiprocketConfig()
  if (!config.webhookToken) return true
  return requestToken === config.webhookToken
}

export {
  bookShiprocketShipments,
  buildTrackingUpdateFromWebhook,
  fetchShiprocketTracking,
  generateShiprocketDocument,
  getShiprocketConfig,
  isShiprocketConfigured,
  normalizeShippingState,
  validateWebhookToken,
}
