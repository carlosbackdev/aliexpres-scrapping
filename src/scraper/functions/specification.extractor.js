/**
 * Extrae las especificaciones/detalles del producto
 */
async function extractSpecifications(page) {
  try {
    const specifications = {};
    
    // Buscar todas las líneas de especificaciones
    const specElements = await page.locator('.specification--prop--Jh28bKu').all();
    
    for (const spec of specElements) {
      try {
        const title = await spec.locator('.specification--title--SfH3sA8 span').textContent();
        const value = await spec.locator('.specification--desc--Dxx6W0W span').textContent();
        
        if (title && value) {
          const cleanTitle = title.trim();
          const cleanValue = value.trim();
          
          // Si ya existe la clave, convertir a array o agregar al array
          if (specifications[cleanTitle]) {
            if (Array.isArray(specifications[cleanTitle])) {
              specifications[cleanTitle].push(cleanValue);
            } else {
              specifications[cleanTitle] = [specifications[cleanTitle], cleanValue];
            }
          } else {
            specifications[cleanTitle] = cleanValue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    console.log(`📋 Especificaciones extraídas: ${Object.keys(specifications).length} propiedades`);
    return specifications;
  } catch (error) {
    console.error('Error extrayendo especificaciones:', error.message);
    return {};
  }
}

module.exports = { extractSpecifications };
