const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Descarga una imagen y la guarda localmente
 */
async function downloadImage(imageUrl, productId, index) {
  try {
    
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.aliexpress.com/'
      },
      timeout: 15000
    });

    // Detectar extensión de la imagen
    const contentType = response.headers['content-type'];
    let extension = 'jpg';
    if (contentType) {
      if (contentType.includes('png')) extension = 'png';
      else if (contentType.includes('webp')) extension = 'webp';
      else if (contentType.includes('jpeg') || contentType.includes('jpg')) extension = 'jpg';
    }

    // Generar nombre único para la imagen
    const hash = crypto.createHash('md5').update(imageUrl).digest('hex').substring(0, 8);
    const filename = `${productId}_${index}_${hash}.${extension}`;
    
    // Ruta donde se guardará (volumen de Docker)
    const uploadDir = path.join(__dirname, '../../../uploads/products');
    await fs.mkdir(uploadDir, { recursive: true });
    
    const filepath = path.join(uploadDir, filename);

    // Guardar imagen
    await fs.writeFile(filepath, response.data);
    
    console.log(`✅ Imagen guardada: ${filename}`);
    
    return {
      originalUrl: imageUrl,
      filename: filename,
      localPath: filepath,
      publicUrl: `/uploads/products/${filename}`
    };
  } catch (error) {
    console.error(`❌ Error descargando imagen ${imageUrl}:`, error.message);
    return null;
  }
}

/**
 * Descarga todas las imágenes de un producto
 */
async function downloadAllImages(imageUrls, productId) {
  if (!imageUrls || imageUrls.length === 0) {
    console.log('⚠️  No hay imágenes para descargar');
    return [];
  }

  console.log(`📥 Descargando ${imageUrls.length} imágenes del producto ${productId}...`);
  
  // Descargar imágenes en paralelo (máximo 5 a la vez)
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    const batchPromises = batch.map((url, batchIndex) => 
      downloadImage(url, productId, i + batchIndex)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  // Filtrar resultados exitosos
  const successfulDownloads = results.filter(r => r !== null);
  
  console.log(`✅ Descargadas ${successfulDownloads.length}/${imageUrls.length} imágenes correctamente`);
  
  return successfulDownloads;
}

/**
 * Elimina imágenes antiguas de un producto
 */
async function deleteProductImages(productId) {
  try {
    const uploadDir = path.join(__dirname, '../../../uploads/products');
    const files = await fs.readdir(uploadDir);
    
    const productFiles = files.filter(file => file.startsWith(`${productId}_`));
    
    for (const file of productFiles) {
      await fs.unlink(path.join(uploadDir, file));
    }
    
    console.log(`🗑️  Eliminadas ${productFiles.length} imágenes antiguas del producto ${productId}`);
  } catch (error) {
    console.error('Error eliminando imágenes antiguas:', error.message);
  }
}

module.exports = {
  downloadImage,
  downloadAllImages,
  deleteProductImages
};
