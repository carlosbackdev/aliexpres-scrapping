const { z } = require('zod');

// Schema para la petición de actualización de precios
const priceUpdateRequestSchema = z.object({
  products: z.array(z.object({
    productId: z.string().min(1, 'productId es requerido'),
    url: z.string().url('URL inválida')
  })).min(1, 'Debe incluir al menos un producto')
});

// Schema para la respuesta de actualización
const priceUpdateResponseSchema = z.object({
  productId: z.string(),
  success: z.boolean(),
  basePrice: z.number().optional(),
  originalPrice: z.number().optional(),
  discount: z.number().optional(),
  deliveryEstimateDays: z.object({
    min: z.number(),
    max: z.number()
  }).optional(),
  error: z.string().optional()
});

module.exports = {
  priceUpdateRequestSchema,
  priceUpdateResponseSchema
};
