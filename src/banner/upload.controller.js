const fs = require('fs').promises;
const path = require('path');

/**
 * Maneja la subida de una imagen desde el frontend
 */
async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se recibió ninguna imagen' 
      });
    }

    const filename = req.file.filename;
    const filepath = req.file.path;
    const publicUrl = `/uploads/products/${filename}`;

    console.log(`✅ Imagen subida: ${filename}`);

    return res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        filename: filename,
        localPath: filepath,
        publicUrl: publicUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al subir la imagen',
      error: error.message
    });
  }
}

module.exports = {
  uploadImage
};
