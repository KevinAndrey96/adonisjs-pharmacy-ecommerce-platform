'use strict'

class UserController {
  async login ({ request, auth, response, session }) {
    const { email, password } = request.all()
    try {
      await auth.attempt(email, password)

      return response.redirect('/dashboard')
    } catch {
      session.flash({ type: 'danger', message: 'Credenciales inválidas. Por favor verifique su correo y contraseña.' })

      return response.redirect('/login')
    }
  }

  async logout ({ response, auth }) {
    try {
      await auth.logout()
    } catch {
      // Guests have no session to close.
    }

    return response.redirect('/login')
  }
}

module.exports = UserController
