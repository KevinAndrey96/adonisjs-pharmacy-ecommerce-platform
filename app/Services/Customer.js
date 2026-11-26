'use strict'

const FIELDS = {
  email: 'EMAIL',
  name: 'NAME',
  phone: 'PHONE',
  address: 'ADDRESS',
  city: 'CITY',
  country: 'COUNTRY'
}

const MAX_LENGTH = 150
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Read the shipping details posted by the checkout form. Every field is
 * required; returns null when one is missing, too long or the email is invalid.
 */
function customerFromRequest (request) {
  const customer = {}

  for (const [attribute, input] of Object.entries(FIELDS)) {
    const value = String(request.input(input) || '').trim()
    if (!value || value.length > MAX_LENGTH) {
      return null
    }
    customer[attribute] = value
  }

  customer.email = customer.email.toLowerCase()

  return EMAIL_PATTERN.test(customer.email) ? customer : null
}

module.exports = { customerFromRequest }
