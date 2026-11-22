'use strict'

class UserController {
  async login ({ request, auth, response, session }) {
    const { email, password } = request.all()
    try {
      await auth.attempt(email, password)
      return response.redirect('/dashboard')
    } catch (error) {
      session.flash({ type: 'danger', message: 'Credenciales inválidas. Por favor verifique su correo y contraseña.' })
      return response.redirect('/login')
    }
  }

  show ({ auth, params }) {
    if (auth.user.id !== Number(params.id)) {
      return 'Acceso denegado: no puede ver el perfil de otro usuario.'
    }
    return auth.user
  }

  async logout ({ response, auth }) {
    try {
      await auth.logout()
    } catch (e) {}
    return response.redirect('/login')
  }
}

module.exports = UserController
