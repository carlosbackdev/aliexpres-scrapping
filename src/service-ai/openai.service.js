const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Mejora el título del producto y genera keywords usando OpenAI
 * @param {Object} product - Producto con name, details, specifications
 * @returns {Object} { enhancedTitle, keywords }
 */
async function enhanceProductWithAI(product) {
  try {
    console.log(`🤖 Enviando producto a OpenAI para mejorar: "${product.name.substring(0, 50)}..."`);
    
    // Parsear specifications si es JSON string
    let specs = '';
    try {
      const specsObj = JSON.parse(product.specifications || '{}');
      specs = Object.entries(specsObj)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      specs = product.specifications || '';
    }
    
    const prompt = `Eres un experto en e-commerce especializado en accesorios para motos y SEO. Te voy a dar la información de un producto y necesito que hagas tres cosas:

1. PARAFRASEAR el título del producto para hacerlo más atractivo y claro, manteniendo las palabras clave importantes pero haciéndolo más corto y quitando las innecesarias. El título debe ser natural en español y optimizado para búsquedas.

2. GENERAR una descripción breve (4-6 líneas máximo) optimizada para SEO que describa el producto de forma natural. Por ejemplo: "Tensor de cadena de distribución para moto, fabricado en hierro resistente, ideal para mantener la tensión correcta de la cadena y prolongar su vida útil."

3. GENERAR una lista de palabras clave (keywords) relevantes para SEO, separadas por comas. Máximo 10 palabras clave.

INFORMACIÓN DEL PRODUCTO:
- Título original: ${product.name}
- Detalles: ${product.details || 'No disponible'}
- Especificaciones: ${specs}
- Categoría ID: ${product.category}

RESPONDE SOLO EN EL SIGUIENTE FORMATO (sin markdown, sin explicaciones adicionales):
TÍTULO: [título mejorado aquí]
DESCRIPCIÓN: [descripción breve SEO aquí]
KEYWORDS: palabra1,palabra2,palabra3,palabra4,palabra5`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo más económico
      messages: [
        {
          role: 'system',
          content: 'Eres un experto en marketing y SEO para e-commerce. Generas títulos atractivos y keywords relevantes en español.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });

    const response = completion.choices[0].message.content.trim();
    console.log(`✅ Respuesta de OpenAI:\n${response}`);
    
    // Parsear la respuesta
    const titleMatch = response.match(/TÍTULO:\s*(.+?)(?:\n|$)/i);
    const descriptionMatch = response.match(/DESCRIPCIÓN:\s*(.+?)(?:\n|KEYWORDS:|$)/is);
    const keywordsMatch = response.match(/KEYWORDS:\s*(.+?)(?:\n|$)/i);
    
    const enhancedTitle = titleMatch ? titleMatch[1].trim() : product.name;
    const description = descriptionMatch ? descriptionMatch[1].trim() : product.details || '';
    const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';
    
    console.log(`📝 Título mejorado: "${enhancedTitle}"`);
    console.log(`📄 Descripción: "${description}"`);
    console.log(`🔑 Keywords: "${keywords}"`);
    
    return {
      enhancedTitle,
      description,
      keywords
    };
    
  } catch (error) {
    console.error('❌ Error al mejorar producto con OpenAI:', error.message);
    
    // Fallback: devolver datos originales
    return {
      enhancedTitle: product.name,
      description: product.details || '',
      keywords: ''
    };
  }
}

module.exports = { enhanceProductWithAI };
