/**
 * Extrae el precio del producto
 */
async function extractPrice(page) {
  try {
    // Hacer scroll a la sección de precios para asegurar que cargue
    await page.evaluate(() => {
      const priceSection = document.querySelector('[class*="price"]');
      if (priceSection) {
        priceSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }).catch(() => {});
    
    // Esperar un poco después del scroll
    await page.waitForTimeout(2000);
    
    const priceData = {
      current: 0,
      original: 0
    };

    console.log('🔍 Buscando precio actual...');

    // Precio actual (precio de venta)
    const currentPriceSelectors = [
      '.price-default--current--F8OlYIo',
      '[class*="--current--"]',
      '[class*="price-default--current"]',
      '.price-default--currentWrap--A_MNgCG span',
      '[class*="price--current"]',
      '[class*="current"] span'
    ];

    for (const selector of currentPriceSelectors) {
      try {
        console.log(`   Probando selector: ${selector}`);
        const element = await page.locator(selector).first();
        const priceText = await element.textContent({ timeout: 3000 }).catch(() => null);
        
        console.log(`   Texto extraído: "${priceText}"`);
        
        if (priceText) {
          const match = priceText.match(/[\d.,]+/);
          if (match) {
            const price = parseFloat(match[0].replace(',', '.'));
            if (!isNaN(price) && price > 0) {
              priceData.current = price;
              console.log(`✅ Precio actual encontrado: ${price}€`);
              break;
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error con selector ${selector}: ${error.message}`);
        continue;
      }
    }

    console.log('🔍 Buscando precio original...');

    // Precio original (precio tachado)
    const originalPriceSelectors = [
      '.price-default--original--CWcHOit',
      '[class*="--original--"]',
      '[class*="price-default--original"]',
      '.price-default--priceExtraFont12--pRHaee0 span',
      '[class*="price--original"]',
      'del span',
      's span'
    ];

    for (const selector of originalPriceSelectors) {
      try {
        console.log(`   Probando selector: ${selector}`);
        const element = await page.locator(selector).first();
        const priceText = await element.textContent({ timeout: 3000 }).catch(() => null);
        
        console.log(`   Texto extraído: "${priceText}"`);
        
        if (priceText) {
          const match = priceText.match(/[\d.,]+/);
          if (match) {
            const price = parseFloat(match[0].replace(',', '.'));
            if (!isNaN(price) && price > 0 && price !== priceData.current) {
              priceData.original = price;
              console.log(`✅ Precio original encontrado: ${price}€`);
              break;
            }
          }
        }
      } catch (error) {
        console.log(`   ❌ Error con selector ${selector}: ${error.message}`);
        continue;
      }
    }

    // Si no hay precio original, usar el precio actual
    if (priceData.original === 0 && priceData.current > 0) {
      priceData.original = priceData.current;
      console.log(`ℹ️  No hay precio original, usando precio actual: ${priceData.current}€`);
    }

    return priceData;
  } catch (error) {
    console.error('❌ Error extrayendo precio:', error.message);
    return { current: 0, original: 0 };
  }
}

module.exports = { extractPrice };/**
 * Extrae el precio del producto
 */
async function extractPrice(page) {
  try {
    const priceData = {
      current: 0,
      original: 0
    };

    // Precio actual (precio de venta) - selectores ampliados
    const currentPriceSelectors = [
      '[class*="--currentPriceText--"]',
      '[class*="--currentPrice--"]',
      '.price-default--current--F8OlYIo',
      '.price-default--currentWrap--A_MNgCG span',
      '[class*="price--current"]',
      '[class*="current"] span',
      '[data-spm-anchor-id*="price"]'
    ];

    for (const selector of currentPriceSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const priceText = await element.textContent({ timeout: 2000 });
          
          if (priceText) {
            const match = priceText.match(/[\d.,]+/);
            if (match) {
              const price = parseFloat(match[0].replace(',', '.'));
              if (!isNaN(price) && price > 0) {
                priceData.current = price;
                console.log(`✅ Precio actual encontrado con selector ${selector}: ${price}€`);
                break;
              }
            }
          }
        }
        if (priceData.current > 0) break;
      } catch (error) {
        continue;
      }
    }

    // Precio original (precio tachado) - selectores ampliados
    const originalPriceSelectors = [
      '[class*="--originalPriceText--"]',
      '[class*="--originalPrice--"]',
      '.price-default--original--CWcHOit',
      '.price-default--priceExtraFont12--pRHaee0 span',
      '[class*="price--original"]',
      '[class*="original"] span',
      'del span',
      's span'
    ];

    for (const selector of originalPriceSelectors) {
      try {
        const elements = await page.locator(selector).all();
        for (const element of elements) {
          const priceText = await element.textContent({ timeout: 2000 });
          
          if (priceText) {
            const match = priceText.match(/[\d.,]+/);
            if (match) {
              const price = parseFloat(match[0].replace(',', '.'));
              if (!isNaN(price) && price > 0 && price !== priceData.current) {
                priceData.original = price;
                console.log(`✅ Precio original encontrado con selector ${selector}: ${price}€`);
                break;
              }
            }
          }
        }
        if (priceData.original > 0) break;
      } catch (error) {
        continue;
      }
    }

    // Si no hay precio original, usar el precio actual
    if (priceData.original === 0) {
      priceData.original = priceData.current;
    }

    return priceData;
  } catch (error) {
    console.error('❌ Error extrayendo precio:', error.message);
    return { current: 0, original: 0 };
  }
}

module.exports = { extractPrice };
