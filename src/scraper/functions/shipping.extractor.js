/**
 * Extrae información de envío del producto
 * SIEMPRE devuelve shippingCost: 1.99 (simplificado)
 */
async function extractShippingInfo(page) {
  try {
    const shippingInfo = {
      shippingCost: 1.99, // FIJO: siempre 1.99€
      estimatedDelivery: {
        min: null,
        max: null
      }
    };
    
    // Obtener textos de entrega
    const allShippingTexts = await page.locator('.dynamic-shipping-line').allTextContents().catch(() => []);
    console.log(allShippingTexts);
    console.log(`📦 Envío: 1.99€ (fijo)`);
    
    for (const text of allShippingTexts) {
      // Buscar fechas de entrega "19 - 23 de NOV"
      const deliveryMatch = text.match(/(\d+)\s*-\s*(\d+)\s*de\s*(\w+)/i);
      if (deliveryMatch) {
        shippingInfo.estimatedDelivery.min = parseInt(deliveryMatch[1]);
        shippingInfo.estimatedDelivery.max = parseInt(deliveryMatch[2]);
        console.log(`📅 Entrega estimada: ${deliveryMatch[1]} - ${deliveryMatch[2]} de ${deliveryMatch[3]}`);
        break; // Solo necesitamos el primero
      }
    }

    return shippingInfo;
  } catch (error) {
    console.error('Error extrayendo información de envío:', error.message);
    return {
      shippingCost: 1.99,
      estimatedDelivery: { min: null, max: null }
    };
  }
}

module.exports = { extractShippingInfo };
