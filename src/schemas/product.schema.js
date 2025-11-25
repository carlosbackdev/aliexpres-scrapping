const { z } = require('zod');

// Schema para validar la URL de entrada
const scrapeRequestSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('aliexpress.com'),
    { message: 'La URL debe ser de AliExpress' }
  )
});

// Schema para la respuesta del producto
const productResponseSchema = z.object({
  title: z.string(),
  details: z.string().default('Sin descripción disponible'),
  specifications: z.any().default({}), // JSON flexible con detalles del producto
  basePrice: z.number().positive(),
  originalPrice: z.number().positive().optional(),
  discount: z.number().int().min(0).max(100).default(0),
  currency: z.string().default('EUR'),
  images: z.array(z.string()).default([]),
  shippingCost: z.number().min(0).default(1.99), // 0 = gratis, 1.99 si es "a partir de"
  deliveryEstimateDays: z.object({
    min: z.number().int(),
    max: z.number().int()
  }).default({ min: 15, max: 30 }),
  variants: z.array(
    z.object({
      groupName: z.string(),
      options: z.array(
        z.object({
          value: z.string(),
          extraPrice: z.number().default(0),
          image: z.string().nullable().optional() // URL local de la imagen de la variante
        })
      )
    })
  ).default([]),
  sellerName: z.string().default('Vendedor de AliExpress'),
  externalId: z.string(),
  sourceUrl: z.string().url()
});

module.exports = {
  scrapeRequestSchema,
  productResponseSchema
};
