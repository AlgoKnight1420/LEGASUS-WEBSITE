const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '')

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.')
  }

  return payload
}

const bootstrapStore = () => request('/bootstrap')

const registerCustomer = (payload) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const loginWithPassword = (payload) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const requestLoginOtp = (payload) =>
  request('/auth/login/request-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const verifyLoginOtp = (payload) =>
  request('/auth/login/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const updateCustomer = (userId, payload) =>
  request(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

const removeCustomer = (userId) =>
  request(`/users/${userId}`, {
    method: 'DELETE',
  })

const createAdminProduct = (payload) =>
  request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const updateAdminProduct = (productId, payload) =>
  request(`/admin/products/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

const deleteAdminProduct = (productId) =>
  request(`/admin/products/${productId}`, {
    method: 'DELETE',
  })

const updateAdminProductStock = (productId, quantity) =>
  request(`/admin/products/${productId}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  })

const replaceAdminDepartmentBanners = (department, banners) =>
  request(`/admin/banners/${department}`, {
    method: 'PUT',
    body: JSON.stringify({ banners }),
  })

const updateAdminOrderStatus = (orderId, status) =>
  request(`/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })

const getOrderTracking = (orderId) => request(`/orders/${orderId}/tracking`)

const generateAdminOrderDocument = (orderId, documentType) =>
  request(`/admin/orders/${orderId}/documents/${documentType}`, {
    method: 'POST',
  })

const createRazorpayPaymentOrder = (payload) =>
  request('/payments/razorpay/order', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const verifyRazorpayPayment = (payload) =>
  request('/payments/razorpay/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

const placeCheckoutOrder = (payload) =>
  request('/checkout/place-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export {
  bootstrapStore,
  createAdminProduct,
  createRazorpayPaymentOrder,
  deleteAdminProduct,
  generateAdminOrderDocument,
  getOrderTracking,
  loginWithPassword,
  placeCheckoutOrder,
  requestLoginOtp,
  replaceAdminDepartmentBanners,
  registerCustomer,
  removeCustomer,
  updateAdminOrderStatus,
  updateAdminProduct,
  updateAdminProductStock,
  updateCustomer,
  verifyLoginOtp,
  verifyRazorpayPayment,
}
