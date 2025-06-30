const express = require("express");
const multer = require("multer");
const router = express.Router();
const documentService = require("../services/documentService");
const logger = require("../utils/logger");
const path = require("path");

// Configurar multer para subida de archivos
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10, // Máximo 10 archivos
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos PDF"), false);
    }
  },
});

/**
 * POST /api/documents/upload
 * Subir y procesar archivos PDF
 */
router.post("/upload", upload.array("pdfs", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionaron archivos PDF",
      });
    }

    logger.info(`Procesando ${req.files.length} archivos PDF`);

    // Procesar PDFs
    const documents = await documentService.processMultiplePDFs(req.files);

    // Crear vector store
    const vectorStore = await documentService.createVectorStore(documents);

    // Guardar vector store
    const savePath = process.env.VECTOR_STORE_PATH || "./data/vector-store";
    await documentService.saveVectorStore(vectorStore, savePath);

    res.json({
      success: true,
      data: {
        message: "Documentos procesados correctamente",
        filesProcessed: req.files.map((f) => f.originalname),
        documentsCreated: documents.length,
        vectorStorePath: savePath,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error procesando documentos:", error);

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        error: "Archivo demasiado grande (máximo 10MB)",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error procesando documentos",
      message: error.message,
    });
  }
});

/**
 * POST /api/documents/setup
 * Configurar vector store desde PDFs por defecto
 */
router.post("/setup", async (req, res) => {
  try {
    logger.info("Configurando vector store desde PDFs por defecto");

    const result = await documentService.setupVectorStoreFromDefaultPDFs();

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error configurando documentos por defecto:", error);
    res.status(500).json({
      success: false,
      error: "Error configurando documentos",
      message: error.message,
    });
  }
});

/**
 * GET /api/documents/status
 * Verificar estado de los documentos y vector store
 */
router.get("/status", async (req, res) => {
  try {
    const vectorStorePath =
      process.env.VECTOR_STORE_PATH || "./data/vector-store";
    const pdfsFolder = process.env.PDFS_FOLDER || "./data/pdfs";

    // Verificar si existe el vector store
    let vectorStoreExists = false;
    try {
      const fs = require("fs").promises;
      await fs.access(vectorStorePath);
      vectorStoreExists = true;
    } catch (error) {
      vectorStoreExists = false;
    }

    // Verificar PDFs disponibles
    let availablePDFs = [];
    try {
      const fs = require("fs").promises;
      const files = await fs.readdir(pdfsFolder);
      availablePDFs = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );
    } catch (error) {
      logger.warn("No se pudo acceder a la carpeta de PDFs");
    }

    res.json({
      success: true,
      data: {
        vectorStore: {
          exists: vectorStoreExists,
          path: vectorStorePath,
        },
        pdfs: {
          folder: pdfsFolder,
          available: availablePDFs,
          count: availablePDFs.length,
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error verificando estado de documentos:", error);
    res.status(500).json({
      success: false,
      error: "Error verificando estado",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/documents/reset
 * Limpiar vector store (útil para desarrollo)
 */
router.delete("/reset", async (req, res) => {
  try {
    const vectorStorePath =
      process.env.VECTOR_STORE_PATH || "./data/vector-store";
    const fs = require("fs").promises;

    try {
      await fs.rm(vectorStorePath, { recursive: true, force: true });
      logger.info("Vector store eliminado");
    } catch (error) {
      logger.warn("No se pudo eliminar vector store (puede que no exista)");
    }

    res.json({
      success: true,
      data: {
        message: "Vector store reiniciado",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error reiniciando documentos:", error);
    res.status(500).json({
      success: false,
      error: "Error reiniciando documentos",
      message: error.message,
    });
  }
});

module.exports = router;
