'use strict'

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URLs and bind Controller actions to them.
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

/*
|--------------------------------------------------------------------------
| Storefront Customer Routes
|--------------------------------------------------------------------------
*/
Route.get('/', 'IndexController.index')
Route.get('categories', 'IndexController.categories')
Route.get('product_detail/:id', 'ProductController.index')
Route.get('cart', 'ProductController.cart')
Route.post('checkout', 'ProductController.checkout')
Route.post('pay', 'ProductController.pay')
Route.get('pay', 'ProductController.pay2')
Route.get('search', 'ProductController.search')
Route.get('getProduct', 'ProductController.get')
Route.get('getClient', 'ClientController.get')
Route.get('validateCoupon', 'CouponController.validate')
Route.post('newsletter', 'NewsletterController.store').as('newsletter')
Route.get('confirm', ({ view }) => view.render('order_completed'))

/*
|--------------------------------------------------------------------------
| Admin Authentication Routes
|--------------------------------------------------------------------------
*/
Route.get('login', ({ view }) => view.render('admin.login'))
Route.post('login', 'Admin/UserController.login')
Route.get('logout', 'Admin/UserController.logout')

Route.get('admin', ({ response }) => response.redirect('/dashboard'))
Route.get('admin/login', ({ response }) => response.redirect('/login'))

/*
|--------------------------------------------------------------------------
| Protected Administration Routes
|--------------------------------------------------------------------------
*/
Route.group(() => {
  Route.get('dashboard', 'Admin/DashboardController.index')
  Route.get('products', 'Admin/ProductController.index')
  Route.get('add-product', 'Admin/ProductController.new')
  Route.post('add-product', 'Admin/ProductController.create')
  Route.get('edit-product/:id', 'Admin/ProductController.edit')
  Route.post('edit-product', 'Admin/ProductController.update')
  Route.delete('products', 'Admin/ProductController.destroy')

  Route.get('orders', 'Admin/OrderController.index')
  Route.get('order-detail/:id?', 'Admin/OrderController.show')

  Route.get('clients', 'Admin/ClientController.index')
  Route.get('edit-client/:id', 'Admin/ClientController.edit')
  Route.post('edit-client', 'Admin/ClientController.update')

  Route.get('profile', ({ view }) => view.render('admin.profile'))
}).middleware(['auth'])
