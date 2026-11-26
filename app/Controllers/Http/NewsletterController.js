'use strict'

const crypto = require('crypto')

const Newsletter = use('App/Models/Newsletter')
const Coupon = use('App/Models/Coupon')
const Env = use('Env')
const Logger = use('Logger')

const WELCOME_DISCOUNT = 10

function alertAndGoHome (message) {
  return `<script>window.alert(${JSON.stringify(message)});window.location.href = '/'</script>`
}

class NewsletterController {
  async store ({ request }) {
    const data = request.only(['email', 'first_name', 'last_name', 'phone'])
    const email = String(data.email || '').trim().toLowerCase()

    if (!email || await Newsletter.findBy('email', email)) {
      return alertAndGoHome('Este correo ya se encuentra registrado en el boletín.')
    }

    await Newsletter.create({ ...data, email })
    const coupon = await Coupon.create({
      code: crypto.randomBytes(5).toString('hex').toUpperCase(),
      discount: WELCOME_DISCOUNT,
      status: 'active'
    })

    try {
      const Mail = use('Mail')
      await Mail.send('emails.coupon', { coupon: coupon.toJSON() }, (message) => {
        message
          .to(email)
          .from(Env.get('MAIL_FROM', 'no-reply@example.com'))
          .subject('Bienvenido: tu cupón de descuento')
      })
    } catch (error) {
      Logger.warning('newsletter coupon email not sent: %s', error.message)
    }

    return alertAndGoHome('Gracias por suscribirte. Te enviamos un cupón de descuento a tu correo.')
  }
}

module.exports = NewsletterController
