const { z } = require('zod');

// Schema para la petición de crear banner
const createBannerSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().min(1, 'La descripción es requerida'),
  image: z.string().optional() // Base64 o puede venir como multipart
});

// Schema para la respuesta
const bannerResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    title: z.string(),
    description: z.string(),
    image: z.string()
  }).optional(),
  error: z.string().optional()
});

module.exports = {
  createBannerSchema,
  bannerResponseSchema
};
