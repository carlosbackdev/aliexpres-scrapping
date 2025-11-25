/**
 * Extrae las variantes del producto (colores, tallas, etc.) con sus imágenes
 */
async function extractVariants(page) {
  try {
    const variants = [];
    
    // Buscar grupos de propiedades SKU (cada propiedad es Color, Tamaño, etc.)
    const skuGroups = await page.locator('[class*="sku-item--property"]').all();
    
    for (const group of skuGroups) {
      try {
        // Nombre del grupo (ej: "Color", "Tamaño")
        const groupName = await group.locator('[class*="sku-item--title"]').first().textContent();
        
        if (!groupName) continue;
        
        // Opciones dentro del grupo (buscar divs que contengan las opciones de variante)
        const optionElements = await group.locator('[class*="sku-item--skus"] div[data-sku-col]').all();
        const options = [];
        
        for (const option of optionElements) {
          try {
            let imageUrl = null;
            let value = null;
            
            // Intentar obtener la imagen de la variante
            const imgCount = await option.locator('img').count();
            
            if (imgCount > 0) {
              const imgElement = await option.locator('img').first();
              
              // Extraer URL de la imagen
              const imgSrc = await imgElement.getAttribute('src');
              if (imgSrc) {
                // Limpiar la URL (quitar parámetros de tamaño)
                imageUrl = imgSrc.split('_220x220')[0].replace('.jpg_.avif', '.jpg').replace('.webp_.avif', '.webp');
              }
              
              // Extraer valor desde el atributo alt
              const imgAlt = await imgElement.getAttribute('alt');
              value = imgAlt?.trim() || null;
            }
            
            // Si no hay imagen, usar el texto del elemento
            if (!value) {
              const textValue = await option.textContent();
              value = textValue?.trim() || null;
            }
            
            if (value) {
              const optionData = {
                value: value,
                extraPrice: 0,
                imageUrl: imageUrl // URL original de AliExpress (se reemplazará después con la descargada)
              };
              options.push(optionData);
            }
          } catch (error) {
            console.error(`[VARIANTS] ❌ Error procesando opción:`, error.message);
            continue;
          }
        }
        
        if (options.length > 0) {
          const cleanGroupName = groupName.replace(':', '').trim();
          variants.push({
            groupName: cleanGroupName,
            options
          });
        }
      } catch (error) {
        console.error(`[VARIANTS] Error procesando grupo:`, error.message);
        continue;
      }
    }
    
    console.log(`[VARIANTS] Total de variantes extraídas: ${variants.length}`);
    return variants;
  } catch (error) {
    console.error('Error extrayendo variantes:', error.message);
    return [];
  }
}

module.exports = { extractVariants };
