import { useEffect, useState } from 'react'
import './App.css'
import ProductPage from './ProductPage'
import useVoiceSearch from './useVoiceSearch'
import { productCatalog } from './productCatalog'
import {
  bootstrapStore,
  createAdminProduct as createAdminProductApi,
  createRazorpayPaymentOrder,
  deleteAdminProduct as deleteAdminProductApi,
  generateAdminOrderDocument,
  getOrderTracking,
  loginWithGoogle,
  loginWithPassword,
  placeCheckoutOrder,
  requestLoginOtp as requestLoginOtpApi,
  replaceAdminDepartmentBanners,
  registerCustomer,
  removeCustomer,
  updateAdminOrderStatus as updateAdminOrderStatusApi,
  updateAdminProduct as updateAdminProductApi,
  updateAdminProductStock as updateAdminProductStockApi,
  updateCustomer,
  verifyLoginOtp as verifyLoginOtpApi,
  verifyRazorpayPayment,
} from './api'
import { calculateCheckoutPricing } from '../shared/checkoutPricing.js'

const departmentTabs = [
  { id: 'men', label: 'Men' },
  { id: 'women', label: 'Women' },
  { id: 'sneakers', label: 'Sneakers' },
]

const footerColumns = [
  { title: 'Need Help', links: ['Contact Us', 'Track Order', 'Exchange Policy', 'FAQs', 'My Account'] },
  { title: 'Company', links: ['About Us', 'Investor Relation', 'Careers', 'Gift Vouchers', 'Community Initiatives'] },
  { title: 'More Info', links: ['T&C', 'Privacy Policy', 'Sitemap', 'Get Notified', 'Blogs'] },
  { title: 'Store Near Me', links: ['Mumbai', 'Pune', 'Bangalore', 'Hubballi', 'View More'] },
]

const heroSlidesByDepartment = {
  men: [
    {
      id: 'summer-shirts',
      eyebrow: 'Fresh Drop',
      titleTop: 'SUM',
      titleBottom: 'MER',
      script: "collection '26",
      cta: 'Explore T-Shirts',
      focusFilter: 'Oversized T-Shirts',
      tone: 'warm-sand',
      image:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=80',
      note: 'Lightweight silhouettes and laid-back tailoring for everyday wear.',
    },
    {
      id: 'summer-polos',
      eyebrow: 'Comfort Stretch',
      titleTop: 'SUM',
      titleBottom: 'MER',
      script: "collection '26",
      cta: 'Explore Polos',
      focusFilter: 'Polos',
      tone: 'warm-sand',
      image:
        'https://images.unsplash.com/photo-1506629905607-d9c381e87b1d?auto=format&fit=crop&w=1400&q=80',
      note: 'Relaxed polos and easy denim built for sunny weekends.',
    },
    {
      id: 'linen-shirting',
      eyebrow: 'Linen Blend',
      titleTop: 'SOFT',
      titleBottom: 'MOVE',
      script: 'linen focus',
      cta: 'Explore Shirts',
      focusFilter: 'Shirts',
      tone: 'cloud-blue',
      image:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1400&q=80',
      note: 'Breathable linen blends with clean fits and understated summer color.',
    },
  ],
  women: [
    {
      id: 'women-resort',
      eyebrow: 'Resort Mood',
      titleTop: 'SUN',
      titleBottom: 'GLOW',
      script: 'soft edit',
      cta: 'Explore Dresses',
      focusFilter: 'Trending',
      tone: 'cloud-blue',
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80',
      note: 'Soft resort silhouettes, matching sets, and easy vacation styling.',
    },
    {
      id: 'women-denim',
      eyebrow: 'New Muse',
      titleTop: 'SEA',
      titleBottom: 'SON',
      script: 'matching sets',
      cta: 'Explore Co-ords',
      focusFilter: 'Trending',
      tone: 'warm-sand',
      image:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=80',
      note: 'Fresh tops, relaxed denim, and elevated everyday essentials.',
    },
  ],
  sneakers: [
    {
      id: 'sneaker-lowtops',
      eyebrow: 'Sneaker Division',
      titleTop: 'LOW',
      titleBottom: 'TOPS',
      script: 'street comfort',
      cta: 'Explore Sneakers',
      focusFilter: 'Sneakers',
      tone: 'slate-navy',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80',
      note: 'Everyday silhouettes with soft cushioning and street-ready finishes.',
    },
    {
      id: 'sneaker-high',
      eyebrow: 'Court Energy',
      titleTop: 'HIGH',
      titleBottom: 'RISE',
      script: 'elevated pairs',
      cta: 'Explore High Tops',
      focusFilter: 'Sneakers',
      tone: 'warm-sand',
      image:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80',
      note: 'Statement pairs, layered textures, and bold color blocking.',
    },
  ],
}

const newArrivals = [
  {
    id: 'classic-chino',
    name: 'Chino Pants: Ebony',
    subtitle: 'Classic fit chinos',
    price: 'Rs. 1899',
    badge: 'Classic Fit',
    tag: 'Men Pants',
    detailId: 'classic-chino-ebony',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'bootcut-denim',
    name: 'Bootcut Denim: Urban Ash',
    subtitle: 'Stretch denim',
    price: 'Rs. 2299',
    badge: 'Bootcut Fit',
    tag: 'Men Jeans',
    detailId: 'bootcut-denim-urban-ash',
    image:
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'tiger-shirt',
    name: 'Oversized Shirt: Tiger',
    subtitle: 'Printed resort shirt',
    price: 'Rs. 1299',
    badge: 'Oversized Fit',
    tag: 'Shirts',
    detailId: 'oversized-shirt-tiger',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'graphic-boxers',
    name: 'Graphic Boxers: Pop',
    subtitle: 'Comfort boxer shorts',
    price: 'Rs. 499',
    badge: 'Soft Cotton',
    tag: 'Bottomwear',
    detailId: 'graphic-boxers-pop',
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
  },
]

const departmentCategories = {
  men: [
  {
    id: 'men-shirts',
    label: 'Shirts',
    filter: 'Shirts',
    productId: 'cotton-linen-light-green',
    image:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-tees',
    label: 'T-Shirts',
    filter: 'Oversized T-Shirts',
    productId: 'marauders-map-solar',
    image:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-outerwear',
    label: 'Outerwear',
    filter: 'Jackets',
    productId: 'solids-mystic-black',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-linen',
    label: 'Cotton Linen',
    filter: 'Shirts',
    productId: 'cotton-linen-russet-brown',
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-sneakers',
    label: 'Sneakers',
    filter: 'Sneakers',
    productId: 'milano-walnut',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-polos',
    label: 'Polos',
    filter: 'Polos',
    productId: 'colourblock-cocoa',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-jeans',
    label: 'Jeans',
    filter: 'Men Jeans',
    productId: 'bootcut-denim-urban-ash',
    image:
      'https://images.unsplash.com/photo-1506629905607-d9c381e87b1d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'men-pants',
    label: 'Pants',
    filter: 'Men Pants',
    productId: 'classic-chino-ebony',
    image:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=900&q=80',
  },
  ],
  women: [
    {
      id: 'women-all-topwear',
      label: 'All Topwear',
      filter: 'Women',
      productId: 'women-heartline-tee',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-tees',
      label: 'T-Shirts',
      filter: 'Women T-Shirts',
      productId: 'women-heartline-tee',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-shirts',
      label: 'Shirts',
      filter: 'Women Shirts',
      productId: 'women-ocean-breeze-shirt',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-dresses',
      label: 'Dresses & Jumpsuits',
      filter: 'Women Dresses & Jumpsuits',
      productId: 'women-sunlit-jumpsuit',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-tops',
      label: 'Tops',
      filter: 'Women Tops',
      productId: 'women-sunset-top',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-all-outerwear',
      label: 'All Outerwear',
      filter: 'Women Outerwear',
      productId: 'women-ember-jacket',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-all-bottomwear',
      label: 'All Bottomwear',
      filter: 'Women Bottomwear',
      productId: 'women-wide-leg-drift',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-sneakers',
      label: 'Sneakers',
      filter: 'Women Sneakers',
      productId: 'women-petal-runner',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'women-all-accessories',
      label: 'All Accessories',
      filter: 'Women Accessories',
      productId: 'women-blush-tote',
      department: 'women',
      image:
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80',
    },
  ],
  sneakers: [
    {
      id: 'sneaker-lowtops',
      label: 'Low Tops',
      filter: 'Sneakers',
      productId: 'street-ace-lowtops',
      image:
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'sneaker-court',
      label: 'Court Classics',
      filter: 'Sneakers',
      productId: 'milano-walnut',
      image:
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80',
    },
    {
      id: 'sneaker-street',
      label: 'Streetwear',
      filter: 'Sneakers',
      productId: 'milano-walnut',
      image:
        'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=900&q=80',
    },
  ],
}

const mobileHeroCopyByDepartment = {
  men: {
    leftTop: 'Shirts',
    leftBottom: 'That Never',
    rightTop: 'Go Out',
    rightBottom: 'Of Style',
  },
  women: {
    leftTop: 'Styles',
    leftBottom: 'That Glow',
    rightTop: 'Made To',
    rightBottom: 'Stand Out',
  },
  sneakers: {
    leftTop: 'Pairs',
    leftBottom: 'Built For',
    rightTop: 'Move In',
    rightBottom: 'Street Style',
  },
}

const footerPaymentPartners = ['PhonePe', 'GPay', 'Amazon Pay', 'Mastercard', 'MobiKwik', 'Paytm', 'UPI']
const footerShippingPartners = ['DTDC', 'Delhivery', 'Ecom Express', 'Xpressbees']

const trendingFilters = ['Trending', 'Oversized T-Shirts', 'Shirts', 'Polos', 'Jackets', 'Men Pants', 'Men Jeans', 'Sneakers']

const trendingProducts = [
  {
    id: 'cocoa-polo',
    name: 'Colourblock: Cocoa',
    subtitle: 'Oversized polos',
    price: 'Rs. 1199',
    tag: 'Polos',
    badge: 'Heavy Gauge',
    detailId: 'colourblock-cocoa',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'linen-green',
    name: 'Cotton Linen: Light Green',
    subtitle: 'Cotton linen shirts',
    price: 'Rs. 1499',
    tag: 'Shirts',
    badge: 'Linen Blend',
    detailId: 'cotton-linen-light-green',
    image:
      'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'linen-brown',
    name: 'Cotton Linen: Russet Brown',
    subtitle: 'Cotton linen shirts',
    price: 'Rs. 1499',
    tag: 'Shirts',
    badge: 'Relaxed Fit',
    detailId: 'cotton-linen-russet-brown',
    image:
      'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'milano-walnut',
    name: 'Milano: Walnut',
    subtitle: 'Men low top sneakers',
    price: 'Rs. 2599',
    tag: 'Sneakers',
    badge: 'New Sole',
    detailId: 'milano-walnut',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'marauders-map',
    name: "Marauder's Map: Solar",
    subtitle: 'Oversized T-shirts',
    price: 'Rs. 1599',
    tag: 'Oversized T-Shirts',
    badge: 'Graphic Drop',
    detailId: 'marauders-map-solar',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'dark-sage',
    name: 'Cotton Linen: Dark Sage',
    subtitle: 'Cotton linen shirts',
    price: 'Rs. 1499',
    tag: 'Shirts',
    badge: 'Linen Blend',
    detailId: 'cotton-linen-dark-sage',
    image:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'on-the-coast',
    name: 'Originals: On The Coast',
    subtitle: 'Oversized T-shirts',
    price: 'Rs. 1199',
    tag: 'Oversized T-Shirts',
    badge: 'Soft Drop',
    detailId: 'originals-on-the-coast',
    image:
      'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'mystic-black',
    name: 'Solids: Mystic Black',
    subtitle: 'Men utility shirts',
    price: 'Rs. 1699',
    tag: 'Jackets',
    badge: 'Utility',
    detailId: 'solids-mystic-black',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
]

const drawerCatalog = {
  men: {
    featured: [
      {
        id: 'men-feature-1',
        title: 'Summer Home',
        heroId: 'summer-shirts',
        filter: 'Oversized T-Shirts',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'men-feature-2',
        title: 'Cotton Linen',
        heroId: 'linen-shirting',
        filter: 'Shirts',
        image:
          'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'men-feature-3',
        title: 'Hot Merch',
        heroId: 'summer-shirts',
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'men-feature-4',
        title: 'New Arrivals',
        heroId: 'summer-polos',
        filter: 'Trending',
        image:
          'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'men-feature-5',
        title: 'Anime',
        heroId: 'summer-shirts',
        image:
          'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'men-feature-6',
        title: 'Sneaker Edit',
        heroId: 'summer-polos',
        filter: 'Sneakers',
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
      },
    ],
    sections: [
      { id: 'shop-all', title: 'Shop All', kind: 'grid', defaultOpen: true, target: 'categories', items: departmentCategories.men },
      {
        id: 'topwear',
        title: 'Topwear',
        kind: 'links',
        items: [
          { id: 'topwear-1', label: 'Oversized T-Shirts', filter: 'Oversized T-Shirts' },
          { id: 'topwear-2', label: 'Shirts', filter: 'Shirts' },
          { id: 'topwear-3', label: 'Polos', filter: 'Polos' },
          { id: 'topwear-4', label: 'Jackets', filter: 'Jackets' },
        ],
      },
      {
        id: 'all-accessories',
        title: 'All Accessories',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'accessory-1', label: 'Backpacks' },
          { id: 'accessory-2', label: 'Perfumes' },
          { id: 'accessory-3', label: 'Socks' },
          { id: 'accessory-4', label: 'Collectibles' },
          { id: 'accessory-5', label: 'Action Figures' },
        ],
      },
      {
        id: 'more',
        title: 'More',
        kind: 'links',
        items: [
          { id: 'more-1', label: 'Stores Near Me' },
          { id: 'more-2', label: 'Track My Order' },
          { id: 'more-3', label: 'Markdowns', filter: 'Trending' },
        ],
      },
    ],
  },
  women: {
    featured: [
      {
        id: 'women-feature-1',
        title: 'Resort Edit',
        heroId: 'women-resort',
        image:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'women-feature-2',
        title: 'Co-ords',
        heroId: 'women-denim',
        image:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'women-feature-3',
        title: 'Fresh Tops',
        heroId: 'women-resort',
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=500&q=80',
      },
    ],
    sections: [
      {
        id: 'shop-all',
        title: 'Shop All',
        kind: 'grid',
        defaultOpen: true,
        target: 'categories',
        items: departmentCategories.women,
      },
      {
        id: 'women-topwear',
        title: 'Topwear',
        kind: 'links',
        items: [
          { id: 'women-topwear-1', label: 'All Topwear', filter: 'Women', department: 'women' },
          { id: 'women-topwear-2', label: 'T-Shirts', filter: 'Women T-Shirts', department: 'women' },
          { id: 'women-topwear-3', label: 'Shirts', filter: 'Women Shirts', department: 'women' },
          { id: 'women-topwear-4', label: 'Dresses & Jumpsuits', filter: 'Women Dresses & Jumpsuits', department: 'women' },
          { id: 'women-topwear-5', label: 'Tops', filter: 'Women Tops', department: 'women' },
          { id: 'women-topwear-6', label: 'All Outerwear', filter: 'Women Outerwear', department: 'women' },
        ],
      },
      {
        id: 'women-bottomwear',
        title: 'Bottomwear',
        kind: 'links',
        items: [{ id: 'women-bottomwear-1', label: 'All Bottomwear', filter: 'Women Bottomwear', department: 'women' }],
      },
      {
        id: 'women-sneaker-links',
        title: 'Sneakers',
        kind: 'links',
        items: [{ id: 'women-sneakers-1', label: 'Sneakers', filter: 'Women Sneakers', department: 'women' }],
      },
      {
        id: 'women-official-merch',
        title: 'Official Merch',
        kind: 'links',
        items: [
          { id: 'women-merch-1', label: 'Anime Tees', filter: 'Women T-Shirts', department: 'women' },
          { id: 'women-merch-2', label: 'Kawaii Edit', filter: 'Women', department: 'women' },
        ],
      },
      {
        id: 'women-all-accessories',
        title: 'All Accessories',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'women-accessory-1', label: 'All Accessories', filter: 'Women Accessories', department: 'women' },
          { id: 'women-accessory-2', label: 'Perfumes', filter: 'Women Accessories', department: 'women' },
          { id: 'women-accessory-3', label: 'Socks', filter: 'Women Accessories', department: 'women' },
        ],
      },
      {
        id: 'more',
        title: 'More',
        kind: 'links',
        defaultOpen: true,
        items: [
          { id: 'women-more-1', label: 'Stores Near Me' },
          { id: 'women-more-2', label: 'Track My Order' },
        ],
      },
    ],
  },
  sneakers: {
    featured: [
      {
        id: 'sneaker-feature-1',
        title: 'Low Tops',
        heroId: 'sneaker-lowtops',
        image:
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'sneaker-feature-2',
        title: 'High Tops',
        heroId: 'sneaker-high',
        image:
          'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=500&q=80',
      },
      {
        id: 'sneaker-feature-3',
        title: 'Care Kits',
        heroId: 'sneaker-lowtops',
        image:
          'https://images.unsplash.com/photo-1582582621959-48d27397dc69?auto=format&fit=crop&w=500&q=80',
      },
    ],
    sections: [
      {
        id: 'shop-all',
        title: 'Shop All',
        kind: 'grid',
        defaultOpen: true,
        target: 'categories',
        items: departmentCategories.sneakers,
      },
    ],
  },
}

const createExpandedSections = (departmentId) =>
  Object.fromEntries(drawerCatalog[departmentId].sections.map((section) => [section.id, Boolean(section.defaultOpen)]))

const chunkItems = (items, size) => {
  const pages = []

  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }

  return pages
}

const checkoutSteps = [
  { id: 'bag', label: 'My Bag' },
  { id: 'address', label: 'Address' },
  { id: 'payment', label: 'Payment' },
]

const POPULAR_CART_CATEGORIES = ['Men\'s T-Shirts', 'Women\'s T-Shirts', 'Joggers', 'Shorts', 'Tank Tops', 'Full Sleeve T-Shirt', 'Polos']

const initialAddressForm = {
  flat: '',
  street: '',
  landmark: '',
  pincode: '',
  city: '',
  state: '',
  country: 'India',
  fullName: '',
  phone: '',
  addressType: 'home',
  isDefault: true,
}

const initialLoginForm = {
  email: '',
  password: '',
  otp: '',
}

const initialLoginOtpState = {
  requestedEmail: '',
  maskedEmail: '',
  expiresInSeconds: 0,
  resendAvailableInSeconds: 0,
  previewCode: '',
}

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  birthdate: '',
  phone: '',
  gender: 'male',
}

const initialCustomerProfileForm = {
  firstName: '',
  lastName: '',
  email: '',
  birthdate: '',
  phone: '',
  gender: 'male',
  newPassword: '',
  confirmPassword: '',
}

const customerAccountSections = [
  { id: 'orders', label: 'Orders' },
  { id: 'support', label: 'FAQs' },
  { id: 'profile', label: 'Profile' },
]

const rawGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
const GOOGLE_CLIENT_ID = rawGoogleClientId && !/^your[_-]/i.test(rawGoogleClientId) ? rawGoogleClientId : ''

const supportFaqSections = [
  {
    id: 'gift-card-faq',
    label: 'Gift Card FAQ',
    faqs: [
      {
        id: 'gift-card-1',
        question: 'How do I redeem a gift card?',
        answer: 'Add products to your cart, enter the gift card code at checkout, and the value will be adjusted instantly.',
      },
      {
        id: 'gift-card-2',
        question: 'Can I use multiple gift cards together?',
        answer: 'Yes. You can stack multiple active gift cards in a single order until the payable amount becomes zero.',
      },
      {
        id: 'gift-card-3',
        question: 'Does a gift card expire?',
        answer: 'Gift cards stay active for 12 months from the date of issue. The expiry is shown in the voucher email as well.',
      },
    ],
  },
  {
    id: 'sale-terms',
    label: 'Sale Terms & Conditions',
    faqs: [
      {
        id: 'sale-terms-1',
        question: 'Do sale prices apply to all products?',
        answer: 'Sale pricing is only valid on marked products. Limited drops, membership items, and certain collaborations may be excluded.',
      },
      {
        id: 'sale-terms-2',
        question: 'Can I combine a sale offer with coupons?',
        answer: 'If a product already has a markdown, coupon stacking may be restricted depending on the offer rules visible on the cart page.',
      },
      {
        id: 'sale-terms-3',
        question: 'Will exchange eligibility depend on the discounted price?',
        answer: 'Exchange eligibility is based on the final billed order and the product condition at pickup. Discounted items can still be exchange-eligible if they meet the 7-day exchange policy.',
      },
    ],
  },
  {
    id: 'miscellaneous',
    label: 'Miscellaneous',
    faqs: [
      {
        id: 'misc-1',
        question: 'Can I update my phone number after placing an order?',
        answer: 'You can update contact details before shipment from your profile or by contacting support with your order ID.',
      },
      {
        id: 'misc-2',
        question: 'Do you have physical stores?',
        answer: 'Yes. The store locator in the header can be expanded later for exact addresses. Current demo data focuses on online shopping flow.',
      },
      {
        id: 'misc-3',
        question: 'How do I contact support?',
        answer: 'Use the help sections on this page or reach out from the profile page. You can also use the contact information shown in the footer.',
      },
    ],
  },
  {
    id: 'exclusive-membership',
    label: 'Exclusive Membership',
    faqs: [
      {
        id: 'membership-1',
        question: 'What does membership include?',
        answer: 'Members get extra savings, early access to drops, smoother returns, and priority support on selected campaigns.',
      },
      {
        id: 'membership-2',
        question: 'Can I add membership later?',
        answer: 'Yes. Membership can be added from cart prompts, account pages, or special campaign surfaces when available.',
      },
      {
        id: 'membership-3',
        question: 'Can membership be cancelled after activation?',
        answer: 'Membership benefits begin immediately after activation, so cancellation is generally not supported once the membership is active.',
      },
    ],
  },
  {
    id: 'exchange-policy',
    label: 'Exchange Policy',
    faqs: [
      {
        id: 'returns-1',
        question: 'What are the terms of the exchange policy?',
        answer: 'Only exchanges are supported for eligible items within 7 days of delivery, provided the product remains unused and tags stay intact.',
      },
      {
        id: 'returns-2',
        question: 'How do I create an exchange request?',
        answer: 'Go to your orders, open the relevant order card, and use the exchange action once the order becomes eligible for after-sales support.',
      },
      {
        id: 'returns-3',
        question: 'Do you offer returns or refunds?',
        answer: 'No. This store currently supports exchange only. Return and refund requests are not accepted for delivered orders.',
      },
      {
        id: 'returns-4',
        question: 'Are there charges on exchanges?',
        answer: 'Exchange requests may require eligibility checks, but delivered orders are not refunded. Only size or replacement exchanges are supported under the 7-day policy.',
      },
    ],
  },
  {
    id: 'shipping-tracking',
    label: 'Shipping & Tracking',
    faqs: [
      {
        id: 'shipping-1',
        question: 'Can I modify the shipping address before dispatch?',
        answer: 'Yes. If the order has not moved to shipped status, you can update the address from your profile or contact support immediately.',
      },
      {
        id: 'shipping-2',
        question: 'How long does delivery usually take?',
        answer: 'Metro deliveries are usually completed in 2 to 4 business days. Other locations may take 4 to 7 business days depending on pin code.',
      },
      {
        id: 'shipping-3',
        question: 'How do I track my order?',
        answer: 'Open your profile, go to Orders, and search using order ID, transaction ID, or product name to see the latest shipment stage.',
      },
      {
        id: 'shipping-4',
        question: 'What if my order is undelivered?',
        answer: 'If delivery fails, the shipment is re-attempted. If it remains undelivered, support can help arrange a new attempt or cancellation.',
      },
      {
        id: 'shipping-5',
        question: 'Are there additional shipping charges?',
        answer: 'Standard shipping is free on eligible orders. Special fees may appear on urgent, gifting, or remote-location deliveries when applicable.',
      },
    ],
  },
  {
    id: 'orders-payment',
    label: 'Orders & Payment',
    faqs: [
      {
        id: 'orders-1',
        question: 'Can I place an order on Cash on Delivery?',
        answer: 'COD is available on selected pin codes and eligible carts. Availability is confirmed on the payment step during checkout.',
      },
      {
        id: 'orders-2',
        question: 'Can I ship to a different address than billing?',
        answer: 'Yes. Shipping address can be different from the billing address as long as the delivery location is serviceable.',
      },
      {
        id: 'orders-3',
        question: 'Why is my order not showing in the account?',
        answer: 'Orders appear against the email used at checkout. Make sure you are signed in with the same email address used for purchase.',
      },
      {
        id: 'orders-4',
        question: 'How do I use my TSS points or money?',
        answer: 'Points and TSS money can be redeemed on eligible orders from the payment stage, subject to campaign and account rules.',
      },
    ],
  },
]

const AUTH_USERS_STORAGE_KEY = 'legasus-auth-users'
const AUTH_SESSION_STORAGE_KEY = 'legasus-auth-session'
const ADMIN_PRODUCTS_STORAGE_KEY = 'legasus-admin-products'
const ADMIN_ORDERS_STORAGE_KEY = 'legasus-admin-orders'
const ADMIN_HOME_BANNERS_STORAGE_KEY = 'legasus-admin-home-banners'
const DEFAULT_ADMIN_EMAIL = 'admin@legasus.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

const adminNavigation = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'orders', label: 'Orders' },
  { id: 'customers', label: 'Customers' },
  { id: 'payments', label: 'Payments' },
]

const initialAdminProductForm = {
  title: '',
  description: '',
  price: '',
  category: '',
  images: [],
  sizeChartImage: '',
  sizes: [],
  sizeInventory: {},
  quantity: '0',
}

const MAX_ADMIN_PRODUCT_IMAGES = 6
const MAX_HOME_BANNERS = 5
const DEFAULT_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const DEFAULT_EXTENDED_APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
const DEFAULT_BOTTOM_SIZES = ['30', '32', '34', '36', '38']
const DEFAULT_SNEAKER_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']
const productCatalogById = new Map(productCatalog.map((product) => [product.id, product]))
const adminCategoryOptions = [
  ...departmentTabs.map((tab) => tab.label),
  ...Array.from(new Set(productCatalog.map((product) => product.category).filter(Boolean))),
]

const normalizeSizeLabel = (size) => String(size ?? '').trim()

const inferProductSizes = ({ id = '', category = '', sizes = [] } = {}) => {
  const directSizes = Array.isArray(sizes) ? sizes.map(normalizeSizeLabel).filter(Boolean) : []
  if (directSizes.length) {
    return [...new Set(directSizes)]
  }

  const catalogSizes = Array.isArray(productCatalogById.get(id)?.sizes)
    ? productCatalogById.get(id).sizes.map(normalizeSizeLabel).filter(Boolean)
    : []

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

const sumSizeInventory = (sizeInventory, sizes = Object.keys(sizeInventory ?? {})) =>
  sizes.reduce((sum, size) => sum + Math.max(0, Number(sizeInventory?.[size] ?? 0) || 0), 0)

const getProductSizeQuantity = (product, size) => {
  const normalizedSize = normalizeSizeLabel(size)
  if (!normalizedSize) return Math.max(0, Number(product?.quantity ?? 0) || 0)

  return Math.max(0, Number(product?.sizeInventory?.[normalizedSize] ?? 0) || 0)
}

const getFirstAvailableSize = (product) =>
  inferProductSizes(product).find((size) => getProductSizeQuantity(product, size) > 0) ?? inferProductSizes(product)[0] ?? ''

const formatSizeStockSummary = (product) =>
  inferProductSizes(product)
    .map((size) => `${size}: ${getProductSizeQuantity(product, size)}`)
    .join(' | ')

const buildSizeDraftMap = (product) =>
  Object.fromEntries(inferProductSizes(product).map((size) => [size, String(getProductSizeQuantity(product, size))]))

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`))
    reader.readAsDataURL(file)
  })

const seedAdminProducts = productCatalog.map((product, index) => {
  const quantities = [42, 16, 0, 21, 8, 14, 5, 30]
  const quantity = quantities[index] ?? 12
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
    price: product.price,
    category: product.category,
    images: product.gallery.slice(0, 3).map((item) => item.image),
    sizes,
    sizeInventory,
    quantity: sumSizeInventory(sizeInventory, sizes),
    stockStatus: quantity > 0 ? 'in-stock' : 'out-of-stock',
    badge: product.badge,
  }
})

const seedAdminCustomers = [
  {
    id: 'cust-aarav-mehta',
    name: 'Aarav Mehta',
    email: 'aarav.mehta@example.com',
    phone: '9876543210',
    city: 'Mumbai',
    joinedOn: '2026-01-04',
  },
  {
    id: 'cust-sana-khan',
    name: 'Sana Khan',
    email: 'sana.khan@example.com',
    phone: '9820012345',
    city: 'Pune',
    joinedOn: '2026-01-18',
  },
  {
    id: 'cust-rohan-verma',
    name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '9811182233',
    city: 'Bangalore',
    joinedOn: '2026-02-06',
  },
  {
    id: 'cust-meera-nair',
    name: 'Meera Nair',
    email: 'meera.nair@example.com',
    phone: '9898981234',
    city: 'Delhi',
    joinedOn: '2026-02-21',
  },
]

const seedAdminOrders = [
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

const createCartItemKey = (productId, size) => `${productId}::${size}`
const initialPaymentConfig = {
  provider: 'razorpay',
  enabled: false,
  keyId: '',
  brandName: 'Legasus Store',
  brandDescription: 'Secure checkout powered by Razorpay',
  brandLogo: '',
}

let razorpayScriptPromise = null

const formatAmount = (value, decimals = 0) =>
  `₹ ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`

const readStoredJson = (storageKey, fallbackValue) => {
  if (typeof window === 'undefined') return fallbackValue

  try {
    const storedValue = window.localStorage.getItem(storageKey)
    return storedValue ? JSON.parse(storedValue) : fallbackValue
  } catch {
    return fallbackValue
  }
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const formatLabel = (value) =>
  String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ')

const getAdminStatusPresentation = (status) => {
  const normalizedStatus = String(status ?? 'pending').toLowerCase().replace(/\s+/g, '-')

  if (normalizedStatus === 'cancelled') {
    return {
      tone: 'cancelled',
      label: 'Uncompleted',
    }
  }

  return {
    tone: normalizedStatus,
    label: formatLabel(normalizedStatus),
  }
}

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

const normalizeOrderRecord = (order) => {
  const normalizedShippingStatus = String(order?.shippingStatus ?? '')
    .toLowerCase()
    .replace(/\s+/g, '-')

  return {
    ...order,
    shippingStatus: normalizedShippingStatus || String(order?.shippingStatus ?? ''),
    status: deriveOrderStatusFromShippingStatus(order?.shippingStatus, order?.status),
  }
}

const nonCollectionSelectionLabels = new Set(['track my order', 'stores near me'])

const broadCollectionTerms = new Set(['trending', 'markdowns', 'new arrivals', 'new arrival'])

const collectionKeywordAliases = {
  shirts: ['shirt', 'linen', 'cotton linen shirt'],
  'cotton linen': ['linen', 'cotton linen', 'cotton linen shirt'],
  't shirts': ['t shirt', 'oversized t shirts', 'oversized full sleeve t shirts'],
  't shirt': ['t shirt', 'oversized t shirts', 'oversized full sleeve t shirts'],
  'oversized t shirts': ['t shirt', 'oversized t shirts', 'oversized full sleeve t shirts'],
  polos: ['polo'],
  polo: ['polo'],
  outerwear: ['jacket', 'outerwear'],
  jackets: ['jacket', 'outerwear'],
  jacket: ['jacket', 'outerwear'],
  jeans: ['jean', 'denim'],
  'men jeans': ['jean', 'denim'],
  pants: ['pant', 'pants', 'chino', 'trouser'],
  'men pants': ['pant', 'pants', 'chino', 'trouser'],
  joggers: ['jogger'],
  bottomwear: ['bottomwear', 'pant', 'jean', 'jogger', 'short', 'boxer'],
  'all topwear': ['women', 'topwear', 'tops', 'shirt', 't shirt'],
  'all outerwear': ['women', 'outerwear', 'jacket'],
  'all bottomwear': ['women', 'bottomwear', 'pant', 'jean', 'jogger', 'skirt'],
  'women sneakers': ['women', 'sneaker', 'low top', 'high top'],
  'women accessories': ['women', 'accessory'],
  'women shirts': ['women', 'shirt'],
  'women tops': ['women', 'top'],
  'women dresses': ['women', 'dress', 'jumpsuit'],
  shorts: ['short', 'boxer'],
  sneakers: ['sneaker', 'low top', 'high top'],
  'low tops': ['low top', 'sneaker'],
  'low top': ['low top', 'sneaker'],
  'high tops': ['high top', 'sneaker'],
  'high top': ['high top', 'sneaker'],
  dresses: ['dress'],
  tops: ['top'],
  'co ords': ['co ord', 'co ords', 'coord', 'set'],
  backpacks: ['backpack'],
  perfumes: ['perfume'],
  socks: ['sock'],
  collectibles: ['collectible'],
  'action figures': ['action figure'],
  accessories: ['accessory'],
  'all accessories': ['accessory'],
}

const normalizeCollectionTerm = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const buildCollectionKeywords = (value) => {
  const normalizedValue = normalizeCollectionTerm(value)

  if (!normalizedValue) return []

  const keywords = new Set([normalizedValue])

  if (normalizedValue.endsWith('s')) {
    keywords.add(normalizedValue.slice(0, -1))
  }

  ;(collectionKeywordAliases[normalizedValue] ?? []).forEach((keyword) => keywords.add(keyword))

  return [...keywords].filter(Boolean)
}

const browsePriceRanges = [
  { id: 'under-999', label: 'Under Rs. 999', min: 0, max: 999 },
  { id: '1000-1499', label: 'Rs. 1000 - Rs. 1499', min: 1000, max: 1499 },
  { id: '1500-1999', label: 'Rs. 1500 - Rs. 1999', min: 1500, max: 1999 },
  { id: '2000-plus', label: 'Rs. 2000 & above', min: 2000, max: Number.POSITIVE_INFINITY },
]

const getProductThemeLabel = (product) => {
  const title = String(product.title ?? '').trim()

  if (title.includes(':')) return title.split(':')[0].trim()
  if (Array.isArray(product.breadcrumbs) && product.breadcrumbs[2]) return product.breadcrumbs[2]
  return product.badge ?? 'Legasus'
}

const buildBrowseHintMap = () => {
  const hintMap = new Map()

  const addHints = (productId, values) => {
    if (!productId) return

    const current = hintMap.get(productId) ?? new Set()
    values
      .filter(Boolean)
      .forEach((value) => {
        current.add(String(value))
      })
    hintMap.set(productId, current)
  }

  Object.values(departmentCategories)
    .flat()
    .forEach((item) => addHints(item.productId, [item.label, item.filter]))
  newArrivals.forEach((item) => addHints(item.detailId, [item.tag, item.subtitle, item.badge]))
  trendingProducts.forEach((item) => addHints(item.detailId, [item.tag, item.subtitle, item.badge]))

  return new Map([...hintMap.entries()].map(([productId, values]) => [productId, [...values]]))
}

const getDepartmentBrowseOptions = (departmentId, products) => {
  const options = []
  const seen = new Set()

  drawerCatalog[departmentId]?.sections.forEach((section) => {
    section.items.forEach((item) => {
      const normalizedLabel = normalizeCollectionTerm(item.label)

      if (!normalizedLabel || nonCollectionSelectionLabels.has(normalizedLabel) || broadCollectionTerms.has(normalizedLabel) || seen.has(normalizedLabel)) {
        return
      }

      const keywords = buildCollectionKeywords(item.label)
      const count = products.filter((product) => productMatchesKeywords(product, keywords)).length

      if (!count) return

      seen.add(normalizedLabel)
      options.push({
        id: item.id,
        label: item.label,
        count,
      })
    })
  })

  if (options.length) return options

  const fallbackCounts = new Map()
  products.forEach((product) => {
    const key = product.category
    fallbackCounts.set(key, (fallbackCounts.get(key) ?? 0) + 1)
  })

  return [...fallbackCounts.entries()].map(([label, count]) => ({
    id: normalizeCollectionTerm(label),
    label,
    count,
  }))
}

const resolveCollectionDepartment = (selection, fallbackDepartment) => {
  const departmentHints = [selection.department, selection.filter, selection.label]
    .map(normalizeCollectionTerm)
    .filter(Boolean)

  if (departmentHints.some((term) => term.includes('women'))) return 'women'
  if (departmentHints.some((term) => term.includes('sneaker') || term.includes('low top') || term.includes('high top'))) return 'sneakers'
  return fallbackDepartment
}

const productMatchesKeywords = (product, keywords) => {
  if (!keywords.length) return true

  const haystack = normalizeCollectionTerm(
    [product.title, product.category, product.badge, product.teaser, product.department, ...(product.browseHints ?? [])]
      .filter(Boolean)
      .join(' '),
  )

  return keywords.some((keyword) => haystack.includes(keyword))
}

const inferDepartmentFromCategory = (category = '') => {
  const normalizedCategory = String(category).trim().toLowerCase()

  if (normalizedCategory.includes('women')) return 'women'
  if (normalizedCategory.includes('sneaker')) return 'sneakers'
  return 'men'
}

const normalizeAdminDashboardProduct = (product, index = 0) => ({
  ...product,
  sizes: inferProductSizes(product),
  sizeInventory: normalizeSizeInventory(product),
  quantity: sumSizeInventory(normalizeSizeInventory(product), inferProductSizes(product)),
  stockStatus: getStockStatus(sumSizeInventory(normalizeSizeInventory(product), inferProductSizes(product))),
  images: Array.isArray(product.images) ? product.images.filter(Boolean).slice(0, MAX_ADMIN_PRODUCT_IMAGES) : [],
  sizeChartImage: String(product.sizeChartImage ?? '').trim(),
  createdAt: Number(product.createdAt ?? Date.now() - index * 86400000),
})

const normalizeAdminHomeBanner = (banner, index = 0) => ({
  id: String(banner?.id ?? `banner-${banner?.department ?? 'men'}-${Date.now()}-${index}`),
  department: departmentTabs.some((tab) => tab.id === banner?.department) ? banner.department : 'men',
  image: String(banner?.image ?? '').trim(),
  createdAt: Number(banner?.createdAt ?? Date.now() + index),
})

const buildHeroSlidesForDepartment = (department, banners) => {
  const defaultSlides = heroSlidesByDepartment[department] ?? heroSlidesByDepartment.men
  const departmentBanners = (banners ?? [])
    .filter((banner) => banner.department === department && banner.image)
    .slice(0, MAX_HOME_BANNERS)

  if (!departmentBanners.length) return defaultSlides

  return departmentBanners.map((banner, index) => ({
    ...defaultSlides[index % defaultSlides.length],
    id: banner.id,
    image: banner.image,
  }))
}

const buildCustomerProductsFromAdminUploads = (products) => {
  const mappedProducts = products.map((product) => {
    const department = inferDepartmentFromCategory(product.category)
    const gallery = (product.images ?? []).filter(Boolean).map((image, index) => ({
      image,
      alt: `${product.title} image ${index + 1}`,
      overlays: index === 0 ? [{ text: 'NEW UPLOAD', position: 'top-left' }] : [],
    }))

    return {
      id: product.id,
      title: product.title,
      category: product.category,
      price: Number(product.price),
      color: formatLabel(department),
      department,
      breadcrumbs: ['Home', formatLabel(department), product.category, product.title],
      gallery,
      sizeChartImage: String(product.sizeChartImage ?? '').trim(),
      sizes: inferProductSizes(product),
      sizeInventory: normalizeSizeInventory(product),
      defaultSize: getFirstAvailableSize(product),
      details: {
        returnPolicy: 'This product is eligible for exchange only within 7 days of delivery. Returns are not available.',
        material: ['Premium fabric blend', 'Machine wash'],
        origin: 'India',
        manufacturer: [
          'Amit Garments Pvt. Ltd.',
          'F-67, Harsh Vihar Hari Nagar Tanki Road',
          'Badarpur Part-3',
          'New Delhi - 110044',
          'legasus.co@gmail.com',
        ],
      },
      description: [
        {
          heading: 'Product Description',
          copy: product.description,
        },
      ],
      artist: 'Legasus Studio',
      teaser: product.description,
      badge: product.badge ?? 'Admin Upload',
      stockStatus: product.stockStatus,
      quantity: sumSizeInventory(normalizeSizeInventory(product), inferProductSizes(product)),
      createdAt: Number(product.createdAt ?? 0),
    }
  })

  return mappedProducts.map((product) => {
    const relatedCustomIds = mappedProducts
      .filter((candidate) => candidate.id !== product.id && candidate.department === product.department)
      .map((candidate) => candidate.id)
    const relatedCatalogIds = productCatalog
      .filter((candidate) => candidate.department === product.department)
      .map((candidate) => candidate.id)

    return {
      ...product,
      recommendedIds: [...relatedCustomIds, ...relatedCatalogIds].slice(0, 4),
    }
  })
}

const getDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDate = (value) => {
  if (!value) return '--'

  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`))
  } catch {
    return value
  }
}

const getStockStatus = (quantity) => (Number(quantity) > 0 ? 'in-stock' : 'out-of-stock')

const normalizeStoredUser = (user) => {
  if (!user) return null
  if (user.email === DEFAULT_ADMIN_EMAIL) return { ...user, role: 'admin', addresses: Array.isArray(user.addresses) ? user.addresses : [] }
  return { ...user, role: user.role ?? 'customer', addresses: Array.isArray(user.addresses) ? user.addresses : [] }
}

let googleIdentityScriptPromise

const loadGoogleIdentityScript = () => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google sign-in is available in the browser only.'))
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google)
  }

  if (googleIdentityScriptPromise) {
    return googleIdentityScriptPromise
  }

  googleIdentityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-google-identity="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Google sign-in right now.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleIdentity = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Unable to load Google sign-in right now.'))
    document.body.appendChild(script)
  })

  return googleIdentityScriptPromise
}

const requestGoogleAccessToken = async () => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Google login is not configured yet. Add VITE_GOOGLE_CLIENT_ID to the frontend environment.')
  }

  const google = await loadGoogleIdentityScript()

  return new Promise((resolve, reject) => {
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      callback: (response) => {
        if (!response?.access_token) {
          reject(new Error(response?.error_description ?? 'Google sign-in was cancelled.'))
          return
        }

        resolve(response.access_token)
      },
      error_callback: () => {
        reject(new Error('Google sign-in popup was closed before completing login.'))
      },
    })

    tokenClient.requestAccessToken({
      prompt: 'select_account',
    })
  })
}

const loadRazorpayCheckoutScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector('script[data-razorpay-checkout="true"]')

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout.')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout.'))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

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
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
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
      <path d="M12 20s-7-4.6-7-10.1A4 4 0 0 1 9 6.1c1.2 0 2.3.5 3 1.5.7-1 1.8-1.5 3-1.5a4 4 0 0 1 4 3.8C19 15.4 12 20 12 20Z" fill={filled ? 'currentColor' : 'none'} />
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

function ArrowIcon({ direction = 'right' }) {
  const rotate = direction === 'left' ? 'rotate(180 12 12)' : undefined

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g transform={rotate}>
        <path d="m9 6 6 6-6 6" />
      </g>
    </svg>
  )
}

function ChevronIcon({ expanded = false }) {
  const rotate = expanded ? 'rotate(180 12 12)' : undefined

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g transform={rotate}>
        <path d="m6 9 6 6 6-6" />
      </g>
    </svg>
  )
}

function BrandMark() {
  return (
    <div className="brand-mark" aria-label="Legasus storefront">
      <strong>LEGASUS</strong>
    </div>
  )
}

function HeaderIconButton({ label, children, onClick, active = false, count }) {
  return (
    <button className={`header-icon-button${active ? ' is-active' : ''}`} type="button" aria-label={label} onClick={onClick}>
      {children}
      {count ? <span className="header-icon-button__count">{count}</span> : null}
    </button>
  )
}

function SectionHeading({ title, subtitle }) {
  return (
    <div className="section-heading">
      {subtitle ? <p>{subtitle}</p> : null}
      <h2>{title}</h2>
    </div>
  )
}

function ProductCard({ product, onSelect, onToggleWishlist, isWishlisted }) {
  const isInteractive = Boolean(product.detailId && onSelect)
  const canWishlist = Boolean(product.detailId && onToggleWishlist)
  const rotationImages = product.rotatingImages?.filter(Boolean) ?? []
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const activeImage = rotationImages[activeImageIndex % Math.max(rotationImages.length, 1)] ?? product.image
  const isOutOfStock = product.stockStatus === 'out-of-stock' || Number(product.quantity ?? 0) <= 0
  const stockMessage = isOutOfStock
    ? 'Out of Stock'
    : Number(product.quantity ?? 0) <= 10
      ? `${product.quantity} left`
      : 'In Stock'

  useEffect(() => {
    if (rotationImages.length <= 1) return undefined

    const timerId = window.setInterval(() => {
      setActiveImageIndex((current) => (current + 1) % rotationImages.length)
    }, 3000)

    return () => window.clearInterval(timerId)
  }, [rotationImages.length])

  return (
    <article className={`product-card${isInteractive ? ' product-card--interactive' : ''}`}>
      {isInteractive ? <button className="product-card__cover" type="button" onClick={() => onSelect(product.detailId)} aria-label={`Open ${product.name}`} /> : null}
      <div className="product-card__media">
        <img src={activeImage} alt={product.name} />
        <span className="product-card__badge">{product.badge}</span>
        {canWishlist ? (
          <button
            className={`product-card__wish${isWishlisted ? ' is-active' : ''}`}
            type="button"
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            onClick={() => onToggleWishlist(product.detailId)}
          >
            <HeartIcon filled={isWishlisted} />
          </button>
        ) : null}
      </div>
      <div className="product-card__body">
        <h3>{product.name}</h3>
        <p>{product.subtitle}</p>
        <span className={`product-card__stock${isOutOfStock ? ' is-out' : ''}`}>{stockMessage}</span>
        <strong>{product.price}</strong>
      </div>
    </article>
  )
}

function CategoryCard({ category, onClick }) {
  return (
    <article className="category-card">
      <button className="category-card__button" type="button" onClick={() => onClick({ ...category, source: 'home-grid' })}>
        <div className="category-card__image">
          <img src={category.image} alt={category.label} />
        </div>
        <h3>{category.label}</h3>
      </button>
    </article>
  )
}

function CollectionPage({ collection, products, searchQuery, onBack, onSelectProduct, onToggleWishlist, wishlistIds }) {
  const [sortOption, setSortOption] = useState('latest')
  const [selectedCategory, setSelectedCategory] = useState(collection.defaultBrowseKey ?? '')
  const [selectedTheme, setSelectedTheme] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedPriceRangeId, setSelectedPriceRangeId] = useState('')
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)

  const searchValue = normalizeCollectionTerm(searchQuery)
  const defaultBrowseKey = collection.defaultBrowseKey ?? ''
  const categoryOptions = collection.showSidebar ? getDepartmentBrowseOptions(collection.department, products) : []
  const categoryKeywords = selectedCategory ? buildCollectionKeywords(selectedCategory) : []
  const categoryMatches = categoryKeywords.length ? products.filter((product) => productMatchesKeywords(product, categoryKeywords)) : products
  const categoryFilteredProducts = categoryKeywords.length && categoryMatches.length === 0 ? products : categoryMatches

  const themeCounts = new Map()
  categoryFilteredProducts.forEach((product) => {
    const theme = getProductThemeLabel(product)
    themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1)
  })

  const themeOptions = [...themeCounts.entries()]
    .map(([label, count]) => ({
      id: normalizeCollectionTerm(label),
      label,
      count,
    }))
    .sort((left, right) => left.label.localeCompare(right.label))

  const sizeOptions = [...new Set(categoryFilteredProducts.flatMap((product) => product.sizes ?? []))]
  const selectedPriceRange = browsePriceRanges.find((range) => range.id === selectedPriceRangeId) ?? null

  const filteredProducts = categoryFilteredProducts
    .filter((product) => (selectedTheme ? normalizeCollectionTerm(getProductThemeLabel(product)) === selectedTheme : true))
    .filter((product) => (selectedSize ? (product.sizes ?? []).includes(selectedSize) : true))
    .filter((product) => {
      if (!selectedPriceRange) return true
      return Number(product.price) >= selectedPriceRange.min && Number(product.price) <= selectedPriceRange.max
    })
    .filter((product) => {
      if (!searchValue) return true

      return normalizeCollectionTerm(
        [product.title, product.category, product.badge, product.teaser, getProductThemeLabel(product)].filter(Boolean).join(' '),
      ).includes(searchValue)
    })

  const sortedProducts = [...filteredProducts].sort((left, right) => {
    if (sortOption === 'price-low') return Number(left.price) - Number(right.price)
    if (sortOption === 'price-high') return Number(right.price) - Number(left.price)
    if (sortOption === 'name') return left.title.localeCompare(right.title)
    return Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0)
  })

  const productCards = sortedProducts.map((product) => ({
    id: `collection-${product.id}`,
    name: product.title,
    subtitle: product.category,
    price: formatAmount(product.price),
    badge: product.badge ?? formatLabel(product.department),
    tag: product.category,
    detailId: product.id,
    image: product.gallery?.[0]?.image ?? '',
    rotatingImages: product.gallery?.map((image) => image.image).filter(Boolean) ?? [],
    stockStatus: product.stockStatus,
    quantity: product.quantity,
  }))

  const breadcrumb = `Home / ${collection.title}`
  const activeFilterCount = [
    selectedCategory && selectedCategory !== defaultBrowseKey ? 'category' : '',
    selectedTheme,
    selectedSize,
    selectedPriceRangeId,
  ].filter(Boolean).length

  const resetBrowseFilters = () => {
    setSelectedCategory(defaultBrowseKey)
    setSelectedTheme('')
    setSelectedSize('')
    setSelectedPriceRangeId('')
  }

  const handleCategorySelect = (label) => {
    setSelectedCategory(label)
    setSelectedTheme('')
    setSelectedSize('')
    setSelectedPriceRangeId('')
  }

  const renderFilterSections = () => (
    <>
      <section className="browse-filter">
        <div className="browse-filter__header">
          <h2>Categories</h2>
        </div>
        <div className="browse-filter__list">
          {categoryOptions.map((option) => (
            <button
              key={option.id}
              className={`browse-filter__item${selectedCategory === option.label ? ' is-active' : ''}`}
              type="button"
              onClick={() => handleCategorySelect(option.label)}
            >
              <span>{option.label}</span>
              <b>{option.count}</b>
            </button>
          ))}
        </div>
      </section>

      {themeOptions.length ? (
        <section className="browse-filter">
          <div className="browse-filter__header">
            <h2>Themes</h2>
          </div>
          <div className="browse-filter__list">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                className={`browse-filter__item${selectedTheme === option.id ? ' is-active' : ''}`}
                type="button"
                onClick={() => setSelectedTheme((current) => (current === option.id ? '' : option.id))}
              >
                <span>{option.label}</span>
                <b>{option.count}</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {sizeOptions.length ? (
        <section className="browse-filter">
          <div className="browse-filter__header">
            <h2>Size</h2>
          </div>
          <div className="browse-filter__chips">
            {sizeOptions.map((size) => (
              <button
                key={size}
                className={selectedSize === size ? 'is-active' : ''}
                type="button"
                onClick={() => setSelectedSize((current) => (current === size ? '' : size))}
              >
                {size}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="browse-filter">
        <div className="browse-filter__header">
          <h2>Prices</h2>
        </div>
        <div className="browse-filter__list">
          {browsePriceRanges.map((range) => (
            <button
              key={range.id}
              className={`browse-filter__item${selectedPriceRangeId === range.id ? ' is-active' : ''}`}
              type="button"
              onClick={() => setSelectedPriceRangeId((current) => (current === range.id ? '' : range.id))}
            >
              <span>{range.label}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )

  return (
    <section className={`section-block browse-page${collection.showSidebar ? ' has-sidebar' : ''}`}>
      <div className="browse-page__top">
        <div className="browse-page__intro">
          <button className="browse-page__back" type="button" onClick={onBack}>
            <ArrowIcon direction="left" />
            <span>Back</span>
          </button>
          <p className="browse-page__breadcrumb">{breadcrumb}</p>
          <div className="browse-page__heading">
            <h1>{collection.title}</h1>
            <span>
              {productCards.length} item{productCards.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        <div className="browse-page__actions">
          <label className="browse-page__sort">
            <span>Sort By</span>
            <select value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
              <option value="latest">Newest First</option>
              <option value="price-low">Price: Low To High</option>
              <option value="price-high">Price: High To Low</option>
              <option value="name">Name: A To Z</option>
            </select>
          </label>

          {collection.showSidebar ? (
            <button className="browse-page__filter-toggle" type="button" onClick={() => setIsMobileFilterOpen(true)}>
              Filters{activeFilterCount ? ` (${activeFilterCount})` : ''}
            </button>
          ) : null}
        </div>
      </div>

      <div className={`browse-page__layout${collection.showSidebar ? ' has-sidebar' : ''}`}>
        {collection.showSidebar ? (
          <aside className="browse-page__sidebar">{renderFilterSections()}</aside>
        ) : null}

        <div className="browse-page__content">
          {productCards.length ? (
            <div className="browse-page__grid">
              {productCards.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistIds.includes(product.detailId)}
                />
              ))}
            </div>
          ) : (
            <div className="collection-empty collection-empty--catalog">
              <h2>No products found</h2>
              <p>Try another category, theme, size, or price range.</p>
              <div className="collection-empty__actions">
                <button type="button" onClick={resetBrowseFilters}>
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {collection.showSidebar ? (
        <div className={`browse-mobile-filter${isMobileFilterOpen ? ' is-open' : ''}`} aria-hidden={!isMobileFilterOpen}>
          <button className="browse-mobile-filter__backdrop" type="button" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="browse-mobile-filter__panel" role="dialog" aria-modal="true" aria-label="Product filters">
            <div className="browse-mobile-filter__header">
              <div>
                <p>Refine your picks</p>
                <h2>Filters</h2>
              </div>
              <button type="button" onClick={() => setIsMobileFilterOpen(false)}>
                x
              </button>
            </div>

            <div className="browse-mobile-filter__body">{renderFilterSections()}</div>

            <div className="browse-mobile-filter__actions">
              <button type="button" onClick={resetBrowseFilters}>
                Reset
              </button>
              <button className="is-primary" type="button" onClick={() => setIsMobileFilterOpen(false)}>
                View {productCards.length}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function MobileHomeShowcase({ activeDepartment, activeSlide, heroSlides, activeHero, onHeroChange, categories, onApplySelection }) {
  const copy = mobileHeroCopyByDepartment[activeDepartment] ?? mobileHeroCopyByDepartment.men
  const showcaseCategories = categories.slice(0, 6)

  return (
    <section className="mobile-home-hero" aria-label="Featured mobile showcase">
      <div className="mobile-home-hero__top">
        <div className="mobile-home-hero__copy mobile-home-hero__copy--left">
          <span>{copy.leftTop}</span>
          <span>{copy.leftBottom}</span>
        </div>

        <button
          className="mobile-home-hero__lead"
          type="button"
          onClick={() => onApplySelection({ filter: activeSlide.focusFilter, label: activeSlide.cta, target: 'trending' })}
        >
          <img src={activeSlide.image} alt={activeSlide.cta} />
        </button>

        <div className="mobile-home-hero__copy mobile-home-hero__copy--right">
          <span>{copy.rightTop}</span>
          <span>{copy.rightBottom}</span>
        </div>
      </div>

      <div className="mobile-home-hero__mini-grid">
        {showcaseCategories.map((category) => (
          <button key={category.id} className="mobile-home-hero__mini-card" type="button" onClick={() => onApplySelection({ ...category, source: 'home-grid' })}>
            <img src={category.image} alt={category.label} />
          </button>
        ))}
      </div>

      <button
        className="mobile-home-hero__cta"
        type="button"
        onClick={() => onApplySelection({ filter: activeSlide.focusFilter, label: activeSlide.cta, target: 'trending' })}
      >
        Explore The Collection
      </button>

      <div className="mobile-home-hero__dots">
        {heroSlides.map((slide, index) => (
          <button key={slide.id} className={index === activeHero ? 'is-active' : ''} type="button" onClick={() => onHeroChange(index)} />
        ))}
      </div>

      <div className="mobile-home-hero__benefits">
        <span>
          <FooterRupeeIcon />
          10% Cashback
        </span>
        <span>
          <FooterRefreshIcon />
          7 Days Exchange
        </span>
        <span>
          <FooterTruckIcon />
          Fast Shipping
        </span>
      </div>
    </section>
  )
}

function BrandBanner() {
  return (
    <section className="brand-banner">
      <p>Homegrown Indian Brand</p>
      <h2>
        Over <span>6 Million</span> Happy Customers
      </h2>
    </section>
  )
}

function FooterRupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 5h10M7 9h10M9 5c4 0 6 1.8 6 4s-2 4-6 4H7l8 6" />
    </svg>
  )
}

function FooterRefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 7V3L3 7l4 4V7Z" />
      <path d="M20 11a8 8 0 1 1-2.3-5.7" />
    </svg>
  )
}

function FooterTruckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 7h11v8H3Z" />
      <path d="M14 10h3.5L20 13v2h-6Z" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </svg>
  )
}

function FooterFacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M13.5 20v-6h2.2l.3-2.6h-2.5V9.8c0-.8.2-1.3 1.3-1.3H16V6.2c-.3 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.2v2.1H9v2.6h2.3v6Z"
        fill="currentColor"
      />
    </svg>
  )
}

function FooterInstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function FooterWhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.7 19.5 7.8 16A8.2 8.2 0 1 1 12 20.2a8 8 0 0 1-3.8-.9Z" />
      <path d="M9.4 9.2c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.5c.1.3 0 .4-.1.6l-.3.4c-.1.1-.1.3 0 .5.3.6 1 1.4 1.9 1.8.2.1.3.1.5 0l.4-.4c.2-.2.4-.2.6-.1l1.4.7c.2.1.4.2.4.4v.5c0 .2 0 .5-.3.6-.5.3-1 .5-1.6.4-2.6-.4-5.2-2.8-5.7-5.4-.1-.5.1-1 .5-1.5Z" />
    </svg>
  )
}

function FooterXIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 5h3.7l3.9 5.3L16.8 5H19l-5.4 6.2L19.4 19h-3.8l-4.1-5.5L6.7 19H4.4l5.8-6.6Z" fill="currentColor" />
    </svg>
  )
}

function SiteFooter() {
  const [isKnowMoreOpen, setIsKnowMoreOpen] = useState(true)
  const [isWhoWeAreOpen, setIsWhoWeAreOpen] = useState(false)

  return (
    <footer className="site-footer">
      <div className="site-footer__desktop">
        <div className="site-footer__grid">
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

        <div className="site-footer__bottom">
          <div className="footer-features">
            <span>
              <FooterRupeeIcon />
              COD Available
            </span>
            <span>
              <FooterRefreshIcon />
              7 Days Easy Exchange Only
            </span>
          </div>

          <div className="app-promo">
            <p>Experience the Legasus Store App</p>
            <div className="store-badges">
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

          <div className="social-row">
            <span>Follow Us.</span>
            <div className="social-row__icons">
              <a href="#0" aria-label="Follow us on Facebook">
                <FooterFacebookIcon />
              </a>
              <a href="#0" aria-label="Follow us on Instagram">
                <FooterInstagramIcon />
              </a>
              <a href="#0" aria-label="Message us on WhatsApp">
                <FooterWhatsAppIcon />
              </a>
              <a href="#0" aria-label="Follow us on X">
                <FooterXIcon />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="site-footer__mobile">
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
                <FooterRupeeIcon />
                COD Available
              </span>
              <span>
                <FooterRefreshIcon />
                7 Days Easy Exchange Only
              </span>
            </div>

            <div className="social-row social-row--mobile">
              <span>Follow Us.</span>
              <div className="social-row__icons">
                <a href="#0" aria-label="Follow us on Facebook">
                  <FooterFacebookIcon />
                </a>
                <a href="#0" aria-label="Follow us on Instagram">
                  <FooterInstagramIcon />
                </a>
                <a href="#0" aria-label="Message us on WhatsApp">
                  <FooterWhatsAppIcon />
                </a>
                <a href="#0" aria-label="Follow us on X">
                  <FooterXIcon />
                </a>
              </div>
            </div>

            <button className="site-footer__mobile-toggle site-footer__mobile-toggle--secondary" type="button" onClick={() => setIsWhoWeAreOpen((current) => !current)}>
              <span>Who We Are</span>
              <strong>{isWhoWeAreOpen ? '−' : '+'}</strong>
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
  )
}

function EmptyGhostIllustration({ type }) {
  return (
    <div className={`status-illustration status-illustration--${type}`} aria-hidden="true">
      <div className="status-illustration__frame">
        <div className="status-illustration__dots">
          <span className="status-illustration__dot" />
          <span className="status-illustration__dot" />
          <span className="status-illustration__dot" />
        </div>
        <div className="status-illustration__line" />
      </div>
    </div>
  )
}

function WishlistItemCard({ product, onOpen, onRemove, onMoveToCart }) {
  return (
    <article className="wishlist-tile">
      <button className="wishlist-tile__remove" type="button" aria-label={`Remove ${product.title} from wishlist`} onClick={() => onRemove(product.id)}>
        <CloseIcon />
      </button>
      <button className="wishlist-tile__product" type="button" onClick={() => onOpen(product.id)}>
        <div className="wishlist-tile__media">
          <img src={product.gallery[0].image} alt={product.title} />
          <span className="wishlist-tile__badge">{product.badge}</span>
        </div>
        <div className="wishlist-tile__body">
          <h3>{product.title}</h3>
          <p>{product.category}</p>
          <strong>{formatAmount(product.price)}</strong>
        </div>
      </button>
      <button className="wishlist-tile__action" type="button" onClick={() => onMoveToCart(product.id)}>
        Move To Cart
      </button>
    </article>
  )
}

function CheckoutSteps({ step }) {
  return (
    <div className="checkout-steps" aria-label="Checkout progress">
      {checkoutSteps.map((checkoutStep, index) => (
        <div key={checkoutStep.id} className={`checkout-steps__item${checkoutStep.id === step ? ' is-active' : ''}`}>
          <span>{checkoutStep.label}</span>
          {index < checkoutSteps.length - 1 ? <i aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  )
}

function AddressModal({ isOpen, form, onFieldChange, onClose, onSave }) {
  if (!isOpen) return null

  return (
    <div className="address-modal" role="presentation">
      <button className="address-modal__backdrop" type="button" aria-label="Close address form" onClick={onClose} />
      <div className="address-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
        <div className="address-modal__header">
          <h2 id="address-modal-title">Add New Address</h2>
          <button type="button" aria-label="Close address form" onClick={onClose}>
            x
          </button>
        </div>

        <div className="address-modal__fields">
          <input type="text" placeholder="Flat No / Building / Company*" value={form.flat} onChange={(event) => onFieldChange('flat', event.target.value)} />
          <input type="text" placeholder="Street Name, Area*" value={form.street} onChange={(event) => onFieldChange('street', event.target.value)} />
          <input type="text" placeholder="Landmark" value={form.landmark} onChange={(event) => onFieldChange('landmark', event.target.value)} />

          <div className="address-modal__row">
            <input type="text" inputMode="numeric" placeholder="Pincode*" value={form.pincode} onChange={(event) => onFieldChange('pincode', event.target.value.replace(/\D/g, '').slice(0, 6))} />
            <input type="text" placeholder="City/District*" value={form.city} onChange={(event) => onFieldChange('city', event.target.value)} />
          </div>

          <div className="address-modal__row">
            <input type="text" value={form.country} disabled />
            <input type="text" placeholder="State*" value={form.state} onChange={(event) => onFieldChange('state', event.target.value)} />
          </div>

          <div className="address-modal__contact">
            <h3>Contact Details</h3>
            <input type="text" placeholder="Full Name*" value={form.fullName} onChange={(event) => onFieldChange('fullName', event.target.value)} />
            <div className="address-modal__phone">
              <span>+91</span>
              <input type="tel" inputMode="numeric" placeholder="Phone Number*" value={form.phone} onChange={(event) => onFieldChange('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
          </div>

          <div className="address-modal__type">
            <h3>Save Address As</h3>
            <div className="address-modal__chips">
              {['home', 'work', 'other'].map((option) => (
                <button
                  key={option}
                  className={form.addressType === option ? 'is-active' : ''}
                  type="button"
                  onClick={() => onFieldChange('addressType', option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <label className="address-modal__default">
            <input type="checkbox" checked={form.isDefault} onChange={(event) => onFieldChange('isDefault', event.target.checked)} />
            <span>Save This As Default Address</span>
          </label>
        </div>

        <div className="address-modal__actions">
          <button className="address-modal__secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="address-modal__primary" type="button" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminStatusPill({ status }) {
  const { tone, label } = getAdminStatusPresentation(status)

  return <span className={`admin-pill admin-pill--${tone}`}>{label}</span>
}

function AdminMetricCard({ label, value, note }) {
  return (
    <article className="admin-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <p>{note}</p> : null}
    </article>
  )
}

function AdminDashboard({
  currentUser,
  activeSection,
  onSectionChange,
  earnings,
  stats,
  inventory,
  products,
  selectedProduct,
  onSelectProduct,
  productForm,
  onProductFieldChange,
  onProductSizeStockChange,
  onProductImagesUpload,
  onRemoveProductImage,
  onProductSizeChartUpload,
  onRemoveProductSizeChart,
  homeBanners,
  onHomeBannerUpload,
  onRemoveHomeBanner,
  onProductSubmit,
  productFormMessage,
  bannerFormMessage,
  editingProductId,
  onStartProductEdit,
  onDeleteProduct,
  onResetProductForm,
  stockDrafts,
  sizeStockDrafts,
  onStockDraftChange,
  onInventorySizeDraftChange,
  onStockUpdate,
  orders,
  orderSummary,
  selectedOrder,
  onSelectOrder,
  onOrderStatusChange,
  onRefreshOrderTracking,
  onOpenOrderDocument,
  orderActionState,
  customers,
  selectedCustomer,
  onSelectCustomer,
  payments,
  paymentSummary,
  onBackToStore,
  onLogout,
}) {
  const [productQuery, setProductQuery] = useState('')
  const [inventoryQuery, setInventoryQuery] = useState('')
  const [inventoryFilter, setInventoryFilter] = useState('all')
  const [orderQuery, setOrderQuery] = useState('')
  const [orderFilter, setOrderFilter] = useState('all')
  const [customerQuery, setCustomerQuery] = useState('')
  const [paymentQuery, setPaymentQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [bannerDepartment, setBannerDepartment] = useState('men')

  const productSearchValue = productQuery.trim().toLowerCase()
  const inventorySearchValue = inventoryQuery.trim().toLowerCase()
  const orderSearchValue = orderQuery.trim().toLowerCase()
  const customerSearchValue = customerQuery.trim().toLowerCase()
  const paymentSearchValue = paymentQuery.trim().toLowerCase()
  const quickOrders = orders.slice(0, 5)
  const lowStockProducts = products.filter((product) => product.quantity <= 10).slice(0, 5)
  const recentPayments = payments.slice(0, 5)
  const selectedProductImages = selectedProduct?.images?.filter(Boolean) ?? []
  const selectedProductSizeChart = selectedProduct?.sizeChartImage ?? ''
  const selectedDepartmentBanners = homeBanners.filter((banner) => banner.department === bannerDepartment)
  const selectedCustomerOrders = orders.filter((order) => order.customerId === selectedCustomer?.id)
  const filteredProducts = products.filter((product) =>
    !productSearchValue
      ? true
      : [product.title, product.category, product.description].some((value) =>
          value.toLowerCase().includes(productSearchValue),
        ),
  )
  const filteredInventoryProducts = products.filter((product) => {
    const matchesFilter =
      inventoryFilter === 'all'
        ? true
        : inventoryFilter === 'low-stock'
          ? product.quantity <= 10
          : product.stockStatus === inventoryFilter

    const matchesSearch = !inventorySearchValue
      ? true
      : [product.title, product.category].some((value) => value.toLowerCase().includes(inventorySearchValue))

    return matchesFilter && matchesSearch
  })
  const filteredOrders = orders.filter((order) => {
    const matchesFilter = orderFilter === 'all' ? true : order.status === orderFilter
    const matchesSearch = !orderSearchValue
      ? true
      : [order.id, order.customerName, order.customerEmail, order.productTitle, order.transactionId].some((value) =>
          value.toLowerCase().includes(orderSearchValue),
        )

    return matchesFilter && matchesSearch
  })
  const filteredCustomers = customers.filter((customer) =>
    !customerSearchValue
      ? true
      : [customer.name, customer.email, customer.phone, customer.city].some((value) =>
          String(value ?? '')
            .toLowerCase()
            .includes(customerSearchValue),
        ),
  )
  const filteredPayments = payments.filter((payment) => {
    const matchesFilter = paymentFilter === 'all' ? true : payment.paymentStatus === paymentFilter
    const matchesSearch = !paymentSearchValue
      ? true
      : [payment.transactionId, payment.customerName, payment.orderId].some((value) =>
          value.toLowerCase().includes(paymentSearchValue),
        )

    return matchesFilter && matchesSearch
  })
  const categorySnapshot = Object.entries(
    products.reduce((summary, product) => {
      summary[product.category] = (summary[product.category] ?? 0) + 1
      return summary
    }, {}),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 4)
  const bestSellers = Object.values(
    orders.reduce((summary, order) => {
      const currentItem = summary[order.productId] ?? {
        id: order.productId,
        title: order.productTitle,
        quantity: 0,
        revenue: 0,
      }

      if (order.status !== 'cancelled') {
        currentItem.quantity += order.quantity
        currentItem.revenue += order.amount
      }

      summary[order.productId] = currentItem
      return summary
    }, {}),
  )
    .sort((left, right) => right.quantity - left.quantity || right.revenue - left.revenue)
    .slice(0, 4)
  const revenueTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const dateKey = getDateKey(date)
    const amount = orders
      .filter((order) => order.createdAt === dateKey && order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + order.amount, 0)

    return {
      dateKey,
      label: new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(date),
      amount,
    }
  })
  const peakRevenue = Math.max(...revenueTrend.map((item) => item.amount), 1)
  const orderMix = [
    { id: 'pending', label: 'Pending', value: orderSummary.pending },
    { id: 'completed', label: 'Completed', value: orderSummary.completed },
    { id: 'cancelled', label: 'Uncompleted', value: orderSummary.uncompleted },
  ]
  const highestOrderMix = Math.max(...orderMix.map((item) => item.value), 1)
  const topCustomer = [...customers].sort((left, right) => right.totalSpent - left.totalSpent)[0] ?? null

  return (
    <section className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__intro">
            <p>Legasus Admin</p>
            <h1>Dashboard</h1>
            <span>{currentUser?.email ?? DEFAULT_ADMIN_EMAIL}</span>
          </div>

          <nav className="admin-sidebar__nav" aria-label="Admin sections">
            {adminNavigation.map((item) => (
              <button
                key={item.id}
                className={item.id === activeSection ? 'is-active' : ''}
                type="button"
                onClick={() => onSectionChange(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="admin-content">
          <header className="admin-header">
            <div>
              <p>Welcome back</p>
              <h2>{currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'Admin'}</h2>
              <span>Manage earnings, products, stock, orders, customers, and payments from one place.</span>
            </div>

            <div className="admin-header__actions">
              <button type="button" onClick={onBackToStore}>
                Back To Store
              </button>
              <button className="is-primary" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          </header>

          {activeSection === 'overview' ? (
            <div className="admin-stack">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Earnings</p>
                    <h3>Revenue overview</h3>
                  </div>
                </div>

                <div className="admin-metrics">
                  <AdminMetricCard label="Total Earnings" value={formatAmount(earnings.total)} note="Paid earnings collected" />
                  <AdminMetricCard label="Today's Earnings" value={formatAmount(earnings.today)} note="Paid orders today" />
                  <AdminMetricCard label="Monthly Earnings" value={formatAmount(earnings.month)} note="Current month collection" />
                  <AdminMetricCard label="Total Revenue" value={formatAmount(earnings.revenue)} note="Gross order value" />
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Dashboard Stats</p>
                    <h3>Business snapshot</h3>
                  </div>
                </div>

              <div className="admin-metrics">
                  <AdminMetricCard label="Total Products" value={stats.products} note="Active catalog items" />
                  <AdminMetricCard label="Total Orders" value={stats.orders} note="Across all statuses" />
                  <AdminMetricCard label="Total Customers" value={stats.customers} note="Registered and ordering users" />
                  <AdminMetricCard label="Total Sales" value={stats.sales} note="Units sold in live orders" />
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Overview Insights</p>
                    <h3>Momentum and best performers</h3>
                  </div>
                </div>

                <div className="admin-insights-grid">
                  <article className="admin-insight-card admin-insight-card--wide">
                    <div className="admin-insight-card__header">
                      <div>
                        <span>Revenue Trend</span>
                        <strong>{formatAmount(earnings.month)}</strong>
                      </div>
                      <p>Last 7 days of paid earnings.</p>
                    </div>

                    <div className="admin-revenue-bars">
                      {revenueTrend.map((item) => (
                        <div className="admin-revenue-bars__item" key={item.dateKey}>
                          <small>{item.label}</small>
                          <div className="admin-revenue-bars__track">
                            <i
                              style={{
                                height: item.amount ? `${Math.max((item.amount / peakRevenue) * 100, 14)}%` : '0%',
                              }}
                            />
                          </div>
                          <strong>{item.amount ? formatAmount(item.amount) : '--'}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="admin-insight-card">
                    <div className="admin-insight-card__header">
                      <div>
                        <span>Order Status Mix</span>
                        <strong>{orderSummary.total}</strong>
                      </div>
                      <p>Live order distribution.</p>
                    </div>

                    <div className="admin-progress-list">
                      {orderMix.map((item) => (
                        <div className="admin-progress-row" key={item.id}>
                          <div>
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                          </div>
                          <div className="admin-progress-row__track">
                            <i
                              className={`admin-progress-row__fill admin-progress-row__fill--${item.id}`}
                              style={{ width: `${(item.value / highestOrderMix) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="admin-insight-card">
                    <div className="admin-insight-card__header">
                      <div>
                        <span>Best Sellers</span>
                        <strong>{bestSellers.length}</strong>
                      </div>
                      <p>Top products by sold units.</p>
                    </div>

                    <div className="admin-ranking-list">
                      {bestSellers.length ? (
                        bestSellers.map((product) => (
                          <article key={product.id}>
                            <div>
                              <strong>{product.title}</strong>
                              <span>{product.quantity} units sold</span>
                            </div>
                            <b>{formatAmount(product.revenue)}</b>
                          </article>
                        ))
                      ) : (
                        <p className="admin-empty">No sales yet.</p>
                      )}
                    </div>
                  </article>
                </div>
              </section>

              <div className="admin-overview-grid">
                <section className="admin-section">
                  <div className="admin-section__header">
                    <div>
                      <p>Orders</p>
                      <h3>Recent orders</h3>
                    </div>
                  </div>

                  <div className="admin-activity-list">
                    {quickOrders.map((order) => (
                      <button
                        key={order.id}
                        className={`admin-activity-card${selectedOrder?.id === order.id ? ' is-active' : ''}`}
                        type="button"
                        onClick={() => {
                          onSelectOrder(order.id)
                          onSectionChange('orders')
                        }}
                      >
                        <div>
                          <strong>{order.id}</strong>
                          <span>{order.customerName}</span>
                        </div>
                        <div>
                          <AdminStatusPill status={order.status} />
                          <small>{formatAmount(order.amount)}</small>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section__header">
                    <div>
                      <p>Inventory</p>
                      <h3>Stock watch</h3>
                    </div>
                  </div>

                  <div className="admin-activity-list">
                    {lowStockProducts.length ? (
                      lowStockProducts.map((product) => (
                        <button
                          key={product.id}
                          className={`admin-activity-card${selectedProduct?.id === product.id ? ' is-active' : ''}`}
                          type="button"
                          onClick={() => {
                            onSelectProduct(product.id)
                            onSectionChange('inventory')
                          }}
                        >
                          <div>
                            <strong>{product.title}</strong>
                            <span>{product.category}</span>
                          </div>
                          <div>
                            <AdminStatusPill status={product.stockStatus} />
                            <small>{product.quantity} left</small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="admin-empty">All tracked products are comfortably stocked.</p>
                    )}
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section__header">
                    <div>
                      <p>Payments</p>
                      <h3>Recent transactions</h3>
                    </div>
                  </div>

                  <div className="admin-activity-list">
                    {recentPayments.map((payment) => (
                      <article className="admin-activity-card admin-activity-card--static" key={payment.transactionId}>
                        <div>
                          <strong>{payment.transactionId}</strong>
                          <span>{payment.customerName}</span>
                        </div>
                        <div>
                          <AdminStatusPill status={payment.paymentStatus} />
                          <small>{formatAmount(payment.amount)}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          ) : null}

          {activeSection === 'products' ? (
            <div className="admin-products">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Products</p>
                    <h3>{editingProductId ? 'Edit Product' : 'Add Product / Upload Product'}</h3>
                  </div>
                  {editingProductId ? <span className="admin-section__tag">Editing selected item</span> : null}
                </div>

                <form className="admin-product-form" onSubmit={onProductSubmit}>
                  <label>
                    <span>Product Title</span>
                    <input
                      type="text"
                      placeholder="Product Title"
                      value={productForm.title}
                      onChange={(event) => onProductFieldChange('title', event.target.value)}
                    />
                  </label>

                  <div className="admin-product-form__split">
                    <label>
                      <span>Product Price</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Product Price"
                        value={productForm.price}
                        onChange={(event) => onProductFieldChange('price', event.target.value)}
                      />
                    </label>

                    <label>
                      <span>Available Quantity</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Available Quantity"
                        value={productForm.quantity}
                        onChange={(event) => onProductFieldChange('quantity', event.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    <span>Product Category</span>
                    <select
                      value={productForm.category}
                      onChange={(event) => onProductFieldChange('category', event.target.value)}
                    >
                      <option value="">Select Product Category</option>
                      {adminCategoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>

                  {productForm.sizes.length ? (
                    <div className="admin-size-stock">
                      <div className="admin-size-stock__header">
                        <span>Size-wise Stock</span>
                        <small>When total stock is 0, all sizes automatically go out of stock.</small>
                      </div>
                      <div className="admin-size-stock__grid">
                        {productForm.sizes.map((size) => (
                          <label key={size}>
                            <span>{size}</span>
                            <input
                              type="number"
                              min="0"
                              value={productForm.sizeInventory?.[size] ?? 0}
                              onChange={(event) => onProductSizeStockChange(size, event.target.value)}
                            />
                            <small>{Number(productForm.sizeInventory?.[size] ?? 0) > 0 ? `${productForm.sizeInventory?.[size]} in stock` : 'Out of stock'}</small>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <label>
                    <span>Product Description</span>
                    <textarea
                      rows="5"
                      placeholder="Product Description"
                      value={productForm.description}
                      onChange={(event) => onProductFieldChange('description', event.target.value)}
                    />
                  </label>

                  <div className="admin-upload-field">
                    <div className="admin-upload-field__header">
                      <span>Product Images</span>
                      <small>Upload up to {MAX_ADMIN_PRODUCT_IMAGES} images from your files</small>
                    </div>

                    <label className="admin-upload-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) => {
                          onProductImagesUpload(event.target.files)
                          event.target.value = ''
                        }}
                      />
                      <strong>Choose product images</strong>
                      <span>PNG, JPG, WEBP up to {MAX_ADMIN_PRODUCT_IMAGES} images</span>
                    </label>

                    {productForm.images.length ? (
                      <div className="admin-upload-grid">
                        {productForm.images.map((image, index) => (
                          <article className="admin-upload-card" key={`${image.slice(0, 40)}-${index}`}>
                            <img src={image} alt={`Upload preview ${index + 1}`} />
                            <button type="button" onClick={() => onRemoveProductImage(index)}>
                              Remove
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-upload-empty">No images uploaded yet.</p>
                    )}
                  </div>

                  <div className="admin-upload-field">
                    <div className="admin-upload-field__header">
                      <span>Product Size Chart</span>
                      <small>Upload one image file for the customer size chart</small>
                    </div>

                    <label className="admin-upload-dropzone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          onProductSizeChartUpload(event.target.files)
                          event.target.value = ''
                        }}
                      />
                      <strong>Choose size chart image</strong>
                      <span>PNG, JPG, WEBP single image</span>
                    </label>

                    {productForm.sizeChartImage ? (
                      <div className="admin-upload-grid admin-upload-grid--single">
                        <article className="admin-upload-card admin-upload-card--wide">
                          <img src={productForm.sizeChartImage} alt="Product size chart preview" />
                          <button type="button" onClick={onRemoveProductSizeChart}>
                            Remove
                          </button>
                        </article>
                      </div>
                    ) : (
                      <p className="admin-upload-empty">No size chart uploaded yet.</p>
                    )}
                  </div>

                  {productFormMessage ? <p className="admin-feedback">{productFormMessage}</p> : null}

                  <div className="admin-form-actions">
                    {editingProductId ? (
                      <button className="admin-secondary-button" type="button" onClick={onResetProductForm}>
                        Cancel Edit
                      </button>
                    ) : null}
                    <button className="admin-primary-button" type="submit">
                      {editingProductId ? 'Save Changes' : 'Upload Product'}
                    </button>
                  </div>
                </form>
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Home Banners</p>
                    <h3>Update hero banners</h3>
                  </div>
                </div>

                <div className="admin-filter-pills">
                  {departmentTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={bannerDepartment === tab.id ? 'is-active' : ''}
                      type="button"
                      onClick={() => setBannerDepartment(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="admin-upload-field admin-upload-field--banners">
                  <div className="admin-upload-field__header">
                    <span>{formatLabel(bannerDepartment)} Home Banners</span>
                    <small>Upload up to {MAX_HOME_BANNERS} images for the home page slider</small>
                  </div>

                  <label className="admin-upload-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        onHomeBannerUpload(bannerDepartment, event.target.files)
                        event.target.value = ''
                      }}
                    />
                    <strong>Choose banner images</strong>
                    <span>PNG, JPG, WEBP up to {MAX_HOME_BANNERS} banners</span>
                  </label>

                  {selectedDepartmentBanners.length ? (
                    <div className="admin-upload-grid admin-upload-grid--banners">
                      {selectedDepartmentBanners.map((banner, index) => (
                        <article className="admin-upload-card admin-upload-card--banner" key={banner.id}>
                          <img src={banner.image} alt={`${formatLabel(bannerDepartment)} banner ${index + 1}`} />
                          <button type="button" onClick={() => onRemoveHomeBanner(bannerDepartment, banner.id)}>
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="admin-upload-empty">No custom banners uploaded for {formatLabel(bannerDepartment)} yet.</p>
                  )}
                </div>

                {bannerFormMessage ? <p className="admin-feedback">{bannerFormMessage}</p> : null}
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Product List</p>
                    <h3>Catalog and details</h3>
                  </div>
                </div>

                <div className="admin-toolbar">
                  <label className="admin-search">
                    <input
                      type="search"
                      placeholder="Search products by title, category, or description"
                      value={productQuery}
                      onChange={(event) => setProductQuery(event.target.value)}
                    />
                  </label>
                  <div className="admin-summary-chips">
                    {categorySnapshot.map(([category, count]) => (
                      <span key={category}>
                        {category}: {count}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="admin-products__layout">
                  <div className="admin-product-list">
                    {filteredProducts.length ? (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          className={selectedProduct?.id === product.id ? 'is-active' : ''}
                          type="button"
                          onClick={() => onSelectProduct(product.id)}
                        >
                          <img src={product.images[0]} alt={product.title} />
                          <div>
                            <strong>{product.title}</strong>
                            <span>{product.category}</span>
                            <small>{formatAmount(product.price)}</small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="admin-empty">No products matched your search.</p>
                    )}
                  </div>

                  {selectedProduct ? (
                    <div className="admin-product-details">
                      <div className="admin-detail-grid">
                        <article>
                          <span>Product Details</span>
                          <strong>{selectedProduct.title}</strong>
                        </article>
                        <article>
                          <span>Product Price</span>
                          <strong>{formatAmount(selectedProduct.price)}</strong>
                        </article>
                        <article>
                          <span>Product Category</span>
                          <strong>{selectedProduct.category}</strong>
                        </article>
                        <article>
                          <span>Stock Status</span>
                          <strong>
                            <AdminStatusPill status={selectedProduct.stockStatus} />
                          </strong>
                        </article>
                      </div>

                      <div className="admin-copy-block">
                        <span>Product Description</span>
                        <p>{selectedProduct.description}</p>
                      </div>

                      <div className="admin-copy-block">
                        <span>Available Quantity</span>
                        <p>{selectedProduct.quantity}</p>
                      </div>

                      <div className="admin-copy-block">
                        <span>Size-wise Stock</span>
                        <p>{formatSizeStockSummary(selectedProduct)}</p>
                      </div>

                      <div className="admin-copy-block">
                        <span>Product Images</span>
                        <div className="admin-product-gallery">
                          {selectedProductImages.map((image) => (
                            <img key={image} src={image} alt={selectedProduct.title} />
                          ))}
                        </div>
                      </div>

                      <div className="admin-copy-block">
                        <span>Size Chart</span>
                        {selectedProductSizeChart ? (
                          <div className="admin-product-gallery admin-product-gallery--wide">
                            <img src={selectedProductSizeChart} alt={`${selectedProduct.title} size chart`} />
                          </div>
                        ) : (
                          <p>No size chart uploaded yet.</p>
                        )}
                      </div>

                      <div className="admin-card-actions">
                        <button type="button" onClick={() => onStartProductEdit(selectedProduct.id)}>
                          Edit Product
                        </button>
                        <button className="is-danger" type="button" onClick={() => onDeleteProduct(selectedProduct.id)}>
                          Delete Product
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="admin-empty">Select a product to view details.</p>
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeSection === 'inventory' ? (
            <div className="admin-stack">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Stock / Inventory</p>
                    <h3>Inventory summary</h3>
                  </div>
                </div>

                <div className="admin-metrics">
                  <AdminMetricCard label="Stock Status" value={inventory.tracked} note="Tracked inventory SKUs" />
                  <AdminMetricCard label="In Stock" value={inventory.inStock} note="Products ready to sell" />
                  <AdminMetricCard label="Out of Stock" value={inventory.outOfStock} note="Needs replenishment" />
                  <AdminMetricCard label="Available Quantity" value={inventory.available} note="Sellable units live now" />
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Update Stock</p>
                    <h3>Inventory controls</h3>
                  </div>
                </div>

                <div className="admin-toolbar">
                  <label className="admin-search">
                    <input
                      type="search"
                      placeholder="Search inventory by product or category"
                      value={inventoryQuery}
                      onChange={(event) => setInventoryQuery(event.target.value)}
                    />
                  </label>
                  <div className="admin-filter-pills">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'in-stock', label: 'In Stock' },
                      { id: 'out-of-stock', label: 'Out Of Stock' },
                      { id: 'low-stock', label: 'Low Stock' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        className={inventoryFilter === item.id ? 'is-active' : ''}
                        type="button"
                        onClick={() => setInventoryFilter(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Stock Status</th>
                        <th>Available Quantity</th>
                        <th>Size-wise Stock</th>
                        <th>Update Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInventoryProducts.length ? (
                        filteredInventoryProducts.map((product) => (
                          <tr key={product.id}>
                            <td>
                              <div className="admin-table__product">
                                <img src={product.images[0]} alt={product.title} />
                                <div>
                                  <strong>{product.title}</strong>
                                  <span>{product.category}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <AdminStatusPill status={product.stockStatus} />
                            </td>
                            <td>{stockDrafts[product.id] ?? String(product.quantity)}</td>
                            <td>
                              <div className="admin-size-editor">
                                {inferProductSizes(product).map((size) => {
                                  const draftValue = sizeStockDrafts?.[product.id]?.[size] ?? String(getProductSizeQuantity(product, size))
                                  const isOut = Number(draftValue ?? 0) <= 0

                                  return (
                                    <label key={`${product.id}-${size}`} className="admin-size-editor__cell">
                                      <span>{size}</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={draftValue}
                                        onChange={(event) => onInventorySizeDraftChange(product.id, size, event.target.value)}
                                      />
                                      <small className={`admin-size-editor__status${isOut ? ' is-out' : ''}`}>
                                        {isOut ? 'Out of stock' : `${draftValue} in stock`}
                                      </small>
                                    </label>
                                  )
                                })}
                              </div>
                            </td>
                            <td>
                              <div className="admin-stock-editor">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockDrafts[product.id] ?? String(product.quantity)}
                                  onChange={(event) => onStockDraftChange(product.id, event.target.value)}
                                />
                                <button type="button" onClick={() => onStockUpdate(product.id)}>
                                  Update
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5">
                            <p className="admin-empty">No inventory items matched the current filter.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}

          {activeSection === 'orders' ? (
            <div className="admin-stack">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Orders</p>
                    <h3>Order management</h3>
                  </div>
                </div>

                <div className="admin-metrics">
                  <AdminMetricCard label="Total Orders" value={orderSummary.total} note="All tracked orders" />
                  <AdminMetricCard label="Pending Orders" value={orderSummary.pending} note="Awaiting fulfillment" />
                  <AdminMetricCard label="Completed Orders" value={orderSummary.completed} note="Delivered successfully" />
                  <AdminMetricCard label="Uncompleted Orders" value={orderSummary.uncompleted} note="Cancelled or not completed" />
                </div>
              </section>

              <div className="admin-orders__layout">
                <section className="admin-section">
                  <div className="admin-section__header">
                    <div>
                    <p>Order List</p>
                    <h3>Recent and live orders</h3>
                  </div>
                </div>

                <div className="admin-toolbar admin-toolbar--stacked">
                  <label className="admin-search">
                    <input
                      type="search"
                      placeholder="Search by order ID, customer, product, or transaction"
                      value={orderQuery}
                      onChange={(event) => setOrderQuery(event.target.value)}
                    />
                  </label>
                  <div className="admin-filter-pills">
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'completed', label: 'Completed' },
                      { id: 'cancelled', label: 'Uncompleted' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        className={orderFilter === item.id ? 'is-active' : ''}
                        type="button"
                        onClick={() => setOrderFilter(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-order-list">
                    {filteredOrders.length ? (
                      filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          className={selectedOrder?.id === order.id ? 'is-active' : ''}
                          type="button"
                          onClick={() => onSelectOrder(order.id)}
                        >
                          <div>
                            <strong>{order.id}</strong>
                            <span>{order.customerName}</span>
                          </div>
                          <div>
                            <AdminStatusPill status={order.status} />
                            <small>{formatAmount(order.amount)}</small>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="admin-empty">No orders matched the current search or filter.</p>
                    )}
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section__header">
                    <div>
                      <p>Order Details</p>
                      <h3>{selectedOrder?.id ?? 'Select an order'}</h3>
                    </div>
                  </div>

                  {selectedOrder ? (
                    <div className="admin-order-details">
                      <div className="admin-detail-grid">
                        <article>
                          <span>Customer</span>
                          <strong>{selectedOrder.customerName}</strong>
                        </article>
                        <article>
                          <span>Order Status</span>
                          <strong>
                            <AdminStatusPill status={selectedOrder.status} />
                          </strong>
                        </article>
                        <article>
                          <span>Payment Status</span>
                          <strong>
                            <AdminStatusPill status={selectedOrder.paymentStatus} />
                          </strong>
                        </article>
                        <article>
                          <span>Transaction ID</span>
                          <strong>{selectedOrder.transactionId}</strong>
                        </article>
                      </div>

                      <div className="admin-copy-block">
                        <span>Product</span>
                        <p>{selectedOrder.productTitle}</p>
                      </div>

                      <div className="admin-copy-block">
                        <span>Order Details</span>
                        <p>
                          Quantity: {selectedOrder.quantity} | Amount: {formatAmount(selectedOrder.amount)} | Ordered on:{' '}
                          {formatDate(selectedOrder.createdAt)}
                        </p>
                      </div>

                      <div className="admin-copy-block">
                        <span>Shipping</span>
                        <p>
                          Provider: {selectedOrder.shippingProvider || 'Manual'} | Status:{' '}
                          {formatShippingStatus(selectedOrder.shippingStatus || selectedOrder.status)}
                          {selectedOrder.courierName ? ` | Courier: ${selectedOrder.courierName}` : ''}
                          {selectedOrder.awbCode ? ` | AWB: ${selectedOrder.awbCode}` : ''}
                        </p>
                      </div>

                      {selectedOrder.shippingProvider === 'shiprocket' ? (
                        <div className="admin-card-actions admin-card-actions--shipping">
                          <button
                            type="button"
                            onClick={() => onRefreshOrderTracking(selectedOrder.id)}
                            disabled={orderActionState.orderId === selectedOrder.id && orderActionState.type === 'tracking'}
                          >
                            {orderActionState.orderId === selectedOrder.id && orderActionState.type === 'tracking'
                              ? 'Refreshing...'
                              : 'Refresh Tracking'}
                          </button>
                          {[
                            { id: 'label', label: 'Label' },
                            { id: 'invoice', label: 'Invoice' },
                            { id: 'manifest', label: 'Manifest' },
                          ].map((document) => (
                            <button
                              key={document.id}
                              type="button"
                              onClick={() => onOpenOrderDocument(selectedOrder.id, document.id)}
                              disabled={orderActionState.orderId === selectedOrder.id && orderActionState.type === document.id}
                            >
                              {orderActionState.orderId === selectedOrder.id && orderActionState.type === document.id
                                ? `Opening ${document.label}...`
                                : document.label}
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {selectedOrder.trackingEvents?.length ? (
                        <div className="admin-copy-block">
                          <span>Latest Tracking Updates</span>
                          <div className="admin-tracking-list">
                            {selectedOrder.trackingEvents.slice(-4).reverse().map((event, index) => (
                              <article key={`${selectedOrder.id}-tracking-${index}`}>
                                <strong>{event.status}</strong>
                                <p>{event.note}</p>
                              </article>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <label className="admin-order-status">
                        <span>Update Order Status</span>
                        <select
                          value={selectedOrder.status}
                          onChange={(event) => onOrderStatusChange(selectedOrder.id, event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Uncompleted</option>
                        </select>
                      </label>
                    </div>
                  ) : (
                    <p className="admin-empty">Select an order to view details.</p>
                  )}
                </section>
              </div>
            </div>
          ) : null}

          {activeSection === 'customers' ? (
            <div className="admin-customers__layout">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Customers</p>
                    <h3>Customer list</h3>
                  </div>
                  {topCustomer ? <span className="admin-section__tag">Top spender: {topCustomer.name}</span> : null}
                </div>

                <div className="admin-toolbar">
                  <label className="admin-search">
                    <input
                      type="search"
                      placeholder="Search customers by name, email, phone, or city"
                      value={customerQuery}
                      onChange={(event) => setCustomerQuery(event.target.value)}
                    />
                  </label>
                </div>

                <div className="admin-customer-list">
                  {filteredCustomers.length ? (
                    filteredCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        className={selectedCustomer?.id === customer.id ? 'is-active' : ''}
                        type="button"
                        onClick={() => onSelectCustomer(customer.id)}
                      >
                        <div>
                          <strong>{customer.name}</strong>
                          <span>{customer.email}</span>
                        </div>
                        <small>{customer.city || 'No city yet'}</small>
                      </button>
                    ))
                  ) : (
                    <p className="admin-empty">No customers matched the current search.</p>
                  )}
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Customer Details</p>
                    <h3>{selectedCustomer?.name ?? 'Select a customer'}</h3>
                  </div>
                </div>

                {selectedCustomer ? (
                  <div className="admin-order-details">
                    <div className="admin-detail-grid">
                      <article>
                        <span>Email</span>
                        <strong>{selectedCustomer.email}</strong>
                      </article>
                      <article>
                        <span>Phone</span>
                        <strong>{selectedCustomer.phone || '--'}</strong>
                      </article>
                      <article>
                        <span>Total Orders</span>
                        <strong>{selectedCustomer.totalOrders}</strong>
                      </article>
                      <article>
                        <span>Total Spend</span>
                        <strong>{formatAmount(selectedCustomer.totalSpent)}</strong>
                      </article>
                    </div>

                    <div className="admin-copy-block">
                      <span>Joined On</span>
                      <p>{formatDate(selectedCustomer.joinedOn)}</p>
                    </div>

                    <div className="admin-copy-block">
                      <span>Recent Orders</span>
                      <div className="admin-inline-list">
                        {selectedCustomerOrders.length ? (
                          selectedCustomerOrders.slice(0, 4).map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => {
                                onSelectOrder(order.id)
                                onSectionChange('orders')
                              }}
                            >
                              {order.id}
                            </button>
                          ))
                        ) : (
                          <p className="admin-empty">No orders yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="admin-empty">Select a customer to view details.</p>
                )}
              </section>
            </div>
          ) : null}

          {activeSection === 'payments' ? (
            <div className="admin-stack">
              <section className="admin-section">
                <div className="admin-section__header">
                  <div>
                    <p>Payments</p>
                    <h3>Payment history</h3>
                  </div>
                </div>

                <div className="admin-metrics">
                  <AdminMetricCard label="Payment History" value={paymentSummary.total} note="Tracked transactions" />
                  <AdminMetricCard label="Payment Status: Paid" value={paymentSummary.paid} note="Captured payments" />
                  <AdminMetricCard label="Payment Status: Pending" value={paymentSummary.pending} note="Awaiting confirmation" />
                  <AdminMetricCard label="Refunded" value={paymentSummary.refunded} note="Returned to customers" />
                </div>
              </section>

              <section className="admin-section">
                <div className="admin-toolbar admin-toolbar--stacked">
                  <label className="admin-search">
                    <input
                      type="search"
                      placeholder="Search by transaction ID, customer, or order"
                      value={paymentQuery}
                      onChange={(event) => setPaymentQuery(event.target.value)}
                    />
                  </label>
                  <div className="admin-filter-pills">
                    {[
                      { id: 'all', label: 'All Payments' },
                      { id: 'paid', label: 'Paid' },
                      { id: 'pending', label: 'Pending' },
                      { id: 'refunded', label: 'Refunded' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        className={paymentFilter === item.id ? 'is-active' : ''}
                        type="button"
                        onClick={() => setPaymentFilter(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Transaction ID</th>
                        <th>Customer</th>
                        <th>Order</th>
                        <th>Payment Status</th>
                        <th>Amount</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPayments.length ? (
                        filteredPayments.map((payment) => (
                          <tr key={payment.transactionId}>
                            <td>{payment.transactionId}</td>
                            <td>{payment.customerName}</td>
                            <td>{payment.orderId}</td>
                            <td>
                              <AdminStatusPill status={payment.paymentStatus} />
                            </td>
                            <td>{formatAmount(payment.amount)}</td>
                            <td>{formatDate(payment.createdAt)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6">
                            <p className="admin-empty">No payments matched the current search or filter.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function CustomerOrderTimeline({ order }) {
  const shippingStage = String(order.shippingStatus ?? '').toLowerCase()
  const isCancelled = order.status === 'cancelled' || shippingStage === 'cancelled'
  const isPicked = ['pickup-scheduled', 'pickup-generated', 'awb-assigned', 'picked-up', 'in-transit', 'out-for-delivery', 'delivered'].includes(shippingStage)
  const isShipped = ['picked-up', 'in-transit', 'out-for-delivery', 'delivered'].includes(shippingStage)
  const isDelivered = shippingStage === 'delivered' || order.status === 'completed'
  const steps = isCancelled
    ? [
        { label: 'Order Placed', active: true },
        { label: 'Cancelled', active: true, tone: 'cancelled' },
      ]
    : [
        { label: 'Order Placed', active: true },
        { label: order.shippingProvider === 'shiprocket' ? 'Pickup Scheduled' : 'Processing', active: order.shippingProvider === 'shiprocket' ? isPicked : true },
        { label: 'Shipped', active: isShipped || isDelivered },
        { label: 'Delivered', active: isDelivered },
      ]

  return (
    <div className="profile-order-timeline">
      {steps.map((step) => (
        <div
          key={step.label}
          className={`profile-order-timeline__step${step.active ? ' is-active' : ''}${step.tone ? ` is-${step.tone}` : ''}`}
        >
          <i />
          <span>{step.label}</span>
        </div>
      ))}
    </div>
  )
}

const formatShippingStatus = (value) => {
  if (!value) return 'Awaiting Shipment'

  return String(value)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((segment) => segment[0].toUpperCase() + segment.slice(1))
    .join(' ')
}

function SupportCenterPage({ activeCategoryId, onCategoryChange }) {
  const activeCategory = supportFaqSections.find((section) => section.id === activeCategoryId) ?? supportFaqSections[0]
  const defaultExpandedFaqId = activeCategory.id === 'exclusive-membership' ? (activeCategory.faqs[0]?.id ?? null) : null
  const [expandedFaqId, setExpandedFaqId] = useState(activeCategory.faqs[0]?.id ?? null)
  const resolvedExpandedFaqId = activeCategory.faqs.some((faq) => faq.id === expandedFaqId)
    ? expandedFaqId
    : defaultExpandedFaqId

  return (
    <section className="support-shell">
      <div className="support-layout">
        <aside className="support-sidebar">
          {supportFaqSections.map((section) => (
            <button
              key={section.id}
              className={`${section.id === activeCategory.id ? 'is-active' : ''}${section.id === 'exclusive-membership' ? ' is-membership' : ''}`}
              type="button"
              onClick={() => onCategoryChange(section.id)}
            >
              <span>{section.label}</span>
              {section.id === activeCategory.id ? <ArrowIcon /> : null}
            </button>
          ))}
        </aside>

        <section className="support-content">
          <div className="support-accordion">
            {activeCategory.faqs.map((faq) => {
              const isOpen = resolvedExpandedFaqId === faq.id

              return (
                <article className={`support-accordion__item${isOpen ? ' is-open' : ''}`} key={faq.id}>
                  <button type="button" onClick={() => setExpandedFaqId(isOpen ? null : faq.id)}>
                    <span>{faq.question}</span>
                    <ChevronIcon expanded={isOpen} />
                  </button>
                  {isOpen ? (
                    <div className="support-accordion__answer">
                      <p>{faq.answer}</p>
                    </div>
                  ) : null}
                </article>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}

function CustomerProfilePage({
  currentUser,
  customerOrders,
  activeSection,
  onSectionChange,
  onOpenSupportCategory,
  onOpenProduct,
  onLogout,
  onDeleteAccount,
  profileForm,
  onProfileFieldChange,
  onSaveProfile,
  profileMessage,
  isPasswordEditorOpen,
  onTogglePasswordEditor,
  defaultAddressText,
  onManageAddress,
  onTrackShipment,
  trackingOrderId,
}) {
  const primarySections = customerAccountSections.filter((section) => section.id === 'orders')
  const secondarySections = customerAccountSections.filter((section) => section.id !== 'orders')
  const [orderSearch, setOrderSearch] = useState('')
  const orderSearchValue = orderSearch.trim().toLowerCase()
  const visibleOrders = customerOrders.filter((order) =>
    !orderSearchValue
      ? true
      : [order.id, order.transactionId, order.productTitle].some((value) => value.toLowerCase().includes(orderSearchValue)),
  )

  return (
    <section className="profile-shell">
      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar__card">
            <h2>
              {currentUser?.firstName} {currentUser?.lastName}
            </h2>
            <p>{currentUser?.email}</p>
            <button type="button" onClick={() => onOpenSupportCategory('exclusive-membership')}>
              Get Membership Now
            </button>
          </div>

          <div className="profile-sidebar__menu profile-sidebar__menu--primary">
            {primarySections.map((section) => {
              return (
                <button
                  key={section.id}
                  className={activeSection === section.id ? 'is-active' : ''}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                >
                  <div className="profile-sidebar__menu-copy">
                    <span>{section.label}</span>
                    <small>(Track your order here)</small>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="profile-sidebar__menu">
            {secondarySections.map((section) => {
              if (section.id === 'support') {
                return (
                  <button key={section.id} type="button" onClick={() => onOpenSupportCategory('shipping-tracking')}>
                    <div className="profile-sidebar__menu-copy">
                      <span>{section.label}</span>
                    </div>
                  </button>
                )
              }

              return (
                <button
                  key={section.id}
                  className={activeSection === section.id ? 'is-active' : ''}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                >
                  <div className="profile-sidebar__menu-copy">
                    <span>{section.label}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="profile-sidebar__actions">
            <button type="button" onClick={onDeleteAccount}>
              Delete My Account
            </button>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </aside>

        <div className="profile-content">
          {activeSection === 'orders' ? (
            <section className="profile-panel">
              <p className="profile-section-kicker">My Orders</p>

              {visibleOrders.length ? (
                <>
                  <div className="profile-orders-toolbar">
                    <label className="profile-search">
                      <SearchIcon />
                      <input
                        type="search"
                        placeholder="Track using order ID, transaction ID, or product name"
                        value={orderSearch}
                        onChange={(event) => setOrderSearch(event.target.value)}
                      />
                    </label>
                    <button className="profile-inline-link" type="button" onClick={() => onOpenSupportCategory('shipping-tracking')}>
                      Shipping & Tracking
                    </button>
                  </div>

                  <div className="profile-orders-grid">
                    {visibleOrders.map((order) => (
                      <article className="profile-order-card" key={order.id}>
                        <div className="profile-order-card__top">
                          <div>
                            <span>{order.id}</span>
                            <h3>{order.productTitle}</h3>
                            <p>
                              Ordered on {formatDate(order.createdAt)} | Qty {order.quantity}
                            </p>
                          </div>
                          <AdminStatusPill status={order.status} />
                        </div>

                        <div className="profile-order-card__summary">
                          <span>Transaction ID: {order.transactionId}</span>
                          <span>
                            Payment: <strong>{formatLabel(order.paymentStatus)}</strong>
                          </span>
                          <strong>{formatAmount(order.amount)}</strong>
                        </div>

                        <div className="profile-order-card__shipping">
                          <span>
                            Shipping: <strong>{order.shippingProvider === 'shiprocket' ? 'Shiprocket' : 'Manual'}</strong>
                          </span>
                          <span>
                            Status: <strong>{formatShippingStatus(order.shippingStatus || order.status)}</strong>
                          </span>
                          {order.courierName ? (
                            <span>
                              Courier: <strong>{order.courierName}</strong>
                            </span>
                          ) : null}
                          {order.awbCode ? (
                            <span>
                              AWB: <strong>{order.awbCode}</strong>
                            </span>
                          ) : null}
                          {order.pickupToken ? (
                            <span>
                              Pickup Token: <strong>{order.pickupToken}</strong>
                            </span>
                          ) : null}
                          {order.trackingEvents?.length ? (
                            <span>
                              Latest Update: <strong>{order.trackingEvents[order.trackingEvents.length - 1]?.status}</strong>
                            </span>
                          ) : null}
                          {order.shippingError ? <span className="is-error">{order.shippingError}</span> : null}
                        </div>

                        {order.trackingEvents?.length ? (
                          <div className="profile-tracking-list">
                            {order.trackingEvents.slice(-3).reverse().map((event, index) => (
                              <article key={`${order.id}-event-${index}`}>
                                <strong>{event.status}</strong>
                                <p>{event.note}</p>
                              </article>
                            ))}
                          </div>
                        ) : null}

                        <CustomerOrderTimeline order={order} />

                        <div className="profile-order-card__actions">
                          {order.shippingProvider === 'shiprocket' ? (
                            <button
                              type="button"
                              className="is-primary"
                              onClick={() => onTrackShipment(order.id)}
                              disabled={trackingOrderId === order.id}
                            >
                              {trackingOrderId === order.id ? 'Tracking...' : 'Track Shipment'}
                            </button>
                          ) : null}
                          <button type="button" onClick={() => onOpenProduct(order.productId)}>
                            View Product
                          </button>
                          <button type="button" onClick={() => onOpenSupportCategory('shipping-tracking')}>
                            Need Shipping Help?
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="profile-empty profile-empty--orders">
                  <h2>No Orders found</h2>
                </div>
              )}
            </section>
          ) : null}

          {activeSection === 'profile' ? (
            <section className="profile-panel">
              <p className="profile-section-kicker">Edit Profile</p>
              <div className="profile-form">
                <div className="profile-form__top">
                  <article>
                    <span>Email Id</span>
                    <div className="profile-static-field">{profileForm.email}</div>
                  </article>
                  <article>
                    <div className="profile-form__label-row">
                      <span>Password</span>
                      <button type="button" onClick={onTogglePasswordEditor}>
                        {isPasswordEditorOpen ? 'Cancel Password Change' : 'Change Password'}
                      </button>
                    </div>
                    {isPasswordEditorOpen ? (
                      <div className="profile-password-editor">
                        <input
                          type="password"
                          placeholder="New Password"
                          value={profileForm.newPassword}
                          onChange={(event) => onProfileFieldChange('newPassword', event.target.value)}
                        />
                        <input
                          type="password"
                          placeholder="Confirm Password"
                          value={profileForm.confirmPassword}
                          onChange={(event) => onProfileFieldChange('confirmPassword', event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="profile-static-field">******</div>
                    )}
                  </article>
                </div>

                <div className="profile-form__section">
                  <h3>General Information</h3>
                  <div className="profile-form__grid">
                    <label>
                      <span>First Name</span>
                      <input type="text" value={profileForm.firstName} onChange={(event) => onProfileFieldChange('firstName', event.target.value)} />
                    </label>
                    <label>
                      <span>Date of Birth</span>
                      <input type="date" value={profileForm.birthdate} onChange={(event) => onProfileFieldChange('birthdate', event.target.value)} />
                    </label>
                    <label>
                      <span>Last Name</span>
                      <input type="text" value={profileForm.lastName} onChange={(event) => onProfileFieldChange('lastName', event.target.value)} />
                    </label>
                    <label>
                      <span>Mobile Number</span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={profileForm.phone}
                        onChange={(event) => onProfileFieldChange('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                      />
                    </label>
                  </div>

                  <fieldset className="profile-form__gender">
                    <legend>Gender</legend>
                    {['male', 'female', 'other'].map((gender) => (
                      <label key={gender}>
                        <input type="radio" checked={profileForm.gender === gender} onChange={() => onProfileFieldChange('gender', gender)} />
                        <span>{formatLabel(gender)}</span>
                      </label>
                    ))}
                  </fieldset>

                  <div className="profile-address-panel">
                    <div className="profile-form__label-row">
                      <span>Default Address</span>
                      <button type="button" onClick={onManageAddress}>
                        Change / Edit
                      </button>
                    </div>
                    <textarea value={defaultAddressText} readOnly />
                  </div>
                </div>

                {profileMessage ? <p className="profile-message">{profileMessage}</p> : null}

                <div className="profile-form__actions">
                  <button type="button" onClick={onManageAddress}>
                    Manage Address
                  </button>
                  <button className="is-primary" type="button" onClick={onSaveProfile}>
                    Save Profile
                  </button>
                </div>
              </div>
            </section>
          ) : null}

        </div>
      </div>
    </section>
  )
}

function PaymentResultPage({
  result,
  onViewOrders,
  onRetryPayment,
  onSwitchToCod,
  onContinueShopping,
}) {
  if (!result) return null

  const isSuccess = result.status === 'success'
  const primaryOrder = result.orders?.[0] ?? null

  return (
    <section className="utility-shell utility-shell--payment-result">
      <div className="utility-shell__inner utility-shell__inner--payment-result">
        <div className={`payment-result-card${isSuccess ? ' is-success' : ' is-failed'}`}>
          <div className="payment-result-card__badge">{isSuccess ? 'Payment Complete' : 'Payment Incomplete'}</div>
          <h1>{result.title}</h1>
          <p>{result.message}</p>

          <div className="payment-result-card__summary">
            {primaryOrder?.id ? (
              <article>
                <span>Order ID</span>
                <strong>{primaryOrder.id}</strong>
              </article>
            ) : null}
            {primaryOrder?.transactionId ? (
              <article>
                <span>Transaction</span>
                <strong>{primaryOrder.transactionId}</strong>
              </article>
            ) : null}
            {result.paymentMethod ? (
              <article>
                <span>Payment Method</span>
                <strong>{result.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay'}</strong>
              </article>
            ) : null}
            {result.pricing?.total ? (
              <article>
                <span>Total Paid</span>
                <strong>{formatAmount(result.pricing.total, 2)}</strong>
              </article>
            ) : null}
            {result.pricing?.codCharge ? (
              <article>
                <span>COD Charges</span>
                <strong>{formatAmount(result.pricing.codCharge, 2)}</strong>
              </article>
            ) : null}
          </div>

          <div className="payment-result-card__actions">
            {isSuccess ? (
              <>
                <button type="button" className="is-primary" onClick={onViewOrders}>
                  View My Orders
                </button>
                <button type="button" onClick={onContinueShopping}>
                  Continue Shopping
                </button>
              </>
            ) : (
              <>
                <button type="button" className="is-primary" onClick={onRetryPayment}>
                  Retry Payment
                </button>
                <button type="button" onClick={onSwitchToCod}>
                  Switch To COD
                </button>
                <button type="button" onClick={onContinueShopping}>
                  Continue Shopping
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function App() {
  const [activeView, setActiveView] = useState('home')
  const [selectedProductId, setSelectedProductId] = useState('marauders-map-solar')
  const [activeDepartment, setActiveDepartment] = useState('men')
  const [activeFilter, setActiveFilter] = useState('Trending')
  const [activeHero, setActiveHero] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [drawerPage, setDrawerPage] = useState(0)
  const [expandedSections, setExpandedSections] = useState(createExpandedSections('men'))
  const [wishlistIds, setWishlistIds] = useState([])
  const [cartItems, setCartItems] = useState([])
  const [checkoutStep, setCheckoutStep] = useState('bag')
  const [selectedCartKeys, setSelectedCartKeys] = useState([])
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [addressForm, setAddressForm] = useState(initialAddressForm)
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false)
  const [membershipAdded, setMembershipAdded] = useState(false)
  const [sidebarPanels, setSidebarPanels] = useState({
    coupon: false,
    voucher: false,
    points: false,
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [paymentConfig, setPaymentConfig] = useState(initialPaymentConfig)
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false)
  const [registeredUsers, setRegisteredUsers] = useState(() =>
    readStoredJson(AUTH_USERS_STORAGE_KEY, []).map((user) => ({
      ...user,
      role: user.role ?? 'customer',
    })),
  )
  const [currentUser, setCurrentUser] = useState(() => normalizeStoredUser(readStoredJson(AUTH_SESSION_STORAGE_KEY, null)))
  const [authMode, setAuthMode] = useState('login')
  const [authReturnView, setAuthReturnView] = useState('home')
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [isGoogleLoginPending, setIsGoogleLoginPending] = useState(false)
  const [loginOtpState, setLoginOtpState] = useState(initialLoginOtpState)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeCustomerSection, setActiveCustomerSection] = useState('orders')
  const [activeSupportCategory, setActiveSupportCategory] = useState('shipping-tracking')
  const [customerProfileForm, setCustomerProfileForm] = useState(initialCustomerProfileForm)
  const [profileMessage, setProfileMessage] = useState('')
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false)
  const [activeAdminSection, setActiveAdminSection] = useState('overview')
  const [adminProducts, setAdminProducts] = useState(() =>
    readStoredJson(ADMIN_PRODUCTS_STORAGE_KEY, seedAdminProducts).map((product, index) =>
      normalizeAdminDashboardProduct(product, index),
    ),
  )
  const [adminHomeBanners, setAdminHomeBanners] = useState(() =>
    readStoredJson(ADMIN_HOME_BANNERS_STORAGE_KEY, []).map((banner, index) => normalizeAdminHomeBanner(banner, index)),
  )
  const [adminOrders, setAdminOrders] = useState(() =>
    readStoredJson(ADMIN_ORDERS_STORAGE_KEY, seedAdminOrders).map(normalizeOrderRecord),
  )
  const [selectedAdminProductId, setSelectedAdminProductId] = useState(seedAdminProducts[0]?.id ?? null)
  const [selectedOrderId, setSelectedOrderId] = useState(seedAdminOrders[0]?.id ?? null)
  const [selectedCustomerId, setSelectedCustomerId] = useState(seedAdminCustomers[0]?.id ?? null)
  const [trackingOrderId, setTrackingOrderId] = useState('')
  const [orderActionState, setOrderActionState] = useState({
    orderId: '',
    type: '',
  })
  const [productForm, setProductForm] = useState(initialAdminProductForm)
  const [productFormMessage, setProductFormMessage] = useState('')
  const [bannerFormMessage, setBannerFormMessage] = useState('')
  const [editingAdminProductId, setEditingAdminProductId] = useState(null)
  const [stockDrafts, setStockDrafts] = useState(() =>
    Object.fromEntries(seedAdminProducts.map((product) => [product.id, String(product.quantity)])),
  )
  const [sizeStockDrafts, setSizeStockDrafts] = useState(() =>
    Object.fromEntries(seedAdminProducts.map((product) => [product.id, buildSizeDraftMap(product)])),
  )
  const [backendMode, setBackendMode] = useState('loading')
  const [paymentResult, setPaymentResult] = useState(null)
  const [activeCollection, setActiveCollection] = useState(null)
  const [productBackView, setProductBackView] = useState('home')

  const heroSlides = buildHeroSlidesForDepartment(activeDepartment, adminHomeBanners)
  const activeSlide = heroSlides[activeHero]
  const featuredPages = chunkItems(drawerCatalog[activeDepartment].featured, 5)
  const visibleFeaturedPage = featuredPages[drawerPage] ?? featuredPages[0] ?? []
  const searchValue = searchQuery.trim().toLowerCase()
  const isBackendReady = backendMode === 'ready'
  const normalizedLoginEmail = loginForm.email.trim().toLowerCase()
  const isOtpRequestedForCurrentEmail = Boolean(loginOtpState.requestedEmail) && loginOtpState.requestedEmail === normalizedLoginEmail
  const isOtpStepVisible = isOtpRequestedForCurrentEmail && isBackendReady && normalizedLoginEmail !== DEFAULT_ADMIN_EMAIL
  const adminProductMap = new Map(adminProducts.map((product) => [product.id, product]))
  const storefrontProducts = productCatalog.map((product) => {
    const override = adminProductMap.get(product.id)
    const nextGallery =
      override?.images?.length
        ? override.images.map((image, index) => ({
            image,
            alt: `${override.title ?? product.title} image ${index + 1}`,
            overlays: [],
          }))
        : product.gallery

    return {
      ...product,
      title: override?.title ?? product.title,
      category: override?.category ?? product.category,
      price: Number(override?.price ?? product.price),
      badge: override?.badge ?? product.badge,
      teaser: override?.description ?? product.teaser,
      gallery: nextGallery,
      sizeChartImage: String(override?.sizeChartImage ?? product.sizeChartImage ?? ''),
      sizes: inferProductSizes({ id: product.id, category: override?.category ?? product.category, sizes: override?.sizes ?? product.sizes }),
      sizeInventory: normalizeSizeInventory({
        id: product.id,
        category: override?.category ?? product.category,
        sizes: override?.sizes ?? product.sizes,
        sizeInventory: override?.sizeInventory,
        quantity: Number(override?.quantity ?? product.quantity ?? 0),
      }),
      defaultSize: getFirstAvailableSize({
        id: product.id,
        category: override?.category ?? product.category,
        sizes: override?.sizes ?? product.sizes,
        sizeInventory: override?.sizeInventory,
        quantity: Number(override?.quantity ?? product.quantity ?? 0),
      }),
      quantity: Number(override?.quantity ?? product.quantity ?? 0),
      stockStatus: override?.stockStatus ?? getStockStatus(override?.quantity ?? product.quantity ?? 0),
      description: override?.description
        ? [
            {
              heading: 'Product Description',
              copy: override.description,
            },
          ]
        : product.description,
    }
  })
  const uploadedAdminProducts = adminProducts
    .filter((product) => !adminProductMap.has(product.id) || String(product.id).startsWith('admin-product-'))
    .filter((product) => String(product.id).startsWith('admin-product-') && (product.images ?? []).length)
    .sort((left, right) => Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0))
  const uploadedCustomerProducts = buildCustomerProductsFromAdminUploads(uploadedAdminProducts)
  const productBrowseHintMap = buildBrowseHintMap()
  const customerBrowseProducts = [...uploadedCustomerProducts, ...storefrontProducts].map((product) => ({
    ...product,
    browseHints: productBrowseHintMap.get(product.id) ?? [],
  }))
  const storeProductMap = new Map([...storefrontProducts, ...uploadedCustomerProducts].map((product) => [product.id, product]))
  const getStoreProductById = (productId) => storeProductMap.get(productId) ?? null
  const uploadedArrivalCards = uploadedCustomerProducts
    .filter((product) => product.department === activeDepartment)
    .map((product) => ({
      id: `upload-arrival-${product.id}`,
      name: product.title,
      subtitle: product.category,
      price: formatAmount(product.price),
      badge: product.badge ?? 'New Upload',
      tag: formatLabel(product.department),
      detailId: product.id,
      image: product.gallery[0]?.image ?? '',
      rotatingImages: product.gallery.map((image) => image.image),
      stockStatus: product.stockStatus,
      quantity: product.quantity,
    }))
  const wishlistProducts = wishlistIds.map(getStoreProductById).filter(Boolean)
  const cartProducts = cartItems
    .map((item) => ({
      ...item,
      key: createCartItemKey(item.productId, item.size),
      product: getStoreProductById(item.productId),
    }))
    .filter((item) => item.product)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0)
  const selectedCartProducts = cartProducts.filter((item) => selectedCartKeys.includes(item.key))
  const selectedLineCount = selectedCartProducts.length
  const selectedCheckoutPaymentMethod =
    selectedPaymentMethod === 'cod' ? 'cod' : selectedPaymentMethod === 'razorpay' ? 'razorpay' : ''
  const checkoutLineItems = selectedCartProducts.map(({ product, quantity, size }) => ({
    productId: product.id,
    size,
    quantity,
    unitPrice: Number(product.price),
  }))
  const checkoutPricing = calculateCheckoutPricing({
    lineItems: checkoutLineItems,
    paymentMethod: selectedCheckoutPaymentMethod,
    giftWrapEnabled: selectedLineCount > 0 && giftWrapEnabled,
  })
  const checkoutPricingByKey = new Map(checkoutPricing.items.map((item) => [item.key, item]))
  const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId) ?? null
  const defaultCustomerAddress = selectedAddress ?? savedAddresses.find((address) => address.isDefault) ?? savedAddresses[0] ?? null
  const recommendationIds = [...new Set(cartProducts.flatMap(({ product }) => product.recommendedIds ?? []))]
    .filter((productId) => !cartProducts.some(({ product }) => product.id === productId))
    .slice(0, 3)
  const recommendations = recommendationIds.map(getStoreProductById).filter(Boolean)
  const { isListening, startListening, stopListening } = useVoiceSearch({
    onTranscript: setSearchQuery,
    onUnsupported: () => window.alert('Voice search is not supported in this browser.'),
    onError: (error) => {
      if (error === 'busy') return
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        window.alert('Microphone permission denied. Allow microphone access and try again.')
      }
    },
  })
  const todayDateKey = getDateKey()
  const currentMonthKey = todayDateKey.slice(0, 7)
  const selectedAdminProduct = adminProducts.find((product) => product.id === selectedAdminProductId) ?? adminProducts[0] ?? null
  const selectedAdminOrder = adminOrders.find((order) => order.id === selectedOrderId) ?? adminOrders[0] ?? null
  const replaceOrderInState = (nextOrder) => {
    const normalizedOrder = normalizeOrderRecord(nextOrder)
    setAdminOrders((current) => current.map((entry) => (entry.id === normalizedOrder.id ? normalizedOrder : entry)))
  }
  const adminCustomerMap = new Map()

  seedAdminCustomers.forEach((customer) => {
    adminCustomerMap.set(customer.email, {
      ...customer,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderOn: customer.joinedOn,
    })
  })

  registeredUsers
    .filter((user) => (user.role ?? 'customer') !== 'admin' && user.email !== DEFAULT_ADMIN_EMAIL)
    .forEach((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      const existingCustomer = adminCustomerMap.get(user.email)
      adminCustomerMap.set(user.email, {
        id: existingCustomer?.id ?? user.id,
        name: fullName,
        email: user.email,
        phone: user.phone,
        city: existingCustomer?.city ?? '',
        joinedOn: existingCustomer?.joinedOn ?? todayDateKey,
        totalOrders: existingCustomer?.totalOrders ?? 0,
        totalSpent: existingCustomer?.totalSpent ?? 0,
        lastOrderOn: existingCustomer?.lastOrderOn ?? existingCustomer?.joinedOn ?? todayDateKey,
      })
    })

  adminOrders.forEach((order) => {
    const existingCustomer = adminCustomerMap.get(order.customerEmail)
    const nextCustomer = {
      id: existingCustomer?.id ?? order.customerId ?? `customer-${order.customerEmail}`,
      name: existingCustomer?.name ?? order.customerName,
      email: order.customerEmail,
      phone: existingCustomer?.phone ?? '',
      city: existingCustomer?.city ?? '',
      joinedOn: existingCustomer?.joinedOn ?? order.createdAt,
      totalOrders: (existingCustomer?.totalOrders ?? 0) + 1,
      totalSpent: (existingCustomer?.totalSpent ?? 0) + (order.status === 'cancelled' ? 0 : order.amount),
      lastOrderOn:
        !existingCustomer?.lastOrderOn || order.createdAt > existingCustomer.lastOrderOn
          ? order.createdAt
          : existingCustomer.lastOrderOn,
    }

    adminCustomerMap.set(order.customerEmail, nextCustomer)
  })

  const adminCustomers = Array.from(adminCustomerMap.values()).sort((left, right) =>
    right.lastOrderOn.localeCompare(left.lastOrderOn),
  )
  const selectedAdminCustomer =
    adminCustomers.find((customer) => customer.id === selectedCustomerId) ?? adminCustomers[0] ?? null
  const paymentHistory = adminOrders.map((order) => ({
    orderId: order.id,
    transactionId: order.transactionId,
    customerName: order.customerName,
    paymentStatus: order.paymentStatus,
    amount: order.amount,
    createdAt: order.createdAt,
  }))
  const paidOrders = adminOrders.filter((order) => order.paymentStatus === 'paid')
  const earnings = {
    total: paidOrders.reduce((sum, order) => sum + order.amount, 0),
    today: paidOrders
      .filter((order) => order.createdAt === todayDateKey)
      .reduce((sum, order) => sum + order.amount, 0),
    month: paidOrders
      .filter((order) => order.createdAt.startsWith(currentMonthKey))
      .reduce((sum, order) => sum + order.amount, 0),
    revenue: adminOrders.reduce((sum, order) => sum + order.amount, 0),
  }
  const stats = {
    products: adminProducts.length,
    orders: adminOrders.length,
    customers: adminCustomers.length,
    sales: adminOrders.filter((order) => order.status !== 'cancelled').reduce((sum, order) => sum + order.quantity, 0),
  }
  const inventorySummary = {
    tracked: adminProducts.length,
    inStock: adminProducts.filter((product) => product.stockStatus === 'in-stock').length,
    outOfStock: adminProducts.filter((product) => product.stockStatus === 'out-of-stock').length,
    available: adminProducts.reduce((sum, product) => sum + Number(product.quantity), 0),
  }
  const orderSummary = {
    total: adminOrders.length,
    pending: adminOrders.filter((order) => order.status === 'pending').length,
    completed: adminOrders.filter((order) => order.status === 'completed').length,
    uncompleted: adminOrders.filter((order) => order.status === 'cancelled').length,
  }
  const paymentSummary = {
    total: paymentHistory.length,
    paid: paymentHistory.filter((payment) => payment.paymentStatus === 'paid').length,
    pending: paymentHistory.filter((payment) => payment.paymentStatus === 'pending').length,
    refunded: paymentHistory.filter((payment) => payment.paymentStatus === 'refunded').length,
  }
  const customerOrders =
    currentUser?.role === 'customer'
      ? [...adminOrders]
          .filter((order) => order.customerEmail === currentUser.email || order.customerId === currentUser.id)
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      : []
  const defaultCustomerAddressText = defaultCustomerAddress
    ? `${defaultCustomerAddress.flat}, ${defaultCustomerAddress.street}${
        defaultCustomerAddress.landmark ? `, ${defaultCustomerAddress.landmark}` : ''
      }\n${defaultCustomerAddress.city}, ${defaultCustomerAddress.state} - ${defaultCustomerAddress.pincode}\n${
        defaultCustomerAddress.country
      }`
    : 'No default address saved yet. Add one from this page to speed up checkout.'

  useEffect(() => {
    let isCancelled = false

    const loadBackendState = async () => {
      try {
        const payload = await bootstrapStore()
        if (isCancelled) return

        setRegisteredUsers(payload.users.map((user) => normalizeStoredUser(user)))
        setAdminProducts(payload.products.map((product, index) => normalizeAdminDashboardProduct(product, index)))
        setAdminHomeBanners((payload.banners ?? []).map((banner, index) => normalizeAdminHomeBanner(banner, index)))
        setAdminOrders(payload.orders.map(normalizeOrderRecord))
        setPaymentConfig({
          ...initialPaymentConfig,
          ...(payload.payments ?? {}),
        })

        if (currentUser?.role === 'customer') {
          const latestUser =
            payload.users.find((user) => user.id === currentUser.id) ??
            payload.users.find((user) => user.email === currentUser.email)

          if (latestUser) {
            setCurrentUser(normalizeStoredUser(latestUser))
            setSavedAddresses(latestUser.addresses ?? [])
            const defaultAddress = (latestUser.addresses ?? []).find((address) => address.isDefault)
            setSelectedAddressId(defaultAddress?.id ?? latestUser.addresses?.[0]?.id ?? null)
          }
        }

        setBackendMode('ready')
      } catch (error) {
        console.error('Backend bootstrap failed, using offline local state.', error)
        if (!isCancelled) setBackendMode('offline')
      }
    }

    loadBackendState()

    return () => {
      isCancelled = true
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.role])

  useEffect(() => {
    const isRazorpayAvailable = isBackendReady && paymentConfig.enabled && Boolean(paymentConfig.keyId)

    if (!isRazorpayAvailable && selectedPaymentMethod === 'razorpay') {
      setSelectedPaymentMethod('')
    }
  }, [isBackendReady, paymentConfig.enabled, paymentConfig.keyId, selectedPaymentMethod])

  useEffect(() => {
    if (!heroSlides.length) return
    if (activeHero < heroSlides.length) return
    setActiveHero(0)
  }, [activeHero, heroSlides.length])

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setActiveHero((current) => (current + 1) % heroSlides.length)
    }, 5000)

    return () => window.clearInterval(timerId)
  }, [heroSlides.length])

  useEffect(() => {
    document.body.classList.toggle('drawer-open', isMenuOpen)
    return () => document.body.classList.remove('drawer-open')
  }, [isMenuOpen])

  useEffect(() => {
    if (isMenuOpen) setIsMobileSearchOpen(false)
  }, [isMenuOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (backendMode === 'ready') return
    window.localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(registeredUsers))
  }, [registeredUsers, backendMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (backendMode === 'ready') return
    window.localStorage.setItem(ADMIN_PRODUCTS_STORAGE_KEY, JSON.stringify(adminProducts))
  }, [adminProducts, backendMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (backendMode === 'ready') return
    window.localStorage.setItem(ADMIN_HOME_BANNERS_STORAGE_KEY, JSON.stringify(adminHomeBanners))
  }, [adminHomeBanners, backendMode])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (backendMode === 'ready') return
    window.localStorage.setItem(ADMIN_ORDERS_STORAGE_KEY, JSON.stringify(adminOrders))
  }, [adminOrders, backendMode])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (currentUser) {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(currentUser))
      return
    }

    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  }, [currentUser])

  useEffect(() => {
    if (currentUser?.role !== 'customer') return

    setCustomerProfileForm({
      firstName: currentUser.firstName ?? '',
      lastName: currentUser.lastName ?? '',
      email: currentUser.email ?? '',
      birthdate: currentUser.birthdate ?? '',
      phone: currentUser.phone ?? '',
      gender: currentUser.gender ?? 'male',
      newPassword: '',
      confirmPassword: '',
    })
    setProfileMessage('')
    setIsPasswordEditorOpen(false)
    setSavedAddresses(currentUser.addresses ?? [])
    setSelectedAddressId((currentUser.addresses ?? []).find((address) => address.isDefault)?.id ?? currentUser.addresses?.[0]?.id ?? null)
  }, [currentUser])

  useEffect(() => {
    if (!adminProducts.length) {
      if (selectedAdminProductId !== null) setSelectedAdminProductId(null)
      return
    }

    if (!adminProducts.some((product) => product.id === selectedAdminProductId)) {
      setSelectedAdminProductId(adminProducts[0].id)
    }
  }, [adminProducts, selectedAdminProductId])

  useEffect(() => {
    setStockDrafts((current) => {
      const nextDrafts = {}
      let hasChanges = false

      adminProducts.forEach((product) => {
        const nextValue = current[product.id] ?? String(product.quantity)
        nextDrafts[product.id] = nextValue
        if (current[product.id] !== nextValue) hasChanges = true
      })

      if (Object.keys(current).length !== Object.keys(nextDrafts).length) hasChanges = true

      return hasChanges ? nextDrafts : current
    })
  }, [adminProducts])

  useEffect(() => {
    if (!adminOrders.length) {
      if (selectedOrderId !== null) setSelectedOrderId(null)
      return
    }

    if (!adminOrders.some((order) => order.id === selectedOrderId)) {
      setSelectedOrderId(adminOrders[0].id)
    }
  }, [adminOrders, selectedOrderId])

  useEffect(() => {
    if (!adminCustomers.length) {
      if (selectedCustomerId !== null) setSelectedCustomerId(null)
      return
    }

    if (!adminCustomers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(adminCustomers[0].id)
    }
  }, [adminCustomers, selectedCustomerId])

  const matchesSearch = (item) => {
    if (!searchValue) return true
    return [item.name, item.subtitle, item.label, item.badge, item.tag]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(searchValue))
  }

  const withStockMeta = (item) => {
    const product = item.detailId ? getStoreProductById(item.detailId) : null
    if (!product) return item

    return {
      ...item,
      price: formatAmount(product.price),
      stockStatus: product.stockStatus,
      quantity: product.quantity,
      rotatingImages: item.rotatingImages ?? product.gallery?.map((image) => image.image) ?? [],
      image: item.image ?? product.gallery?.[0]?.image,
    }
  }

  const toProductCardData = (product) => ({
    id: `browse-${product.id}`,
    name: product.title,
    subtitle: product.category,
    price: formatAmount(product.price),
    badge: product.badge ?? formatLabel(product.department),
    tag: product.category,
    detailId: product.id,
    image: product.gallery?.[0]?.image ?? '',
    rotatingImages: product.gallery?.map((image) => image.image).filter(Boolean) ?? [],
    stockStatus: product.stockStatus,
    quantity: product.quantity,
  })

  const visibleArrivals = [...uploadedArrivalCards, ...newArrivals]
    .map(withStockMeta)
    .filter(matchesSearch)
    .slice(0, 4)
  const visibleCategories = (departmentCategories[activeDepartment] ?? []).filter(matchesSearch)
  const visibleTrending = (
    activeFilter === 'Trending' ? trendingProducts : trendingProducts.filter((item) => item.tag === activeFilter)
  )
    .map(withStockMeta)
    .filter(matchesSearch)
  const visibleAllProducts = customerBrowseProducts
    .filter((product) => product.department === activeDepartment)
    .map(toProductCardData)
    .filter(matchesSearch)

  const buildCollectionConfig = (selection) => {
    const normalizedLabel = normalizeCollectionTerm(selection.label)
    const normalizedFilter = normalizeCollectionTerm(selection.filter)

    if (selection.heroId || (!selection.label && !selection.filter) || nonCollectionSelectionLabels.has(normalizedLabel)) {
      return null
    }

    const department = resolveCollectionDepartment(selection, activeDepartment)
    const showAllInDepartment = broadCollectionTerms.has(normalizedLabel) || broadCollectionTerms.has(normalizedFilter)

    return {
      title: selection.label ?? selection.filter ?? formatLabel(department),
      department,
      showAllInDepartment,
      showSidebar: selection.source !== 'home-grid',
      defaultBrowseKey: showAllInDepartment ? '' : selection.filter ?? selection.label ?? '',
    }
  }

  const collectionDepartmentProducts = activeCollection
    ? customerBrowseProducts
        .filter((product) => (activeCollection.department ? product.department === activeCollection.department : true))
        .sort((left, right) => Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0))
    : []

  const selectDepartment = (departmentId) => {
    setActiveDepartment(departmentId)
    setActiveHero(0)
    setDrawerPage(0)
    setExpandedSections(createExpandedSections(departmentId))
    if (activeView !== 'home') setActiveView('home')
  }

  const openCollectionPage = (selection) => {
    const nextCollection = buildCollectionConfig(selection)

    if (!nextCollection) return false

    setSearchQuery('')
    setActiveDepartment(nextCollection.department)
    setActiveHero(0)
    setDrawerPage(0)
    setExpandedSections(createExpandedSections(nextCollection.department))

    if (selection.filter && trendingFilters.includes(selection.filter)) {
      setActiveFilter(selection.filter)
    }

    setActiveCollection(nextCollection)
    setActiveView('collection')
    setIsMenuOpen(false)

    return true
  }

  const openProductPage = (productId) => {
    setProductBackView((current) => (activeView === 'product' ? current : activeView === 'collection' ? 'collection' : 'home'))
    setSelectedProductId(productId)
    setActiveView('product')
    setIsMenuOpen(false)
  }

  const openWishlistPage = () => {
    setActiveView('wishlist')
    setIsMenuOpen(false)
  }

  const openCartPage = () => {
    setActiveView('cart')
    setCheckoutStep('bag')
    setIsMenuOpen(false)
  }

  const openAdminDashboard = (section = 'overview') => {
    setActiveAdminSection(section)
    setActiveView('admin')
    setIsMenuOpen(false)
  }

  const openProfilePage = (section = 'orders') => {
    setActiveCustomerSection(section)

    if (!currentUser) {
      openAuthPage('login', 'profile')
      return
    }

    if (currentUser.role === 'admin') {
      openAdminDashboard()
      return
    }

    setActiveView('profile')
    setIsMenuOpen(false)
  }

  const openSupportPage = (category = 'shipping-tracking') => {
    setActiveSupportCategory(category)
    setActiveView('support')
    setIsMenuOpen(false)
  }

  const openTrackingPage = () => {
    if (currentUser?.role === 'admin') {
      openAdminDashboard('orders')
      return
    }

    openProfilePage('orders')
  }

  const openAccountPanel = () => {
    if (currentUser?.role === 'admin') {
      openAdminDashboard()
      return
    }

    if (currentUser?.role === 'customer') {
      openProfilePage()
      return
    }

    openAuthPage('login')
  }

  const clearAuthFeedback = () => {
    setAuthError('')
    setAuthMessage('')
  }

  const resetLoginOtpState = () => {
    setLoginOtpState(initialLoginOtpState)
  }

  const resetLoginUi = () => {
    setLoginForm(initialLoginForm)
    setShowLoginPassword(false)
    resetLoginOtpState()
  }

  const returnToLoginCredentials = () => {
    clearAuthFeedback()
    resetLoginOtpState()
    setLoginForm((current) => ({ ...current, otp: '' }))
  }

  const completeLogin = (user) => {
    const normalizedUser = normalizeStoredUser(user)

    setCurrentUser(normalizedUser)
    resetLoginUi()
    setAuthMessage('')
    setAuthError('')

    if (normalizedUser.role === 'admin') {
      openAdminDashboard()
      return
    }

    setActiveView(authReturnView && authReturnView !== 'auth' ? authReturnView : 'home')
  }

  const openAuthPage = (mode = 'login', returnView = activeView === 'auth' ? authReturnView : activeView) => {
    setAuthMode(mode)
    setAuthReturnView(returnView === 'auth' || returnView === 'admin' ? 'home' : returnView)
    clearAuthFeedback()
    if (mode === 'login') {
      setShowLoginPassword(false)
      resetLoginOtpState()
      setLoginForm((current) => ({ ...current, password: '', otp: '' }))
    }
    setActiveView('auth')
    setIsMenuOpen(false)
  }

  const returnHome = () => {
    setPaymentResult(null)
    setActiveCollection(null)
    setProductBackView('home')
    setActiveView('home')
    setIsMenuOpen(false)
  }

  const returnFromProductPage = () => {
    if (productBackView === 'collection' && activeCollection) {
      setActiveView('collection')
      setIsMenuOpen(false)
      return
    }

    returnHome()
  }

  const openPaymentSuccessPage = ({ orders = [], pricing = checkoutPricing, paymentMethod = selectedCheckoutPaymentMethod, message }) => {
    setPaymentResult({
      status: 'success',
      title: paymentMethod === 'cod' ? 'Order placed successfully' : 'Payment successful',
      message: message ?? 'Your order has been confirmed and is now being prepared.',
      orders,
      pricing,
      paymentMethod,
    })
    setActiveView('payment-success')
    setIsMenuOpen(false)
  }

  const openPaymentFailurePage = ({ message, paymentMethod = selectedCheckoutPaymentMethod }) => {
    setPaymentResult({
      status: 'failed',
      title: 'Payment could not be completed',
      message: message ?? 'We could not complete your payment. You can retry or switch to Cash on Delivery.',
      orders: [],
      pricing: checkoutPricing,
      paymentMethod,
    })
    setActiveView('payment-failed')
    setIsMenuOpen(false)
  }

  const retryRazorpayPayment = () => {
    setPaymentResult(null)
    setSelectedPaymentMethod('razorpay')
    setActiveView('cart')
    setCheckoutStep('payment')
    setIsMenuOpen(false)
  }

  const switchPaymentFailureToCod = () => {
    setPaymentResult(null)
    setSelectedPaymentMethod('cod')
    setActiveView('cart')
    setCheckoutStep('payment')
    setIsMenuOpen(false)
  }

  const updateLoginField = (field, value) => {
    if (field === 'email' || field === 'password') {
      const normalizedEmail = String(value ?? '').trim().toLowerCase()

      if (
        loginOtpState.requestedEmail &&
        (field === 'password' || loginOtpState.requestedEmail !== normalizedEmail)
      ) {
        resetLoginOtpState()
        clearAuthFeedback()
        setLoginForm((current) => ({
          ...current,
          [field]: value,
          otp: '',
        }))
        return
      }
    }

    setLoginForm((current) => ({ ...current, [field]: value }))
  }

  const updateRegisterField = (field, value) => {
    setRegisterForm((current) => ({ ...current, [field]: value }))
  }

  const updateCustomerProfileField = (field, value) => {
    setCustomerProfileForm((current) => ({ ...current, [field]: value }))
  }

  const switchAuthMode = (mode) => {
    setAuthMode(mode)
    clearAuthFeedback()

    if (mode === 'login') {
      setShowLoginPassword(false)
      resetLoginOtpState()
      setLoginForm((current) => ({ ...current, password: '', otp: '' }))
    }
  }

  const updateProductFormField = (field, value) => {
    setProductForm((current) => {
      if (field === 'category') {
        const nextSizes = inferProductSizes({ category: value })
        const nextQuantity = Math.max(0, Number(current.quantity) || 0)
        const currentInventory = current.sizeInventory ?? {}
        const hasExistingSizes = nextSizes.some((size) => currentInventory[size] !== undefined)
        const nextSizeInventory = hasExistingSizes
          ? normalizeSizeInventory({ category: value, sizes: nextSizes, sizeInventory: currentInventory, quantity: nextQuantity })
          : distributeQuantityAcrossSizes(nextQuantity, nextSizes)

        return {
          ...current,
          category: value,
          sizes: nextSizes,
          sizeInventory: nextSizeInventory,
          quantity: String(sumSizeInventory(nextSizeInventory, nextSizes)),
        }
      }

      if (field === 'quantity') {
        const sanitizedValue = String(value).replace(/\D/g, '')
        const nextQuantity = Math.max(0, Number(sanitizedValue) || 0)
        const nextSizes = current.sizes.length ? current.sizes : inferProductSizes({ category: current.category })
        const nextSizeInventory = distributeQuantityAcrossSizes(nextQuantity, nextSizes)

        return {
          ...current,
          quantity: String(nextQuantity),
          sizes: nextSizes,
          sizeInventory: nextSizeInventory,
        }
      }

      return { ...current, [field]: value }
    })
  }

  const updateProductSizeInventory = (size, value) => {
    const sanitizedValue = String(value).replace(/\D/g, '')

    setProductForm((current) => {
      const nextSizes = current.sizes.length ? current.sizes : inferProductSizes({ category: current.category })
      const nextSizeInventory = {
        ...(current.sizeInventory ?? {}),
        [size]: Math.max(0, Number(sanitizedValue) || 0),
      }
      const nextQuantity = sumSizeInventory(nextSizeInventory, nextSizes)

      return {
        ...current,
        sizes: nextSizes,
        sizeInventory: nextSizeInventory,
        quantity: String(nextQuantity),
      }
    })
  }

  const startProductEdit = (productId) => {
    const product = adminProducts.find((item) => item.id === productId)
    if (!product) return

    setEditingAdminProductId(productId)
    setSelectedAdminProductId(productId)
    setProductForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      category: product.category,
      images: product.images.slice(0, MAX_ADMIN_PRODUCT_IMAGES),
      sizeChartImage: product.sizeChartImage ?? '',
      sizes: product.sizes,
      sizeInventory: { ...(product.sizeInventory ?? {}) },
      quantity: String(product.quantity),
    })
    setProductFormMessage('Editing selected product. Update the fields and save changes.')
  }

  const resetProductComposer = () => {
    setEditingAdminProductId(null)
    setProductForm(initialAdminProductForm)
    setProductFormMessage('')
  }

  const handleProductImagesUpload = async (filesList) => {
    const files = Array.from(filesList ?? [])
    if (!files.length) return

    const currentImages = productForm.images ?? []
    const remainingSlots = Math.max(MAX_ADMIN_PRODUCT_IMAGES - currentImages.length, 0)

    if (!remainingSlots) {
      setProductFormMessage(`You can upload up to ${MAX_ADMIN_PRODUCT_IMAGES} images only.`)
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/')).slice(0, remainingSlots)

    if (!imageFiles.length) {
      setProductFormMessage('Please select valid image files.')
      return
    }

    const uploadedImages = (await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file).catch(() => '')))).filter(Boolean)

    if (!uploadedImages.length) {
      setProductFormMessage('Images could not be uploaded. Please try again.')
      return
    }

    setProductForm((current) => ({
      ...current,
      images: [...(current.images ?? []), ...uploadedImages].slice(0, MAX_ADMIN_PRODUCT_IMAGES),
    }))

    setProductFormMessage(
      files.length > remainingSlots
        ? `Only ${MAX_ADMIN_PRODUCT_IMAGES} images can be uploaded per product.`
        : 'Product images uploaded successfully.',
    )
  }

  const removeProductImage = (indexToRemove) => {
    setProductForm((current) => ({
      ...current,
      images: (current.images ?? []).filter((_, index) => index !== indexToRemove),
    }))
  }

  const handleProductSizeChartUpload = async (filesList) => {
    const file = Array.from(filesList ?? []).find((entry) => entry.type.startsWith('image/'))

    if (!file) {
      setProductFormMessage('Please select a valid size chart image.')
      return
    }

    const uploadedImage = await readFileAsDataUrl(file).catch(() => '')

    if (!uploadedImage) {
      setProductFormMessage('Size chart image could not be uploaded. Please try again.')
      return
    }

    setProductForm((current) => ({
      ...current,
      sizeChartImage: uploadedImage,
    }))
    setProductFormMessage('Product size chart uploaded successfully.')
  }

  const removeProductSizeChart = () => {
    setProductForm((current) => ({
      ...current,
      sizeChartImage: '',
    }))
    setProductFormMessage('Product size chart removed.')
  }

  const syncDepartmentHomeBanners = async (department, nextDepartmentBanners, successMessage) => {
    const normalizedDepartmentBanners = nextDepartmentBanners
      .filter((banner) => banner.image)
      .slice(0, MAX_HOME_BANNERS)
      .map((banner, index) => normalizeAdminHomeBanner({ ...banner, department }, index))

    if (isBackendReady) {
      try {
        const { banners } = await replaceAdminDepartmentBanners(department, normalizedDepartmentBanners)
        setAdminHomeBanners((banners ?? []).map((banner, index) => normalizeAdminHomeBanner(banner, index)))
        setBannerFormMessage(successMessage)
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to update home banners right now.')
      }
      return
    }

    setAdminHomeBanners((current) => [
      ...current.filter((banner) => banner.department !== department),
      ...normalizedDepartmentBanners,
    ])
    setBannerFormMessage(successMessage)
  }

  const handleHomeBannerUpload = async (department, filesList) => {
    const files = Array.from(filesList ?? [])
    if (!files.length) return

    const currentDepartmentBanners = adminHomeBanners.filter((banner) => banner.department === department)
    const remainingSlots = Math.max(MAX_HOME_BANNERS - currentDepartmentBanners.length, 0)

    if (!remainingSlots) {
      setBannerFormMessage(`You can upload up to ${MAX_HOME_BANNERS} home banners only.`)
      return
    }

    const imageFiles = files.filter((file) => file.type.startsWith('image/')).slice(0, remainingSlots)

    if (!imageFiles.length) {
      setBannerFormMessage('Please select valid banner image files.')
      return
    }

    const uploadedImages = (await Promise.all(imageFiles.map((file) => readFileAsDataUrl(file).catch(() => '')))).filter(Boolean)

    if (!uploadedImages.length) {
      setBannerFormMessage('Banner images could not be uploaded. Please try again.')
      return
    }

    const nextDepartmentBanners = [
      ...currentDepartmentBanners,
      ...uploadedImages.map((image, index) =>
        normalizeAdminHomeBanner({
          id: `banner-${department}-${Date.now()}-${index}`,
          department,
          image,
          createdAt: Date.now() + index,
        }),
      ),
    ].slice(0, MAX_HOME_BANNERS)

    await syncDepartmentHomeBanners(
      department,
      nextDepartmentBanners,
      files.length > remainingSlots
        ? `Only ${MAX_HOME_BANNERS} banners can be uploaded for ${formatLabel(department)}.`
        : `${formatLabel(department)} home banners updated successfully.`,
    )
  }

  const removeHomeBanner = async (department, bannerId) => {
    const currentDepartmentBanners = adminHomeBanners.filter((banner) => banner.department === department)
    const nextDepartmentBanners = currentDepartmentBanners.filter((banner) => banner.id !== bannerId)

    await syncDepartmentHomeBanners(department, nextDepartmentBanners, `${formatLabel(department)} home banners updated successfully.`)
  }

  const deleteAdminProduct = async (productId) => {
    const product = adminProducts.find((item) => item.id === productId)
    if (!product) return

    const shouldDelete = window.confirm(`Delete "${product.title}" from the dashboard catalog?`)
    if (!shouldDelete) return

    if (isBackendReady) {
      try {
        await deleteAdminProductApi(productId)
      } catch (error) {
        setProductFormMessage(error instanceof Error ? error.message : 'Unable to delete this product right now.')
        return
      }
    }

    setAdminProducts((current) => current.filter((item) => item.id !== productId))
    setStockDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[productId]
      return nextDrafts
    })
    setSizeStockDrafts((current) => {
      const nextDrafts = { ...current }
      delete nextDrafts[productId]
      return nextDrafts
    })

    if (editingAdminProductId === productId) {
      setEditingAdminProductId(null)
      setProductForm(initialAdminProductForm)
    }

    setProductFormMessage(`"${product.title}" was removed from the admin catalog.`)
  }

  const handleAdminProductSubmit = async (event) => {
    event.preventDefault()

    if (
      !productForm.title.trim() ||
      !productForm.description.trim() ||
      !productForm.category.trim() ||
      !productForm.price ||
      !(productForm.images ?? []).length
    ) {
      window.alert('Please complete the product title, description, price, category, and upload at least one image.')
      return
    }

    const sizes = productForm.sizes.length ? productForm.sizes : inferProductSizes({ category: productForm.category })
    const sizeInventory = normalizeSizeInventory({
      category: productForm.category,
      sizes,
      sizeInventory: productForm.sizeInventory,
      quantity: productForm.quantity,
    })
    const quantity = sumSizeInventory(sizeInventory, sizes)
    const nextProductPayload = {
      title: productForm.title.trim(),
      description: productForm.description.trim(),
      price: Number(productForm.price),
      category: productForm.category.trim(),
      images: (productForm.images ?? []).slice(0, MAX_ADMIN_PRODUCT_IMAGES).filter(Boolean),
      sizeChartImage: String(productForm.sizeChartImage ?? '').trim(),
      sizes,
      sizeInventory,
      quantity,
      stockStatus: getStockStatus(quantity),
    }

    if (editingAdminProductId) {
      if (isBackendReady) {
        try {
          const { product } = await updateAdminProductApi(editingAdminProductId, nextProductPayload)
          setAdminProducts((current) =>
            current.map((entry) =>
              entry.id === editingAdminProductId ? normalizeAdminDashboardProduct(product) : entry,
            ),
          )
        } catch (error) {
          window.alert(error instanceof Error ? error.message : 'Unable to update this product right now.')
          return
        }
      } else {
        setAdminProducts((current) =>
          current.map((product) =>
            product.id === editingAdminProductId
              ? normalizeAdminDashboardProduct({
                  ...product,
                  ...nextProductPayload,
                })
              : product,
          ),
        )
      }

      setSelectedAdminProductId(editingAdminProductId)
      setStockDrafts((current) => ({ ...current, [editingAdminProductId]: String(quantity) }))
      setSizeStockDrafts((current) => ({ ...current, [editingAdminProductId]: Object.fromEntries(sizes.map((size) => [size, String(sizeInventory[size] ?? 0)])) }))
      setEditingAdminProductId(null)
      setProductForm(initialAdminProductForm)
      setProductFormMessage('Product updated successfully.')
      return
    }

    if (isBackendReady) {
      try {
        const { product } = await createAdminProductApi({
          ...nextProductPayload,
          badge: 'Admin Upload',
        })
        const normalizedProduct = normalizeAdminDashboardProduct(product)
        setAdminProducts((current) => [normalizedProduct, ...current])
        setSelectedAdminProductId(normalizedProduct.id)
        setStockDrafts((current) => ({ ...current, [normalizedProduct.id]: String(normalizedProduct.quantity) }))
        setSizeStockDrafts((current) => ({ ...current, [normalizedProduct.id]: buildSizeDraftMap(normalizedProduct) }))
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to upload this product right now.')
        return
      }
    } else {
      const nextProduct = normalizeAdminDashboardProduct({
        id: `admin-product-${Date.now()}`,
        ...nextProductPayload,
        badge: 'Admin Upload',
        createdAt: Date.now(),
      })

      setAdminProducts((current) => [nextProduct, ...current])
      setSelectedAdminProductId(nextProduct.id)
      setStockDrafts((current) => ({ ...current, [nextProduct.id]: String(nextProduct.quantity) }))
      setSizeStockDrafts((current) => ({ ...current, [nextProduct.id]: buildSizeDraftMap(nextProduct) }))
    }

    setProductForm(initialAdminProductForm)
    setProductFormMessage('Product uploaded successfully and added to inventory.')
  }

  const updateStockDraft = (productId, value) => {
    const sanitizedValue = value.replace(/\D/g, '')
    const nextQuantity = Math.max(0, Number(sanitizedValue) || 0)
    const targetProduct = adminProducts.find((product) => product.id === productId)
    const nextSizeInventory = targetProduct
      ? distributeQuantityAcrossSizes(nextQuantity, inferProductSizes(targetProduct))
      : null

    setStockDrafts((current) => ({ ...current, [productId]: sanitizedValue }))

    if (nextSizeInventory) {
      setSizeStockDrafts((current) => ({
        ...current,
        [productId]: Object.fromEntries(Object.entries(nextSizeInventory).map(([size, quantity]) => [size, String(quantity)])),
      }))
    }
  }

  const updateInventorySizeDraft = (productId, size, value) => {
    const sanitizedValue = value.replace(/\D/g, '')
    const targetProduct = adminProducts.find((product) => product.id === productId)
    if (!targetProduct) return

    const productSizes = inferProductSizes(targetProduct)

    setSizeStockDrafts((current) => {
      const currentDraft = current[productId] ?? buildSizeDraftMap(targetProduct)
      const nextDraft = {
        ...currentDraft,
        [size]: sanitizedValue,
      }
      const nextQuantity = productSizes.reduce((sum, itemSize) => sum + Math.max(0, Number(nextDraft[itemSize] ?? 0) || 0), 0)

      setStockDrafts((stockCurrent) => ({ ...stockCurrent, [productId]: String(nextQuantity) }))

      return {
        ...current,
        [productId]: nextDraft,
      }
    })
  }

  const applyStockUpdate = async (productId) => {
    const targetProduct = adminProducts.find((product) => product.id === productId)
    if (!targetProduct) return

    const productSizes = inferProductSizes(targetProduct)
    const sizeDraft = sizeStockDrafts[productId] ?? buildSizeDraftMap(targetProduct)
    const nextSizeInventory = Object.fromEntries(
      productSizes.map((size) => [size, Math.max(0, Number(sizeDraft[size] ?? 0) || 0)]),
    )
    const nextQuantity = sumSizeInventory(nextSizeInventory, productSizes)

    if (isBackendReady) {
      try {
        const hasSizeSpecificDrafts = productSizes.length > 0
        const productPayload = {
          title: targetProduct.title,
          description: targetProduct.description,
          price: targetProduct.price,
          category: targetProduct.category,
          images: targetProduct.images,
          badge: targetProduct.badge,
          createdAt: targetProduct.createdAt,
          source: targetProduct.source,
          sizes: productSizes,
          sizeInventory: nextSizeInventory,
          quantity: nextQuantity,
          stockStatus: getStockStatus(nextQuantity),
        }
        const { product } = hasSizeSpecificDrafts
          ? await updateAdminProductApi(productId, productPayload)
          : await updateAdminProductStockApi(productId, nextQuantity)
        const normalizedProduct = normalizeAdminDashboardProduct(product)
        setAdminProducts((current) =>
          current.map((entry) => (entry.id === productId ? normalizedProduct : entry)),
        )
        setStockDrafts((current) => ({ ...current, [productId]: String(normalizedProduct.quantity) }))
        setSizeStockDrafts((current) => ({ ...current, [productId]: buildSizeDraftMap(normalizedProduct) }))
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to update stock right now.')
      }
      return
    }

    const normalizedProduct = normalizeAdminDashboardProduct({
      ...targetProduct,
      sizes: productSizes,
      sizeInventory: nextSizeInventory,
      quantity: nextQuantity,
      stockStatus: getStockStatus(nextQuantity),
    })

    setAdminProducts((current) =>
      current.map((product) => (product.id === productId ? normalizedProduct : product)),
    )
    setStockDrafts((current) => ({ ...current, [productId]: String(normalizedProduct.quantity) }))
    setSizeStockDrafts((current) => ({ ...current, [productId]: buildSizeDraftMap(normalizedProduct) }))
  }

  const updateOrderStatus = async (orderId, nextStatus) => {
    const normalizedNextStatus = normalizeOrderStatusValue(nextStatus)

    if (isBackendReady) {
      try {
        const { order, products } = await updateAdminOrderStatusApi(orderId, normalizedNextStatus)
        replaceOrderInState(order)
        setAdminProducts(products.map((product, index) => normalizeAdminDashboardProduct(product, index)))
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to update order status right now.')
      }
      return
    }

    const existingOrder = adminOrders.find((order) => order.id === orderId)

    setAdminOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order

        const nextPaymentStatus =
          normalizedNextStatus === 'cancelled'
            ? order.paymentStatus === 'paid'
              ? 'refunded'
              : 'pending'
            : order.paymentStatus === 'refunded'
              ? 'paid'
              : order.paymentStatus

        return {
          ...order,
          status: normalizedNextStatus,
          paymentStatus: nextPaymentStatus,
        }
      }),
    )

    if (!existingOrder || existingOrder.status === normalizedNextStatus) return

    setAdminProducts((current) =>
      current.map((product) => {
        if (product.id !== existingOrder.productId) return product

        const nextQuantity =
          existingOrder.status !== 'cancelled' && normalizedNextStatus === 'cancelled'
            ? Number(product.quantity) + Number(existingOrder.quantity)
            : existingOrder.status === 'cancelled' && normalizedNextStatus !== 'cancelled'
              ? Math.max(0, Number(product.quantity) - Number(existingOrder.quantity))
              : Number(product.quantity)

        const nextSizeInventory = existingOrder.size
          ? {
              ...(product.sizeInventory ?? {}),
              [existingOrder.size]:
                existingOrder.status !== 'cancelled' && normalizedNextStatus === 'cancelled'
                  ? getProductSizeQuantity(product, existingOrder.size) + Number(existingOrder.quantity)
                  : existingOrder.status === 'cancelled' && normalizedNextStatus !== 'cancelled'
                    ? Math.max(0, getProductSizeQuantity(product, existingOrder.size) - Number(existingOrder.quantity))
                    : getProductSizeQuantity(product, existingOrder.size),
            }
          : distributeQuantityAcrossSizes(nextQuantity, product.sizes)

        return normalizeAdminDashboardProduct({
          ...product,
          sizeInventory: nextSizeInventory,
          quantity: nextQuantity,
          stockStatus: getStockStatus(nextQuantity),
        })
      }),
    )
  }

  const refreshOrderTracking = async (orderId, successMessage = 'Shipment tracking refreshed.') => {
    if (!isBackendReady) {
      window.alert('Shipment tracking refresh is available when the backend is running.')
      return
    }

    setTrackingOrderId(orderId)
    setOrderActionState({
      orderId,
      type: 'tracking',
    })

    try {
      const { order } = await getOrderTracking(orderId)
      replaceOrderInState(order)
      if (activeView === 'profile') {
        setProfileMessage(successMessage)
      } else if (successMessage) {
        window.alert(successMessage)
      }
      if (order.trackingUrl) {
        window.open(order.trackingUrl, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to refresh shipment tracking right now.')
    } finally {
      setTrackingOrderId('')
      setOrderActionState({
        orderId: '',
        type: '',
      })
    }
  }

  const openOrderDocument = async (orderId, documentType) => {
    if (!isBackendReady) {
      window.alert('Shipping documents are available when the backend is running.')
      return
    }

    setOrderActionState({
      orderId,
      type: documentType,
    })

    try {
      const { url } = await generateAdminOrderDocument(orderId, documentType)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      window.alert(error instanceof Error ? error.message : `Unable to open the ${documentType} right now.`)
    } finally {
      setOrderActionState({
        orderId: '',
        type: '',
      })
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    clearAuthFeedback()

    const normalizedEmail = registerForm.email.trim().toLowerCase()

    if (
      !registerForm.firstName.trim() ||
      !registerForm.lastName.trim() ||
      !normalizedEmail ||
      !registerForm.password ||
      !registerForm.confirmPassword ||
      !registerForm.birthdate ||
      !registerForm.phone.trim()
    ) {
      setAuthError('Please fill all required registration fields.')
      return
    }

    if (!isValidEmail(normalizedEmail)) {
      setAuthError('Please enter a valid email address.')
      return
    }

    if (normalizedEmail === DEFAULT_ADMIN_EMAIL) {
      setAuthError('This email is reserved for the admin account.')
      return
    }

    if (registerForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters long.')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('Password and confirm password do not match.')
      return
    }

    if (registerForm.phone.trim().length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.')
      return
    }

    if (registeredUsers.some((user) => user.email === normalizedEmail)) {
      setAuthError('This email is already registered. Please login instead.')
      setAuthMode('login')
      setLoginForm((current) => ({ ...current, email: normalizedEmail }))
      return
    }

    if (isBackendReady) {
      try {
        const { user } = await registerCustomer({
          firstName: registerForm.firstName.trim(),
          lastName: registerForm.lastName.trim(),
          email: normalizedEmail,
          password: registerForm.password,
          birthdate: registerForm.birthdate,
          phone: registerForm.phone.trim(),
          gender: registerForm.gender,
        })

        setRegisteredUsers((current) => [...current, normalizeStoredUser(user)])
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Registration failed.')
        return
      }
    } else {
      const nextUser = {
        id: `user-${Date.now()}`,
        firstName: registerForm.firstName.trim(),
        lastName: registerForm.lastName.trim(),
        email: normalizedEmail,
        password: registerForm.password,
        birthdate: registerForm.birthdate,
        phone: registerForm.phone.trim(),
        gender: registerForm.gender,
        role: 'customer',
        addresses: [],
      }

      setRegisteredUsers((current) => [...current, nextUser])
    }

    setRegisterForm(initialRegisterForm)
    setLoginForm({ email: normalizedEmail, password: '', otp: '' })
    setShowRegisterPassword(false)
    setShowConfirmPassword(false)
    resetLoginOtpState()
    setAuthMode('login')
    setAuthMessage('Account created. Login with your email and password.')
  }

  const handleRequestEmailOtp = async () => {
    clearAuthFeedback()

    if (!normalizedLoginEmail) {
      setAuthError('Please enter your email address.')
      return
    }

    if (!isBackendReady) {
      setAuthError('Email OTP login is available only when the backend is connected.')
      return
    }

    try {
      const payload = await requestLoginOtpApi({
        email: normalizedLoginEmail,
        password: loginForm.password,
      })

      setLoginOtpState({
        requestedEmail: normalizedLoginEmail,
        maskedEmail: payload.maskedEmail ?? normalizedLoginEmail,
        expiresInSeconds: Number(payload.expiresInSeconds ?? 0),
        resendAvailableInSeconds: Number(payload.resendAvailableInSeconds ?? 0),
        previewCode: String(payload.previewCode ?? ''),
      })
      setLoginForm((current) => ({ ...current, email: normalizedLoginEmail, otp: '' }))
      setAuthMessage(
        payload.previewCode
          ? `Password verified. OTP sent to ${payload.maskedEmail ?? normalizedLoginEmail}. Demo code: ${payload.previewCode}`
          : `Password verified. OTP sent to ${payload.maskedEmail ?? normalizedLoginEmail}. Please check your inbox.`,
      )
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'We could not send the OTP right now.')
    }
  }

  const handleVerifyEmailOtp = async () => {
    clearAuthFeedback()

    if (!normalizedLoginEmail || !loginForm.otp.trim()) {
      setAuthError('Please enter your email and OTP.')
      return
    }

    if (!isBackendReady) {
      setAuthError('Email OTP login is available only when the backend is connected.')
      return
    }

    if (!isOtpRequestedForCurrentEmail) {
      setAuthError('Please request a new OTP for this email first.')
      return
    }

    try {
      const { user } = await verifyLoginOtpApi({
        email: normalizedLoginEmail,
        otp: loginForm.otp.trim(),
      })

      completeLogin(user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'OTP verification failed.')
    }
  }

  const handleOtpStepSubmit = async (event) => {
    event.preventDefault()
    await handleVerifyEmailOtp()
  }

  const handleGoogleSignIn = async () => {
    clearAuthFeedback()

    if (!isBackendReady) {
      setAuthError('Google login works when the backend is connected.')
      return
    }

    setIsGoogleLoginPending(true)

    try {
      const accessToken = await requestGoogleAccessToken()
      const { user } = await loginWithGoogle({ accessToken })
      completeLogin(user)
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in could not be completed.')
    } finally {
      setIsGoogleLoginPending(false)
    }
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    clearAuthFeedback()

    if (!normalizedLoginEmail || !loginForm.password) {
      setAuthError('Please enter your email and password.')
      return
    }

    if (isBackendReady) {
      if (normalizedLoginEmail === DEFAULT_ADMIN_EMAIL) {
        try {
          const { user } = await loginWithPassword({
            email: normalizedLoginEmail,
            password: loginForm.password,
          })

          completeLogin(user)
        } catch (error) {
          setAuthError(error instanceof Error ? error.message : 'Invalid email or password.')
        }
        return
      }

      try {
        await handleRequestEmailOtp()
        return
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'We could not start OTP login.')
        return
      }
    } else {
      if (normalizedLoginEmail === DEFAULT_ADMIN_EMAIL && loginForm.password === DEFAULT_ADMIN_PASSWORD) {
        completeLogin({
          id: 'admin-legasus',
          firstName: 'Admin',
          lastName: 'Legasus',
          email: DEFAULT_ADMIN_EMAIL,
          birthdate: '--',
          phone: '0000000000',
          gender: 'other',
          role: 'admin',
          addresses: [],
        })
        return
      }

      const matchedUser = registeredUsers.find((user) => user.email === normalizedLoginEmail && user.password === loginForm.password)

      if (!matchedUser) {
        setAuthError('Invalid email or password.')
        return
      }

      completeLogin({
        id: matchedUser.id,
        firstName: matchedUser.firstName,
        lastName: matchedUser.lastName,
        email: matchedUser.email,
        birthdate: matchedUser.birthdate,
        phone: matchedUser.phone,
        gender: matchedUser.gender,
        role: matchedUser.role ?? 'customer',
        addresses: matchedUser.addresses ?? [],
      })
      return
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    clearAuthFeedback()
    resetProductComposer()
    setActiveCustomerSection('orders')
    setActiveSupportCategory('shipping-tracking')
    setProfileMessage('')
    setIsPasswordEditorOpen(false)
    setActiveView('home')
  }

  const handleSaveCustomerProfile = async () => {
    if (!currentUser || currentUser.role !== 'customer') return

    if (!customerProfileForm.firstName.trim()) {
      setProfileMessage('First name is required.')
      return
    }

    if (customerProfileForm.phone.trim().length !== 10) {
      setProfileMessage('Please enter a valid 10-digit mobile number.')
      return
    }

    if (isPasswordEditorOpen) {
      if (customerProfileForm.newPassword.length < 6) {
        setProfileMessage('New password must be at least 6 characters long.')
        return
      }

      if (customerProfileForm.newPassword !== customerProfileForm.confirmPassword) {
        setProfileMessage('New password and confirm password do not match.')
        return
      }
    }

    const nextProfile = {
      firstName: customerProfileForm.firstName.trim(),
      lastName: customerProfileForm.lastName.trim(),
      email: currentUser.email,
      birthdate: customerProfileForm.birthdate,
      phone: customerProfileForm.phone.trim(),
      gender: customerProfileForm.gender,
      role: 'customer',
    }

    if (isBackendReady) {
      try {
        const { user } = await updateCustomer(currentUser.id, {
          ...nextProfile,
          newPassword: isPasswordEditorOpen ? customerProfileForm.newPassword : '',
          addresses: savedAddresses,
        })

        const normalizedUser = normalizeStoredUser(user)
        setCurrentUser(normalizedUser)
        setRegisteredUsers((current) =>
          current.map((entry) => (entry.id === normalizedUser.id ? normalizedUser : entry)),
        )
      } catch (error) {
        setProfileMessage(error instanceof Error ? error.message : 'Profile update failed.')
        return
      }
    } else {
      setCurrentUser((current) => (current ? { ...current, ...nextProfile } : current))
      setRegisteredUsers((current) =>
        current.map((user) =>
          user.email === currentUser.email
            ? {
                ...user,
                ...nextProfile,
                password: isPasswordEditorOpen && customerProfileForm.newPassword ? customerProfileForm.newPassword : user.password,
              }
            : user,
        ),
      )
    }

    setCustomerProfileForm((current) => ({
      ...current,
      ...nextProfile,
      newPassword: '',
      confirmPassword: '',
    }))
    setIsPasswordEditorOpen(false)
    setProfileMessage('Profile updated successfully.')
  }

  const handleDeleteCustomerAccount = async () => {
    if (!currentUser || currentUser.role !== 'customer') return

    const shouldDelete = window.confirm('Delete this customer account? This will sign you out from the store.')
    if (!shouldDelete) return

    if (isBackendReady) {
      try {
        await removeCustomer(currentUser.id)
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to delete account right now.')
        return
      }
    }

    setRegisteredUsers((current) => current.filter((user) => user.email !== currentUser.email))
    setWishlistIds([])
    setCartItems([])
    setSelectedCartKeys([])
    setSavedAddresses([])
    setSelectedAddressId(null)
    handleLogout()
  }

  const toggleWishlist = (productId) => {
    setWishlistIds((current) =>
      current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId],
    )
  }

  const addToCart = (productId, size, quantity = 1) => {
    const product = getStoreProductById(productId)
    if (!product) return { ok: false, message: 'Product is unavailable right now.' }

    const nextSize = size || getFirstAvailableSize(product)
    const availableSizeQuantity = getProductSizeQuantity(product, nextSize)
    const existingQuantity = cartItems.find((item) => item.productId === productId && item.size === nextSize)?.quantity ?? 0

    if (availableSizeQuantity <= 0) {
      return { ok: false, message: `Size ${nextSize} is currently out of stock.` }
    }

    if (existingQuantity + quantity > availableSizeQuantity) {
      return { ok: false, message: `Only ${availableSizeQuantity} item(s) left in size ${nextSize}.` }
    }

    const nextKey = createCartItemKey(productId, nextSize)

    setCartItems((current) => {
      const existingIndex = current.findIndex((item) => item.productId === productId && item.size === nextSize)

      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      return [...current, { productId, size: nextSize, quantity }]
    })

    setSelectedCartKeys((current) => (current.includes(nextKey) ? current : [...current, nextKey]))
    return { ok: true, size: nextSize }
  }

  const removeCartItem = (productId, size) => {
    const itemKey = createCartItemKey(productId, size)

    setCartItems((current) => current.filter((item) => !(item.productId === productId && item.size === size)))
    setSelectedCartKeys((current) => current.filter((key) => key !== itemKey))
  }

  const moveWishlistToCart = (productId) => {
    const product = getStoreProductById(productId)
    if (!product) return

    const targetSize = getFirstAvailableSize(product)
    const result = addToCart(productId, targetSize, 1)
    if (!result?.ok) {
      window.alert(result?.message ?? 'This product is out of stock right now.')
      return
    }

    setWishlistIds((current) => current.filter((id) => id !== productId))
    setActiveView('cart')
    setCheckoutStep('bag')
  }

  const moveCartToWishlist = (productId, size) => {
    setWishlistIds((current) => (current.includes(productId) ? current : [...current, productId]))
    removeCartItem(productId, size)
  }

  const updateCartItemQuantity = (productId, size, quantity) => {
    const product = getStoreProductById(productId)
    const availableQuantity = product ? getProductSizeQuantity(product, size) : quantity
    const nextQuantity = Math.max(1, Math.min(quantity, availableQuantity || 1))

    setCartItems((current) =>
      current.map((item) => (item.productId === productId && item.size === size ? { ...item, quantity: nextQuantity } : item)),
    )
  }

  const updateCartItemSize = (productId, currentSize, nextSize) => {
    if (currentSize === nextSize) return

    const product = getStoreProductById(productId)
    if (product && getProductSizeQuantity(product, nextSize) <= 0) {
      window.alert(`Size ${nextSize} is currently out of stock.`)
      return
    }

    const previousKey = createCartItemKey(productId, currentSize)
    const nextKey = createCartItemKey(productId, nextSize)

    setCartItems((current) => {
      const currentItem = current.find((item) => item.productId === productId && item.size === currentSize)
      const matchingItem = current.find((item) => item.productId === productId && item.size === nextSize)
      const availableNextSize = product ? getProductSizeQuantity(product, nextSize) : 0

      if (!currentItem) return current

      if (matchingItem && matchingItem.quantity + currentItem.quantity > availableNextSize) {
        window.alert(`Only ${availableNextSize} item(s) left in size ${nextSize}.`)
        return current
      }

      if (matchingItem) {
        return current
          .filter((item) => !(item.productId === productId && item.size === currentSize))
          .map((item) =>
            item.productId === productId && item.size === nextSize
              ? { ...item, quantity: item.quantity + currentItem.quantity }
              : item,
          )
      }

      return current.map((item) =>
        item.productId === productId && item.size === currentSize ? { ...item, size: nextSize } : item,
      )
    })

    setSelectedCartKeys((current) => {
      const nextSelection = current.map((key) => (key === previousKey ? nextKey : key))
      return [...new Set(nextSelection)]
    })
  }

  const toggleCartSelection = (itemKey) => {
    setSelectedCartKeys((current) =>
      current.includes(itemKey) ? current.filter((key) => key !== itemKey) : [...current, itemKey],
    )
  }

  const toggleAllCartSelections = () => {
    if (selectedCartKeys.length === cartProducts.length) {
      setSelectedCartKeys([])
      return
    }

    setSelectedCartKeys(cartProducts.map((item) => item.key))
  }

  const toggleSidebarPanel = (panelId) => {
    setSidebarPanels((current) => ({ ...current, [panelId]: !current[panelId] }))
  }

  const openAddressModal = () => {
    setIsAddressModalOpen(true)
  }

  const closeAddressModal = () => {
    setIsAddressModalOpen(false)
    setAddressForm(initialAddressForm)
  }

  const updateAddressFormField = (field, value) => {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  const saveAddress = async () => {
    const requiredFields = ['flat', 'street', 'pincode', 'city', 'state', 'fullName', 'phone']
    const hasMissingFields = requiredFields.some((field) => !String(addressForm[field]).trim())

    if (hasMissingFields) {
      window.alert('Please fill all required address fields.')
      return
    }

    const nextAddressId = `address-${Date.now()}`
    const nextAddress = {
      id: nextAddressId,
      ...addressForm,
    }

    const nextAddresses = addressForm.isDefault
      ? savedAddresses.map((address) => ({ ...address, isDefault: false }))
      : [...savedAddresses]

    const mergedAddresses = [nextAddress, ...nextAddresses]

    if (isBackendReady && currentUser?.role === 'customer') {
      try {
        const { user } = await updateCustomer(currentUser.id, {
          addresses: mergedAddresses,
        })

        const normalizedUser = normalizeStoredUser(user)
        setCurrentUser((current) => (current ? { ...current, ...normalizedUser } : current))
        setRegisteredUsers((current) =>
          current.map((entry) => (entry.id === normalizedUser.id ? normalizedUser : entry)),
        )
        setSavedAddresses(normalizedUser.addresses ?? [])
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Unable to save address right now.')
        return
      }
    } else {
      setSavedAddresses(mergedAddresses)
    }

    setSelectedAddressId(nextAddressId)
    if (activeView === 'cart') {
      setCheckoutStep('address')
    } else {
      setProfileMessage('Default address updated successfully.')
    }
    closeAddressModal()
  }

  const continueFromBag = () => {
    if (!selectedLineCount) return

    if (!currentUser) {
      openAuthPage('login', 'cart')
      return
    }

    setCheckoutStep('address')

    if (!savedAddresses.length) {
      openAddressModal()
    }
  }

  const continueToPayment = () => {
    if (!selectedAddressId) return
    setCheckoutStep('payment')
  }

  const finishCheckoutFlow = ({ orders = [], products = null, pricing = checkoutPricing, successMessage }) => {
    if (orders.length) {
      setAdminOrders((current) => [...orders.map(normalizeOrderRecord), ...current])
      setSelectedOrderId(orders[0].id)
    }

    if (products?.length) {
      setAdminProducts(products.map((product, index) => normalizeAdminDashboardProduct(product, index)))
    }

    setCartItems((current) =>
      current.filter((item) => !selectedCartKeys.includes(createCartItemKey(item.productId, item.size))),
    )
    setSelectedCartKeys([])
    setGiftWrapEnabled(false)
    setCheckoutStep('bag')
    openPaymentSuccessPage({
      orders,
      pricing,
      paymentMethod: selectedCheckoutPaymentMethod,
      message: successMessage,
    })
  }

  const confirmOrder = async () => {
    if (!selectedLineCount) return

    if (!currentUser) {
      openAuthPage('login', 'cart')
      return
    }

    if (!selectedAddressId) {
      setCheckoutStep('address')
      return
    }

    if (!selectedPaymentMethod) {
      window.alert('Please choose a payment method.')
      return
    }

    if (isCheckoutProcessing) return

    const checkoutItems = selectedCartProducts.map(({ product, quantity, size }) => ({
      productId: product.id,
      quantity,
      size,
    }))

    setIsCheckoutProcessing(true)

    try {
      if (selectedCheckoutPaymentMethod === 'razorpay') {
        if (!isBackendReady) {
          window.alert('Razorpay payments need the backend server to be running. Please start the server or use Cash on Delivery.')
          return
        }

        if (!paymentConfig.enabled || !paymentConfig.keyId) {
          window.alert('Razorpay is not configured on the server yet. Please add Razorpay keys in the backend .env file.')
          return
        }

        const scriptLoaded = await loadRazorpayCheckoutScript()
        if (!scriptLoaded || !window.Razorpay) {
          window.alert('Unable to load Razorpay checkout right now. Please try again.')
          return
        }

        const razorpayOrderPayload = await createRazorpayPaymentOrder({
          customerId: currentUser.id,
          paymentMethod: 'razorpay',
          items: checkoutItems,
          giftWrapEnabled,
        })

        const verifiedCheckout = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: razorpayOrderPayload.keyId,
            amount: razorpayOrderPayload.order.amount,
            currency: razorpayOrderPayload.order.currency ?? 'INR',
            name: razorpayOrderPayload.brandName || paymentConfig.brandName,
            description:
              razorpayOrderPayload.brandDescription ||
              `Payment for ${selectedLineCount} item${selectedLineCount > 1 ? 's' : ''}`,
            image: razorpayOrderPayload.brandLogo || undefined,
            order_id: razorpayOrderPayload.order.id,
            prefill: {
              name: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
              email: currentUser.email,
              contact: selectedAddress?.phone ?? currentUser.phone ?? customerProfileForm.phone ?? '',
            },
            notes: {
              customerId: currentUser.id,
              shippingCity: selectedAddress?.city ?? '',
              paymentMode: 'razorpay',
            },
            theme: {
              color: '#0f9198',
            },
            modal: {
              ondismiss: () => reject(new Error('Payment cancelled.')),
            },
            handler: async (response) => {
              try {
                const verifiedPayload = await verifyRazorpayPayment({
                  customerId: currentUser.id,
                  paymentMethod: 'razorpay',
                  items: checkoutItems,
                  address: selectedAddress,
                  giftWrapEnabled,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                })
                resolve(verifiedPayload)
              } catch (error) {
                reject(error)
              }
            },
          })

          razorpay.on('payment.failed', (event) => {
            reject(new Error(event.error?.description ?? 'Payment failed. Please try again.'))
          })

          razorpay.open()
        })

        finishCheckoutFlow({
          orders: verifiedCheckout.orders,
          products: verifiedCheckout.products,
          pricing: verifiedCheckout.pricing,
          successMessage: 'Payment successful and order placed.',
        })
        return
      }

      if (isBackendReady) {
        const { orders, products, pricing } = await placeCheckoutOrder({
          customerId: currentUser.id,
          paymentMethod: selectedCheckoutPaymentMethod,
          address: selectedAddress,
          items: checkoutItems,
          giftWrapEnabled,
        })

        finishCheckoutFlow({
          orders,
          products,
          pricing,
          successMessage: 'Order placed successfully.',
        })
        return
      }

      const createdOn = getDateKey()
      const nextOrders = selectedCartProducts.map(({ product, quantity, size }, index) => {
        const pricingLine = checkoutPricingByKey.get(createCartItemKey(product.id, size))

        return {
          id: `ORD-${Date.now() + index}`,
          customerId: currentUser.id,
          customerName: `${currentUser.firstName} ${currentUser.lastName}`.trim(),
          customerEmail: currentUser.email,
          productId: product.id,
          productTitle: product.title,
          quantity,
          size,
          amount: pricingLine?.total ?? product.price * quantity,
          status: 'pending',
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          transactionId: `COD-${Date.now() + index}`,
          createdAt: createdOn,
          billingDetails: {
            subtotal: pricingLine?.subtotal ?? product.price * quantity,
            gst: pricingLine?.gst ?? 0,
            tcs: pricingLine?.tcs ?? 0,
            tds: pricingLine?.tds ?? 0,
            codCharge: pricingLine?.codCharge ?? 0,
            giftWrapCharge: pricingLine?.giftWrapCharge ?? 0,
            total: pricingLine?.total ?? product.price * quantity,
            cartTotal: checkoutPricing.total,
          },
        }
      })

      if (nextOrders.length) {
        const stockAdjustments = nextOrders.reduce((map, order) => {
          const currentAdjustment = map.get(order.productId) ?? { quantity: 0, sizes: {} }

          map.set(order.productId, {
            quantity: currentAdjustment.quantity + Number(order.quantity),
            sizes: order.size
              ? {
                  ...currentAdjustment.sizes,
                  [order.size]: (currentAdjustment.sizes[order.size] ?? 0) + Number(order.quantity),
                }
              : currentAdjustment.sizes,
          })

          return map
        }, new Map())

        const nextProducts = adminProducts.map((product) => {
          const productAdjustment = stockAdjustments.get(product.id)
          if (!productAdjustment) return product

          const productSizes = inferProductSizes(product)
          const nextSizeInventory = Object.fromEntries(
            productSizes.map((productSize) => [
              productSize,
              Math.max(0, getProductSizeQuantity(product, productSize) - (productAdjustment.sizes[productSize] ?? 0)),
            ]),
          )
          const nextQuantity = sumSizeInventory(nextSizeInventory, productSizes)

          return normalizeAdminDashboardProduct({
            ...product,
            sizes: productSizes,
            sizeInventory: nextSizeInventory,
            quantity: nextQuantity,
            stockStatus: getStockStatus(nextQuantity),
          })
        })

        finishCheckoutFlow({
          orders: nextOrders,
          products: nextProducts,
          pricing: checkoutPricing,
          successMessage: 'Order placed successfully.',
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unable to place the order right now.'

      if (selectedCheckoutPaymentMethod === 'razorpay') {
        openPaymentFailurePage({
          message: errorMessage,
          paymentMethod: 'razorpay',
        })
      } else {
        window.alert(errorMessage)
      }
    } finally {
      setIsCheckoutProcessing(false)
    }
  }

  const applySelection = (selection, targetId = 'trending') => {
    if (selection.label === 'Track My Order') {
      openSupportPage('shipping-tracking')
      return
    }

    if (selection.label === 'Stores Near Me') {
      returnHome()
      return
    }

    if (openCollectionPage(selection)) {
      return
    }

    if (selection.productId) {
      openProductPage(selection.productId)
      return
    }

    if (selection.heroId) {
      const nextHero = heroSlides.findIndex((slide) => slide.id === selection.heroId)
      if (nextHero >= 0) setActiveHero(nextHero)
    }

    if (selection.filter && trendingFilters.includes(selection.filter)) {
      setActiveFilter(selection.filter)
    }

    setIsMenuOpen(false)
    window.requestAnimationFrame(() => {
      document.getElementById(selection.target ?? targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  if (activeView === 'product') {
    return (
      <ProductPage
        key={selectedProductId}
        productId={selectedProductId}
        onBack={returnFromProductPage}
        onSelectProduct={openProductPage}
        wishlistIds={wishlistIds}
        cartItems={cartItems}
        onToggleWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onOpenWishlist={openWishlistPage}
        onOpenCart={openCartPage}
        onOpenTracking={openTrackingPage}
        onOpenAccount={openAccountPanel}
        customProducts={[...storefrontProducts, ...uploadedCustomerProducts]}
      />
    )
  }

  const toggleMobileSearch = () => {
    setIsMobileSearchOpen((current) => !current)
  }

  const isUtilityPage =
    activeView === 'wishlist' ||
    activeView === 'cart' ||
    activeView === 'auth' ||
    activeView === 'profile' ||
    activeView === 'support' ||
    activeView === 'payment-success' ||
    activeView === 'payment-failed'
  const allCartSelected = cartProducts.length > 0 && selectedCartKeys.length === cartProducts.length
  const stepPrimaryLabel =
    checkoutStep === 'bag'
      ? 'Place Order'
      : checkoutStep === 'address'
        ? 'Continue To Payment'
        : isCheckoutProcessing
          ? selectedCheckoutPaymentMethod === 'cod'
            ? 'Placing Order...'
            : 'Opening Razorpay...'
          : selectedCheckoutPaymentMethod === 'cod'
            ? 'Place Order'
            : 'Pay Now'
  const stepPrimaryAction =
    checkoutStep === 'bag' ? continueFromBag : checkoutStep === 'address' ? continueToPayment : confirmOrder
  const stepPrimaryDisabled =
    checkoutStep === 'bag'
      ? !selectedLineCount
      : checkoutStep === 'address'
        ? !selectedAddressId
        : !selectedPaymentMethod || isCheckoutProcessing
  const showBagSidebarExtras = checkoutStep === 'bag' && selectedLineCount > 0

  return (
    <div className="page-shell">
      <div className={`drawer-backdrop${isMenuOpen ? ' is-visible' : ''}`} onClick={() => setIsMenuOpen(false)} />
      <aside className={`mega-drawer${isMenuOpen ? ' is-open' : ''}`}>
        <div className="mega-drawer__inner">
          <div className="mega-drawer__header">
            <BrandMark />
            <button className="drawer-close" type="button" aria-label="Close menu" onClick={() => setIsMenuOpen(false)}>
              <CloseIcon />
            </button>
          </div>
          <button className="drawer-login" type="button" onClick={openAccountPanel}>
            {currentUser?.role === 'admin'
              ? 'Admin Dashboard'
              : currentUser
                ? 'My Profile'
                : 'Log In/Register'}
          </button>
          <div className="cashback-strip">
            <span>Earn 10% Cashback on Every App Order</span>
            <div className="cashback-strip__badges"><span>G</span><span>A</span></div>
          </div>
          <div className="drawer-tabs">
            {departmentTabs.map((department) => (
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
              {visibleFeaturedPage.map((feature) => (
                <button key={feature.id} className="drawer-featured-card" type="button" onClick={() => applySelection(feature, 'hero')}>
                  <img src={feature.image} alt={feature.title} />
                  <strong>{feature.title}</strong>
                </button>
              ))}
            </div>
            {featuredPages.length > 1 ? (
              <div className="drawer-dots">
                {featuredPages.map((page, index) => (
                  <button key={`drawer-page-${index + 1}`} className={index === drawerPage ? 'is-active' : ''} type="button" onClick={() => setDrawerPage(index)} />
                ))}
              </div>
            ) : null}
          </div>
          <div className="drawer-sections">
            {drawerCatalog[activeDepartment].sections.map((section) => {
              const isExpanded = Boolean(expandedSections[section.id])
              return (
                <section className="drawer-section" key={`${activeDepartment}-${section.id}`}>
                  <button className="drawer-section__toggle" type="button" onClick={() => setExpandedSections((current) => ({ ...current, [section.id]: !current[section.id] }))}>
                    <span>{section.title}</span>
                    <ChevronIcon expanded={isExpanded} />
                  </button>
                  {isExpanded ? (
                    <div className="drawer-section__content">
                      {section.kind === 'grid' ? (
                        <div className="drawer-grid">
                          {section.items.map((item) => (
                            <button key={item.id} className="drawer-grid__item" type="button" onClick={() => applySelection(item)}>
                              <img src={item.image} alt={item.label} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="drawer-link-list">
                          {section.items.map((item) => (
                            <button key={item.id} className="drawer-link-list__item" type="button" onClick={() => applySelection(item)}>
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

      <header className="site-header">
        <div className="site-header__desktop">
          <div className="site-header__left">
            <button className="menu-button" type="button" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
              <MenuIcon />
            </button>
            <nav className="main-nav">
              {departmentTabs.map((department) => (
                <button key={department.id} className={department.id === activeDepartment ? 'is-active' : ''} type="button" onClick={() => selectDepartment(department.id)}>
                  {department.label}
                </button>
              ))}
            </nav>
          </div>
          <button className="brand-home-button" type="button" aria-label="Go to home" onClick={returnHome}>
            <BrandMark />
          </button>
          <div className="site-header__right">
            <label className="search-pill">
              <input type="text" placeholder="What are you looking for?" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} />
              <button
                className={`search-pill__icon${isListening ? ' is-listening' : ''}`}
                type="button"
                aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                onClick={() => (isListening ? stopListening() : startListening())}
              >
                <MicIcon />
              </button>
              <span className="search-pill__icon search-pill__icon--passive" aria-hidden="true">
                <SearchIcon />
              </span>
            </label>
            <div className="quick-actions">
              <HeaderIconButton
                label="Track your order"
                active={activeView === 'profile' && activeCustomerSection === 'orders'}
                onClick={openTrackingPage}
              >
                <PinIcon />
              </HeaderIconButton>
              <HeaderIconButton
                label={currentUser ? `My account, ${currentUser.firstName}` : 'My account'}
                active={activeView === 'auth' || activeView === 'admin' || activeView === 'profile'}
                onClick={openAccountPanel}
              >
                <UserIcon />
              </HeaderIconButton>
              <HeaderIconButton label="Wishlist" active={activeView === 'wishlist'} count={wishlistIds.length || undefined} onClick={openWishlistPage}>
                <HeartIcon filled={activeView === 'wishlist'} />
              </HeaderIconButton>
              <HeaderIconButton label="Cart" active={activeView === 'cart'} count={cartCount || undefined} onClick={openCartPage}>
                <CartIcon />
              </HeaderIconButton>
            </div>
          </div>
        </div>

        <div className="site-header__mobile">
          <div className="site-header__mobile-promo">
            <span>Get 10% Cashback On All Orders</span>
            <button type="button">Open App</button>
          </div>

          <div className="site-header__mobile-bar">
            <button className="menu-button" type="button" aria-label="Open menu" onClick={() => setIsMenuOpen(true)}>
              <MenuIcon />
            </button>

            <button className="brand-home-button" type="button" aria-label="Go to home" onClick={returnHome}>
              <BrandMark />
            </button>

            <div className="site-header__mobile-actions">
              <HeaderIconButton label={isMobileSearchOpen ? 'Close search' : 'Open search'} onClick={toggleMobileSearch}>
                <SearchIcon />
              </HeaderIconButton>
              <HeaderIconButton label="Wishlist" active={activeView === 'wishlist'} count={wishlistIds.length || undefined} onClick={openWishlistPage}>
                <HeartIcon filled={activeView === 'wishlist'} />
              </HeaderIconButton>
              <HeaderIconButton label="Cart" active={activeView === 'cart'} count={cartCount || undefined} onClick={openCartPage}>
                <CartIcon />
              </HeaderIconButton>
            </div>
          </div>

          <nav className="main-nav main-nav--mobile">
            {departmentTabs.map((department) => (
              <button key={department.id} className={department.id === activeDepartment ? 'is-active' : ''} type="button" onClick={() => selectDepartment(department.id)}>
                {department.label}
              </button>
            ))}
          </nav>

          {isMobileSearchOpen ? (
            <div className="mobile-search-panel">
              <label className="search-pill search-pill--mobile-expanded">
                <input type="text" placeholder="What are you looking for?" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} autoFocus />
                <button
                  className={`search-pill__icon${isListening ? ' is-listening' : ''}`}
                  type="button"
                  aria-label={isListening ? 'Stop voice search' : 'Start voice search'}
                  onClick={() => (isListening ? stopListening() : startListening())}
                >
                  <MicIcon />
                </button>
              </label>
            </div>
          ) : null}
        </div>
      </header>

      <main>
        {activeView === 'home' ? (
          <>
            <section className="hero hero--desktop" id="hero">
              <div className="hero__carousel">
                <button className="hero__arrow hero__arrow--left" type="button" onClick={() => setActiveHero((current) => (current - 1 + heroSlides.length) % heroSlides.length)}>
                  <ArrowIcon direction="left" />
                </button>
                <div className="hero__visual"><img src={activeSlide.image} alt={activeSlide.cta} /></div>
                <div className={`hero__content hero__content--${activeSlide.tone}`}>
                  <p>{activeSlide.eyebrow}</p>
                  <div className="hero__title-wrap">
                    <span className="hero__script">{activeSlide.script}</span>
                    <h1><span>{activeSlide.titleTop}</span><span>{activeSlide.titleBottom}</span></h1>
                  </div>
                  <strong>{activeSlide.cta}</strong>
                  <p className="hero__note">{activeSlide.note}</p>
                  <button className="cta-button" type="button" onClick={() => setActiveFilter(activeSlide.focusFilter)}>Shop now</button>
                </div>
                <button className="hero__arrow hero__arrow--right" type="button" onClick={() => setActiveHero((current) => (current + 1) % heroSlides.length)}>
                  <ArrowIcon />
                </button>
              </div>
              <div className="hero__dots">
                {heroSlides.map((slide, index) => (
                  <button key={slide.id} className={index === activeHero ? 'is-active' : ''} type="button" onClick={() => setActiveHero(index)} />
                ))}
              </div>
            </section>

            <MobileHomeShowcase
              activeDepartment={activeDepartment}
              activeSlide={activeSlide}
              heroSlides={heroSlides}
              activeHero={activeHero}
              onHeroChange={setActiveHero}
              categories={visibleCategories}
              onApplySelection={applySelection}
            />

            <section className="section-block section-block--tight">
              <SectionHeading title="New Arrivals" subtitle={departmentTabs.find((tab) => tab.id === activeDepartment)?.label} />
              <div className="featured-row">
                {visibleArrivals.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={openProductPage}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={wishlistIds.includes(product.detailId)}
                  />
                ))}
              </div>
            </section>

            <section className="section-block" id="categories">
              <SectionHeading title="Categories" />
              <div className="category-grid">{visibleCategories.map((category) => <CategoryCard key={category.id} category={category} onClick={applySelection} />)}</div>
            </section>

            <section className="section-block section-block--trending" id="trending">
              <div className="filter-strip">
                {trendingFilters.map((filter) => (
                  <button key={filter} className={filter === activeFilter ? 'is-active' : ''} type="button" onClick={() => setActiveFilter(filter)}>
                    {filter}
                  </button>
                ))}
              </div>
              <div className="trending-layout">
                {visibleTrending.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={openProductPage}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={wishlistIds.includes(product.detailId)}
                  />
                ))}
              </div>
            </section>

            <section className="section-block section-block--all-products" id="all-products">
              <SectionHeading title="All Products" subtitle={departmentTabs.find((tab) => tab.id === activeDepartment)?.label} />
              <div className="trending-layout">
                {visibleAllProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={openProductPage}
                    onToggleWishlist={toggleWishlist}
                    isWishlisted={wishlistIds.includes(product.detailId)}
                  />
                ))}
              </div>
              <div className="mobile-section-dots" aria-hidden="true">
                {visibleArrivals.map((product, index) => (
                  <span key={`arrival-dot-${product.id}`} className={index === 0 ? 'is-active' : ''} />
                ))}
              </div>
            </section>
          </>
        ) : null}

        {activeView === 'collection' && activeCollection ? (
          <CollectionPage
            key={`collection-${activeCollection.department}-${activeCollection.title}-${activeCollection.showSidebar ? 'sidebar' : 'plain'}-${activeCollection.defaultBrowseKey ?? 'all'}`}
            collection={activeCollection}
            products={collectionDepartmentProducts}
            searchQuery={searchQuery}
            onBack={returnHome}
            onSelectProduct={openProductPage}
            onToggleWishlist={toggleWishlist}
            wishlistIds={wishlistIds}
          />
        ) : null}

        {activeView === 'admin' ? (
          <AdminDashboard
            currentUser={currentUser}
            activeSection={activeAdminSection}
            onSectionChange={setActiveAdminSection}
            earnings={earnings}
            stats={stats}
            inventory={inventorySummary}
            products={adminProducts}
            selectedProduct={selectedAdminProduct}
            onSelectProduct={setSelectedAdminProductId}
            productForm={productForm}
            onProductFieldChange={updateProductFormField}
            onProductSizeStockChange={updateProductSizeInventory}
            onProductImagesUpload={handleProductImagesUpload}
            onRemoveProductImage={removeProductImage}
            onProductSizeChartUpload={handleProductSizeChartUpload}
            onRemoveProductSizeChart={removeProductSizeChart}
            homeBanners={adminHomeBanners}
            onHomeBannerUpload={handleHomeBannerUpload}
            onRemoveHomeBanner={removeHomeBanner}
            onProductSubmit={handleAdminProductSubmit}
            productFormMessage={productFormMessage}
            bannerFormMessage={bannerFormMessage}
            editingProductId={editingAdminProductId}
            onStartProductEdit={startProductEdit}
            onDeleteProduct={deleteAdminProduct}
            onResetProductForm={resetProductComposer}
            stockDrafts={stockDrafts}
            sizeStockDrafts={sizeStockDrafts}
            onStockDraftChange={updateStockDraft}
            onInventorySizeDraftChange={updateInventorySizeDraft}
            onStockUpdate={applyStockUpdate}
            orders={adminOrders}
            orderSummary={orderSummary}
            selectedOrder={selectedAdminOrder}
            onSelectOrder={setSelectedOrderId}
            onOrderStatusChange={updateOrderStatus}
            onRefreshOrderTracking={refreshOrderTracking}
            onOpenOrderDocument={openOrderDocument}
            orderActionState={orderActionState}
            customers={adminCustomers}
            selectedCustomer={selectedAdminCustomer}
            onSelectCustomer={setSelectedCustomerId}
            payments={paymentHistory}
            paymentSummary={paymentSummary}
            onBackToStore={returnHome}
            onLogout={handleLogout}
          />
        ) : null}

        {activeView === 'payment-success' || activeView === 'payment-failed' ? (
          <PaymentResultPage
            result={paymentResult}
            onViewOrders={() => openProfilePage('orders')}
            onRetryPayment={retryRazorpayPayment}
            onSwitchToCod={switchPaymentFailureToCod}
            onContinueShopping={returnHome}
          />
        ) : null}

        {activeView === 'profile' && currentUser?.role === 'customer' ? (
          <CustomerProfilePage
            currentUser={currentUser}
            customerOrders={customerOrders}
            activeSection={activeCustomerSection}
            onSectionChange={setActiveCustomerSection}
            onOpenSupportCategory={openSupportPage}
            onOpenProduct={openProductPage}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteCustomerAccount}
            profileForm={customerProfileForm}
            onProfileFieldChange={updateCustomerProfileField}
            onSaveProfile={handleSaveCustomerProfile}
            profileMessage={profileMessage}
            isPasswordEditorOpen={isPasswordEditorOpen}
            onTogglePasswordEditor={() => setIsPasswordEditorOpen((current) => !current)}
            defaultAddressText={defaultCustomerAddressText}
            onManageAddress={openAddressModal}
            onTrackShipment={(orderId) => refreshOrderTracking(orderId, 'Shipment status updated in your orders list.')}
            trackingOrderId={trackingOrderId}
          />
        ) : null}

        {activeView === 'support' ? (
          <SupportCenterPage
            activeCategoryId={activeSupportCategory}
            onCategoryChange={setActiveSupportCategory}
            onBack={currentUser?.role === 'customer' ? () => openProfilePage('orders') : returnHome}
          />
        ) : null}

        {activeView === 'auth' ? (
          <section className="utility-shell utility-shell--auth">
            <div className="utility-shell__inner utility-shell__inner--auth">
              <div className={`auth-card auth-card--${currentUser ? 'account' : authMode}`}>
                {currentUser ? (
                  <div className="auth-card__account">
                    <p className="auth-card__eyebrow">{currentUser.role === 'admin' ? 'Admin access' : 'Signed in as'}</p>
                    <h1>
                      {currentUser.firstName} {currentUser.lastName}
                    </h1>
                    <p className="auth-card__subtext">{currentUser.email}</p>

                    <div className="auth-account__grid">
                      <article>
                        <span>Email</span>
                        <strong>{currentUser.email}</strong>
                      </article>
                      <article>
                        <span>{currentUser.role === 'admin' ? 'Role' : 'Phone'}</span>
                        <strong>{currentUser.role === 'admin' ? 'Administrator' : `+91 ${currentUser.phone}`}</strong>
                      </article>
                      <article>
                        <span>{currentUser.role === 'admin' ? 'Access' : 'Birthdate'}</span>
                        <strong>{currentUser.role === 'admin' ? 'Full dashboard control' : currentUser.birthdate}</strong>
                      </article>
                      <article>
                        <span>Gender</span>
                        <strong>{currentUser.gender}</strong>
                      </article>
                    </div>

                    <div className="auth-card__actions">
                      <button
                        type="button"
                        onClick={() =>
                          currentUser.role === 'admin'
                            ? openAdminDashboard()
                            : setActiveView(authReturnView && authReturnView !== 'auth' ? authReturnView : 'home')
                        }
                      >
                        {currentUser.role === 'admin' ? 'Open Dashboard' : 'Continue'}
                      </button>
                      <button type="button" className="is-primary" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="auth-card__intro">
                      <h1>
                        {authMode === 'login'
                          ? (isOtpStepVisible ? 'Verify Login OTP' : 'Login with Legasus Store')
                          : 'Register with Legasus Store'}
                      </h1>
                    </div>

                    <div className="auth-card__tabs">
                      <button className={authMode === 'login' ? 'is-active' : ''} type="button" onClick={() => switchAuthMode('login')}>
                        Login
                      </button>
                      <button className={authMode === 'register' ? 'is-active' : ''} type="button" onClick={() => switchAuthMode('register')}>
                        Register
                      </button>
                    </div>

                    <div className={`auth-panel auth-panel--${authMode}`}>
                      {authMode === 'login' && !isOtpStepVisible ? (
                        <>
                          <div className="auth-social">
                            <button type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoginPending}>
                              {isGoogleLoginPending ? 'Connecting...' : 'Google'}
                            </button>
                          </div>
                          <div className="auth-divider">
                            <span>or</span>
                          </div>
                        </>
                      ) : null}

                      {authError ? <p className="auth-feedback auth-feedback--error">{authError}</p> : null}
                      {authMessage ? <p className="auth-feedback auth-feedback--success">{authMessage}</p> : null}

                      {authMode === 'login' ? (
                        isOtpStepVisible ? (
                          <form className="auth-form" onSubmit={handleOtpStepSubmit}>
                            <p className="auth-form__hint">
                              OTP sent to {loginOtpState.maskedEmail || normalizedLoginEmail}. Enter the 6-digit code to complete login.
                            </p>

                            <label>
                              <span>OTP</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                                value={loginForm.otp}
                                onChange={(event) => updateLoginField('otp', event.target.value.replace(/\D/g, '').slice(0, 6))}
                              />
                            </label>

                            <div className="auth-form__actions">
                              <button className="auth-form__submit" type="submit">
                                Proceed
                              </button>
                              <button className="auth-form__secondary" type="button" onClick={handleRequestEmailOtp}>
                                Resend OTP
                              </button>
                              <button className="auth-form__secondary" type="button" onClick={returnToLoginCredentials}>
                                Back to Login
                              </button>
                            </div>
                          </form>
                        ) : (
                          <form className="auth-form" onSubmit={handleLogin}>
                            <label>
                              <span>Email ID</span>
                              <input type="email" placeholder="Enter Email ID" value={loginForm.email} onChange={(event) => updateLoginField('email', event.target.value)} />
                            </label>

                            <label>
                              <span>Password</span>
                              <div className="auth-form__password">
                                <input type={showLoginPassword ? 'text' : 'password'} placeholder="Enter Password" value={loginForm.password} onChange={(event) => updateLoginField('password', event.target.value)} />
                                <button type="button" onClick={() => setShowLoginPassword((current) => !current)}>
                                  {showLoginPassword ? 'Hide' : 'Show'}
                                </button>
                              </div>
                            </label>

                            <p className="auth-form__hint">
                              {!isBackendReady
                                ? 'Login will use password directly until the backend is connected.'
                                : (normalizedLoginEmail === DEFAULT_ADMIN_EMAIL
                                    ? 'Admin login continues with email and password only.'
                                    : 'After you press login, we will verify the password and open the OTP verification step.')}
                            </p>

                            <div className="auth-form__actions">
                              <button className="auth-form__submit" type="submit">
                                {isBackendReady && normalizedLoginEmail !== DEFAULT_ADMIN_EMAIL ? 'Login' : 'Proceed'}
                              </button>
                            </div>

                            <p className="auth-form__switch">
                              New User?{' '}
                              <button type="button" onClick={() => switchAuthMode('register')}>
                                Create Account
                              </button>
                            </p>
                          </form>
                        )
                      ) : (
                        <form className="auth-form auth-form--register" onSubmit={handleRegister}>
                          <div className="auth-form__split">
                            <label>
                              <span>First Name</span>
                              <input type="text" placeholder="First Name*" value={registerForm.firstName} onChange={(event) => updateRegisterField('firstName', event.target.value)} />
                            </label>
                            <label>
                              <span>Last Name</span>
                              <input type="text" placeholder="Last Name*" value={registerForm.lastName} onChange={(event) => updateRegisterField('lastName', event.target.value)} />
                            </label>
                          </div>

                          <label>
                            <span>Email ID</span>
                            <input type="email" placeholder="Email ID*" value={registerForm.email} onChange={(event) => updateRegisterField('email', event.target.value)} />
                          </label>

                          <label>
                            <span>Choose Password</span>
                            <div className="auth-form__password">
                              <input type={showRegisterPassword ? 'text' : 'password'} placeholder="Choose New Password*" value={registerForm.password} onChange={(event) => updateRegisterField('password', event.target.value)} />
                              <button type="button" onClick={() => setShowRegisterPassword((current) => !current)}>
                                {showRegisterPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </label>

                          <label>
                            <span>Confirm Password</span>
                            <div className="auth-form__password">
                              <input type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password*" value={registerForm.confirmPassword} onChange={(event) => updateRegisterField('confirmPassword', event.target.value)} />
                              <button type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                                {showConfirmPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </label>

                          <label>
                            <span>Birthdate</span>
                            <input type="date" value={registerForm.birthdate} onChange={(event) => updateRegisterField('birthdate', event.target.value)} />
                          </label>

                          <label>
                            <span>Mobile Number</span>
                            <div className="auth-form__phone">
                              <span>+91</span>
                              <input type="tel" inputMode="numeric" placeholder="Mobile Number*" value={registerForm.phone} onChange={(event) => updateRegisterField('phone', event.target.value.replace(/\D/g, '').slice(0, 10))} />
                            </div>
                          </label>

                          <fieldset className="auth-form__gender">
                            <legend>Gender</legend>
                            {['male', 'female', 'other'].map((gender) => (
                              <label key={gender}>
                                <input type="radio" name="gender" checked={registerForm.gender === gender} onChange={() => updateRegisterField('gender', gender)} />
                                <span>{gender[0].toUpperCase() + gender.slice(1)}</span>
                              </label>
                            ))}
                          </fieldset>

                          <button className="auth-form__submit" type="submit">
                            Register
                          </button>

                          <p className="auth-form__switch">
                            Already a customer?{' '}
                            <button type="button" onClick={() => switchAuthMode('login')}>
                              Login
                            </button>
                          </p>
                        </form>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {activeView === 'wishlist' ? (
          <section className="utility-shell utility-shell--wishlist">
            <div className="utility-shell__inner utility-shell__inner--wishlist">
              {wishlistProducts.length ? (
                <>
                  <div className="wishlist-view__header">
                    <h1>
                      My Wishlist <span>({wishlistProducts.length} items)</span>
                    </h1>
                  </div>
                  <div className="wishlist-view__grid">
                    {wishlistProducts.map((product) => (
                      <WishlistItemCard
                        key={product.id}
                        product={product}
                        onOpen={openProductPage}
                        onRemove={toggleWishlist}
                        onMoveToCart={moveWishlistToCart}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="collection-empty">
                  <EmptyGhostIllustration type="wishlist" />
                  <h1>Your wishlist is lonely and looking for love.</h1>
                  <p>Add products to your wishlist, review them anytime and easily move to cart.</p>
                  <div className="collection-empty__actions">
                    <button type="button" onClick={returnHome}>Continue Shopping</button>
                    <button type="button" className="is-primary" onClick={() => openAuthPage('login', 'wishlist')}>Login</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeView === 'cart' ? (
          <section className="utility-shell utility-shell--checkout">
            <CheckoutSteps step={checkoutStep} />
            <div className="utility-shell__inner utility-shell__inner--checkout">
              {cartProducts.length ? (
                <div className="checkout-layout">
                  <div className="checkout-layout__main">
                    {checkoutStep === 'bag' ? (
                      <>
                        <div className="checkout-address-banner">
                          <div>
                            {selectedAddress ? (
                              <>
                                <strong>{selectedAddress.fullName}</strong>
                                <p>
                                  {selectedAddress.flat}, {selectedAddress.street}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                                </p>
                              </>
                            ) : (
                              <p>Please select address.</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutStep('address')
                              openAddressModal()
                            }}
                          >
                            {selectedAddress ? 'Change' : 'Add'}
                          </button>
                        </div>

                        <div className="bag-selection-bar">
                          <label>
                            <input type="checkbox" checked={allCartSelected} onChange={toggleAllCartSelections} />
                            <span>
                              {selectedLineCount}/{cartProducts.length} item selected ({formatAmount(checkoutPricing.subtotal)})
                            </span>
                          </label>
                        </div>

                        <div className="bag-items">
                          {cartProducts.map(({ product, quantity, size, key }) => {
                            const sizeStock = getProductSizeQuantity(product, size)
                            const quantityLimit = Math.max(1, Math.min(5, sizeStock || quantity))

                            return (
                            <article className="bag-item" key={key}>
                              <div className="bag-item__check">
                                <input type="checkbox" checked={selectedCartKeys.includes(key)} onChange={() => toggleCartSelection(key)} />
                              </div>

                              <button className="bag-item__media" type="button" onClick={() => openProductPage(product.id)}>
                                <img src={product.gallery[0].image} alt={product.title} />
                              </button>

                              <div className="bag-item__content">
                                <div className="bag-item__top">
                                  <div className="bag-item__copy">
                                    <button type="button" onClick={() => openProductPage(product.id)}>
                                      {product.title}
                                    </button>
                                    <p>{product.category}</p>
                                  </div>
                                  <div className="bag-item__price">
                                    <strong>{formatAmount(product.price)}</strong>
                                    <span>MRP incl. of all taxes</span>
                                  </div>
                                </div>

                                <div className="bag-item__selectors">
                                  <label>
                                    <span>Size</span>
                                    <select value={size} onChange={(event) => updateCartItemSize(product.id, size, event.target.value)}>
                                      {product.sizes.map((itemSize) => (
                                        <option key={itemSize} value={itemSize} disabled={getProductSizeQuantity(product, itemSize) <= 0 && itemSize !== size}>
                                          {itemSize}{getProductSizeQuantity(product, itemSize) <= 0 ? ' - Out of Stock' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  <label>
                                    <span>Qty</span>
                                    <select value={quantity} onChange={(event) => updateCartItemQuantity(product.id, size, Number(event.target.value))}>
                                      {Array.from({ length: quantityLimit }, (_, index) => index + 1).map((itemQuantity) => (
                                        <option key={itemQuantity} value={itemQuantity}>
                                          {itemQuantity}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <p className={`bag-item__stock${sizeStock <= 0 ? ' is-out' : ''}`}>
                                  {sizeStock <= 0 ? `${size} is out of stock.` : `${sizeStock} item(s) left in ${size}.`}
                                </p>

                                <div className="bag-item__actions">
                                  <button type="button" onClick={() => removeCartItem(product.id, size)}>
                                    Remove
                                  </button>
                                  <button type="button" onClick={() => moveCartToWishlist(product.id, size)}>
                                    Move To Wishlist
                                  </button>
                                </div>
                              </div>
                            </article>
                            )
                          })}
                        </div>

                        {recommendations.length ? (
                          <section className="bag-recommendations">
                            <div className="bag-recommendations__header">
                              <h2>You May Also Like</h2>
                              <button type="button" onClick={() => openProductPage(recommendations[0].id)}>
                                <ChevronIcon />
                              </button>
                            </div>
                            <div className="bag-recommendations__grid">
                              {recommendations.map((product) => (
                                <article className="bag-recommendation-card" key={product.id}>
                                  <button className="bag-recommendation-card__media" type="button" onClick={() => openProductPage(product.id)}>
                                    <img src={product.gallery[0].image} alt={product.title} />
                                  </button>
                                  <div className="bag-recommendation-card__body">
                                    <h3>{product.title}</h3>
                                    <p>{product.category}</p>
                                    <strong>{formatAmount(product.price)}</strong>
                                  </div>
                                  <button
                                    className="bag-recommendation-card__action"
                                    type="button"
                                    onClick={() => addToCart(product.id, product.defaultSize ?? product.sizes[0] ?? 'One Size', 1)}
                                  >
                                    Add Now
                                  </button>
                                </article>
                              ))}
                            </div>
                          </section>
                        ) : null}
                      </>
                    ) : null}

                    {checkoutStep === 'address' ? (
                      <section className="address-step">
                        <div className="address-step__header">
                          <h2>Delivery To</h2>
                        </div>
                        <button className="address-add-card" type="button" onClick={openAddressModal}>
                          <span>+</span>
                          <strong>Add New Address</strong>
                        </button>

                        {savedAddresses.length ? (
                          <div className="address-list">
                            {savedAddresses.map((address) => (
                              <article className={`address-card${address.id === selectedAddressId ? ' is-active' : ''}`} key={address.id}>
                                <button className="address-card__select" type="button" onClick={() => setSelectedAddressId(address.id)}>
                                  <div className="address-card__meta">
                                    <div>
                                      <strong>{address.fullName}</strong>
                                      <span>{address.addressType}</span>
                                    </div>
                                    {address.isDefault ? <b>Default</b> : null}
                                  </div>
                                  <p>
                                    {address.flat}, {address.street}
                                    {address.landmark ? `, ${address.landmark}` : ''}
                                  </p>
                                  <p>
                                    {address.city}, {address.state}, {address.country} - {address.pincode}
                                  </p>
                                  <small>+91 {address.phone}</small>
                                </button>
                              </article>
                            ))}
                          </div>
                        ) : null}
                      </section>
                        ) : null}

                    {checkoutStep === 'payment' ? (
                      <>
                        <section className="payment-step">
                          <h2>Payment Options</h2>

                          <label
                            className={`payment-option${selectedPaymentMethod === 'razorpay' ? ' is-selected' : ''}${
                              !isBackendReady || !paymentConfig.enabled ? ' is-disabled' : ''
                            }`}
                          >
                            <div>
                              <strong>Razorpay Secure Checkout</strong>
                              <p>UPI, cards, wallets and netbanking through Razorpay.</p>
                              <small>
                                {isBackendReady && paymentConfig.enabled
                                  ? 'Online payments are available.'
                                  : 'Start the backend server and add Razorpay keys to enable online payments.'}
                              </small>
                            </div>
                            <input
                              type="radio"
                              name="payment-method"
                              checked={selectedPaymentMethod === 'razorpay'}
                              onChange={() => setSelectedPaymentMethod('razorpay')}
                              disabled={!isBackendReady || !paymentConfig.enabled}
                            />
                          </label>

                          <label className={`payment-option${selectedPaymentMethod === 'cod' ? ' is-selected' : ''}`}>
                            <div>
                              <strong>COD</strong>
                              <p>Cash on Delivery adds Rs 50 COD charges to the order total.</p>
                              {selectedPaymentMethod === 'cod' ? (
                                <small>Extra COD charge applied: {formatAmount(checkoutPricing.codCharge || 50, 2)}</small>
                              ) : null}
                            </div>
                            <input type="radio" name="payment-method" checked={selectedPaymentMethod === 'cod'} onChange={() => setSelectedPaymentMethod('cod')} />
                          </label>
                        </section>

                        {paymentConfig.provider === '__legacy_preview__' ? (
                      <section className="payment-step">
                        <h2>Payment Options</h2>

                        <label
                          className={`payment-option${selectedPaymentMethod === 'razorpay' ? ' is-selected' : ''}${
                            !isBackendReady || !paymentConfig.enabled ? ' is-disabled' : ''
                          }`}
                        >
                          <div>
                            <strong>Razorpay Secure Checkout</strong>
                            <p>UPI, cards, wallets and netbanking through Razorpay.</p>
                            <small>
                              {isBackendReady && paymentConfig.enabled
                                ? 'Online payments are available.'
                                : 'Start the backend server and add Razorpay keys to enable online payments.'}
                            </small>
                            <p>Used ₹ 0 (Balance Left: ₹ 0.00)</p>
                          </div>
                          <input
                            type="radio"
                            name="payment-method"
                            checked={selectedPaymentMethod === 'razorpay'}
                            onChange={() => setSelectedPaymentMethod('razorpay')}
                            disabled={!isBackendReady || !paymentConfig.enabled}
                          />
                        </label>


                        <label className={`payment-option${selectedPaymentMethod === 'cod' ? ' is-selected' : ''}`}>
                          <div>
                            <strong>COD</strong>
                            <p>Cash on Delivery adds â‚¹ 50 to the order total.</p>
                          </div>
                          <input type="radio" name="payment-method" checked={selectedPaymentMethod === 'cod'} onChange={() => setSelectedPaymentMethod('cod')} />
                        </label>
                      </section>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <aside className="checkout-sidebar">
                    {showBagSidebarExtras ? (
                      <button className="checkout-sidebar__primary" type="button" disabled={stepPrimaryDisabled} onClick={stepPrimaryAction}>
                        {stepPrimaryLabel}
                      </button>
                    ) : null}

                    {showBagSidebarExtras ? (
                      <>
                        <section className="checkout-sidebar__membership">
                          <div>
                            <strong>You Are Missing Out On!</strong>
                            <p>Save an additional ₹95 by adding membership to your cart.</p>
                          </div>
                          <button type="button" onClick={() => setMembershipAdded((current) => !current)}>
                            {membershipAdded ? 'Added' : 'Add'}
                          </button>
                        </section>

                        <div className="checkout-sidebar__accordion" hidden>
                          <section className={`checkout-sidepanel${sidebarPanels.coupon ? ' is-open' : ''}`}>
                            <button type="button" onClick={() => toggleSidebarPanel('coupon')}>
                              <span>Apply Coupon</span>
                              <ChevronIcon expanded={sidebarPanels.coupon} />
                            </button>
                            {sidebarPanels.coupon ? <p>Coupons can be applied at the final review stage.</p> : null}
                          </section>

                          <section className={`checkout-sidepanel${sidebarPanels.voucher ? ' is-open' : ''}`}>
                            <button type="button" onClick={() => toggleSidebarPanel('voucher')}>
                              <span>Gift Voucher</span>
                              <ChevronIcon expanded={sidebarPanels.voucher} />
                            </button>
                            {sidebarPanels.voucher ? <p>Gift voucher support is wired as a static preview for now.</p> : null}
                          </section>

                          <label className="checkout-sidepanel checkout-sidepanel--toggle">
                            <span>Gift Wrap (₹ 25)</span>
                            <input type="checkbox" checked={giftWrapEnabled} onChange={(event) => setGiftWrapEnabled(event.target.checked)} />
                          </label>

                          <section className={`checkout-sidepanel${sidebarPanels.points ? ' is-open' : ''}`}>
                            <button type="button" onClick={() => toggleSidebarPanel('points')}>
                              <span>TSS Money / TSS Points</span>
                              <ChevronIcon expanded={sidebarPanels.points} />
                            </button>
                            {sidebarPanels.points ? <p>Reward point redemption can be connected here later.</p> : null}
                          </section>
                        </div>
                      </>
                    ) : null}

                    <section className="billing-card">
                      <h3>Billing Details</h3>
                      {checkoutStep === 'payment' && !selectedCheckoutPaymentMethod ? (
                        <p className="billing-card__hint">Select a payment method to see the final payable amount. COD charges apply only when COD is selected.</p>
                      ) : null}
                      <div className="billing-card__row">
                        <span>Cart Total</span>
                        <strong>{formatAmount(checkoutPricing.subtotal, 2)}</strong>
                      </div>
                      <div className="billing-card__row">
                        <span>GST (5%)</span>
                        <strong>{formatAmount(checkoutPricing.gst, 2)}</strong>
                      </div>
                      <div className="billing-card__row">
                        <span>TCS (0.5%)</span>
                        <strong>{formatAmount(checkoutPricing.tcs, 2)}</strong>
                      </div>
                      <div className="billing-card__row">
                        <span>TDS (0.5%)</span>
                        <strong>{formatAmount(checkoutPricing.tds, 2)}</strong>
                      </div>
                      {selectedCheckoutPaymentMethod === 'cod' ? (
                        <div className="billing-card__row billing-card__row--cod is-active">
                          <span>COD Charges</span>
                          <strong>{formatAmount(checkoutPricing.codCharge, 2)}</strong>
                        </div>
                      ) : null}
                      {checkoutPricing.giftWrapCharge > 0 ? (
                        <div className="billing-card__row">
                          <span>Gift Wrap</span>
                          <strong>{formatAmount(checkoutPricing.giftWrapCharge, 2)}</strong>
                        </div>
                      ) : null}
                      <div className="billing-card__row billing-card__row--total">
                        <span>Total Amount</span>
                        <strong>{formatAmount(checkoutPricing.total, 2)}</strong>
                      </div>
                    </section>

                    <button className="checkout-sidebar__primary checkout-sidebar__primary--footer" type="button" disabled={stepPrimaryDisabled} onClick={stepPrimaryAction}>
                      {stepPrimaryLabel}
                    </button>
                  </aside>
                </div>
              ) : (
                <div className="collection-empty collection-empty--cart">
                  <EmptyGhostIllustration type="cart" />
                  <h1>Your shopping cart is empty.</h1>
                  <p>Please add something soon, carts have feelings too.</p>
                  <div className="popular-tags">
                    <strong>Popular Categories</strong>
                    <div>
                      {POPULAR_CART_CATEGORIES.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="collection-empty__actions">
                    <button type="button" onClick={returnHome}>Continue Shopping</button>
                    <button type="button" className="is-primary" onClick={() => openAuthPage('login', 'cart')}>Login</button>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>

      <AddressModal
        isOpen={(activeView === 'cart' || activeView === 'profile') && isAddressModalOpen}
        form={addressForm}
        onFieldChange={updateAddressFormField}
        onClose={closeAddressModal}
        onSave={saveAddress}
      />

      {isUtilityPage || activeView === 'home' || activeView === 'collection' ? (
        <>
          <BrandBanner />
          <SiteFooter />
        </>
      ) : null}
    </div>
  )
}

export default App
