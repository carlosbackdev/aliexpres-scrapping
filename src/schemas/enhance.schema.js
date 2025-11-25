const { z } = require('zod');

const enhanceRequestSchema = z.object({
  id: z.number(),
  name: z.string().min(1),
  details: z.string().optional().default(''),
  specifications: z.string().optional(),
  // Campos opcionales/nullable
  keywords: z.string().nullable().optional(),
  basePrice: z.number().optional(),
  originalPrice: z.number().optional(),
  sellPrice: z.number().optional(),
  discount: z.number().optional(),
  currency: z.string().optional(),
  shippingCost: z.number().optional(),
  deliveryEstimateDays: z.string().optional(),
  variants: z.any().optional(),
  images: z.any().optional(),
  sellerName: z.string().optional(),
  externalId: z.string().optional(),
  sourceUrl: z.string().optional(),
  category: z.number().nullable().optional() // ⬅️ Ahora acepta null
}).passthrough(); // Permitir campos extra sin fallar

const enhanceResponseSchema = z.object({
  success: z.boolean(),
  id: z.number(),
  name: z.string(),
  keywords: z.string()
});

module.exports = {
  enhanceRequestSchema,
  enhanceResponseSchema
};