const { z } = require('zod');

// Schema para la petición de tracking
const trackingRequestSchema = z.object({
  trackingNumber: z.string().min(1, 'El número de seguimiento es requerido')
});

// Schema para la respuesta
const trackingResponseSchema = z.object({
  trackingNumber: z.string(),
  status: z.string().nullable(),
  statusDescription: z.string().nullable(),
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  weight: z.string().nullable(),
  couriers: z.array(z.string()).default([]),
  daysOnRoute: z.number().default(0),
  timeline: z.array(
    z.object({
      date: z.string(),
      courier: z.string().nullable(),
      title: z.string(),
      location: z.string().nullable(),
      isActive: z.boolean().default(false)
    })
  ).default([]),
  sourceUrl: z.string().url()
});

module.exports = {
  trackingRequestSchema,
  trackingResponseSchema
};
