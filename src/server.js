require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises; 
const { scrapeAliExpressProduct } = require('./scraper/aliexpress.scraper');
const { updateProductsPrices } = require('./scraper/aliexpress.price-updater');
const { scrapeRequestSchema, productResponseSchema } = require('./schemas/product.schema');
const { priceUpdateRequestSchema } = require('./schemas/price-update.schema');
const { enhanceRequestSchema } = require('./schemas/enhance.schema');
const { downloadAllImages } = require('./scraper/functions/image.downloader');
const { enhanceProductWithAI } = require('./service-ai/openai.service');
const { matchVariantImages } = require('./scraper/functions/variant-image-matcher');
const { saveBannerImage, sendBannerToExternalService } = require('./banner/banner.uploader');
const { createBannerSchema } = require('./banner/banner.schema');
const { scrapeTrackingInfo } = require('./tracking/tracking.scraper');
const { trackingRequestSchema, trackingResponseSchema } = require('./tracking/tracking.schema');
const { z } = require('zod');
const multer = require('multer');
const UPLOADS_ROOT = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');

// Configurar multer para subida de archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

const app = express();

// ⚠️ IMPORTANTE: Middleware de parsing ANTES de las rutas
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Servir imágenes estáticas desde el volumen
app.use('/uploads', express.static(UPLOADS_ROOT));
app.use('/images', express.static(path.join(__dirname, '../images')));

app.get('/', (req, res) => {
  res.json({
    service: 'AliExpress Scraper Microservice',
    version: '1.0.0',
    endpoints: {
      scrape: 'POST /scrape - Scraping completo de producto',
      updatePrices: 'POST /update-prices - Actualización masiva de precios',
      enhanceTitle: 'POST /enhance-title - Mejorar título y generar keywords con IA',
      createBanner: 'POST /banner/create - Crear y subir banner al servicio externo',
      tracking: 'POST /tracking - Obtener información de seguimiento de paquete'
    }
  });
});

app.post('/scrape', async (req, res) => {
  try {
    console.log('📦 Body recibido:', req.body); // Debug
    
    // Validar URL de entrada
    const { url } = scrapeRequestSchema.parse(req.body);
    
    // Realizar scraping
    const productData = await scrapeAliExpressProduct(url);
    console.log('✅ Datos extraídos del scraping');
    
    // Guardar URLs originales de imágenes antes de descargar
    const originalImages = [...productData.images];
    
    // Descargar imágenes y reemplazar URLs
    if (productData.images && productData.images.length > 0) {
      console.log('📥 Descargando imágenes del producto...');
      const downloadedImages = await downloadAllImages(
        productData.images, 
        productData.externalId.replace('ALI_', '')
      );
      
      // Reemplazar URLs originales por URLs locales
      productData.images = downloadedImages.map(img => img.publicUrl);
      console.log(`✅ Imágenes reemplazadas: ${productData.images.length} URLs locales`);
      
      // Hacer matching de imágenes con variantes
      if (productData.variants && productData.variants.length > 0) {
        productData.variants = matchVariantImages(
          productData.variants,
          originalImages,
          downloadedImages
        );
      }
    }
    
    // Validar datos extraídos con Zod
    console.log('🔎 Validando datos con Zod...');
    const validatedProduct = productResponseSchema.parse(productData);
    console.log('✅ Validación exitosa');
    
    res.json({
      success: true,
      data: validatedProduct
    });
    
  } catch (error) {
    console.error('❌ Error en el endpoint /scrape:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ========== ENDPOINT: Actualización masiva de precios ==========
app.post('/update-prices', async (req, res) => {
  try {
    console.log(`📦 Productos a actualizar: ${req.body.products?.length || 0}`);
    
    // Validar entrada
    const { products } = priceUpdateRequestSchema.parse(req.body);
    
    // Actualizar precios de todos los productos
    const results = await updateProductsPrices(products);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`✅ Actualización completada: ${successCount} exitosos, ${failCount} fallidos`);
    
    res.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failCount
      },
      data: results
    });
    
  } catch (error) {
    console.error('❌ Error en el endpoint /update-prices:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ========== ENDPOINT: Mejorar título y generar keywords con IA ==========
app.post('/enhance-title', async (req, res) => {
  try {
    console.log('📥 Recibiendo petición de mejora de título con IA...');
    console.log(`📦 Producto recibido: ID=${req.body.id}, Nombre="${req.body.name?.substring(0, 50)}..."`);
    
    // Validar entrada
    const product = enhanceRequestSchema.parse(req.body);
    
    // Mejorar con OpenAI
    const { enhancedTitle, description, keywords } = await enhanceProductWithAI(product);
    
    console.log(`✅ Producto mejorado exitosamente`);
    console.log(`   Título original: "${product.name.substring(0, 50)}..."`);
    console.log(`   Título mejorado: "${enhancedTitle.substring(0, 50)}..."`);
    console.log(`   Descripción: "${description.substring(0, 60)}..."`);
    console.log(`   Keywords: "${keywords}"`);
    
    // Responder con id, name, details y keywords
    res.json({
      success: true,
      id: product.id,
      name: enhancedTitle,
      details: description,
      keywords: keywords
    });
    
  } catch (error) {
    console.error('❌ Error en el endpoint /enhance-title:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// ========== ENDPOINT: ELIMINAR IMÁGENES DE PRODUCTOS ==========
app.post('/api/products-images/delete', async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({
        success: false,
        error: 'Body debe ser un array de productos'
      });
    }

    const deleted = [];
    const failed = [];

    for (const prod of products) {
      if (typeof prod.imageUrl === 'string' && prod.imageUrl.startsWith('/uploads/products/')) {
        // Nos quedamos solo con el nombre de archivo
        const filename = prod.imageUrl.replace('/uploads/products/', '');
        // Ruta física REAL dentro del contenedor/volumen
        const imagePath = path.join(UPLOADS_ROOT, 'products', filename);

        try {
          await fs.unlink(imagePath);
          deleted.push(prod.id);
        } catch (err) {
          console.error(`No se pudo eliminar ${imagePath}:`, err.message);
          failed.push(prod.id);
        }
      } else {
        failed.push(prod.id);
      }
    }

    res.json({ success: true, deleted, failed });
  } catch (error) {
    console.error('❌ Error en /api/products-images/delete:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar imágenes',
      message: error.message
    });
  }
});

// ========== ENDPOINT: CREAR BANNER ==========
app.post('/banner/create', upload.single('image'), async (req, res) => {
  try {
    console.log('🎨 Recibiendo petición de creación de banner...');
    console.log(`📦 Datos recibidos: título="${req.body.title}", descripción="${req.body.description}"`);
    
    // Verificar que se subió una imagen
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se recibió ninguna imagen. Debes enviar un archivo con el campo "image"'
      });
    }
    
    console.log(`📷 Imagen recibida: ${req.file.originalname} (${req.file.size} bytes)`); 
    
    // Validar campos
    const bannerData = createBannerSchema.parse({
      title: req.body.title,
      description: req.body.description
    });
    
    // Guardar imagen en el sistema de archivos
    const imagePath = await saveBannerImage(req.file.buffer, req.file.originalname);
    console.log(`💾 Imagen guardada en: ${imagePath}`);
    
    // Preparar datos para enviar al servicio externo
    const bannerToSend = {
      title: bannerData.title,
      description: bannerData.description,
      image: imagePath
    };
    
    // Enviar al servicio externo
    const externalResponse = await sendBannerToExternalService(bannerToSend);
    
    console.log('✅ Banner creado y enviado exitosamente');
    
    res.json({
      success: true,
      data: {
        title: bannerToSend.title,
        description: bannerToSend.description,
        image: bannerToSend.image
      },
      externalResponse: externalResponse
    });
    
  } catch (error) {
    console.error('❌ Error en el endpoint /banner/create:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al crear el banner',
      message: error.message
    });
  }
});

// ========== ENDPOINT: TRACKING DE PAQUETE ==========
app.post('/tracking', async (req, res) => {
  try {
    console.log('📦 Recibiendo petición de seguimiento...');
    console.log(`📦 Número de seguimiento: ${req.body.trackingNumber}`);
    
    // Validar entrada
    const { trackingNumber } = trackingRequestSchema.parse(req.body);
    
    // Realizar scraping de tracking
    const trackingData = await scrapeTrackingInfo(trackingNumber);
    
    // Validar respuesta
    const validatedData = trackingResponseSchema.parse(trackingData);
    
    console.log('✅ Información de seguimiento obtenida exitosamente');
    
    res.json({
      success: true,
      data: validatedData
    });
    
  } catch (error) {
    console.error('❌ Error en el endpoint /tracking:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de seguimiento',
      message: error.message
    });
  }
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('💥 Error no manejado:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: err.message
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
