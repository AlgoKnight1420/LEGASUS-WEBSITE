const GST_RATE = 0.05
const TCS_RATE = 0.005
const TDS_RATE = 0.005
const COD_CHARGE = 50
const GIFT_WRAP_CHARGE = 25

const toPaise = (amount) => Math.max(0, Math.round((Number(amount) || 0) * 100))
const fromPaise = (amountPaise) => Number((amountPaise / 100).toFixed(2))
const buildCheckoutLineKey = ({ productId = '', size = '' }) => `${productId}::${size}`

const allocateComponentPaise = (lineSubtotals, componentPaise) => {
  if (!lineSubtotals.length || componentPaise <= 0) {
    return new Array(lineSubtotals.length).fill(0)
  }

  const subtotalPaise = lineSubtotals.reduce((sum, value) => sum + value, 0)
  if (subtotalPaise <= 0) {
    return new Array(lineSubtotals.length).fill(0)
  }

  const allocations = lineSubtotals.map((lineSubtotal) => Math.floor((componentPaise * lineSubtotal) / subtotalPaise))
  let remainder = componentPaise - allocations.reduce((sum, value) => sum + value, 0)
  const sortedIndexes = lineSubtotals
    .map((lineSubtotal, index) => ({ lineSubtotal, index }))
    .sort((left, right) => right.lineSubtotal - left.lineSubtotal)
    .map((entry) => entry.index)

  let pointer = 0
  while (remainder > 0 && sortedIndexes.length) {
    const targetIndex = sortedIndexes[pointer % sortedIndexes.length]
    allocations[targetIndex] += 1
    remainder -= 1
    pointer += 1
  }

  return allocations
}

const calculateCheckoutPricing = ({ lineItems = [], paymentMethod = 'razorpay', giftWrapEnabled = false } = {}) => {
  const normalizedItems = lineItems
    .map((item) => ({
      productId: String(item.productId ?? ''),
      size: String(item.size ?? ''),
      quantity: Math.max(1, Number(item.quantity) || 1),
      unitPricePaise: toPaise(item.unitPrice),
    }))
    .filter((item) => item.productId && item.unitPricePaise > 0)

  const lineSubtotals = normalizedItems.map((item) => item.unitPricePaise * item.quantity)
  const subtotalPaise = lineSubtotals.reduce((sum, value) => sum + value, 0)
  const gstPaise = Math.round(subtotalPaise * GST_RATE)
  const tcsPaise = Math.round(subtotalPaise * TCS_RATE)
  const tdsPaise = Math.round(subtotalPaise * TDS_RATE)
  const codChargePaise = paymentMethod === 'cod' ? toPaise(COD_CHARGE) : 0
  const giftWrapChargePaise = giftWrapEnabled ? toPaise(GIFT_WRAP_CHARGE) : 0

  const gstAllocations = allocateComponentPaise(lineSubtotals, gstPaise)
  const tcsAllocations = allocateComponentPaise(lineSubtotals, tcsPaise)
  const tdsAllocations = allocateComponentPaise(lineSubtotals, tdsPaise)
  const codAllocations = allocateComponentPaise(lineSubtotals, codChargePaise)
  const giftWrapAllocations = allocateComponentPaise(lineSubtotals, giftWrapChargePaise)

  const items = normalizedItems.map((item, index) => {
    const subtotal = lineSubtotals[index]
    const gst = gstAllocations[index]
    const tcs = tcsAllocations[index]
    const tds = tdsAllocations[index]
    const codCharge = codAllocations[index]
    const giftWrapCharge = giftWrapAllocations[index]
    const totalPaise = subtotal + gst + tcs + tds + codCharge + giftWrapCharge

    return {
      key: buildCheckoutLineKey(item),
      productId: item.productId,
      size: item.size,
      quantity: item.quantity,
      subtotalPaise: subtotal,
      gstPaise: gst,
      tcsPaise: tcs,
      tdsPaise: tds,
      codChargePaise: codCharge,
      giftWrapChargePaise: giftWrapCharge,
      totalPaise,
      subtotal: fromPaise(subtotal),
      gst: fromPaise(gst),
      tcs: fromPaise(tcs),
      tds: fromPaise(tds),
      codCharge: fromPaise(codCharge),
      giftWrapCharge: fromPaise(giftWrapCharge),
      total: fromPaise(totalPaise),
    }
  })

  const totalPaise = subtotalPaise + gstPaise + tcsPaise + tdsPaise + codChargePaise + giftWrapChargePaise

  return {
    items,
    subtotalPaise,
    gstPaise,
    tcsPaise,
    tdsPaise,
    codChargePaise,
    giftWrapChargePaise,
    totalPaise,
    subtotal: fromPaise(subtotalPaise),
    gst: fromPaise(gstPaise),
    tcs: fromPaise(tcsPaise),
    tds: fromPaise(tdsPaise),
    codCharge: fromPaise(codChargePaise),
    giftWrapCharge: fromPaise(giftWrapChargePaise),
    total: fromPaise(totalPaise),
    currency: 'INR',
  }
}

export {
  COD_CHARGE,
  GIFT_WRAP_CHARGE,
  GST_RATE,
  TCS_RATE,
  TDS_RATE,
  buildCheckoutLineKey,
  calculateCheckoutPricing,
  fromPaise,
  toPaise,
}
