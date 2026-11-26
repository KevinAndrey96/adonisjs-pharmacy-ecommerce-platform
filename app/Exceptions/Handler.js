'use strict'

const BaseExceptionHandler = use('BaseExceptionHandler')

/**
 * Sends guests that hit the backoffice to the login page instead of a bare 401.
 */
class ExceptionHandler extends BaseExceptionHandler {
  async handle (error, { response }) {
    if (error.name === 'InvalidSessionException') {
      return response.redirect('/login')
    }

    return super.handle(...arguments)
  }
}

module.exports = ExceptionHandler
