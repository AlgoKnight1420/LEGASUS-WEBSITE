/* global Buffer */

import fs from 'node:fs'
import path from 'node:path'
import { scryptSync, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'
import { productCatalog } from '../../../src/productCatalog.js'
import { buildCheckoutLineKey, calculateCheckoutPricing } from '../../../shared/checkoutPricing.js'
import { bookShiprocketShipments, buildTrackingUpdateFromWebhook, fetchShiprocketTracking } from './shiprocket.js'

const currentFilePath = fileURLToPath(import.meta.url)
const backendDirectory = path.resolve(path.dirname(currentFilePath), '..', '..')
const dataDirectory = path.join(backendDirectory, 'data')

const customersWorkbookPath = path.join(dataDirectory, 'customers.xlsx')
const productsWorkbookPath = path.join(dataDirectory, 'products.xlsx')
const ordersWorkbookPath = path.join(dataDirectory, 'orders.xlsx')
const bannersWorkbookPath = path.join(dataDirectory, 'banners.xlsx')
const legacyWorkbookPath = path.join(dataDirectory, 'legasus-store.xlsx')

const CUSTOMERS_SHEET = 'Customers'
const PRODUCTS_SHEET = 'Products'
const ORDERS_SHEET = 'Orders'
const BANNERS_SHEET = 'Banners'
const PASSWORD_SALT = 'legasus-store-demo-salt'
const DEFAULT_ADMIN_EMAIL = 'legasus.co@gmail.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const MAX_PRODUCT_IMAGES = 6
const MAX_HOME_BANNERS = 5
const DEPARTMENT_IDS = ['men', 'women', 'sneakers']
const DEFAULT_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const DEFAULT_EXTENDED_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const DEFAULT_BOTTOM_SIZES = ['30', '32', '34', '36', '38']
const DEFAULT_SNEAKER_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
const productCatalogById = new Map(productCatalog.map((product) => [product.id, product]))

const quantitySeed = [42, 16, 0, 21, 8, 14, 5, 30]

const seedOrders = [
  {
    id: 'ORD-12041',
    customerId: 'cust-aarav-mehta',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav.mehta@example.com',
    productId: 'marauders-map-solar',
    productTitle: "Marauder's Map: Solar",
    quantity: 2,
    amount: 3198,
    status: 'pending',
    paymentStatus: 'paid',
    transactionId: 'TXN-938251',
    createdAt: '2026-03-11',
  },
  {
    id: 'ORD-12042',
    customerId: 'cust-sana-khan',
    customerName: 'Sana Khan',
    customerEmail: 'sana.khan@example.com',
    productId: 'colourblock-cocoa',
    productTitle: 'Colourblock: Cocoa',
    quantity: 1,
    amount: 1199,
    status: 'completed',
    paymentStatus: 'paid',
    transactionId: 'TXN-938252',
    createdAt: '2026-03-11',
  },
  {
    id: 'ORD-12043',
    customerId: 'cust-rohan-verma',
    customerName: 'Rohan Verma',
    customerEmail: 'rohan.verma@example.com',
    productId: 'milano-walnut',
    productTitle: 'Milano: Walnut',
    quantity: 1,
    amount: 2599,
    status: 'cancelled',
    paymentStatus: 'refunded',
    transactionId: 'TXN-938253',
    createdAt: '2026-03-07',
  },
  {
    id: 'ORD-12044',
    customerId: 'cust-meera-nair',
    customerName: 'Meera Nair',
    customerEmail: 'meera.nair@example.com',
    productId: 'cotton-linen-light-green',
    productTitle: 'Cotton Linen: Light Green',
    quantity: 3,
    amount: 4497,
    status: 'completed',
    paymentStatus: 'paid',
    transactionId: 'TXN-938254',
    createdAt: '2026-03-03',
  },
  {
    id: 'ORD-12045',
    customerId: 'cust-aarav-mehta',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav.mehta@example.com',
    productId: 'oversized-shirt-tiger',
    productTitle: 'Oversized Shirt: Tiger',
    quantity: 1,
    amount: 1299,
    status: 'pending',
    paymentStatus: 'pending',
    transactionId: 'TXN-938255',
    createdAt: '2026-02-25',
  },
]

const normalizeDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getStockStatus = (quantity) => (Number(quantity) > 0 ? 'in-stock' : 'out-of-stock')

const normalizeOrderStatusValue = (status) => {
  const normalizedStatus = String(status ?? 'pending').toLowerCase().replace(/\s+/g, '-')
  return normalizedStatus === 'uncompleted' ? 'cancelled' : normalizedStatus
}

const deriveOrderStatusFromShippingStatus = (shippingStatus, fallbackStatus = 'pending') => {
  const normalizedShippingStatus = String(shippingStatus ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')
  const normalizedFallbackStatus = normalizeOrderStatusValue(fallbackStatus)

  if (!normalizedShippingStatus) return normalizedFallbackStatus

  if (normalizedShippingStatus === 'delivered') return 'completed'
  if (
    ['cancelled', 'rto', 'return-to-origin', 'undelivered', 'delivery-failed', 'failed', 'returned'].includes(
      normalizedShippingStatus,
    )
  ) {
    return 'cancelled'
  }
  if (
    [
      'processing',
      'pickup-scheduled',
      'pickup-generated',
      'awb-assigned',
      'manifest-generated',
      'picked-up',
      'in-transit',
      'out-for-delivery',
      'shipped',
    ].includes(normalizedShippingStatus)
  ) {
    return 'pending'
  }

  return normalizedFallbackStatus
}

const normalizeSizeLabel = (size) => String(size ?? '').trim()

const sumSizeInventory = (sizeInventory, sizes = Object.keys(sizeInventory ?? {})) =>
  sizes.reduce((sum, size) => sum + Math.max(0, Number(sizeInventory?.[size] ?? 0) || 0), 0)

const inferProductSizes = ({ id = '', category = '', sizes = [] } = {}) => {
  const directSizes = ensureArray(sizes).map(normalizeSizeLabel).filter(Boolean)
  if (directSizes.length) {
    return [...new Set(directSizes)]
  }

  const catalogSizes = ensureArray(productCatalogById.get(id)?.sizes).map(normalizeSizeLabel).filter(Boolean)
  if (catalogSizes.length) {
    return [...new Set(catalogSizes)]
  }

  const normalizedCategory = String(category).trim().toLowerCase()

  if (/(sneaker|shoe)/.test(normalizedCategory)) return [...DEFAULT_SNEAKER_SIZES]
  if (/(jean|pant|chino|jogger|trouser|bottom)/.test(normalizedCategory)) return [...DEFAULT_BOTTOM_SIZES]
  if (/(full sleeve|oversized)/.test(normalizedCategory)) return [...DEFAULT_EXTENDED_APPAREL_SIZES]

  return [...DEFAULT_APPAREL_SIZES]
}

const distributeQuantityAcrossSizes = (quantity, sizes) => {
  const normalizedSizes = inferProductSizes({ sizes })
  const safeQuantity = Math.max(0, Number(quantity) || 0)

  if (!normalizedSizes.length) return {}

  const baseCount = Math.floor(safeQuantity / normalizedSizes.length)
  let remainder = safeQuantity % normalizedSizes.length

  return Object.fromEntries(
    normalizedSizes.map((size) => {
      const nextValue = baseCount + (remainder > 0 ? 1 : 0)
      if (remainder > 0) remainder -= 1
      return [size, nextValue]
    }),
  )
}

const normalizeSizeInventory = ({ id = '', category = '', sizes = [], sizeInventory = null, quantity = 0 } = {}) => {
  const normalizedSizes = inferProductSizes({ id, category, sizes })
  const inventoryObject = sizeInventory && typeof sizeInventory === 'object' && !Array.isArray(sizeInventory) ? sizeInventory : null

  if (!normalizedSizes.length) return {}

  if (inventoryObject && Object.keys(inventoryObject).length) {
    return Object.fromEntries(
      normalizedSizes.map((size) => [size, Math.max(0, Number(inventoryObject[size] ?? 0) || 0)]),
    )
  }

  return distributeQuantityAcrossSizes(quantity, normalizedSizes)
}

const getSizeQuantity = (product, size) => {
  const normalizedSize = normalizeSizeLabel(size)
  if (!normalizedSize) return Math.max(0, Number(product?.quantity ?? 0) || 0)

  return Math.max(0, Number(product?.sizeInventory?.[normalizedSize] ?? 0) || 0)
}

const hashPassword = (value) => scryptSync(String(value), PASSWORD_SALT, 64).toString('hex')

const verifyPassword = (value, hash) => {
  if (!hash) return false

  try {
    return timingSafeEqual(Buffer.from(hashPassword(value), 'hex'), Buffer.from(String(hash), 'hex'))
  } catch {
    return false
  }
}

const safeParseJson = (value, fallbackValue) => {
  if (!value) return fallbackValue

  try {
    return JSON.parse(value)
  } catch {
    return fallbackValue
  }
}

const ensureArray = (value) => (Array.isArray(value) ? value : [])

const normalizeEmailValue = (value) => String(value ?? '').trim().toLowerCase()

const isReservedAdminEmail = (value) => normalizeEmailValue(value) === DEFAULT_ADMIN_EMAIL

const findAdminUserFromUsers = (users) =>
  ensureArray(users).find((user) => String(user?.role ?? 'customer') === 'admin' || isReservedAdminEmail(user?.email)) ?? null

const syncAdminUsers = (users) => {
  const currentUsers = ensureArray(users)
  const adminUsers = currentUsers.filter((user) => String(user?.role ?? 'customer') === 'admin' || isReservedAdminEmail(user?.email))
  const currentAdmin =
    adminUsers.find((user) => normalizeEmailValue(user.email) === DEFAULT_ADMIN_EMAIL) ??
    adminUsers[0] ??
    null

  const nextAdmin = {
    ...(currentAdmin ?? {}),
    id: 'admin-legasus',
    firstName: String(currentAdmin?.firstName ?? 'Admin').trim() || 'Admin',
    lastName: String(currentAdmin?.lastName ?? 'Legasus').trim() || 'Legasus',
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: String(currentAdmin?.passwordHash ?? '') || hashPassword(DEFAULT_ADMIN_PASSWORD),
    birthdate: String(currentAdmin?.birthdate ?? '--') || '--',
    phone: String(currentAdmin?.phone ?? '0000000000').trim() || '0000000000',
    gender: String(currentAdmin?.gender ?? 'other') || 'other',
    role: 'admin',
    addresses: ensureArray(currentAdmin?.addresses),
    createdAt: String(currentAdmin?.createdAt ?? normalizeDateKey()),
    updatedAt: String(currentAdmin?.updatedAt ?? normalizeDateKey()),
  }

  const nextUsers = [
    nextAdmin,
    ...currentUsers.filter((user) => !(String(user?.role ?? 'customer') === 'admin' || isReservedAdminEmail(user?.email))),
  ]

  const changed =
    !currentAdmin ||
    adminUsers.length !== 1 ||
    currentAdmin.id !== nextAdmin.id ||
    normalizeEmailValue(currentAdmin.email) !== DEFAULT_ADMIN_EMAIL ||
    String(currentAdmin.role ?? 'customer') !== 'admin'

  return {
    users: nextUsers,
    changed,
  }
}

const normalizeStoreData = (data) => {
  const syncedUsers = syncAdminUsers(data.users)

  return {
    data: {
      ...data,
      users: syncedUsers.users,
    },
    changed: syncedUsers.changed,
  }
}

const normalizeDepartmentId = (value) => {
  const normalizedValue = String(value ?? '')
    .trim()
    .toLowerCase()

  return DEPARTMENT_IDS.includes(normalizedValue) ? normalizedValue : 'men'
}

const mergeTrackingEvents = (...groups) => {
  const eventMap = new Map()

  groups
    .flatMap((group) => ensureArray(group))
    .filter(Boolean)
    .forEach((event, index) => {
      const key = JSON.stringify({
        status: event.status ?? '',
        note: event.note ?? '',
        at: event.at ?? '',
      })

      eventMap.set(key, {
        ...event,
        __order: index,
      })
    })

  return [...eventMap.values()]
    .sort((left, right) => {
      const leftTime = Date.parse(left.at ?? '')
      const rightTime = Date.parse(right.at ?? '')

      if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) {
        return left.__order - right.__order
      }

      return leftTime - rightTime
    })
    .slice(-20)
    .map((event) => {
      const nextEvent = { ...event }
      delete nextEvent.__order
      return nextEvent
    })
}

const sanitizeUser = (user) => {
  const nextUser = { ...user }
  delete nextUser.passwordHash

  return {
    ...nextUser,
    role: nextUser.role ?? 'customer',
    addresses: ensureArray(nextUser.addresses),
  }
}

const serializeUser = (user) => ({
  id: String(user.id),
  firstName: String(user.firstName ?? ''),
  lastName: String(user.lastName ?? ''),
  email: String(user.email ?? '').trim().toLowerCase(),
  passwordHash: String(user.passwordHash ?? ''),
  birthdate: String(user.birthdate ?? ''),
  phone: String(user.phone ?? ''),
  gender: String(user.gender ?? 'other'),
  role: String(user.role ?? 'customer'),
  addresses: JSON.stringify(ensureArray(user.addresses)),
  createdAt: String(user.createdAt ?? normalizeDateKey()),
  updatedAt: String(user.updatedAt ?? normalizeDateKey()),
})

const parseUser = (row) => ({
  id: String(row.id ?? ''),
  firstName: String(row.firstName ?? ''),
  lastName: String(row.lastName ?? ''),
  email: String(row.email ?? '').trim().toLowerCase(),
  passwordHash: String(row.passwordHash ?? ''),
  birthdate: String(row.birthdate ?? ''),
  phone: String(row.phone ?? ''),
  gender: String(row.gender ?? 'other'),
  role: String(row.role ?? 'customer'),
  addresses: ensureArray(safeParseJson(row.addresses, [])),
  createdAt: String(row.createdAt ?? normalizeDateKey()),
  updatedAt: String(row.updatedAt ?? normalizeDateKey()),
})

const serializeProduct = (product) => ({
  id: String(product.id),
  title: String(product.title ?? ''),
  description: String(product.description ?? ''),
  price: Number(product.price ?? 0),
  category: String(product.category ?? ''),
  sizes: JSON.stringify(inferProductSizes(product)),
  sizeInventory: JSON.stringify(normalizeSizeInventory(product)),
  images: JSON.stringify(ensureArray(product.images).filter(Boolean).slice(0, MAX_PRODUCT_IMAGES)),
  sizeChartImage: String(product.sizeChartImage ?? ''),
  quantity: sumSizeInventory(normalizeSizeInventory(product), inferProductSizes(product)),
  stockStatus: String(product.stockStatus ?? getStockStatus(sumSizeInventory(normalizeSizeInventory(product), inferProductSizes(product)))),
  badge: String(product.badge ?? ''),
  createdAt: Number(product.createdAt ?? Date.now()),
  source: String(product.source ?? 'catalog'),
})

const parseProduct = (row) => {
  const sizes = inferProductSizes({
    id: String(row.id ?? ''),
    category: String(row.category ?? ''),
    sizes: safeParseJson(row.sizes, []),
  })
  const sizeInventory = normalizeSizeInventory({
    id: String(row.id ?? ''),
    category: String(row.category ?? ''),
    sizes,
    sizeInventory: safeParseJson(row.sizeInventory, null),
    quantity: Number(row.quantity ?? 0),
  })
  const quantity = sumSizeInventory(sizeInventory, sizes)

  return {
    id: String(row.id ?? ''),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    category: String(row.category ?? ''),
    sizes,
    sizeInventory,
    images: ensureArray(safeParseJson(row.images, [])).filter(Boolean).slice(0, MAX_PRODUCT_IMAGES),
    sizeChartImage: String(row.sizeChartImage ?? ''),
    quantity,
    stockStatus: String(row.stockStatus ?? getStockStatus(quantity)),
    badge: String(row.badge ?? ''),
    createdAt: Number(row.createdAt ?? Date.now()),
    source: String(row.source ?? 'catalog'),
  }
}

const serializeBanner = (banner) => ({
  id: String(banner.id ?? ''),
  department: normalizeDepartmentId(banner.department),
  image: String(banner.image ?? ''),
  createdAt: Number(banner.createdAt ?? Date.now()),
})

const parseBanner = (row) => ({
  id: String(row.id ?? ''),
  department: normalizeDepartmentId(row.department),
  image: String(row.image ?? ''),
  createdAt: Number(row.createdAt ?? Date.now()),
})

const serializeOrder = (order) => ({
  id: String(order.id),
  customerId: String(order.customerId ?? ''),
  customerName: String(order.customerName ?? ''),
  customerEmail: String(order.customerEmail ?? '').trim().toLowerCase(),
  productId: String(order.productId ?? ''),
  productTitle: String(order.productTitle ?? ''),
  quantity: Number(order.quantity ?? 0),
  amount: Number(order.amount ?? 0),
  status: String(order.status ?? 'pending'),
  paymentStatus: String(order.paymentStatus ?? 'pending'),
  paymentMethod: String(order.paymentMethod ?? 'cod'),
  transactionId: String(order.transactionId ?? ''),
  createdAt: String(order.createdAt ?? normalizeDateKey()),
  size: String(order.size ?? ''),
  billingDetails: JSON.stringify(order.billingDetails ?? {}),
  razorpayOrderId: String(order.razorpayOrderId ?? ''),
  razorpayPaymentId: String(order.razorpayPaymentId ?? ''),
  razorpaySignature: String(order.razorpaySignature ?? ''),
  shippingProvider: String(order.shippingProvider ?? 'manual'),
  shippingStatus: String(order.shippingStatus ?? ''),
  shiprocketOrderId: String(order.shiprocketOrderId ?? ''),
  shiprocketShipmentId: String(order.shiprocketShipmentId ?? ''),
  awbCode: String(order.awbCode ?? ''),
  courierName: String(order.courierName ?? ''),
  pickupRequested: String(Boolean(order.pickupRequested)),
  pickupToken: String(order.pickupToken ?? ''),
  shippingError: String(order.shippingError ?? ''),
  trackingUrl: String(order.trackingUrl ?? ''),
  shippingAddress: JSON.stringify(order.shippingAddress ?? {}),
  trackingEvents: JSON.stringify(ensureArray(order.trackingEvents)),
})

const parseOrder = (row) => {
  const shippingStatus = String(row.shippingStatus ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')

  return {
    id: String(row.id ?? ''),
    customerId: String(row.customerId ?? ''),
    customerName: String(row.customerName ?? ''),
    customerEmail: String(row.customerEmail ?? '').trim().toLowerCase(),
    productId: String(row.productId ?? ''),
    productTitle: String(row.productTitle ?? ''),
    quantity: Number(row.quantity ?? 0),
    amount: Number(row.amount ?? 0),
    status: deriveOrderStatusFromShippingStatus(shippingStatus, row.status),
    paymentStatus: String(row.paymentStatus ?? 'pending'),
    paymentMethod: String(row.paymentMethod ?? 'cod'),
    transactionId: String(row.transactionId ?? ''),
    createdAt: String(row.createdAt ?? normalizeDateKey()),
    size: String(row.size ?? ''),
    billingDetails: safeParseJson(row.billingDetails, {}),
    razorpayOrderId: String(row.razorpayOrderId ?? ''),
    razorpayPaymentId: String(row.razorpayPaymentId ?? ''),
    razorpaySignature: String(row.razorpaySignature ?? ''),
    shippingProvider: String(row.shippingProvider ?? 'manual'),
    shippingStatus,
    shiprocketOrderId: String(row.shiprocketOrderId ?? ''),
    shiprocketShipmentId: String(row.shiprocketShipmentId ?? ''),
    awbCode: String(row.awbCode ?? ''),
    courierName: String(row.courierName ?? ''),
    pickupRequested: String(row.pickupRequested ?? 'false') === 'true',
    pickupToken: String(row.pickupToken ?? ''),
    shippingError: String(row.shippingError ?? ''),
    trackingUrl: String(row.trackingUrl ?? ''),
    shippingAddress: safeParseJson(row.shippingAddress, {}),
    trackingEvents: ensureArray(safeParseJson(row.trackingEvents, [])),
  }
}

const buildSeedProducts = () =>
  productCatalog.map((product, index) => {
    const quantity = quantitySeed[index] ?? 12
    const sizes = inferProductSizes({ id: product.id, category: product.category, sizes: product.sizes })
    const sizeInventory = normalizeSizeInventory({
      id: product.id,
      category: product.category,
      sizes,
      quantity,
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description.map((section) => section.copy).join(' '),
      price: Number(product.price),
      category: product.category,
      sizes,
      sizeInventory,
      images: product.gallery.slice(0, MAX_PRODUCT_IMAGES).map((item) => item.image),
      sizeChartImage: String(product.sizeChartImage ?? ''),
      quantity: sumSizeInventory(sizeInventory, sizes),
      stockStatus: getStockStatus(sumSizeInventory(sizeInventory, sizes)),
      badge: product.badge,
      createdAt: Date.now() - index * 86400000,
      source: 'catalog',
    }
  })

const buildSeedUsers = () => [
  {
    id: 'admin-legasus',
    firstName: 'Admin',
    lastName: 'Legasus',
    email: DEFAULT_ADMIN_EMAIL,
    passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    birthdate: '--',
    phone: '0000000000',
    gender: 'other',
    role: 'admin',
    addresses: [],
    createdAt: normalizeDateKey(),
    updatedAt: normalizeDateKey(),
  },
]

const readRowsFromWorkbook = (filePath, sheetName, parser) => {
  if (!fs.existsSync(filePath)) return []
  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[sheetName] ?? workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet ?? XLSX.utils.aoa_to_sheet([])).map(parser)
}

const writeRowsToWorkbook = (filePath, sheetName, rows, serializer) => {
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows.map(serializer)), sheetName)
  XLSX.writeFile(workbook, filePath)
}

const readLegacyWorkbook = () => {
  if (!fs.existsSync(legacyWorkbookPath)) return null

  const workbook = XLSX.readFile(legacyWorkbookPath)
  return {
    users: XLSX.utils.sheet_to_json(workbook.Sheets.Users ?? XLSX.utils.aoa_to_sheet([])).map(parseUser),
    products: XLSX.utils.sheet_to_json(workbook.Sheets.Products ?? XLSX.utils.aoa_to_sheet([])).map(parseProduct),
    orders: XLSX.utils.sheet_to_json(workbook.Sheets.Orders ?? XLSX.utils.aoa_to_sheet([])).map(parseOrder),
    banners: [],
  }
}

const cleanupLegacyWorkbook = () => {
  const hasAllNewFiles =
    fs.existsSync(customersWorkbookPath) &&
    fs.existsSync(productsWorkbookPath) &&
    fs.existsSync(ordersWorkbookPath) &&
    fs.existsSync(bannersWorkbookPath)

  if (!hasAllNewFiles || !fs.existsSync(legacyWorkbookPath)) return

  try {
    fs.unlinkSync(legacyWorkbookPath)
  } catch {
    // Ignore cleanup failures so the backend can continue serving data.
  }
}

const writeAllRaw = async ({ users, products, orders, banners }) => {
  fs.mkdirSync(dataDirectory, { recursive: true })
  writeRowsToWorkbook(customersWorkbookPath, CUSTOMERS_SHEET, users, serializeUser)
  writeRowsToWorkbook(productsWorkbookPath, PRODUCTS_SHEET, products, serializeProduct)
  writeRowsToWorkbook(ordersWorkbookPath, ORDERS_SHEET, orders, serializeOrder)
  writeRowsToWorkbook(bannersWorkbookPath, BANNERS_SHEET, banners ?? [], serializeBanner)
}

const resolveInitialData = () => {
  const customers = readRowsFromWorkbook(customersWorkbookPath, CUSTOMERS_SHEET, parseUser)
  const products = readRowsFromWorkbook(productsWorkbookPath, PRODUCTS_SHEET, parseProduct)
  const orders = readRowsFromWorkbook(ordersWorkbookPath, ORDERS_SHEET, parseOrder)
  const banners = readRowsFromWorkbook(bannersWorkbookPath, BANNERS_SHEET, parseBanner)

  if (customers.length && products.length && orders.length && fs.existsSync(bannersWorkbookPath)) {
    return normalizeStoreData({ users: customers, products, orders, banners }).data
  }

  const legacyData = readLegacyWorkbook()

  return normalizeStoreData({
    users: customers.length ? customers : legacyData?.users ?? buildSeedUsers(),
    products: products.length ? products : legacyData?.products ?? buildSeedProducts(),
    orders: orders.length ? orders : legacyData?.orders ?? seedOrders,
    banners: banners.length ? banners : legacyData?.banners ?? [],
  }).data
}

const ensureStorageFiles = async () => {
  fs.mkdirSync(dataDirectory, { recursive: true })

  const hasAllFiles =
    fs.existsSync(customersWorkbookPath) &&
    fs.existsSync(productsWorkbookPath) &&
    fs.existsSync(ordersWorkbookPath) &&
    fs.existsSync(bannersWorkbookPath)

  if (hasAllFiles) {
    const normalizedStore = normalizeStoreData(readAllRaw())

    if (normalizedStore.changed) {
      await writeAllRaw(normalizedStore.data)
    }

    cleanupLegacyWorkbook()
    return
  }

  await writeAllRaw(resolveInitialData())
  cleanupLegacyWorkbook()
}

const readAllRaw = () => ({
  users: readRowsFromWorkbook(customersWorkbookPath, CUSTOMERS_SHEET, parseUser),
  products: readRowsFromWorkbook(productsWorkbookPath, PRODUCTS_SHEET, parseProduct),
  orders: readRowsFromWorkbook(ordersWorkbookPath, ORDERS_SHEET, parseOrder),
  banners: readRowsFromWorkbook(bannersWorkbookPath, BANNERS_SHEET, parseBanner),
})

const readAll = async () => {
  await ensureStorageFiles()
  return readAllRaw()
}

let writeQueue = Promise.resolve()

const withWriteLock = (work) => {
  writeQueue = writeQueue.then(work, work)
  return writeQueue
}

const mutateStore = async (mutator) =>
  withWriteLock(async () => {
    await ensureStorageFiles()
    const currentData = readAllRaw()
    const result = await mutator(currentData)

    if (result?.data) {
      await writeAllRaw(result.data)
    }

    return result?.response
  })

const getBootstrapPayload = async () => {
  const data = await readAll()
  return {
    users: data.users.map(sanitizeUser),
    products: data.products,
    orders: data.orders,
    banners: data.banners,
  }
}

const getOrderById = async (orderId) => {
  const data = await readAll()
  const order = data.orders.find((entry) => entry.id === orderId)

  if (!order) {
    throw new Error('Order not found.')
  }

  return order
}

const buildCheckoutQuote = ({ products, items, paymentMethod, giftWrapEnabled = false }) => {
  const orderItems = ensureArray(items)

  if (!orderItems.length) {
    throw new Error('No items selected for checkout.')
  }

  const lineItems = orderItems.map((item) => {
    const quantity = Math.max(1, Number(item.quantity) || 1)
    const product = products.find((entry) => entry.id === item.productId)

    if (!product) {
      throw new Error('One of the products in the cart is unavailable.')
    }

    return {
      productId: product.id,
      size: String(item.size ?? ''),
      quantity,
      unitPrice: Number(product.price),
    }
  })

  return calculateCheckoutPricing({
    lineItems,
    paymentMethod,
    giftWrapEnabled,
  })
}

const quoteCheckoutPricing = async ({ items, paymentMethod, giftWrapEnabled = false }) => {
  const data = await readAll()

  return buildCheckoutQuote({
    products: data.products,
    items,
    paymentMethod,
    giftWrapEnabled,
  })
}

const registerUser = async (payload) =>
  mutateStore(async (data) => {
    const normalizedEmail = String(payload.email ?? '').trim().toLowerCase()

    if (data.users.some((user) => user.email === normalizedEmail)) {
      throw new Error('This email is already registered. Please login instead.')
    }

    if (isReservedAdminEmail(normalizedEmail)) {
      throw new Error('This email is reserved for the admin account.')
    }

    const nextUser = {
      id: `user-${Date.now()}`,
      firstName: String(payload.firstName ?? '').trim(),
      lastName: String(payload.lastName ?? '').trim(),
      email: normalizedEmail,
      passwordHash: hashPassword(payload.password ?? ''),
      birthdate: String(payload.birthdate ?? ''),
      phone: String(payload.phone ?? '').trim(),
      gender: String(payload.gender ?? 'other'),
      role: 'customer',
      addresses: [],
      createdAt: normalizeDateKey(),
      updatedAt: normalizeDateKey(),
    }

    return {
      data: {
        ...data,
        users: [...data.users, nextUser],
      },
      response: sanitizeUser(nextUser),
    }
  })

const findStoredUserByEmail = (users, email) => {
  const normalizedEmail = String(email ?? '').trim().toLowerCase()
  return users.find((user) => user.email === normalizedEmail) ?? null
}

const loginUser = async (email, password) => {
  const data = await readAll()
  const matchedUser = findStoredUserByEmail(data.users, email)

  if (!matchedUser || !verifyPassword(password ?? '', matchedUser.passwordHash)) {
    throw new Error('Invalid email or password.')
  }

  return sanitizeUser(matchedUser)
}

const loginUserWithOtp = async (email) => {
  const data = await readAll()
  const matchedUser = findStoredUserByEmail(data.users, email)

  if (!matchedUser) {
    throw new Error('No customer account found for this email.')
  }

  if (matchedUser.role !== 'customer') {
    throw new Error('OTP login is available only for customer accounts. Please use password login.')
  }

  return sanitizeUser(matchedUser)
}

const loginOrRegisterGoogleUser = async ({ email, firstName, lastName }) =>
  mutateStore(async (data) => {
    const normalizedEmail = String(email ?? '').trim().toLowerCase()
    const resolvedFirstName = String(firstName ?? '').trim() || 'Google'
    const resolvedLastName = String(lastName ?? '').trim() || 'User'
    const matchedUser = findStoredUserByEmail(data.users, normalizedEmail)

    if (matchedUser) {
      if (matchedUser.role === 'admin') {
        throw new Error('Admin account cannot use Google login.')
      }

      const nextUser = {
        ...matchedUser,
        firstName: matchedUser.firstName || resolvedFirstName,
        lastName: matchedUser.lastName || resolvedLastName,
        updatedAt: normalizeDateKey(),
      }

      return {
        data: {
          ...data,
          users: data.users.map((user) => (user.id === matchedUser.id ? nextUser : user)),
        },
        response: sanitizeUser(nextUser),
      }
    }

    if (isReservedAdminEmail(normalizedEmail)) {
      throw new Error('This email is reserved for the admin account.')
    }

    const nextUser = {
      id: `user-${Date.now()}`,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: normalizedEmail,
      passwordHash: hashPassword(`google-auth:${normalizedEmail}:${Date.now()}`),
      birthdate: '',
      phone: '',
      gender: 'other',
      role: 'customer',
      addresses: [],
      createdAt: normalizeDateKey(),
      updatedAt: normalizeDateKey(),
    }

    return {
      data: {
        ...data,
        users: [...data.users, nextUser],
      },
      response: sanitizeUser(nextUser),
    }
  })

const updateUser = async (userId, payload) =>
  mutateStore(async (data) => {
    const existingUser = data.users.find((user) => user.id === userId)

    if (!existingUser) {
      throw new Error('Customer account not found.')
    }

    const nextUser = {
      ...existingUser,
      firstName: payload.firstName !== undefined ? String(payload.firstName).trim() : existingUser.firstName,
      lastName: payload.lastName !== undefined ? String(payload.lastName).trim() : existingUser.lastName,
      birthdate: payload.birthdate !== undefined ? String(payload.birthdate) : existingUser.birthdate,
      phone: payload.phone !== undefined ? String(payload.phone).trim() : existingUser.phone,
      gender: payload.gender !== undefined ? String(payload.gender) : existingUser.gender,
      addresses: payload.addresses !== undefined ? ensureArray(payload.addresses) : existingUser.addresses,
      updatedAt: normalizeDateKey(),
    }

    if (payload.newPassword) {
      nextUser.passwordHash = hashPassword(payload.newPassword)
    }

    return {
      data: {
        ...data,
        users: data.users.map((user) => (user.id === userId ? nextUser : user)),
      },
      response: sanitizeUser(nextUser),
    }
  })

const getAdminUser = async () => {
  const data = await readAll()
  const adminUser = findAdminUserFromUsers(data.users)

  if (!adminUser) {
    throw new Error('Admin account not found.')
  }

  return sanitizeUser(adminUser)
}

const updateAdminPassword = async (newPassword) =>
  mutateStore(async (data) => {
    const adminUser = findAdminUserFromUsers(data.users)

    if (!adminUser) {
      throw new Error('Admin account not found.')
    }

    const nextAdmin = {
      ...adminUser,
      id: 'admin-legasus',
      email: DEFAULT_ADMIN_EMAIL,
      role: 'admin',
      passwordHash: hashPassword(newPassword ?? ''),
      updatedAt: normalizeDateKey(),
    }

    return {
      data: {
        ...data,
        users: data.users.map((user) =>
          user.id === adminUser.id || String(user?.role ?? 'customer') === 'admin' || isReservedAdminEmail(user?.email)
            ? nextAdmin
            : user,
        ),
      },
      response: sanitizeUser(nextAdmin),
    }
  })

const deleteUser = async (userId) =>
  mutateStore(async (data) => {
    const userExists = data.users.some((user) => user.id === userId)

    if (!userExists) {
      throw new Error('Customer account not found.')
    }

    return {
      data: {
        ...data,
        users: data.users.filter((user) => user.id !== userId),
      },
      response: true,
    }
  })

const buildProductPayload = (payload, existingProduct = null) => {
  const sizes = inferProductSizes({
    id: existingProduct?.id ?? payload.id,
    category: payload.category ?? existingProduct?.category,
    sizes: payload.sizes ?? existingProduct?.sizes,
  })
  const requestedQuantity = Math.max(0, Number(payload.quantity ?? existingProduct?.quantity ?? 0) || 0)
  const sizeInventory = normalizeSizeInventory({
    id: existingProduct?.id ?? payload.id,
    category: payload.category ?? existingProduct?.category,
    sizes,
    sizeInventory: payload.sizeInventory ?? existingProduct?.sizeInventory,
    quantity: requestedQuantity,
  })
  const quantity = sumSizeInventory(sizeInventory, sizes)

  return {
    ...(existingProduct ?? {}),
    title: String(payload.title ?? existingProduct?.title ?? '').trim(),
    description: String(payload.description ?? existingProduct?.description ?? '').trim(),
    price: Number(payload.price ?? existingProduct?.price ?? 0),
    category: String(payload.category ?? existingProduct?.category ?? '').trim(),
    sizes,
    sizeInventory,
    images: ensureArray(payload.images ?? existingProduct?.images).filter(Boolean).slice(0, MAX_PRODUCT_IMAGES),
    sizeChartImage: String(payload.sizeChartImage ?? existingProduct?.sizeChartImage ?? '').trim(),
    quantity,
    stockStatus: getStockStatus(quantity),
    badge: String(payload.badge ?? existingProduct?.badge ?? 'Admin Upload'),
    createdAt: Number(existingProduct?.createdAt ?? payload.createdAt ?? Date.now()),
    source: String(payload.source ?? existingProduct?.source ?? 'upload'),
  }
}

const createProduct = async (payload) =>
  mutateStore(async (data) => {
    const nextProduct = {
      id: `admin-product-${Date.now()}`,
      ...buildProductPayload(payload),
    }

    return {
      data: {
        ...data,
        products: [nextProduct, ...data.products],
      },
      response: nextProduct,
    }
  })

const updateProduct = async (productId, payload) =>
  mutateStore(async (data) => {
    const existingProduct = data.products.find((product) => product.id === productId)

    if (!existingProduct) {
      throw new Error('Product not found.')
    }

    const nextProduct = {
      ...buildProductPayload(payload, existingProduct),
      id: existingProduct.id,
    }

    return {
      data: {
        ...data,
        products: data.products.map((product) => (product.id === productId ? nextProduct : product)),
      },
      response: nextProduct,
    }
  })

const replaceDepartmentBanners = async (department, banners) =>
  mutateStore(async (data) => {
    const normalizedDepartment = normalizeDepartmentId(department)
    const safeBanners = ensureArray(banners)
      .filter((banner) => String(banner?.image ?? '').trim())
      .slice(0, MAX_HOME_BANNERS)
      .map((banner, index) => ({
        id: String(banner.id ?? `banner-${normalizedDepartment}-${Date.now()}-${index}`),
        department: normalizedDepartment,
        image: String(banner.image ?? '').trim(),
        createdAt: Number(banner.createdAt ?? Date.now() + index),
      }))

    const nextBanners = [
      ...data.banners.filter((banner) => normalizeDepartmentId(banner.department) !== normalizedDepartment),
      ...safeBanners,
    ]

    return {
      data: {
        ...data,
        banners: nextBanners,
      },
      response: nextBanners,
    }
  })

const deleteProductRecord = async (productId) =>
  mutateStore(async (data) => {
    const existingProduct = data.products.find((product) => product.id === productId)

    if (!existingProduct) {
      throw new Error('Product not found.')
    }

    return {
      data: {
        ...data,
        products: data.products.filter((product) => product.id !== productId),
      },
      response: true,
    }
  })

const updateProductStock = async (productId, quantity) =>
  mutateStore(async (data) => {
    const existingProduct = data.products.find((product) => product.id === productId)

    if (!existingProduct) {
      throw new Error('Product not found.')
    }

    const nextQuantity = Math.max(0, Number(quantity) || 0)
    const nextSizeInventory = normalizeSizeInventory({
      id: existingProduct.id,
      category: existingProduct.category,
      sizes: existingProduct.sizes,
      quantity: nextQuantity,
    })
    const nextProduct = {
      ...existingProduct,
      sizeInventory: nextSizeInventory,
      quantity: sumSizeInventory(nextSizeInventory, inferProductSizes(existingProduct)),
      stockStatus: getStockStatus(nextQuantity),
    }

    return {
      data: {
        ...data,
        products: data.products.map((product) => (product.id === productId ? nextProduct : product)),
      },
      response: nextProduct,
    }
  })

const updateOrderStatus = async (orderId, nextStatus) =>
  mutateStore(async (data) => {
    const normalizedNextStatus = normalizeOrderStatusValue(nextStatus)
    const existingOrder = data.orders.find((order) => order.id === orderId)

    if (!existingOrder) {
      throw new Error('Order not found.')
    }

    let nextProducts = [...data.products]

    if (existingOrder.status !== normalizedNextStatus) {
      const relatedProduct = nextProducts.find((product) => product.id === existingOrder.productId)

      if (relatedProduct) {
        const productSizes = inferProductSizes(relatedProduct)
        const currentSizeInventory = normalizeSizeInventory(relatedProduct)

        if (existingOrder.status !== 'cancelled' && normalizedNextStatus === 'cancelled') {
          const replenishedQuantity = Number(relatedProduct.quantity) + Number(existingOrder.quantity)
          const replenishedSizeInventory = existingOrder.size
            ? {
                ...currentSizeInventory,
                [existingOrder.size]: getSizeQuantity(relatedProduct, existingOrder.size) + Number(existingOrder.quantity),
              }
            : normalizeSizeInventory({
                id: relatedProduct.id,
                category: relatedProduct.category,
                sizes: productSizes,
                quantity: replenishedQuantity,
              })

          nextProducts = nextProducts.map((product) =>
            product.id === relatedProduct.id
              ? {
                  ...product,
                  sizeInventory: replenishedSizeInventory,
                  quantity: sumSizeInventory(replenishedSizeInventory, productSizes),
                  stockStatus: getStockStatus(replenishedQuantity),
                }
              : product,
          )
        }

        if (existingOrder.status === 'cancelled' && normalizedNextStatus !== 'cancelled') {
          if (Number(relatedProduct.quantity) < Number(existingOrder.quantity)) {
            throw new Error(`Only ${relatedProduct.quantity} item(s) left for ${relatedProduct.title}.`)
          }

          if (existingOrder.size && getSizeQuantity(relatedProduct, existingOrder.size) < Number(existingOrder.quantity)) {
            throw new Error(`Only ${getSizeQuantity(relatedProduct, existingOrder.size)} item(s) left in size ${existingOrder.size} for ${relatedProduct.title}.`)
          }

          const reducedQuantity = Number(relatedProduct.quantity) - Number(existingOrder.quantity)
          const reducedSizeInventory = existingOrder.size
            ? {
                ...currentSizeInventory,
                [existingOrder.size]: Math.max(0, getSizeQuantity(relatedProduct, existingOrder.size) - Number(existingOrder.quantity)),
              }
            : normalizeSizeInventory({
                id: relatedProduct.id,
                category: relatedProduct.category,
                sizes: productSizes,
                quantity: reducedQuantity,
              })

          nextProducts = nextProducts.map((product) =>
            product.id === relatedProduct.id
              ? {
                  ...product,
                  sizeInventory: reducedSizeInventory,
                  quantity: sumSizeInventory(reducedSizeInventory, productSizes),
                  stockStatus: getStockStatus(reducedQuantity),
                }
              : product,
          )
        }
      }
    }

    const nextOrder = {
      ...existingOrder,
      status: normalizedNextStatus,
      shippingStatus:
        normalizedNextStatus === 'cancelled'
          ? 'cancelled'
          : existingOrder.shippingStatus || (normalizedNextStatus === 'completed' ? 'delivered' : 'processing'),
      paymentStatus:
        normalizedNextStatus === 'cancelled'
          ? existingOrder.paymentStatus === 'paid'
            ? 'refunded'
            : 'pending'
          : existingOrder.paymentStatus === 'refunded'
            ? 'paid'
            : existingOrder.paymentStatus,
    }

    const nextOrders = data.orders.map((order) => (order.id === orderId ? nextOrder : order))

    return {
      data: {
        users: data.users,
        products: nextProducts,
        orders: nextOrders,
      },
      response: {
        order: nextOrder,
        products: nextProducts,
      },
    }
  })

const placeCheckoutOrders = async ({ customerId, paymentMethod, items, address, giftWrapEnabled = false, paymentRecord = null }) =>
  mutateStore(async (data) => {
    const customer = data.users.find((user) => user.id === customerId)

    if (!customer) {
      throw new Error('Customer account not found.')
    }

    const orderItems = ensureArray(items)
    if (!orderItems.length) {
      throw new Error('No items selected for checkout.')
    }

    const itemAddress = address && typeof address === 'object' ? address : null

    if (!itemAddress?.flat || !itemAddress?.street || !itemAddress?.city || !itemAddress?.state || !itemAddress?.pincode) {
      throw new Error('A complete shipping address is required to place the order.')
    }

    const quantityByProductId = new Map()
    const quantityByProductSize = new Map()
    orderItems.forEach((item) => {
      const nextQuantity = Math.max(1, Number(item.quantity) || 1)
      quantityByProductId.set(item.productId, (quantityByProductId.get(item.productId) ?? 0) + nextQuantity)

      if (item.size) {
        const nextKey = `${item.productId}::${item.size}`
        quantityByProductSize.set(nextKey, (quantityByProductSize.get(nextKey) ?? 0) + nextQuantity)
      }
    })

    quantityByProductId.forEach((requestedQuantity, productId) => {
      const product = data.products.find((entry) => entry.id === productId)

      if (!product) {
        throw new Error('One of the products in the cart is unavailable.')
      }

      if (Number(product.quantity) < requestedQuantity) {
        throw new Error(`Only ${product.quantity} item(s) left for ${product.title}.`)
      }
    })

    quantityByProductSize.forEach((requestedQuantity, productKey) => {
      const [productId, size] = productKey.split('::')
      const product = data.products.find((entry) => entry.id === productId)

      if (!product) return

      if (getSizeQuantity(product, size) < requestedQuantity) {
        throw new Error(`Only ${getSizeQuantity(product, size)} item(s) left in size ${size} for ${product.title}.`)
      }
    })

    const pricing = buildCheckoutQuote({
      products: data.products,
      items: orderItems,
      paymentMethod,
      giftWrapEnabled,
    })
    const pricingByLineKey = new Map(pricing.items.map((item) => [buildCheckoutLineKey(item), item]))

    const createdAt = normalizeDateKey()
    const createdOrders = orderItems.map((item, index) => {
      const quantity = Math.max(1, Number(item.quantity) || 1)
      const product = data.products.find((entry) => entry.id === item.productId)
      const pricingLine =
        pricingByLineKey.get(
          buildCheckoutLineKey({
            productId: product.id,
            size: String(item.size ?? ''),
          }),
        ) ?? null

      return {
        id: `ORD-${Date.now() + index}`,
        customerId: customer.id,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        customerEmail: customer.email,
        productId: product.id,
        productTitle: product.title,
        quantity,
        size: item.size ?? '',
        amount: Number(pricingLine?.total ?? Number(product.price) * quantity),
        status: 'pending',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        transactionId:
          paymentMethod === 'cod'
            ? `COD-${Date.now() + index}`
            : String(paymentRecord?.paymentId ?? `TXN-${Math.floor(Date.now() / 10) + index}`),
        createdAt,
        billingDetails: {
          subtotal: pricingLine?.subtotal ?? Number(product.price) * quantity,
          gst: pricingLine?.gst ?? 0,
          tcs: pricingLine?.tcs ?? 0,
          tds: pricingLine?.tds ?? 0,
          codCharge: pricingLine?.codCharge ?? 0,
          giftWrapCharge: pricingLine?.giftWrapCharge ?? 0,
          total: pricingLine?.total ?? Number(product.price) * quantity,
          cartTotal: pricing.total,
        },
        razorpayOrderId: String(paymentRecord?.orderId ?? ''),
        razorpayPaymentId: String(paymentRecord?.paymentId ?? ''),
        razorpaySignature: String(paymentRecord?.signature ?? ''),
      }
    })

    const nextProducts = data.products.map((product) => {
      const orderedQuantity = quantityByProductId.get(product.id)
      if (!orderedQuantity) return product

      const nextQuantity = Math.max(0, Number(product.quantity) - orderedQuantity)
      const nextSizeInventory = Object.keys(product.sizeInventory ?? {}).length
        ? Object.fromEntries(
            inferProductSizes(product).map((size) => {
              const orderedSizeQuantity = quantityByProductSize.get(`${product.id}::${size}`) ?? 0
              return [size, Math.max(0, getSizeQuantity(product, size) - orderedSizeQuantity)]
            }),
          )
        : normalizeSizeInventory({
            id: product.id,
            category: product.category,
            sizes: product.sizes,
            quantity: nextQuantity,
          })

      return {
        ...product,
        sizeInventory: nextSizeInventory,
        quantity: sumSizeInventory(nextSizeInventory, inferProductSizes(product)),
        stockStatus: getStockStatus(nextQuantity),
      }
    })

    const shiprocketOrders = await bookShiprocketShipments({
      orders: createdOrders,
      customer,
      address: itemAddress,
      products: data.products,
    })

    return {
      data: {
        users: data.users,
        products: nextProducts,
        orders: [...shiprocketOrders, ...data.orders],
      },
      response: {
        orders: shiprocketOrders,
        products: nextProducts,
        pricing,
      },
    }
  })

const applyShiprocketTrackingUpdate = async (payload) =>
  mutateStore(async (data) => {
    const tracking = buildTrackingUpdateFromWebhook(payload)
    const matchingOrder = data.orders.find(
      (order) =>
        (tracking.awbCode && order.awbCode === tracking.awbCode) ||
        (tracking.shipmentId && String(order.shiprocketShipmentId) === tracking.shipmentId),
    )

    if (!matchingOrder) {
      return {
        response: null,
      }
    }

    const nextOrder = {
      ...matchingOrder,
      shippingStatus: tracking.shippingStatus || matchingOrder.shippingStatus,
      courierName: tracking.courierName || matchingOrder.courierName,
      awbCode: tracking.awbCode || matchingOrder.awbCode,
      trackingEvents: mergeTrackingEvents(matchingOrder.trackingEvents, [tracking.trackingEvent]),
      trackingUrl: tracking.trackingUrl || matchingOrder.trackingUrl,
      status: deriveOrderStatusFromShippingStatus(tracking.shippingStatus, matchingOrder.status),
    }

    return {
      data: {
        ...data,
        orders: data.orders.map((order) => (order.id === matchingOrder.id ? nextOrder : order)),
      },
      response: nextOrder,
    }
  })

const refreshOrderTracking = async (orderId) =>
  mutateStore(async (data) => {
    const existingOrder = data.orders.find((order) => order.id === orderId)

    if (!existingOrder) {
      throw new Error('Order not found.')
    }

    if (existingOrder.shippingProvider !== 'shiprocket') {
      return {
        response: existingOrder,
      }
    }

    const tracking = await fetchShiprocketTracking(existingOrder)
    const nextShippingStatus = tracking.shippingStatus || existingOrder.shippingStatus
    const nextOrder = {
      ...existingOrder,
      shippingStatus: nextShippingStatus,
      courierName: tracking.courierName || existingOrder.courierName,
      awbCode: tracking.awbCode || existingOrder.awbCode,
      trackingUrl: tracking.trackingUrl || existingOrder.trackingUrl,
      trackingEvents: mergeTrackingEvents(existingOrder.trackingEvents, tracking.trackingEvents),
      status: deriveOrderStatusFromShippingStatus(nextShippingStatus, existingOrder.status),
      shippingError: '',
    }

    return {
      data: {
        ...data,
        orders: data.orders.map((order) => (order.id === orderId ? nextOrder : order)),
      },
      response: nextOrder,
    }
  })

const applyRazorpayWebhookEvent = async (payload) =>
  mutateStore(async (data) => {
    const eventName = String(payload?.event ?? '').trim().toLowerCase()
    const paymentEntity = payload?.payload?.payment?.entity ?? {}
    const orderEntity = payload?.payload?.order?.entity ?? {}
    const refundEntity = payload?.payload?.refund?.entity ?? {}

    const razorpayOrderId = String(paymentEntity.order_id ?? orderEntity.id ?? '').trim()
    const razorpayPaymentId = String(paymentEntity.id ?? refundEntity.payment_id ?? '').trim()

    const nextPaymentStatus =
      eventName === 'payment.captured' || eventName === 'order.paid'
        ? 'paid'
        : eventName === 'payment.failed'
          ? 'failed'
          : eventName === 'payment.authorized'
            ? 'pending'
            : eventName === 'refund.processed' || eventName === 'refund.created'
              ? 'refunded'
              : ''

    if (!razorpayOrderId && !razorpayPaymentId) {
      return {
        response: {
          updatedCount: 0,
          event: eventName,
        },
      }
    }

    const matchingOrders = data.orders.filter(
      (order) =>
        (razorpayOrderId && order.razorpayOrderId === razorpayOrderId) ||
        (razorpayPaymentId && (order.razorpayPaymentId === razorpayPaymentId || order.transactionId === razorpayPaymentId)),
    )

    if (!matchingOrders.length) {
      return {
        response: {
          updatedCount: 0,
          event: eventName,
        },
      }
    }

    const nextOrders = data.orders.map((order) => {
      const isMatch = matchingOrders.some((entry) => entry.id === order.id)
      if (!isMatch) return order

      return {
        ...order,
        paymentStatus: nextPaymentStatus || order.paymentStatus,
        transactionId: razorpayPaymentId || order.transactionId,
        razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || order.razorpayPaymentId,
        status:
          nextPaymentStatus === 'refunded'
            ? 'cancelled'
            : order.status,
      }
    })

    return {
      data: {
        ...data,
        orders: nextOrders,
      },
      response: {
        updatedCount: matchingOrders.length,
        event: eventName,
        orders: nextOrders.filter((order) => matchingOrders.some((entry) => entry.id === order.id)),
      },
    }
  })

export {
  DEFAULT_ADMIN_EMAIL,
  MAX_HOME_BANNERS,
  MAX_PRODUCT_IMAGES,
  applyRazorpayWebhookEvent,
  applyShiprocketTrackingUpdate,
  createProduct,
  deleteProductRecord,
  deleteUser,
  getBootstrapPayload,
  getAdminUser,
  getOrderById,
  getStockStatus,
  isReservedAdminEmail,
  loginOrRegisterGoogleUser,
  loginUser,
  loginUserWithOtp,
  placeCheckoutOrders,
  quoteCheckoutPricing,
  refreshOrderTracking,
  registerUser,
  replaceDepartmentBanners,
  updateAdminPassword,
  updateOrderStatus,
  updateProduct,
  updateProductStock,
  updateUser,
}
