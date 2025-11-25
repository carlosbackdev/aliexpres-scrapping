/**
 * Extrae las imágenes del producto
 */
async function extractImages(page) {
  try {
    const images = new Set();
    
    // Selector para la galería de imágenes
    const imageSelectors = [
      '.slider--img--kD4mIg7 img',
      '.magnifier--image--RM17RL2',
      '[class*="image"] img[src*="aliexpress"]',
      '.product-img'
    ];

    for (const selector of imageSelectors) {
      const elements = await page.locator(selector).all();
      for (const element of elements) {
        const src = await element.getAttribute('src');
        if (src && (src.includes('aliexpress') || src.startsWith('http'))) {
          // Limpiar parámetros de tamaño para obtener imagen original
          let cleanUrl = src.split('_')[0] + (src.includes('.jpg') ? '.jpg' : '.png');
          
          // Eliminar extensiones duplicadas (.jpg.jpg -> .jpg)
          cleanUrl = cleanUrl.replace(/\.(jpg|jpeg|png|webp)\.(jpg|jpeg|png|webp)$/i, '.$1');
          
          images.add(cleanUrl);
        }
      }
      
      if (images.size > 0) break;
    }

    return Array.from(images);
  } catch (error) {
    console.error('Error extrayendo imágenes:', error.message);
    return [];
  }
}

module.exports = { extractImages };
