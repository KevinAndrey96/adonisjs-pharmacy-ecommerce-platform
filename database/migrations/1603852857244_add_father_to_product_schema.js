'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFatherToProductSchema extends Schema {
  async up () {
    const exists = await this.hasColumn('products', 'father')
    if (!exists) {
      this.table('products', (table) => {
        table.string('father', 200).nullable().after('category')
      })
    }
  }

  async down () {
    const exists = await this.hasColumn('products', 'father')
    if (exists) {
      this.table('products', (table) => {
        table.dropColumn('father')
      })
    }
  }
}

module.exports = AddFatherToProductSchema
