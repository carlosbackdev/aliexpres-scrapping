FROM mcr.microsoft.com/playwright:v1.56.1-noble

# Establecer directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el código de la aplicación
COPY . .

# Exponer el puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV PORT=3001
ENV NODE_ENV=production

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
