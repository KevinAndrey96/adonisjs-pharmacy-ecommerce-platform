'use strict'

const Product = use('App/Models/Product')

const MAX_QUANTITY = 20

/**
 * Parse the cart the storefront keeps in localStorage and posts as JSON.
 * Anything malformed becomes an empty cart.
 */
function parseCart (raw) {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw

    return parsed && Array.isArray(parsed.cart) ? parsed.cart : []
  } catch {
    return []
  }
}

/**
 * Resolve cart items against the catalog. Prices always come from the database,
 * never from the browser, and quantities are clamped to 1..MAX_QUANTITY.
 */
async function resolveCartLines (raw) {
  const lines = []

  for (const item of parseCart(raw)) {
    const product = await Product.find(parseInt(item.Product, 10))
    if (!product) {
      continue
    }

    const requested = parseInt(item.Quantity, 10) || 1
    const quantity = Math.min(Math.max(requested, 1), MAX_QUANTITY)

    lines.push({ product, quantity, total: quantity * parseInt(product.price, 10) })
  }

  return lines
}

module.exports = { MAX_QUANTITY, parseCart, resolveCartLines }
