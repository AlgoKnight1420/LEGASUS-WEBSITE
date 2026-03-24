import { useEffect, useRef, useState } from 'react'
import './ProductPage.css'
import {
  getFirstProductByDepartment,
  getProductById,
  productCatalog,
  productDepartments,
  sizeChartRows,
} from './productCatalog'
import useVoiceSearch from './useVoiceSearch'

const footerColumns = [
  { title: 'Need Help', links: ['Contact Us', 'Track Order', 'Exchange Policy', 'FAQs', 'My Account'] },
  { title: 'Company', links: ['About Us', 'Investor Relation', 'Careers', 'Gift Vouchers', 'Community Initiatives'] },
  { title: 'More Info', links: ['T&C', 'Privacy Policy', 'Sitemap', 'Get Notified', 'Blogs'] },
  { title: 'Store Near Me', links: ['Mumbai', 'Pune', 'Bangalore', 'Hubballi', 'View More'] },
]

const footerPaymentPartners = ['PhonePe', 'GPay', 'Amazon Pay', 'Mastercard', 'MobiKwik', 'Paytm', 'UPI']
const footerShippingPartners = ['DTDC', 'Delhivery', 'Ecom Express', 'Xpressbees']

const defaultSections = {
  productDetails: true,
  productDescription: false,
  artistDetails: false,
}

const sumSizeInventory = (sizeInventory, sizes = Object.keys(sizeInventory ?? {})) =>
  sizes.reduce((sum, size) => sum + Math.max(0, Number(sizeInventory?.[size] ?? 0) || 0), 0)

const normalizeSizeInventory = (product) => {
  const sizes = Array.isArray(product?.sizes) ? product.sizes : []
  const rawInventory = product?.sizeInventory

  if (!sizes.length) return {}

  if (rawInventory && typeof rawInventory === 'object' && !Array.isArray(rawInventory)) {
    return Object.fromEntries(sizes.map((size) => [size, Math.max(0, Number(rawInventory[size] ?? 0) || 0)]))
  }

  return Object.fromEntries(sizes.map((size) => [size, Math.max(0, Number(product?.quantity ?? 0) || 0)]))
}

const getSizeStock = (product, size) => Math.max(0, Number(normalizeSizeInventory(product)[size] ?? 0) || 0)

const getFirstAvailableSize = (product) =>
  (Array.isArray(product?.sizes) ? product.sizes : []).find((size) => getSizeStock(product, size) > 0) ?? product?.sizes?.[0] ?? ''

const drawerCatalog = {
  men: {
    featured: [
      {
        id: 'summer-home',
        title: 'Summer Home',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
        productId: 'marauders-map-solar',
      },
      {
        id: 'cotton-linen',
        title: 'Cotton Linen',
        image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=500&q=80',
        productId: 'cotton-linen-light-green',
      },
      {
        id: 'hot-merch',
        title: 'Hot Merch',
        image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=500&q=80',
        productId: 'colourblock-cocoa',
      },
      {
        id: 'new-arrivals',
        title: 'New Arrivals',
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
        productId: 'marauders-map-solar',
      },
      {
        id: 'anime',
        title: 'Anime',
        image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80',
        productId: 'marauders-map-solar',
      },
    ],
    sections: [
      {
        id: 'shop-all',
        title: 'Shop All',
        kind: 'grid',
        defaultOpen: true,
        items: [
          {
            id: 'shirts',
            label: 'Shirts',
            image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=300&q=80',
            productId: 'cotton-linen-light-green',
          },
          {
            id: 'tshirts',
            label: 'T-Shirts',
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80',
            productId: 'marauders-map-solar',
          },
          {
            id: 'outerwear',
            label: 'Outerwear',
            image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=300&q=80',
            productId: 'solids-mystic-black',
          },
          {
            id: 'linen',
            label: 'Cotton Linen',
            image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=300&q=80',
            productId: 'cotton-linen-light-green',
          },
          {
            id: 'sneakers',
            label: 'Sneakers',
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80',
            productId: 'milano-walnut',
          },
        ],
      },
      {
        id: 'topwear',
        title: 'Topwear',
        kind: 'links',
        items: [
          { id: 'oversized', label: 'Oversized T-Shirts', productId: 'marauders-map-solar' },
          { id: 'polo', label: 'Polos', productId: 'colourblock-cocoa' },
          { id: 'linen-link', label: 'Cotton Linen', productId: 'cotton-linen-light-green' },
        ],
      },
      {
        id: 'all-accessories',
        title: 'All Accessories',
        kind: 'grid',
        defaultOpen: true,
        items: [
          {
            id: 'backpacks',
            label: 'Backpacks',
            image: 'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=300&q=80',
          },
          {
            id: 'perfumes',
            label: 'Perfumes',
            image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=300&q=80',
          },
          {
            id: 'socks',
            label: 'Socks',
            image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=300&q=80',
          },
          {
            id: 'collectibles',
            label: 'Collectibles',
            image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
          },
          {
            id: 'action-figures',
            label: 'Action Figures',
            image: 'https://images.unsplash.com/photo-1608889175123-c25f31b9e1c7?auto=format&fit=crop&w=300&q=80',
          },
        ],
      },
      {
        id: 'more',
        title: 'More',
        kind: 'links',
        items: [
          { id: 'membership', label: 'My Membership' },
          { id: 'stores', label: 'Stores Near Me' },
          { id: 'track', label: 'Track My Order?' },
        ],
      },
    ],
  },
  women: {
    featured: [
      {
        id: 'resort-edit',
        title: 'Resort Edit',
        image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=80',
        productId: 'resort-soft-glow',
      },
      {
        id: 'fresh-tops',
        title: 'Fresh Tops',
        image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
        productId: 'resort-soft-glow',
      },
    ],
    sections: [
      {
        id: 'shop-all',
        title: 'Shop All',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'graphic-tops', label: 'Graphic Tops', productId: 'resort-soft-glow' },
          { id: 'co-ords', label: 'Co-ords' },
          { id: 'dresses', label: 'Dresses' },
        ],
      },
      {
        id: 'more',
        title: 'More',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'women-stores', label: 'Stores Near Me' },
          { id: 'women-track', label: 'Track My Order?' },
        ],
      },
    ],
  },
  sneakers: {
    featured: [
      {
        id: 'street-ace',
        title: 'Street Ace',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
        productId: 'street-ace-lowtops',
      },
      {
        id: 'milano',
        title: 'Milano',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
        productId: 'milano-walnut',
      },
    ],
    sections: [
      {
        id: 'shop-all',
        title: 'Shop All',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'street-ace-link', label: 'Street Ace: Lowtops', productId: 'street-ace-lowtops' },
          { id: 'milano-link', label: 'Milano: Walnut', productId: 'milano-walnut' },
        ],
      },
      {
        id: 'more',
        title: 'More',
        kind: 'links',
        items: [
          { id: 'care-kits', label: 'Care Kits' },
          { id: 'stores-near', label: 'Stores Near Me' },
        ],
      },
    ],
  },
}

const createDrawerSections = (departmentId) =>
  Object.fromEntries(drawerCatalog[departmentId].sections.map((section) => [section.id, Boolean(section.defaultOpen)]))

const formatPrice = (value) => `₹ ${value.toLocaleString('en-IN')}`

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s-5.5-6.2-5.5-10.3A5.5 5.5 0 1 1 17.5 10.7C17.5 14.8 12 21 12 21Z" />
      <circle cx="12" cy="10.7" r="2.2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20s-7-4.6-7-10.1A4 4 0 0 1 9 6.1c1.2 0 2.3.5 3 1.5.7-1 1.8-1.5 3-1.5a4 4 0 0 1 4 3.8C19 15.4 12 20 12 20Z"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.3 10.5a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.8L21 7H7" />
    </svg>
  )
}

function ChevronIcon({ expanded = false, direction = 'down' }) {
  let transform
  if (expanded) transform = 'rotate(180 12 12)'
  if (direction === 'left') transform = 'rotate(90 12 12)'
  if (direction === 'right') transform = 'rotate(-90 12 12)'

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g transform={transform}>
        <path d="m6 9 6 6 6-6" />
      </g>
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M6.7 19.5 7.8 16A8.2 8.2 0 1 1 12 20.2a8 8 0 0 1-3.8-.9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 9.2c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.5c.1.3 0 .4-.1.6l-.3.4c-.1.1-.1.3 0 .5.3.6 1 1.4 1.9 1.8.2.1.3.1.5 0l.4-.4c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4v.5c0 .2 0 .5-.3.6-.5.3-1 .5-1.6.4-2.6-.4-5.2-2.8-5.7-5.4-.1-.5.1-1 .5-1.5Z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.6 20v-6.1h2.1l.3-2.5h-2.4V9.7c0-.7.2-1.3 1.2-1.3H16V6.2c-.3 0-.9-.1-1.8-.1-1.7 0-2.9 1.1-2.9 3.1v2.2H9v2.5h2.3V20Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7.2a6.5 6.5 0 0 1-1.9.5 3.3 3.3 0 0 0 1.5-1.8 6.7 6.7 0 0 1-2.1.8 3.3 3.3 0 0 0-5.7 2.3c0 .3 0 .5.1.7A9.4 9.4 0 0 1 5 6.5a3.3 3.3 0 0 0 1 4.4 3.2 3.2 0 0 1-1.5-.4v.1a3.3 3.3 0 0 0 2.6 3.2 3.4 3.4 0 0 1-1.5 0 3.3 3.3 0 0 0 3.1 2.3A6.7 6.7 0 0 1 4.5 17a9.4 9.4 0 0 0 5.1 1.5c6.1 0 9.5-5.1 9.5-9.5v-.4A6.8 6.8 0 0 0 20 7.2Z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7V3L3 7l4 4V7Z" />
      <path d="M20 11a8 8 0 1 1-2.3-5.7" />
    </svg>
  )
}

function RupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10M7 9h10M9 5c4 0 6 1.8 6 4s-2 4-6 4H7l8 6" />
    </svg>
  )
}

function BrandMark() {
  return (
    <div className="brand-mark pdp-brand" aria-label="Legasus storefront">
      <strong>LEGASUS</strong>
    </div>
  )
}

function IconButton({ children, count, active = false, label, onClick, className = '' }) {
  return (
    <button className={`pdp-icon-button${active ? ' is-active' : ''}${className ? ` ${className}` : ''}`} type="button" aria-label={label} onClick={onClick}>
      {children}
      {count ? <span className="pdp-icon-button__count header-icon-button__count">{count}</span> : null}
    </button>
  )
}

function Accordion({ id, title, expanded, onToggle, children }) {
  return (
    <section className="pdp-accordion">
      <button className="pdp-accordion__toggle" type="button" onClick={() => onToggle(id)} aria-expanded={expanded}>
        <span>{title}</span>
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded ? <div className="pdp-accordion__content">{children}</div> : null}
    </section>
  )
}

function RelatedCard({ product, onSelect, onToggleWishlist, isWishlisted }) {
  return (
    <article className="pdp-related-card">
      <button className="pdp-related-card__surface" type="button" onClick={() => onSelect(product.id)}>
        <div className="pdp-related-card__media">
          <img src={product.gallery[0].image} alt={product.title} />
          <span>{product.badge}</span>
        </div>
        <div className="pdp-related-card__body">
          <h3>{product.title}</h3>
          <p>{product.category}</p>
          <strong>{formatPrice(product.price)}</strong>
        </div>
      </button>
      <button
        className={`pdp-related-card__wish${isWishlisted ? ' is-active' : ''}`}
        type="button"
        onClick={() => onToggleWishlist(product.id)}
        aria-label={isWishlisted ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
      >
        <HeartIcon filled={isWishlisted} />
      </button>
    </article>
  )
}

function ProductPage({
  productId,
  onBack,
  onSelectProduct,
  wishlistIds,
  cartItems,
  onToggleWishlist,
  onAddToCart,
  onOpenWishlist,
  onOpenCart,
  onOpenTracking,
  onOpenAccount,
  customProducts = [],
}) {
  const browseableProducts = customProducts.length ? customProducts : productCatalog
  const productMap = new Map(browseableProducts.map((product) => [product.id, product]))
  const currentProduct = productMap.get(productId) ?? browseableProducts[0] ?? productCatalog[0]
  const relatedTrackRef = useRef(null)
  const [selectedSize, setSelectedSize] = useState(() => currentProduct.defaultSize ?? getFirstAvailableSize(currentProduct))
  const [quantity, setQuantity] = useState('1')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [pincode, setPincode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [feedback, setFeedback] = useState({ tone: 'info', message: '' })
  const [deliveryState, setDeliveryState] = useState({
    tone: 'neutral',
    message: 'Enter a 6-digit pincode to check delivery timelines.',
  })
  const [expandedSections, setExpandedSections] = useState(defaultSections)
  const [drawerSections, setDrawerSections] = useState(() => createDrawerSections(currentProduct.department))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isKnowMoreOpen, setIsKnowMoreOpen] = useState(true)
  const [isWhoWeAreOpen, setIsWhoWeAreOpen] = useState(false)

  const activeDepartment = currentProduct.department
  const relatedProducts = (currentProduct.recommendedIds ?? []).map((id) => productMap.get(id) ?? getProductById(id)).filter(Boolean)
  const searchValue = searchQuery.trim().toLowerCase()
  const searchResults = searchValue
    ? browseableProducts.filter((product) =>
        [product.title, product.category, product.color, product.teaser].join(' ').toLowerCase().includes(searchValue),
      )
    : []
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const isWishlisted = wishlistIds.includes(currentProduct.id)
  const drawerData = drawerCatalog[activeDepartment]
  const sizeInventory = normalizeSizeInventory(currentProduct)
  const availableStock = Math.max(0, sumSizeInventory(sizeInventory, currentProduct.sizes))
  const isOutOfStock = currentProduct.stockStatus === 'out-of-stock' || availableStock <= 0
  const selectedSizeStock = selectedSize ? getSizeStock(currentProduct, selectedSize) : 0
  const stockMessage = isOutOfStock
    ? 'Out of Stock'
    : selectedSize && selectedSizeStock <= 0
      ? `${selectedSize} is out of stock right now`
      : selectedSizeStock <= 10
        ? `Only ${selectedSizeStock} left in size ${selectedSize}`
      : `${availableStock} pieces available`
  const quantityOptions = Array.from({ length: Math.min(Math.max(selectedSizeStock, 1), 6) }, (_, index) => index + 1)
  const selectedQuantityValue = String(Math.min(Number(quantity) || 1, quantityOptions[quantityOptions.length - 1] ?? 1))
  const { isListening, startListening, stopListening } = useVoiceSearch({
    onTranscript: setSearchQuery,
    onUnsupported: () =>
      setFeedback({
        tone: 'error',
        message: 'Voice search is not supported in this browser.',
      }),
    onError: (error) => {
      if (error === 'busy') return
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        setFeedback({
          tone: 'error',
          message: 'Microphone permission denied. Allow microphone access and try again.',
        })
        return
      }

      setFeedback({
        tone: 'error',
        message: 'Voice search could not start. Please try again.',
      })
    },
  })

  useEffect(() => {
    document.body.classList.toggle('pdp-lock-scroll', isMenuOpen || isSizeChartOpen)
    return () => document.body.classList.remove('pdp-lock-scroll')
  }, [isMenuOpen, isSizeChartOpen])

  const selectProduct = (productId) => {
    const nextProduct = productMap.get(productId)
    if (!nextProduct) return

    onSelectProduct(nextProduct.id)
    setIsMenuOpen(false)
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const selectDepartment = (departmentId) => {
    setDrawerSections(createDrawerSections(departmentId))
    const firstProduct = browseableProducts.find((product) => product.department === departmentId) ?? getFirstProductByDepartment(departmentId)
    if (firstProduct) selectProduct(firstProduct.id)
  }

  const handleDrawerSelection = (item) => {
    if (item.productId) {
      selectProduct(item.productId)
      return
    }

    setFeedback({
      tone: 'info',
      message: `${item.label ?? item.title} section can be connected next.`,
    })
    setIsMenuOpen(false)
  }

  const toggleWishlist = (productId) => {
    const product = productMap.get(productId)
    if (!product) return

    const exists = wishlistIds.includes(productId)
    onToggleWishlist(productId)
    setFeedback({
      tone: exists ? 'info' : 'success',
      message: exists ? `${product.title} removed from wishlist.` : `${product.title} saved to wishlist.`,
    })
  }

  const handleAddToCart = () => {
    if (isOutOfStock) {
      setFeedback({ tone: 'error', message: 'This product is currently out of stock.' })
      return
    }

    if (!selectedSize) {
      setFeedback({ tone: 'error', message: 'Please select a size before adding to cart.' })
      return
    }

    const parsedQuantity = Number(selectedQuantityValue)

    if (selectedSizeStock <= 0) {
      setFeedback({ tone: 'error', message: `${selectedSize} is currently out of stock.` })
      return
    }

    if (parsedQuantity > selectedSizeStock) {
      setFeedback({ tone: 'error', message: `Only ${selectedSizeStock} item${selectedSizeStock === 1 ? '' : 's'} left in size ${selectedSize}.` })
      return
    }

    const result = onAddToCart(currentProduct.id, selectedSize, parsedQuantity)

    if (result?.ok === false) {
      setFeedback({ tone: 'error', message: result.message })
      return
    }

    setFeedback({
      tone: 'success',
      message: `${parsedQuantity} item${parsedQuantity > 1 ? 's' : ''} added to bag in size ${selectedSize}.`,
    })
  }

  const handleDeliveryCheck = (event) => {
    event.preventDefault()
    const cleanPincode = pincode.replace(/\D/g, '')

    if (cleanPincode.length !== 6) {
      setDeliveryState({ tone: 'error', message: 'Enter a valid 6-digit pincode.' })
      return
    }

    setDeliveryState({
      tone: 'success',
      message:
        ['4', '5', '6', '7'].includes(cleanPincode[0])
          ? `Delivery available for ${cleanPincode}. Estimated dispatch in 2-4 business days.`
          : `Delivery available for ${cleanPincode}. Estimated dispatch in 4-6 business days.`,
    })
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    if (!searchResults.length) {
      setFeedback({ tone: 'error', message: 'No matching product found.' })
      return
    }

    selectProduct(searchResults[0].id)
  }

  const toggleSection = (sectionId) => {
    setExpandedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  const scrollRelated = (direction) => {
    const track = relatedTrackRef.current
    if (!track) return

    const amount = track.clientWidth * 0.85
    track.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' })
  }

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen((current) => !current)
  }

  return (
    <div className="product-page-view">
      <div className={`drawer-backdrop${isMenuOpen ? ' is-visible' : ''}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`pdp-overlay pdp-overlay--modal${isSizeChartOpen ? ' is-visible' : ''}`} onClick={() => setIsSizeChartOpen(false)} />

      <aside className={`mega-drawer${isMenuOpen ? ' is-open' : ''}`}>
        <div className="mega-drawer__inner">
          <div className="mega-drawer__header">
            <BrandMark />
            <button className="drawer-close" type="button" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          <button className="drawer-login" type="button">Log In/Register</button>

          <div className="cashback-strip">
            <span>Earn 10% Cashback on Every App Order</span>
            <div className="cashback-strip__badges"><span>G</span><span>A</span></div>
          </div>

          <div className="drawer-tabs">
            {productDepartments.map((department) => (
              <button
                key={department.id}
                className={department.id === activeDepartment ? 'is-active' : ''}
                type="button"
                onClick={() => selectDepartment(department.id)}
              >
                {department.label}
              </button>
            ))}
          </div>

          <div className="drawer-featured">
            <div className="drawer-featured__page">
              {drawerData.featured.map((feature) => (
                <button
                  key={feature.id}
                  className="drawer-featured-card"
                  type="button"
                  onClick={() => handleDrawerSelection(feature)}
                >
                  <img src={feature.image} alt={feature.title} />
                  <strong>{feature.title}</strong>
                </button>
              ))}
            </div>
            <div className="drawer-dots">
              <button className="is-active" type="button" aria-label="Current featured page" />
              <button type="button" aria-label="Featured page 2" />
            </div>
          </div>

          <div className="drawer-sections">
            {drawerData.sections.map((section) => {
              const isExpanded = Boolean(drawerSections[section.id])
              return (
                <section className="drawer-section" key={`${activeDepartment}-${section.id}`}>
                  <button
                    className="drawer-section__toggle"
                    type="button"
                    onClick={() =>
                      setDrawerSections((current) => ({
                        ...current,
                        [section.id]: !current[section.id],
                      }))
                    }
                  >
                    <span>{section.title}</span>
                    <ChevronIcon expanded={isExpanded} />
                  </button>

                  {isExpanded ? (
                    <div className="drawer-section__content">
                      {section.kind === 'grid' ? (
                        <div className="drawer-grid">
                          {section.items.map((item) => (
                            <button
                              key={item.id}
                              className="drawer-grid__item"
                              type="button"
                              onClick={() => handleDrawerSelection(item)}
                            >
                              <img src={item.image} alt={item.label} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="drawer-link-list">
                          {section.items.map((item) => (
                            <button
                              key={item.id}
                              className="drawer-link-list__item"
                              type="button"
                              onClick={() => handleDrawerSelection(item)}
                            >
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}
                </section>
              )
            })}
          </div>
        </div>
      </aside>

      <div className={`pdp-size-chart${isSizeChartOpen ? ' is-open' : ''}`}>
        <div className="pdp-size-chart__header">
          <div>
            <p>Size Chart</p>
            <h2>{currentProduct.sizeChartImage ? `${currentProduct.title} Size Chart` : 'Oversized Fit Measurements'}</h2>
          </div>
          <button className="pdp-icon-button" type="button" onClick={() => setIsSizeChartOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        {currentProduct.sizeChartImage ? (
          <div className="pdp-size-chart__image-wrap">
            <img className="pdp-size-chart__image" src={currentProduct.sizeChartImage} alt={`${currentProduct.title} size chart`} />
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Size</th>
                <th>Chest</th>
                <th>Length</th>
              </tr>
            </thead>
            <tbody>
              {sizeChartRows.map((row) => (
                <tr key={row.size}>
                  <td>{row.size}</td>
                  <td>{row.chest}</td>
                  <td>{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <header className="pdp-header pdp-header--desktop">
        <div className="pdp-header__left">
          <button className="pdp-icon-button" type="button" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
            <MenuIcon />
          </button>
          <nav className="pdp-nav">
            {productDepartments.map((department) => (
              <button
                key={department.id}
                className={department.id === activeDepartment ? 'is-active' : ''}
                type="button"
                onClick={() => selectDepartment(department.id)}
              >
                {department.label}
              </button>
            ))}
          </nav>
        </div>

        <button className="pdp-brand-button" type="button" onClick={onBack} aria-label="Go back home">
          <BrandMark />
        </button>

        <div className="pdp-header__right">
          <form className="pdp-search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              placeholder="What are you looking for?"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <button
              className={`pdp-search__icon${isListening ? ' is-listening' : ''}`}
              type="button"
              aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
              onClick={() => (isListening ? stopListening() : startListening())}
            >
              <MicIcon />
            </button>
            <button className="pdp-search__icon" type="submit">
              <SearchIcon />
            </button>
            {searchValue ? (
              <div className="pdp-search__results">
                {searchResults.length ? (
                  searchResults.map((product) => (
                    <button key={product.id} className="pdp-search__result" type="button" onClick={() => selectProduct(product.id)}>
                      <img src={product.gallery[0].image} alt={product.title} />
                      <div>
                        <strong>{product.title}</strong>
                        <span>{product.category}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="pdp-search__empty">No products found.</p>
                )}
              </div>
            ) : null}
          </form>

          <div className="pdp-actions">
            <IconButton label="Track your order" onClick={onOpenTracking}>
              <PinIcon />
            </IconButton>
            <IconButton label="Account" onClick={onOpenAccount ?? (() => setIsMenuOpen(true))}>
              <UserIcon />
            </IconButton>
            <IconButton label="Wishlist" count={wishlistIds.length || undefined} onClick={onOpenWishlist}>
              <HeartIcon />
            </IconButton>
            <IconButton label="Cart" count={cartCount || undefined} onClick={onOpenCart}>
              <CartIcon />
            </IconButton>
          </div>
        </div>
      </header>

      <header className="site-header__mobile pdp-header-mobile">
        <div className="site-header__mobile-bar pdp-header-mobile__bar">
          <button className="menu-button pdp-icon-button" type="button" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
            <MenuIcon />
          </button>

          <button className="brand-home-button pdp-brand-button pdp-brand-button--mobile" type="button" onClick={onBack} aria-label="Go back home">
            <BrandMark />
          </button>

          <div className="site-header__mobile-actions pdp-header-mobile__actions">
            <IconButton className="header-icon-button" label={isMobileSearchOpen ? 'Close search' : 'Open search'} active={isMobileSearchOpen} onClick={toggleMobileSearch}>
              <SearchIcon />
            </IconButton>
            <IconButton className="header-icon-button" label="Wishlist" count={wishlistIds.length || undefined} onClick={onOpenWishlist}>
              <HeartIcon />
            </IconButton>
            <IconButton className="header-icon-button" label="Cart" count={cartCount || undefined} onClick={onOpenCart}>
              <CartIcon />
            </IconButton>
          </div>
        </div>

        <nav className="main-nav main-nav--mobile pdp-nav pdp-nav--mobile">
          {productDepartments.map((department) => (
            <button
              key={department.id}
              className={department.id === activeDepartment ? 'is-active' : ''}
              type="button"
              onClick={() => selectDepartment(department.id)}
            >
              {department.label}
            </button>
          ))}
        </nav>

        {isMobileSearchOpen ? (
          <div className="mobile-search-panel pdp-mobile-search-panel">
            <form className="search-pill search-pill--mobile-expanded pdp-search pdp-search--mobile" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
              <button
                className={`search-pill__icon pdp-search__icon${isListening ? ' is-listening' : ''}`}
                type="button"
                aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                onClick={() => (isListening ? stopListening() : startListening())}
              >
                <MicIcon />
              </button>
              <button className="search-pill__icon search-pill__icon--passive pdp-search__icon" type="submit" aria-label="Search products">
                <SearchIcon />
              </button>
              {searchValue ? (
                <div className="pdp-search__results">
                  {searchResults.length ? (
                    searchResults.map((product) => (
                      <button key={product.id} className="pdp-search__result" type="button" onClick={() => selectProduct(product.id)}>
                        <img src={product.gallery[0].image} alt={product.title} />
                        <div>
                          <strong>{product.title}</strong>
                          <span>{product.category}</span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="pdp-search__empty">No products found.</p>
                  )}
                </div>
              ) : null}
            </form>
          </div>
        ) : null}
      </header>

      <main className="pdp-main">
        <div className="pdp-breadcrumbs">
          <button type="button" onClick={onBack}>Home</button>
          {currentProduct.breadcrumbs.slice(1).map((crumb) => (
            <span key={crumb}>{crumb}</span>
          ))}
        </div>

        <section className="pdp-hero">
          <div className="pdp-gallery">
            <div className="pdp-gallery__focus">
              <img src={currentProduct.gallery[selectedImageIndex].image} alt={currentProduct.gallery[selectedImageIndex].alt} />
            </div>
            <div className="pdp-gallery__grid">
              {currentProduct.gallery.map((image, index) => (
                <button
                  key={`${currentProduct.id}-${index}`}
                  className={`pdp-gallery__card${index < 2 ? ' is-tall' : ''}${selectedImageIndex === index ? ' is-selected' : ''}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                >
                  <img src={image.image} alt={image.alt} />
                  {image.overlays?.map((overlay) => (
                    <span
                      key={`${overlay.text}-${overlay.position}`}
                      className={`pdp-gallery__label pdp-gallery__label--${overlay.position}`}
                    >
                      {overlay.text}
                    </span>
                  ))}
                </button>
              ))}
            </div>
          </div>

          <aside className="pdp-summary">
            <h1>{currentProduct.title}</h1>
            <p className="pdp-summary__category">{currentProduct.category}</p>

            <div className="pdp-summary__price">
              <strong>{formatPrice(currentProduct.price)}</strong>
              <span>Price incl. of all taxes</span>
              <small>{currentProduct.color}</small>
            </div>

            <div className={`pdp-stock-note${isOutOfStock ? ' is-out' : ''}`}>
              <strong>{isOutOfStock ? 'Out of Stock' : 'In Stock'}</strong>
              <span>{stockMessage}</span>
            </div>

            <div className="pdp-size-block">
              <div className="pdp-size-block__header">
                <strong>Please select a size.</strong>
                <button type="button" onClick={() => setIsSizeChartOpen(true)}>
                  Size Chart
                </button>
              </div>
              <div className="pdp-size-block__options">
                {currentProduct.sizes.map((size) => (
                  <button
                    key={size}
                    className={`${size === selectedSize ? 'is-active' : ''}${getSizeStock(currentProduct, size) <= 0 ? ' is-unavailable' : ''}`.trim()}
                    type="button"
                    disabled={isOutOfStock || getSizeStock(currentProduct, size) <= 0}
                    onClick={() => setSelectedSize(size)}
                  >
                    <span>{size}</span>
                    {getSizeStock(currentProduct, size) <= 0 ? <small>Out of stock</small> : null}
                  </button>
                ))}
              </div>
            </div>

            <label className="pdp-quantity">
              <span>Quantity</span>
              <select value={selectedQuantityValue} disabled={isOutOfStock || selectedSizeStock <= 0} onChange={(event) => setQuantity(event.target.value)}>
                {quantityOptions.map((option) => (
                  <option key={option} value={option}>
                    {String(option).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </label>

            <div className="pdp-summary__actions">
              <button className="pdp-primary-button" type="button" disabled={isOutOfStock || selectedSizeStock <= 0} onClick={handleAddToCart}>
                {isOutOfStock || selectedSizeStock <= 0 ? 'Out Of Stock' : 'Add To Cart'}
              </button>
              <button
                className={`pdp-secondary-button${isWishlisted ? ' is-active' : ''}`}
                type="button"
                onClick={() => toggleWishlist(currentProduct.id)}
              >
                <HeartIcon filled={isWishlisted} />
                <span>{isWishlisted ? 'Wishlisted' : 'Add To Wishlist'}</span>
              </button>
            </div>

            {feedback.message ? <p className={`pdp-feedback pdp-feedback--${feedback.tone}`}>{feedback.message}</p> : null}
            <section className="pdp-delivery">
              <h2>Delivery Details</h2>
              <form className="pdp-delivery__form" onSubmit={handleDeliveryCheck}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter Pincode"
                  value={pincode}
                  onChange={(event) => setPincode(event.target.value)}
                />
                <button type="submit">Check</button>
              </form>
              <div className={`pdp-delivery__status pdp-delivery__status--${deliveryState.tone}`}>{deliveryState.message}</div>
              <div className="pdp-policy">
                <ReturnIcon />
                <p>{currentProduct.details.returnPolicy}</p>
              </div>
            </section>

            <div className="pdp-accordion-stack">
              <Accordion id="productDetails" title="Product Details" expanded={expandedSections.productDetails} onToggle={toggleSection}>
                <div className="pdp-info-block">
                  <h3>Material &amp; Care</h3>
                  {currentProduct.details.material.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
                <div className="pdp-info-block">
                  <h3>Country of Origin</h3>
                  <p>{currentProduct.details.origin}</p>
                </div>
                <div className="pdp-info-block">
                  <h3>Manufactured &amp; Sold By</h3>
                  {currentProduct.details.manufacturer.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </Accordion>

              <Accordion id="productDescription" title="Product Description" expanded={expandedSections.productDescription} onToggle={toggleSection}>
                {currentProduct.description.map((item) => (
                  <div className="pdp-info-block" key={item.heading}>
                    <h3>{item.heading}</h3>
                    <p>{item.copy}</p>
                  </div>
                ))}
              </Accordion>

              <Accordion id="artistDetails" title="Artist's Details" expanded={expandedSections.artistDetails} onToggle={toggleSection}>
                <div className="pdp-info-block">
                  <p>{currentProduct.artist}</p>
                </div>
              </Accordion>
            </div>
          </aside>
        </section>

        <section className="pdp-related">
          <div className="pdp-related__header">
            <h2>Others Also Bought</h2>
            <div className="pdp-related__controls">
              <button type="button" onClick={() => scrollRelated('prev')} aria-label="Previous products">
                <ChevronIcon direction="left" />
              </button>
              <button type="button" onClick={() => scrollRelated('next')} aria-label="Next products">
                <ChevronIcon direction="right" />
              </button>
            </div>
          </div>

          <div className="pdp-related__track" ref={relatedTrackRef}>
            {relatedProducts.map((product) => (
              <RelatedCard
                key={product.id}
                product={product}
                onSelect={selectProduct}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistIds.includes(product.id)}
              />
            ))}
          </div>
        </section>

        <section className="pdp-brand-strip">
          <p>Homegrown Indian Brand</p>
          <h2>
            Over <span>6 Million</span> Happy Customers
          </h2>
        </section>
      </main>

      <footer className="pdp-footer">
        <div className="pdp-footer__desktop">
          <div className="pdp-footer__grid">
            {footerColumns.map((column) => (
              <section key={column.title}>
                <h3>{column.title}</h3>
                <div className="pdp-footer__links">
                  {column.links.map((link) => (
                    <button key={link} type="button" onClick={() => setFeedback({ tone: 'info', message: `${link} link can be connected next.` })}>
                      {link}
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="pdp-footer__bottom">
            <div className="pdp-footer__features">
              <span><RupeeIcon />COD Available</span>
              <span><ReturnIcon />7 Days Easy Exchange Only</span>
            </div>

            <div className="pdp-footer__apps">
              <p>Experience the Legasus Store App</p>
              <div>
                <button type="button">Get it on Google Play</button>
                <button type="button">Download on the App Store</button>
              </div>
            </div>

            <div className="pdp-footer__socials">
              <span>Follow Us.</span>
              <div className="pdp-footer__social-icons">
                <button type="button" aria-label="Facebook"><FacebookIcon /></button>
                <button type="button" aria-label="Instagram"><InstagramIcon /></button>
                <button type="button" aria-label="WhatsApp"><WhatsAppIcon /></button>
                <button type="button" aria-label="X"><TwitterIcon /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="site-footer__mobile pdp-footer__mobile">
          <button className="site-footer__mobile-toggle" type="button" onClick={() => setIsKnowMoreOpen((current) => !current)}>
            <span>Know more about The Legasus Store</span>
            <ChevronIcon expanded={isKnowMoreOpen} />
          </button>

          {isKnowMoreOpen ? (
            <div className="site-footer__mobile-body">
              <div className="site-footer__mobile-app">
                <p>Experience the Legasus Store App</p>
                <div className="store-badges store-badges--mobile">
                  <a href="#0">
                    <small>Get it on</small>
                    <strong>Google Play</strong>
                  </a>
                  <a href="#0">
                    <small>Download on the</small>
                    <strong>App Store</strong>
                  </a>
                </div>
              </div>

              <div className="site-footer__mobile-grid">
                {footerColumns.map((column) => (
                  <section key={column.title}>
                    <h3>{column.title}</h3>
                    {column.links.map((link) => (
                      <a key={link} href="#0">
                        {link}
                      </a>
                    ))}
                  </section>
                ))}
              </div>

              <div className="footer-features footer-features--mobile">
                <span>
                  <RupeeIcon />
                  COD Available
                </span>
                <span>
                  <ReturnIcon />
                  7 Days Easy Exchange Only
                </span>
              </div>

              <div className="social-row social-row--mobile">
                <span>Follow Us.</span>
                <div className="social-row__icons">
                  <a href="#0" aria-label="Follow us on Facebook">
                    <FacebookIcon />
                  </a>
                  <a href="#0" aria-label="Follow us on Instagram">
                    <InstagramIcon />
                  </a>
                  <a href="#0" aria-label="Message us on WhatsApp">
                    <WhatsAppIcon />
                  </a>
                  <a href="#0" aria-label="Follow us on X">
                    <TwitterIcon />
                  </a>
                </div>
              </div>

              <button className="site-footer__mobile-toggle site-footer__mobile-toggle--secondary" type="button" onClick={() => setIsWhoWeAreOpen((current) => !current)}>
                <span>Who We Are</span>
                <strong>{isWhoWeAreOpen ? '-' : '+'}</strong>
              </button>

              {isWhoWeAreOpen ? (
                <div className="site-footer__mobile-extra">
                  <div className="site-footer__mobile-partners">
                    <p>100% Secure Payment:</p>
                    <div>
                      {footerPaymentPartners.map((partner) => (
                        <span key={partner}>{partner}</span>
                      ))}
                    </div>
                  </div>

                  <div className="site-footer__mobile-partners">
                    <p>Shipping Partners:</p>
                    <div>
                      {footerShippingPartners.map((partner) => (
                        <span key={partner}>{partner}</span>
                      ))}
                    </div>
                  </div>

                  <small>© Legasus Store 2026-27</small>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  )
}

export default ProductPage
