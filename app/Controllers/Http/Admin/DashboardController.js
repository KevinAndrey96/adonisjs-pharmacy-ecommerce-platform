'use strict'

const Product = use('App/Models/Product')
const Category = use('App/Models/Category')
const Order = use('App/Models/Order')
const Client = use('App/Models/Client')

class DashboardController {
  formatCurrency (locales, currency, fractionDigits, number) {
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits
    }).format(number || 0)
  }

  async index ({ view }) {
    const productsCount = await Product.getCount()
    const categoriesCount = await Category.getCount()
    const ordersCount = await Order.getCount()
    const clientsCount = await Client.getCount()

    const orders = await Order.query().orderBy('created_at', 'desc').limit(5).fetch()
    const totalRevenueResult = await Order.query().sum('value as total')
    const totalRevenue = totalRevenueResult[0]?.total || 0

    return view.render('admin.dashboard', {
      metrics: {
        products: productsCount,
        categories: categoriesCount,
        orders: ordersCount,
        clients: clientsCount,
        revenue: this.formatCurrency('es-CO', 'COP', 0, totalRevenue)
      },
      latestOrders: orders.toJSON()
    })
  }
}

module.exports = DashboardController
