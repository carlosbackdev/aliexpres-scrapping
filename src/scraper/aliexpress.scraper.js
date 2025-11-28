const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getText, getAllTexts } = require('./functions/text.extractor');
const { extractPrice } = require('./functions/price.extractor');
const { extractImages } = require('./functions/image.extractor');
const { extractVariants } = require('./functions/variant.extractor');
const { extractSpecifications } = require('./functions/specification.extractor');
const { extractShippingInfo } = require('./functions/shipping.extractor');
const fs = require('fs').promises;
const path = require('path');

// Aplicar plugin stealth para evitar detección
chromium.use(StealthPlugin());

/**
 * Función principal de scraping con anti-detección
 */
async function scrapeAliExpressProduct(url) {
  let browser = null;
  
  try {
    console.log(`🔍 Iniciando scraping con modo stealth: ${url}`);
    
    // Lanzar navegador con stealth mode
    browser = await chromium.launch({ 
      headless: true,
      //browser: 'chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'es-ES',
      timezoneId: 'Europe/Madrid',
      extraHTTPHeaders: {
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    const page = await context.newPage();
    
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
    await page.waitForTimeout(Math.random() * 2000 + 1000);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log('⏳ Esperando contenido dinámico (4 segundos)...');
    await page.waitForTimeout(4000);
    
    // Simular scroll humano
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 500 + 300);
    });
    await page.waitForTimeout(1500);
    
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 500 + 300);
    });
    await page.waitForTimeout(500);
    
    // Diagnóstico: guardar screenshot
   //  const debugDir = path.join(__dirname, '../../debug');
    // await fs.mkdir(debugDir, { recursive: true }).catch(() => {});
    // const timestamp = Date.now();
   //  await page.screenshot({ path: path.join(debugDir, `screenshot_${timestamp}.png`), fullPage: false });
    // console.log(`📸 Screenshot guardado en debug/screenshot_${timestamp}.png`);
    
    // Verificar si hay contenido de producto
    const hasTitleElement = await page.locator('[data-pl="product-title"]').count();
    const hasPriceElement = await page.locator('[class*="price-default--current"]').count();
    console.log(`🔍 Elementos encontrados: ${hasTitleElement} títulos, ${hasPriceElement} precios`);
    
    if (hasTitleElement === 0 && hasPriceElement === 0) {
      console.log('⚠️ No se encontraron elementos de producto, esperando 5 segundos más...');
      await page.waitForTimeout(5000);
    }
    
    // Extraer información
    console.log('📦 Extrayendo información del producto...');
    
    // Título
    const titleSelectors = [
      '[data-pl="product-title"]',
      '.title--wrap--UUHae_g h1',
      'h1[data-pl="product-title"]',
      '.product-title-text',
      'h1[class*="Product"]',
      'h1'
    ];
    
    let title = 'Producto sin título';
    for (const selector of titleSelectors) {
      const extracted = await getText(page, selector);
      if (extracted && extracted !== '' && extracted.length > 5) {
        title = extracted;
        console.log(`✅ Título encontrado: "${title.substring(0, 60)}..."`);
        break;
      }
    }
    
    // Especificaciones
    const specifications = await extractSpecifications(page);
    
    // Precio
    const priceData = await extractPrice(page);
    console.log(`💰 Precios extraídos - Actual: ${priceData.current}€, Original: ${priceData.original}€`);
    
    // Imágenes
    const images = await extractImages(page);
    console.log(`🖼️  Imágenes encontradas: ${images.length}`);
    
    // Información de envío
    const shippingInfo = await extractShippingInfo(page);
    
    // Variantes - esperar a que el contenedor esté visible    
    const variants = await extractVariants(page);
    console.log(`🎨 Variantes encontradas: ${variants.length}`);
    
    // Vendedor
    const sellerName = await getText(page, '.store-detail--storeName--Lk2FVZ4, [class*="storeName"], [class*="shop-name"], [class*="store-name"]', 'Vendedor de AliExpress');
    
    // Extraer ID del producto de la URL
    const idMatch = url.match(/\/(\d+)\.html/);
    const productId = idMatch ? idMatch[1] : Date.now().toString();
    
    const result = {
      title,
      details: '',
      specifications,
      basePrice: priceData.current,
      originalPrice: priceData.original,
      discount: priceData.original > priceData.current 
        ? Math.round(((priceData.original - priceData.current) / priceData.original) * 100)
        : 0,
      currency: 'EUR',
      images,
      shippingCost: shippingInfo.shippingCost,
      deliveryEstimateDays: shippingInfo.estimatedDelivery.min && shippingInfo.estimatedDelivery.max
        ? { min: shippingInfo.estimatedDelivery.min, max: shippingInfo.estimatedDelivery.max }
        : { min: 15, max: 30 },
      variants,
      sellerName,
      externalId: `ALI_${productId}`,
      sourceUrl: url
    };
    
    console.log('✅ Scraping completado exitosamente');
    return result;
    
  } catch (error) {
    console.error('❌ Error durante el scraping:', error.message);
    throw new Error(`Error al scrapear el producto: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeAliExpressProduct };