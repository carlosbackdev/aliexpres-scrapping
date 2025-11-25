# AliExpress Importer Microservice

Microservicio Node.js para scrapear productos de AliExpress y devolverlos en formato JSON estructurado para consumo por el backend Spring Boot.

## 🚀 Características

- Scraping de productos de AliExpress con Playwright
- Extracción de datos: título, precio, imágenes, variantes, opciones de envío, etc.
- Validación de entrada/salida con Zod
- API REST con Express
- CORS habilitado para integración con Spring Boot
- Manejo robusto de errores

## 📋 Requisitos

- Node.js v18+ o v20+
- npm o pnpm

## 🔧 Instalación

```bash
# Clonar repositorio
cd aliexpres-scrapping

# Instalar dependencias
npm install

# Instalar navegadores de Playwright (solo la primera vez)
npx playwright install chromium
```

## ▶️ Ejecución

### Opción 1: Node.js local

```bash
# Instalar dependencias
npm install

# Instalar navegadores de Playwright
npm run install:browsers

# Iniciar el servidor
npm start

# El servidor estará disponible en:
# http://localhost:3001
```

### Opción 2: Docker (Recomendado)

```bash
# Construir y levantar con Docker Compose
npm run docker:up

# Ver logs
npm run docker:logs

# Detener contenedor
npm run docker:down
```

**O manualmente:**

```bash
# Construir imagen
docker build -t aliexpress-scraper .

# Ejecutar contenedor
docker run -p 3001:3001 aliexpress-scraper
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Respuesta:

```json
{
  "status": "OK",
  "service": "AliExpress Importer",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Scrape Product

```http
POST /scrape
Content-Type: application/json

{
  "url": "https://es.aliexpress.com/item/1005006254572890.html"
}
```

Respuesta exitosa (200):

```json
{
  "title": "Suéter de Navidad para hombre y mujer",
  "descriptionHtml": "<p>Descripción del producto...</p>",
  "basePrice": 9.89,
  "currency": "EUR",
  "images": [
    "https://ae01.alicdn.com/kf/xxx/image1.jpg",
    "https://ae01.alicdn.com/kf/xxx/image2.jpg"
  ],
  "shipFromOptions": ["CHINA", "España", "Francia"],
  "deliveryEstimateDays": {
    "min": 7,
    "max": 15
  },
  "variants": [
    {
      "groupName": "Color",
      "options": [
        {
          "value": "Rojo",
          "extraPrice": 0
        },
        {
          "value": "Azul",
          "extraPrice": 2.5
        }
      ]
    },
    {
      "groupName": "Size",
      "options": [
        {
          "value": "M",
          "extraPrice": 0
        },
        {
          "value": "L",
          "extraPrice": 1.0
        }
      ]
    }
  ],
  "sellerName": "Official Store",
  "externalId": "1005006254572890",
  "sourceUrl": "https://es.aliexpress.com/item/1005006254572890.html"
}
```

Respuesta de error (400):

```json
{
  "error": "Datos inválidos",
  "details": [
    {
      "campo": "url",
      "mensaje": "URL inválida: debe ser de AliExpress"
    }
  ]
}
```

Respuesta de error (500):

```json
{
  "error": "Error al scrapear el producto",
  "message": "Timeout esperando elemento..."
}
```

## 🏗️ Estructura del Proyecto

```
aliexpres-scrapping/
├── src/
│   ├── schemas/
│   │   └── product.schema.js      # Esquemas Zod para validación
│   ├── scraper/
│   │   └── aliexpress.scraper.js  # Lógica de scraping
│   └── server.js                   # Servidor Express
├── index.js                        # Punto de entrada
├── package.json
└── README.md
```

## 🔗 Integración con Spring Boot

### Ejemplo de consumo desde Spring Boot:

```java
@Service
public class AliExpressImporterService {

    @Value("${aliexpress.importer.url}")
    private String importerUrl; // http://localhost:3001

    private final RestTemplate restTemplate;

    public ProductDTO scrapeProduct(String aliexpressUrl) {
        String endpoint = importerUrl + "/scrape";

        Map<String, String> request = Map.of("url", aliexpressUrl);

        ResponseEntity<ProductDTO> response = restTemplate.postForEntity(
            endpoint,
            request,
            ProductDTO.class
        );

        return response.getBody();
    }
}
```

### Configuración en application.properties:

```properties
aliexpress.importer.url=http://localhost:3001
```

## 🧪 Pruebas

### Con cURL:

```bash
curl -X POST http://localhost:3001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://es.aliexpress.com/item/1005006254572890.html"}'
```

### Con PowerShell:

```powershell
$body = @{
    url = "https://es.aliexpress.com/item/1005006254572890.html"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/scrape" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Con Postman:

1. Método: POST
2. URL: `http://localhost:3001/scrape`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):

```json
{
  "url": "https://es.aliexpress.com/item/1005006254572890.html"
}
```

## ⚙️ Configuración

### Variables de entorno:

```bash
# Puerto del servidor (default: 3001)
PORT=3001
```

Crear archivo `.env` (opcional):

```env
PORT=3001
```

## 🐛 Troubleshooting

### Error: "Playwright chromium not found"

```bash
npx playwright install chromium
```

### Error: "Port 3001 already in use"

Cambiar el puerto:

```bash
PORT=3002 npm start
```

### El scraping es muy lento

AliExpress usa contenido dinámico. El scraper espera a que se carguen los elementos (5-10 segundos). Esto es normal.

### No se extraen todos los datos

AliExpress cambia frecuentemente su estructura HTML. Revisar los selectores en `src/scraper/aliexpress.scraper.js`.

## 📝 Notas

- **Limitaciones de AliExpress**: AliExpress puede detectar scraping y bloquear peticiones. Usar con moderación.
- **Tiempo de respuesta**: El scraping puede tomar 5-15 segundos por producto.
- **Mantenimiento**: Los selectores HTML pueden cambiar. Actualizar según sea necesario.

## 📄 Licencia

MIT

## 👨‍💻 Autor

Desarrollado para integración con backend Spring Boot.

aliexpress.price-updater.js - Scraper simplificado que solo extrae precios y fechas de entrega
price-update.schema.js - Validación con Zod para el nuevo endpoint
Nuevo endpoint POST /update-prices en el server
Uso del endpoint:
POST http://localhost:3001/update-prices
{
"products": [
{
"productId": "123",
"url": "https://es.aliexpress.com/item/1005006982763663.html"
},
{
"productId": "456",
"url": "https://es.aliexpress.com/item/1005009987739670.html"
}
]
}

Respuesta:
{
"success": true,
"summary": {
"total": 2,
"successful": 2,
"failed": 0
},
"data": [
{
"productId": "123",
"success": true,
"basePrice": 0.99,
"originalPrice": 13.77,
"discount": 93,
"deliveryEstimateDays": { "min": 19, "max": 23 }
},
{
"productId": "456",
"success": true,
"basePrice": 5.99,
...
}
]
}
