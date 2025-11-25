const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Guarda la imagen del banner en el sistema de archivos
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} originalName - Nombre original del archivo
 * @returns {string} Ruta pública de la imagen guardada
 */
async function saveBannerImage(imageBuffer, originalName) {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/banners');
    
    // Crear directorio si no existe
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Generar nombre único usando MD5
    const hash = crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 8);
    const ext = path.extname(originalName);
    const filename = `banner_${Date.now()}_${hash}${ext}`;
    
    const filePath = path.join(uploadsDir, filename);
    
    // Guardar archivo
    await fs.writeFile(filePath, imageBuffer);
    
    console.log(`✅ Banner guardado: ${filename}`);
    
    // Retornar ruta pública
    return `/uploads/banners/${filename}`;
    
  } catch (error) {
    console.error('❌ Error guardando imagen del banner:', error.message);
    throw new Error('No se pudo guardar la imagen del banner');
  }
}

/**
 * Envía el banner al servicio externo
 * @param {Object} bannerData - { title, description, image }
 * @returns {Object} Respuesta del servidor externo
 */
async function sendBannerToExternalService(bannerData) {
  try {
    console.log('📤 Enviando banner al servicio externo...');
    console.log(`   Título: "${bannerData.title}"`);
    console.log(`   Descripción: "${bannerData.description}"`);
    console.log(`   Imagen: "${bannerData.image}"`);
    
    const response = await axios.put('http://localhost:8080/api/home-banners/admin', bannerData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 segundos
    });
    
    console.log('✅ Banner enviado exitosamente al servicio externo');
    return response.data;
    
  } catch (error) {
    console.error('❌ Error enviando banner al servicio externo:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Respuesta: ${JSON.stringify(error.response.data)}`);
      throw new Error(`El servicio externo respondió con error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No se pudo conectar con el servicio externo en localhost:8080');
    } else {
      throw new Error(`Error al enviar banner: ${error.message}`);
    }
  }
}

module.exports = {
  saveBannerImage,
  sendBannerToExternalService
};
