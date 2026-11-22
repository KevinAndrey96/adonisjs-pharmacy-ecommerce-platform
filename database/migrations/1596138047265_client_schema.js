'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ClientSchema extends Schema {
  up () {
    this.create('clients', (table) => {
      table.increments()
      table.string('name', 150).notNullable()
      table.string('email', 255).notNullable().index()
      table.string('phone', 50).nullable()
      table.string('address', 255).nullable()
      table.string('city', 100).nullable()
      table.string('country', 100).nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('clients')
  }
}

module.exports = ClientSchema
