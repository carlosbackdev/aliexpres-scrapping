# AliExpress Importer Microservice

Microservicio Node.js para scrapear productos de AliExpress y devolverlos en formato JSON estructurado para consumo por el backend Spring Boot.

## 🚀 Características

- Scraping de productos de AliExpress con Playwright
- Extracción de datos: título, precio, imágenes, variantes, opciones de envío, etc.
- Validación de entrada/salida con Zod
- API REST con Express
- CORS habilitado para integración con Spring Boot
- Manejo robusto de errores

### El scraping es muy lento

AliExpress usa contenido dinámico. El scraper espera a que se carguen los elementos (5-10 segundos). Esto es normal.

### No se extraen todos los datos

AliExpress cambia frecuentemente su estructura HTML. Revisar los selectores en `src/scraper/aliexpress.scraper.js`.

## 📝 Notas

- **Limitaciones de AliExpress**: AliExpress puede detectar scraping y bloquear peticiones. Usar con moderación.
- **Tiempo de respuesta**: El scraping puede tomar 5-15 segundos por producto.
- **Mantenimiento**: Los selectores HTML pueden cambiar. Actualizar según sea necesario.

...
}
]
}
