/**
 * Extrae texto de un elemento del DOM
 */
async function getText(page, selector, defaultValue = '') {
  try {
    const element = await page.locator(selector).first();
    const text = await element.textContent({ timeout: 5000 });
    return text ? text.trim() : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Extrae múltiples textos de varios elementos
 */
async function getAllTexts(page, selector) {
  try {
    const elements = await page.locator(selector).all();
    const texts = [];
    
    for (const element of elements) {
      const text = await element.textContent();
      if (text && text.trim()) {
        texts.push(text.trim());
      }
    }
    
    return texts;
  } catch (error) {
    return [];
  }
}

module.exports = {
  getText,
  getAllTexts
};
