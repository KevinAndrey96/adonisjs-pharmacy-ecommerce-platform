'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class NewsletterSchema extends Schema {
  up () {
    this.create('newsletters', (table) => {
      table.increments()
      table.string('email', 255).notNullable().unique()
      table.string('first_name', 100).nullable()
      table.string('last_name', 100).nullable()
      table.string('phone', 50).nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('newsletters')
  }
}

module.exports = NewsletterSchema
