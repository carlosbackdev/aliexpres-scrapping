const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { extractPrice } = require('./functions/price.extractor');
const { extractShippingInfo } = require('./functions/shipping.extractor');

// Aplicar plugin stealth
chromium.use(StealthPlugin());


async function scrapePriceUpdate(url) {
  let browser = null;
  
  try {
    console.log(`🔍 Actualizando precios con modo stealth: ${url}`);
    
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
      extraHTTPHeaders: {
        'Accept-Language': 'es-ES,es;q=0.9',
        'Referer': 'https://www.google.com/'
      }
    });
    
    const page = await context.newPage();
    
    // Inyectar anti-detección
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    

   // Inyectar código para ocultar webdriver
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Sobrescribir plugins y mimeTypes
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es', 'en'],
      });
    });
    
    // Navegar como lo haría un humano
    console.log('🌐 Navegando a la página con comportamiento humano...');
    
    // Pequeño delay aleatorio antes de navegar
    await page.waitForTimeout(Math.random() * 1000 + 500);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Extraer solo precios y fechas de entrega
    const priceData = await extractPrice(page);
    const shippingInfo = await extractShippingInfo(page);
    
    const result = {
      basePrice: priceData.current,
      originalPrice: priceData.original,
      discount: priceData.original > priceData.current 
        ? Math.round(((priceData.original - priceData.current) / priceData.original) * 100)
        : 0,
      deliveryEstimateDays: shippingInfo.estimatedDelivery.min && shippingInfo.estimatedDelivery.max
        ? { min: shippingInfo.estimatedDelivery.min, max: shippingInfo.estimatedDelivery.max }
        : { min: 15, max: 30 }
    };
    
    console.log(`✅ Precios actualizados - Base: ${result.basePrice}€, Original: ${result.originalPrice}€, Descuento: ${result.discount}%`);
    return result;
    
  } catch (error) {
    console.error('❌ Error actualizando precios:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Actualiza precios de múltiples productos en batch
 * @param {Array} products - Array de { productId, url }
 * @returns {Array} Array de { productId, basePrice, originalPrice, discount, deliveryEstimateDays }
 */
async function updateProductsPrices(products) {
  const results = [];
  
  for (const product of products) {
    try {
      const priceData = await scrapePriceUpdate(product.url);
      results.push({
        productId: product.productId,
        ...priceData,
        success: true
      });
    } catch (error) {
      console.error(`Error en producto ${product.productId}:`, error.message);
      results.push({
        productId: product.productId,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = { updateProductsPrices };
