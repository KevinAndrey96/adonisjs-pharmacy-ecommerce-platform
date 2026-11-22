'use strict'

const Order = use('App/Models/Order')
const Client = use('App/Models/Client')
const OrderProduct = use('App/Models/OrderProduct')

class OrderController {
  formatCurrency (locales, currency, fractionDigits, number) {
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits
    }).format(number || 0)
  }

  async index ({ view }) {
    const orders = await Order.query().orderBy('created_at', 'desc').fetch()
    const ordersList = orders.toJSON()

    for (const order of ordersList) {
      if (order.client_id) {
        order.client = await Client.find(order.client_id)
      }
      order.formattedValue = this.formatCurrency('es-CO', 'COP', 0, order.value)
    }

    return view.render('admin.orders', { orders: ordersList })
  }

  async show ({ params, view }) {
    const order = await Order.findOrFail(params.id)
    const client = order.client_id ? await Client.find(order.client_id) : null
    const orderProducts = await OrderProduct.query().where('order_id', order.id).fetch()

    return view.render('admin.order-detail', {
      order: order.toJSON(),
      client: client ? client.toJSON() : null,
      items: orderProducts.toJSON(),
      formattedValue: this.formatCurrency('es-CO', 'COP', 0, order.value)
    })
  }
}

module.exports = OrderController
