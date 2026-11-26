'use strict'

const axios = require('axios')
const FormData = require('form-data')

const Product = use('App/Models/Product')
const Client = use('App/Models/Client')
const Order = use('App/Models/Order')
const OrderProduct = use('App/Models/OrderProduct')
const Coupon = use('App/Models/Coupon')
const Category = use('App/Models/Category')
const Env = use('Env')
const Logger = use('Logger')
const { formatCop, withCopPrices } = use('App/Services/Money')
const { resolveCartLines } = use('App/Services/Cart')
const { customerFromRequest } = use('App/Services/Customer')

const SHIPPING_COP = 1700
const GATEWAY_TIMEOUT_MS = 10000

const SORTS = {
  pricedesc: ['price', 'desc'],
  priceasc: ['price', 'asc'],
  alphadesc: ['name', 'desc'],
  alphaasc: ['name', 'asc']
}

function gatewayEnabled () {
  return Env.get('ENABLE_PAYMENT_GATEWAY') === 'true'
}

class ProductController {
  async index ({ params, view }) {
    const product = await Product.findOrFail(params.id)

    const [relateds, categories] = await Promise.all([
      Product.query()
        .where('category', '=', product.category)
        .where('id', '!=', product.id)
        .limit(6)
        .fetch(),
      Category.all()
    ])

    return view.render('product_detail', {
      product: { ...product.toJSON(), price: formatCop(product.price) },
      relateds: withCopPrices(relateds.toJSON()),
      categories: categories.toJSON()
    })
  }

  async search ({ request, view }) {
    const { sort, father, name, category, min, max } = request.get()
    const [sortColumn, sortDirection] = SORTS[sort] || SORTS.alphaasc

    const query = Product.query().orderBy(sortColumn, sortDirection)
    let title = 'Todos los productos'

    if (father) {
      query.where('father', 'LIKE', `%${father}%`)
      title = father
    }

    if (name) {
      query.where('name', 'LIKE', `%${name}%`)
      title = `Búsqueda: "${name}"`
    }

    if (category) {
      query.whereRaw('LOWER(category) = ?', [String(category).toLowerCase()])
      title = category
    }

    const minPrice = parseInt(min, 10)
    if (Number.isFinite(minPrice)) {
      query.where('price', '>=', minPrice)
    }

    const maxPrice = parseInt(max, 10)
    if (Number.isFinite(maxPrice)) {
      query.where('price', '<=', maxPrice)
    }

    const products = (await query.fetch()).toJSON()
    const parent = father || (products[0] && products[0].father)
    const categories = parent
      ? await Product.query().where('father', parent).pluck('category').groupBy('category')
      : []

    return view.render('products_list', {
      products: withCopPrices(products),
      category: { name: title },
      categories
    })
  }

  async get ({ request, response }) {
    const product = await Product.find(request.input('id'))
    if (!product) {
      return response.status(404).json({ error: 'Producto no encontrado' })
    }

    return response.json(product)
  }

  async cart ({ view }) {
    return view.render('cart')
  }

  async checkout ({ request, view }) {
    const rawCart = request.input('CART') || '{"cart":[]}'
    const lines = await resolveCartLines(rawCart)
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0)

    return view.render('checkout', {
      cart: lines.map(({ product, quantity, total }) => ({
        id: product.id,
        name: product.name,
        code: product.code,
        quantity,
        price: total,
        prettyprice: formatCop(total)
      })),
      prices: { subtotal, shipping: SHIPPING_COP, total: subtotal + SHIPPING_COP },
      prettyprices: {
        subtotal: formatCop(subtotal),
        shipping: formatCop(SHIPPING_COP),
        total: formatCop(subtotal + SHIPPING_COP)
      },
      gatewayEnabled: gatewayEnabled(),
      originalcart: rawCart
    })
  }

  async pay ({ request, response, session }) {
    const customer = customerFromRequest(request)
    const lines = await resolveCartLines(request.input('CART'))

    if (!customer || lines.length === 0) {
      session.flash({ error: 'Completa tus datos de envío y agrega al menos un producto al carrito.' })

      return response.redirect('/cart')
    }

    const client = await this.upsertClient(customer)
    const useGateway = request.input('payment_type') === 'gateway' && gatewayEnabled()

    const order = await Order.create({
      client_id: client.id,
      status: 'pending',
      value: 0,
      gateway: 'Contraentrega'
    })

    let subtotal = 0
    let summary = ''
    for (const line of lines) {
      await OrderProduct.create({ order_id: order.id, product_id: line.product.id, quantity: line.quantity })
      subtotal += line.total
      summary += `${line.product.name}: ${formatCop(line.product.price)} x${line.quantity} - `
    }

    const coupon = await this.redeemCoupon(request.input('COUPON'))
    if (coupon) {
      subtotal -= Math.round((subtotal * coupon.discount) / 100)
      summary += ` / Cupón ${coupon.code}: -${coupon.discount}%`
    }

    order.value = subtotal + SHIPPING_COP
    order.details = `${summary} Total: ${formatCop(order.value)} (envío ${formatCop(SHIPPING_COP)})`
    await order.save()

    await this.sendConfirmation(customer.email, order)

    if (useGateway) {
      const formUrl = await this.registerGatewayPayment(order)
      if (formUrl) {
        return response.redirect(formUrl)
      }
    }

    return response.redirect('/confirm')
  }

  async pay2 ({ view }) {
    return view.render('order_completed')
  }

  async upsertClient (customer) {
    const client = await Client.findBy('email', customer.email)
    if (!client) {
      return Client.create(customer)
    }

    client.merge(customer)
    await client.save()

    return client
  }

  async redeemCoupon (code) {
    if (!code) {
      return null
    }

    const coupon = await Coupon.query().where('code', code).where('status', 'active').first()
    if (!coupon) {
      return null
    }

    coupon.status = 'used'
    await coupon.save()

    return coupon
  }

  async sendConfirmation (email, order) {
    try {
      const Mail = use('Mail')
      await Mail.send('emails.order', { order: order.toJSON(), prods: order.details }, (message) => {
        message
          .to(email)
          .from(Env.get('MAIL_FROM', 'no-reply@example.com'))
          .subject(`Confirmación de pedido #${order.id}`)
      })
    } catch (error) {
      Logger.warning('order confirmation email not sent: %s', error.message)
    }
  }

  async registerGatewayPayment (order) {
    try {
      const form = new FormData()
      form.append('userName', Env.getOrFail('GATEWAY_USERNAME'))
      form.append('password', Env.getOrFail('GATEWAY_PASSWORD'))
      form.append('orderNumber', String(order.id))
      form.append('amount', `${order.value}00`)
      form.append('returnUrl', `${Env.get('APP_URL', 'http://127.0.0.1:3333')}/pay`)
      form.append('description', order.details)

      const { data } = await axios.post(
        Env.get('GATEWAY_URL', 'https://ecouat.credibanco.com/payment/rest/register.do'),
        form,
        { headers: form.getHeaders(), timeout: GATEWAY_TIMEOUT_MS }
      )
      if (!data || !data.orderId || !data.formUrl) {
        Logger.warning('payment gateway registration rejected for order %s', order.id)

        return null
      }

      order.gateway = data.orderId
      await order.save()

      return data.formUrl
    } catch (error) {
      Logger.warning('payment gateway registration: %s', error.message)

      return null
    }
  }
}

module.exports = ProductController
