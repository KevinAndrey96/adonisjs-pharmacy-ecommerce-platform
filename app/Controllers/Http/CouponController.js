'use strict'

const Coupon = use('App/Models/Coupon')

class CouponController {
  async validate ({ request, response }) {
    const coupon = await Coupon.query()
      .where('code', String(request.input('code') || ''))
      .where('status', 'active')
      .first()

    if (!coupon) {
      return response.status(404).json({ error: 'Cupón no válido o ya usado' })
    }

    return response.json({ code: coupon.code, discount: coupon.discount })
  }
}

module.exports = CouponController
