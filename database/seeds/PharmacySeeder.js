'use strict'

/*
|--------------------------------------------------------------------------
| PharmacySeeder
|--------------------------------------------------------------------------
|
| Seeds initial pharmaceutical categories, essential products, coupons,
| and an administrative user for PharmaStore.
|
*/

const User = use('App/Models/User')
const Category = use('App/Models/Category')
const Product = use('App/Models/Product')
const Coupon = use('App/Models/Coupon')

class PharmacySeeder {
  async run () {
    // 1. Seed Admin User
    const existingAdmin = await User.findBy('email', 'admin@example.com')
    if (!existingAdmin) {
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'adminpassword123'
      })
      console.log('✓ Admin user created (admin@example.com / adminpassword123)')
    }

    // 2. Seed Categories
    const categoriesData = [
      { name: 'Analgésicos y Antiinflamatorios', image: 'analgesicos.png' },
      { name: 'Vitaminas y Suplementos', image: 'vitaminas.png' },
      { name: 'Cuidado de la Piel', image: 'cuidado_piel.png' },
      { name: 'Primeros Auxilios', image: 'primeros_auxilios.png' },
      { name: 'Higiene Oral', image: 'higiene_oral.png' },
      { name: 'Cuidado Infantil', image: 'cuidado_infantil.png' }
    ]

    for (const cat of categoriesData) {
      const exists = await Category.findBy('name', cat.name)
      if (!exists) {
        await Category.create(cat)
      }
    }
    console.log(`✓ Seeded ${categoriesData.length} categories`)

    // 3. Seed Products
    const productsData = [
      {
        name: 'Acetaminofén 500mg x 20 Tabletas',
        code: 'MED-ACE-500',
        category: 'Analgésicos y Antiinflamatorios',
        father: 'Medicamentos',
        price: 5200,
        short_description: 'Alivio rápido de dolor de cabeza, dolor muscular y fiebre.',
        long_description: 'Analgésico y antipirético de rápida absorción. Indicado para el tratamiento sintomático de dolores de leves a moderados y estados febriles.',
        image: 'med-ace-500.png'
      },
      {
        name: 'Ibuprofeno 400mg Cápsulas Blandas x 10',
        code: 'MED-IBU-400',
        category: 'Analgésicos y Antiinflamatorios',
        father: 'Medicamentos',
        price: 8900,
        short_description: 'Antiinflamatorio no esteroideo para dolores articulares e inflamación.',
        long_description: 'Cápsulas líquidas de gel de rápida acción indicadas para dolor dental, cefalea, dolores musculares y dismenorrea.',
        image: 'med-ibu-400.png'
      },
      {
        name: 'Vitamina C 1000mg + Zinc Efervescente x 10',
        code: 'VIT-CZ-1000',
        category: 'Vitaminas y Suplementos',
        father: 'Bienestar',
        price: 18500,
        short_description: 'Refuerzo del sistema inmune con sabor a naranja.',
        long_description: 'Suplemento dietario antioxidante que contribuye a las defensas naturales del cuerpo y a la absorción eficiente de nutrientes.',
        image: 'vit-cz-1000.png'
      },
      {
        name: 'Multivitamínico Complex x 60 Tabletas',
        code: 'VIT-MULTI-60',
        category: 'Vitaminas y Suplementos',
        father: 'Bienestar',
        price: 34000,
        short_description: 'Fórmula completa con 13 vitaminas y 10 minerales esenciales.',
        long_description: 'Energía diaria y vitalidad física y mental. Contiene Vitaminas A, C, D, E y Complejo B para el rendimiento óptimo.',
        image: 'vit-multi-60.png'
      },
      {
        name: 'Protector Solar SPF 50+ Gel Toque Seco 120ml',
        code: 'DERM-SUN-50',
        category: 'Cuidado de la Piel',
        father: 'Dermatología',
        price: 49900,
        short_description: 'Alta protección UVA/UVB con acabado mate no graso.',
        long_description: 'Fórmula dermatológicamente probada para todo tipo de piel, resistente al agua y al sudor, sin efecto mimo ni brillo.',
        image: 'derm-sun-50.png'
      },
      {
        name: 'Alcohol Antiséptico 70% Frasco 500ml',
        code: 'AUX-ALC-70',
        category: 'Primeros Auxilios',
        father: 'Botiquín',
        price: 4500,
        short_description: 'Desinfectante tópico y sanitizante de grado medicinal.',
        long_description: 'Solución hidroalcohólica al 70% para desinfección de heridas superficiales y antisepsia de manos e instrumental.',
        image: 'aux-alc-70.png'
      },
      {
        name: 'Termómetro Digital Infrarrojo Sin Contacto',
        code: 'DISP-TERM-IR',
        category: 'Primeros Auxilios',
        father: 'Equipos Médicos',
        price: 65000,
        short_description: 'Lectura instantánea de temperatura en 1 segundo con pantalla LCD.',
        long_description: 'Sensor óptico de alta precisión para medición en frente sin contacto a distancia de 3 a 5 cm con alarma de fiebre.',
        image: 'disp-term-ir.png'
      },
      {
        name: 'Enjuague Bucal Antiséptico Menta 500ml',
        code: 'HIG-ENJ-500',
        category: 'Higiene Oral',
        father: 'Cuidado Personal',
        price: 14200,
        short_description: 'Protección contra placa bacteriana y aliento fresco prolongado.',
        long_description: 'Fórmula sin alcohol que elimina hasta el 99.9% de gérmenes causantes de la gingivitis y caries dental.',
        image: 'hig-enj-500.png'
      }
    ]

    for (const prod of productsData) {
      const exists = await Product.findBy('code', prod.code)
      if (!exists) {
        await Product.create(prod)
      }
    }
    console.log(`✓ Seeded ${productsData.length} products`)

    // 4. Seed Coupons
    const couponsData = [
      { code: 'BIENVENIDO10', discount: 10, status: 'active' },
      { code: 'SALUD20', discount: 20, status: 'active' }
    ]

    for (const coup of couponsData) {
      const exists = await Coupon.findBy('code', coup.code)
      if (!exists) {
        await Coupon.create(coup)
      }
    }
    console.log(`✓ Seeded ${couponsData.length} coupons`)
  }
}

module.exports = PharmacySeeder
