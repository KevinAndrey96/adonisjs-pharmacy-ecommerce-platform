'use strict'

const Product = use('App/Models/Product')
const Category = use('App/Models/Category')

class ProductController {
  formatCurrency (locales, currency, fractionDigits, number) {
    return new Intl.NumberFormat(locales, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: fractionDigits
    }).format(number || 0)
  }

  async index ({ view }) {
    const products = await Product.all()
    const productsFormatted = products.toJSON().map((prod) => ({
      ...prod,
      price: this.formatCurrency('es-CO', 'COP', 0, prod.price)
    }))

    return view.render('admin.products', { products: productsFormatted })
  }

  async new ({ view }) {
    const categories = await Category.all()
    return view.render('admin.add-product', { categories: categories.toJSON() })
  }

  async create ({ request, response, session }) {
    const productData = request.only(['name', 'code', 'category', 'father', 'price', 'short_description', 'long_description'])
    const product = await Product.create(productData)

    try {
      const photo = request.file('image', {
        types: ['image'],
        size: '10mb',
        extnames: ['png', 'gif', 'jpg', 'jpeg', 'PNG', 'GIF', 'JPG', 'JPEG']
      })
      if (photo) {
        const filename = `${product.id}.png`
        await photo.move('./public/files', {
          name: filename,
          overwrite: true
        })
        if (photo.moved()) {
          product.image = `/files/${filename}`
          await product.save()
        }
      }
      session.flash({ type: 'success', message: 'Producto agregado exitosamente al catálogo' })
    } catch (e) {
      session.flash({ type: 'warning', message: 'Producto creado, pero ocurrió un problema al guardar la imagen.' })
    }

    return response.redirect('/products')
  }

  async edit ({ params, view }) {
    const product = await Product.findOrFail(params.id)
    const categories = await Category.all()
    return view.render('admin.edit-product', { product: product.toJSON(), categories: categories.toJSON() })
  }

  async update ({ request, response, session }) {
    const id = request.input('id')
    const product = await Product.findOrFail(id)

    product.name = request.input('name')
    product.code = request.input('code')
    product.category = request.input('category')
    product.father = request.input('father')
    product.price = request.input('price')
    product.short_description = request.input('short_description')
    product.long_description = request.input('long_description')
    await product.save()

    try {
      const photo = request.file('image', {
        types: ['image'],
        size: '10mb',
        extnames: ['png', 'gif', 'jpg', 'jpeg', 'PNG', 'GIF', 'JPG', 'JPEG']
      })
      if (photo) {
        const filename = `${product.id}.png`
        await photo.move('./public/files', {
          name: filename,
          overwrite: true
        })
        if (photo.moved()) {
          product.image = `/files/${filename}`
          await product.save()
        }
      }
      session.flash({ type: 'success', message: 'Producto actualizado correctamente' })
    } catch (e) {
      session.flash({ type: 'warning', message: 'Producto actualizado sin cambios en la imagen.' })
    }

    return response.redirect('/products')
  }

  async destroy ({ request, response, session }) {
    const id = request.input('id')
    const product = await Product.findOrFail(id)
    await product.delete()
    session.flash({ type: 'info', message: 'Producto eliminado correctamente' })
    return response.redirect('/products')
  }
}

module.exports = ProductController
