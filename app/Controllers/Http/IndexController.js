'use strict'

const Product = use('App/Models/Product')
const Category = use('App/Models/Category')
const { withCopPrices } = use('App/Services/Money')

const HOME_SHELVES = [
  { equals: ['ENJUAGES-BUCALES', 'ORTODONCIA'], like: ['CREMAS DENTALES NI%'] },
  { equals: ['JABONES Y GEL ANTIBACTERIAL'], like: ['AFEITADA Y DEPILACI%', 'TOALLITAS-PA%'] },
  { equals: ['JABONES-GELES', 'REPELENTES'], like: [] },
  { equals: ['DESODORANTES', 'SEDAS DENTALES'], like: [] },
  { equals: ['BLANQUEADORES', 'CUIDADO-PROTESIS', 'CEPILLOS DENTALES ADULTOS'], like: [] }
]

async function shelfProducts ({ equals, like }) {
  const products = await Product.query()
    .where((query) => {
      query.whereIn('category', equals)
      for (const pattern of like) {
        query.orWhere('category', 'LIKE', pattern)
      }
    })
    .fetch()

  return withCopPrices(products.toJSON())
}

class IndexController {
  async index ({ view }) {
    const [shelves, categories] = await Promise.all([
      Promise.all(HOME_SHELVES.map(shelfProducts)),
      Category.all()
    ])

    return view.render('index', {
      cats1: shelves[0],
      cats2: shelves[1],
      cats3: shelves[2],
      cats4: shelves[3],
      cats5: shelves[4],
      categories: categories.toJSON()
    })
  }

  async categories ({ view }) {
    const categories = await Category.all()

    return view.render('categories', { categories: categories.toJSON() })
  }
}

module.exports = IndexController
