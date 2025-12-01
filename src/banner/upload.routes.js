const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadImage } = require('./upload.controller');

const router = express.Router();

// Configuración de Multer
const uploadDir = path.join(__dirname, '../../uploads/products');

// Crear directorio si no existe
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Mantener el nombre original del archivo
    const originalName = file.originalname;
    cb(null, originalName);
  }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, WEBP, GIF)'), false);
  }
};

// Configuración de Multer con límites
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10MB
  }
});

/**
 * POST /api/upload/image
 * Sube una imagen al servidor
 */
router.post('/image', upload.single('image'), uploadImage);

module.exports = router;
