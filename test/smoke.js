'use strict'

/*
 * HTTP smoke test: boots the real AdonisJS server against the migrated and
 * seeded SQLite database and checks the storefront, the JSON endpoints used
 * by the cart and the protection of the backoffice.
 */

const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const net = require('node:net')
const path = require('node:path')

let server
let baseUrl

const CUSTOMER = {
  EMAIL: 'Comprador@Example.com',
  NAME: 'Comprador de prueba',
  PHONE: '3000000000',
  ADDRESS: 'Calle 1 # 2-3',
  CITY: 'Bogotá',
  COUNTRY: 'Colombia'
}

function freePort () {
  return new Promise((resolve, reject) => {
    const probe = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => resolve(port))
    })
    probe.on('error', reject)
  })
}

async function waitUntilReady (url, deadline) {
  while (Date.now() < deadline) {
    try {
      await fetch(url)

      return
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }
  throw new Error(`server not ready at ${url}`)
}

function get (pathname, base = baseUrl) {
  return fetch(`${base}${pathname}`, { redirect: 'manual' })
}

async function startServer (env = {}) {
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, ...env, HOST: '127.0.0.1', PORT: String(port) },
    stdio: ['ignore', 'ignore', 'inherit']
  })
  await waitUntilReady(url, Date.now() + 20000)

  return { url, child }
}

before(async () => {
  const started = await startServer()
  baseUrl = started.url
  server = started.child
})

after(() => {
  server.kill()
})

for (const page of ['/', '/categories', '/cart', '/search?father=Medicamentos', '/search?name=vitamina&sort=pricedesc&min=0&max=50000', '/search?category=vitaminas%20y%20suplementos', '/product_detail/1', '/login', '/confirm', '/pay']) {
  test(`GET ${page} renders`, async () => {
    const response = await get(page)

    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type'), /text\/html/)
  })
}

test('getProduct returns the product as JSON', async () => {
  const response = await get('/getProduct?id=1')
  const body = await response.json()

  assert.equal(response.status, 200)
  assert.equal(body.id, 1)
  assert.ok(Number(body.price) > 0)
})

test('getProduct returns 404 for an unknown product', async () => {
  const response = await get('/getProduct?id=999999')

  assert.equal(response.status, 404)
})

test('an unknown product page is not found', async () => {
  const response = await get('/product_detail/999999')

  assert.equal(response.status, 404)
})

for (const page of ['/dashboard', '/products', '/orders', '/clients', '/admin']) {
  test(`GET ${page} sends guests to the login page`, async () => {
    let response = await get(page)
    if (page === '/admin') {
      response = await get(response.headers.get('location'))
    }

    assert.equal(response.status, 302)
    assert.equal(response.headers.get('location'), '/login')
  })
}

test('customer data is not exposed by email lookup', async () => {
  const response = await get('/getClient?email=cliente%40example.com')

  assert.equal(response.status, 404)
})

test('validateCoupon returns only the code and discount of an active coupon', async () => {
  const response = await get('/validateCoupon?code=SALUD20')

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { code: 'SALUD20', discount: 20 })
})

test('validateCoupon returns 404 for an unknown coupon', async () => {
  const response = await get('/validateCoupon?code=NOPE')

  assert.equal(response.status, 404)
})

function cookieJar () {
  const cookies = new Map()

  return {
    store (response) {
      for (const header of response.headers.getSetCookie()) {
        const [pair] = header.split(';')
        const index = pair.indexOf('=')
        cookies.set(pair.slice(0, index), pair.slice(index + 1))
      }
    },
    header () {
      return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ')
    }
  }
}

function csrfToken (html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/)
  assert.ok(match, 'csrf field present')

  return match[1]
}

async function post (jar, pathname, fields, base = baseUrl) {
  const response = await fetch(`${base}${pathname}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', cookie: jar.header() },
    body: new URLSearchParams(fields).toString(),
    redirect: 'manual'
  })
  jar.store(response)

  return response
}

function queryOne (sql, params = []) {
  const sqlite3 = require('sqlite3')
  const db = new sqlite3.Database(path.join(__dirname, '..', 'database', 'development.sqlite'))

  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      db.close()
      if (error) {
        reject(error)
      } else {
        resolve(row)
      }
    })
  })
}

test('a guest buys with catalog prices, a clamped quantity, a coupon and shipping', async () => {
  const jar = cookieJar()
  const cartPage = await get('/cart')
  jar.store(cartPage)

  const product = await (await get('/getProduct?id=1')).json()
  const cart = JSON.stringify({ cart: [{ Product: 1, Quantity: 500, Price: 1 }, { Product: 999999, Quantity: 1 }] })
  const couponCode = `PRUEBA${process.pid}`
  await queryOne("INSERT INTO coupons (code, discount, status) VALUES (?, 10, 'active')", [couponCode])

  const checkout = await post(jar, '/checkout', { _csrf: csrfToken(await cartPage.text()), CART: cart })
  assert.equal(checkout.status, 200)
  const checkoutHtml = await checkout.text()
  assert.doesNotMatch(checkoutHtml, /value="gateway"/)

  const pay = await post(jar, '/pay', {
    _csrf: csrfToken(checkoutHtml),
    CART: cart,
    ...CUSTOMER,
    COUPON: couponCode,
    payment_type: 'gateway'
  })

  assert.equal(pay.status, 302)
  assert.equal(pay.headers.get('location'), '/confirm')

  const subtotal = Number(product.price) * 20
  const order = await queryOne('SELECT * FROM orders ORDER BY id DESC LIMIT 1')
  assert.equal(Number(order.value), subtotal - Math.round(subtotal * 0.1) + 1700)
  assert.equal(order.gateway, 'Contraentrega')
  assert.equal(order.status, 'pending')

  const line = await queryOne(`SELECT * FROM order_products WHERE order_id = ${order.id}`)
  assert.equal(line.quantity, 20)

  const coupon = await queryOne('SELECT status FROM coupons WHERE code = ?', [couponCode])
  assert.equal(coupon.status, 'used')
})

test('newsletter sign-up issues a single welcome coupon per email', async () => {
  const jar = cookieJar()
  const home = await get('/')
  jar.store(home)
  const token = csrfToken(await home.text())
  const email = `boletin-${process.pid}@example.com`

  const first = await post(jar, '/newsletter', { _csrf: token, email })
  assert.equal(first.status, 200)
  assert.match(await first.text(), /Gracias por suscribirte/)

  const second = await post(jar, '/newsletter', { _csrf: token, email })
  assert.match(await second.text(), /ya se encuentra registrado/)

  const coupon = await queryOne('SELECT * FROM coupons ORDER BY id DESC LIMIT 1')
  assert.match(coupon.code, /^[0-9A-F]{10}$/)
  assert.equal(coupon.discount, 10)
})

test('checkout without a CSRF token is rejected', async () => {
  const response = await fetch(`${baseUrl}/pay`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'EMAIL=a%40example.com&CART=%7B%22cart%22%3A%5B%5D%7D',
    redirect: 'manual'
  })

  assert.equal(response.status, 403)
})

test('an unreachable payment gateway falls back to the confirmation page', async (t) => {
  const gateway = await startServer({
    ENABLE_PAYMENT_GATEWAY: 'true',
    GATEWAY_USERNAME: 'demo',
    GATEWAY_PASSWORD: 'demo',
    GATEWAY_URL: 'http://127.0.0.1:9/register.do'
  })
  t.after(() => gateway.child.kill())

  const jar = cookieJar()
  const cartPage = await get('/cart', gateway.url)
  jar.store(cartPage)
  const cart = JSON.stringify({ cart: [{ Product: 1, Quantity: 1 }] })

  const checkout = await post(jar, '/checkout', { _csrf: csrfToken(await cartPage.text()), CART: cart }, gateway.url)
  const pay = await post(jar, '/pay', {
    _csrf: csrfToken(await checkout.text()),
    CART: cart,
    payment_type: 'gateway',
    ...CUSTOMER
  }, gateway.url)

  assert.equal(pay.status, 302)
  assert.equal(pay.headers.get('location'), '/confirm')

  const order = await queryOne('SELECT * FROM orders ORDER BY id DESC LIMIT 1')
  assert.equal(order.status, 'pending')
  assert.equal(order.gateway, 'Contraentrega')
})

test('checkout with incomplete shipping details goes back to the cart', async () => {
  const jar = cookieJar()
  const cartPage = await get('/cart')
  jar.store(cartPage)
  const cart = JSON.stringify({ cart: [{ Product: 1, Quantity: 1 }] })

  const response = await post(jar, '/pay', { _csrf: csrfToken(await cartPage.text()), CART: cart, EMAIL: 'sin-datos@example.com' })

  assert.equal(response.status, 302)
  assert.equal(response.headers.get('location'), '/cart')
})
