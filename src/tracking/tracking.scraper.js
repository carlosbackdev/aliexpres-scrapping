const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Aplicar plugin stealth
chromium.use(StealthPlugin());

/**
 * Extrae información de seguimiento desde pkge.net
 * @param {string} trackingNumber - Número de seguimiento del paquete
 * @returns {Object} Información del seguimiento
 */
async function scrapeTrackingInfo(trackingNumber) {
  let browser = null;
  
  try {
    console.log(`📦 Iniciando scraping de seguimiento con modo stealth: ${trackingNumber}`);
    
    browser = await chromium.launch({ 
      headless: true, // Modo headless para producción
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site'
      }
    });
    
    const page = await context.newPage();
    
    // Inyectar código anti-detección
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es', 'en'],
      });
    });
    const url = `https://pkge.net/parcel/${trackingNumber}`;
    
    console.log(`🌐 Navegando a: ${url}`);
    
    // Pequeño delay aleatorio antes de navegar (comportamiento humano)
    await page.waitForTimeout(Math.random() * 1000 + 500);
    
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    console.log('⏳ Esperando contenido dinámico...');
    await page.waitForTimeout(4000);
    
    // Simular scroll humano
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 300 + 200);
    });
    await page.waitForTimeout(1000);
    
    // Detectar y cerrar modal de consentimiento
    console.log('🔍 Buscando modal de consentimiento...');
    await page.waitForTimeout(2000);
    
    // Intentar múltiples selectores para el botón de consentimiento
    const consentSelectors = [
      'button.fc-button.fc-cta-consent',
      'button:has-text("Consent")',
      '.fc-button',
      '[class*="consent"] button'
    ];
    
    let clicked = false;
    for (const selector of consentSelectors) {
      try {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ Botón de consentimiento encontrado: ${selector}`);
          await page.locator(selector).first().click({ timeout: 5000 });
          console.log('✅ Clic en consentimiento realizado');
          clicked = true;
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (clicked) {
      console.log('⏳ Esperando 8 segundos después del consentimiento...');
      await page.waitForTimeout(8000);
    } else {
      console.log('⚠️ No se encontró modal de consentimiento');
      await page.waitForTimeout(3000);
    }
    
    // Esperar explícitamente a que aparezca el contenido (hasta 30 segundos)
    console.log('⏳ Esperando a que cargue el contenido de tracking...');
    
    try {
      await page.waitForSelector('#parcel-status-info', { timeout: 30000, state: 'visible' });
      console.log('✅ Contenedor de estado encontrado');
    } catch (e) {
      console.log('⚠️ No se encontró #parcel-status-info');
    }
    
    try {
      await page.waitForSelector('.package-timeline__item', { timeout: 30000, state: 'visible' });
      console.log('✅ Timeline encontrado');
    } catch (e) {
      console.log('⚠️ No se encontró .package-timeline__item');
    }
    
    await page.waitForTimeout(3000); // Esperar adicional
    
    // Debug: guardar screenshot
    // const fs = require('fs');
    // const debugPath = require('path');
    // const debugDir = debugPath.join(__dirname, '../../debug');
    // if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
   //  await page.screenshot({ path: debugPath.join(debugDir, `tracking_${trackingNumber}.png`), fullPage: true });
    // console.log(`📸 Screenshot guardado en debug/tracking_${trackingNumber}.png`);
    
    // Extraer información principal del estado
    const statusInfo = await page.evaluate(() => {
      const statusDiv = document.querySelector('.package-status-header');
      const trackNumberDiv = document.querySelector('.package-status-info-code');
      const statusDescDiv = document.querySelector('.package-status-info-box');
      
      // Función para extraer texto limpiando los tags de Google Translate
      const cleanText = (element) => {
        if (!element) return null;
        return element.textContent?.trim().replace(/\s+/g, ' ') || null;
      };
      
      return {
        status: cleanText(statusDiv),
        trackNumber: cleanText(trackNumberDiv),
        statusDescription: cleanText(statusDescDiv)
      };
    });
    
    // Extraer información del paquete
    const packageInfo = await page.evaluate(() => {
      const infoItems = document.querySelectorAll('.package-info-list li');
      const info = {};
      
      // Función para limpiar texto
      const cleanText = (text) => text?.trim().replace(/\s+/g, ' ') || '';
      
      infoItems.forEach(item => {
        const title = cleanText(item.querySelector('.package-info-list-title')?.textContent);
        const content = cleanText(item.querySelector('.package-info-list-content')?.textContent);
        
        if (title && content) {
          if (title.includes('remitente') || title.includes('Shipper')) {
            info.origin = content.replace('Cambiar', '').trim();
          } else if (title.includes('Servicio') || title.includes('Delivery Service')) {
            // Extraer nombres de couriers
            const couriers = [];
            const links = item.querySelectorAll('.package-info-list-content a[href*="/couriers/"]');
            links.forEach(link => {
              const courierName = cleanText(link.textContent);
              if (courierName) couriers.push(courierName);
            });
            info.couriers = couriers;
          } else if (title.includes('receptor') || title.includes('Receiver')) {
            info.destination = content.replace('Cambiar', '').trim();
          } else if (title.includes('Peso') || title.includes('Weight')) {
            info.weight = content || null;
          }
        }
      });
      
      // Días en ruta
      const daysValue = cleanText(document.querySelector('.package-info-delivery-days-value')?.textContent);
      if (daysValue) {
        info.daysOnRoute = parseInt(daysValue) || 0;
      }
      
      return info;
    });
    
    // Extraer timeline de seguimiento
    const timeline = await page.evaluate(() => {
      const timelineItems = document.querySelectorAll('.package-timeline__item');
      const events = [];
      
      // Función para limpiar texto
      const cleanText = (text) => text?.trim().replace(/\s+/g, ' ') || null;
      
      timelineItems.forEach((item) => {
        const timeText = cleanText(item.querySelector('.package-timeline__time')?.textContent);
        const courier = cleanText(item.querySelector('.package-timeline__post a')?.textContent);
        const title = cleanText(item.querySelector('.package-timeline__title')?.textContent);
        const location = cleanText(item.querySelector('.package-timeline__description')?.textContent);
        const isActive = item.classList.contains('package-timeline__item--active');
        
        if (timeText && title) {
          events.push({
            date: timeText,
            courier: courier,
            title: title,
            location: location,
            isActive: isActive
          });
        }
      });
      
      return events;
    });
    
    const result = {
      trackingNumber: statusInfo.trackNumber || trackingNumber,
      status: statusInfo.status,
      statusDescription: statusInfo.statusDescription,
      origin: packageInfo.origin || null,
      destination: packageInfo.destination || null,
      weight: packageInfo.weight || null,
      couriers: packageInfo.couriers || [],
      daysOnRoute: packageInfo.daysOnRoute || 0,
      timeline: timeline,
      sourceUrl: url
    };
    
    console.log(`✅ Seguimiento extraído exitosamente`);
    console.log(`   Estado: ${result.status}`);
    console.log(`   Eventos: ${result.timeline.length}`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error durante el scraping de seguimiento:', error.message);
    throw new Error(`Error al obtener seguimiento: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = { scrapeTrackingInfo };
