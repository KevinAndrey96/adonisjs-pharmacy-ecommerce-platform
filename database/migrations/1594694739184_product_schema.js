'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ProductSchema extends Schema {
  up () {
    this.create('products', (table) => {
      table.increments()
      table.string('name', 200).notNullable()
      table.string('code', 50).nullable()
      table.string('category', 200).nullable()
      table.string('father', 200).nullable()
      table.float('price').defaultTo(0)
      table.text('short_description').nullable()
      table.text('long_description').nullable()
      table.text('image').nullable()
      table.timestamps()
    })
  }

  down () {
    this.drop('products')
  }
}

module.exports = ProductSchema
