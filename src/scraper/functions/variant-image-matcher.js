/**
 * Hace matching entre imágenes de producto y variantes
 * Reemplaza las URLs de AliExpress con las URLs locales descargadas
 */
function matchVariantImages(variants, originalImages, downloadedImages) {
  try {
    console.log('🔗 Haciendo matching de imágenes con variantes...');
    
    // Crear un mapa de URLs originales a URLs descargadas
    const imageMap = new Map();
    
    originalImages.forEach((originalUrl, index) => {
      if (downloadedImages[index]) {
        // Limpiar URL original (normalizar)
        const cleanOriginalUrl = originalUrl
          .split('_220x220')[0]
          .replace('.jpg_.avif', '.jpg')
          .replace('.webp_.avif', '.webp')
          .split('?')[0];
        
        imageMap.set(cleanOriginalUrl, downloadedImages[index].publicUrl);
        
        // También guardar versiones alternativas de la URL
        imageMap.set(originalUrl, downloadedImages[index].publicUrl);
      }
    });
    
    console.log(`📋 Mapa de imágenes creado con ${imageMap.size} entradas`);
    
    // Recorrer variantes y actualizar imageUrl
    let matchCount = 0;
    variants.forEach(variant => {
      variant.options.forEach(option => {
        if (option.imageUrl) {
          const cleanVariantUrl = option.imageUrl
            .split('_220x220')[0]
            .replace('.jpg_.avif', '.jpg')
            .replace('.webp_.avif', '.webp')
            .split('?')[0];
          
          // Buscar match en el mapa
          let matchedUrl = imageMap.get(cleanVariantUrl);
          
          // Si no encontró match directo, buscar por similitud parcial
          if (!matchedUrl) {
            for (const [originalUrl, localUrl] of imageMap.entries()) {
              if (originalUrl.includes(cleanVariantUrl) || cleanVariantUrl.includes(originalUrl)) {
                matchedUrl = localUrl;
                break;
              }
            }
          }
          
          if (matchedUrl) {
            option.image = matchedUrl;
            matchCount++;
          } else {
            console.log(`⚠️  No se encontró match para "${option.value}": ${cleanVariantUrl.substring(0, 60)}...`);
            option.image = null;
          }
          
          // Eliminar imageUrl temporal
          delete option.imageUrl;
        } else {
          option.image = null;
        }
      });
    });
    
    console.log(`🔗 Total de matches: ${matchCount} de ${variants.reduce((sum, v) => sum + v.options.length, 0)} opciones`);
    
    return variants;
  } catch (error) {
    console.error('❌ Error haciendo matching de imágenes:', error.message);
    return variants;
  }
}

module.exports = { matchVariantImages };
