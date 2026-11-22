'use strict'

const Client = use('App/Models/Client')

class ClientController {
  async index ({ view }) {
    const clients = await Client.query().orderBy('created_at', 'desc').fetch()
    return view.render('admin.clients', { clients: clients.toJSON() })
  }

  async edit ({ params, view }) {
    const client = await Client.findOrFail(params.id)
    return view.render('admin.edit-client', { client: client.toJSON() })
  }

  async update ({ request, response, session }) {
    const id = request.input('id')
    const client = await Client.findOrFail(id)
    client.name = request.input('name')
    client.phone = request.input('phone')
    client.address = request.input('address')
    client.city = request.input('city')
    client.country = request.input('country')
    await client.save()

    session.flash({ type: 'success', message: 'Datos de cliente actualizados correctamente' })
    return response.redirect('/clients')
  }
}

module.exports = ClientController
