'use strict'

const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0
})

/**
 * Format an amount in Colombian pesos, e.g. "$ 89.900".
 */
function formatCop (amount) {
  return formatter.format(Number(amount) || 0)
}

/**
 * Replace each product price with its formatted COP string for the views.
 */
function withCopPrices (products) {
  return products.map((product) => ({ ...product, price: formatCop(product.price) }))
}

module.exports = { formatCop, withCopPrices }
