const express = require("express");
const router = express.Router();
const chatService = require("../services/chatService");
const { validateChatMessage } = require("../middleware/validation");
const logger = require("../utils/logger");
const crypto = require("crypto");

// Inicializar el servicio de chat al cargar las rutas
chatService.initialize().catch((error) => {
  logger.error("Error inicializando chat service:", error);
});

/**
 * POST /api/chat
 * Enviar mensaje al chatbot
 */
router.post("/", validateChatMessage, async (req, res) => {
  try {
    const { message, userId } = req.body;

    // Generar ID único si no se proporciona
    const finalUserId =
      userId || `user_${crypto.randomBytes(8).toString("hex")}`;

    logger.info(`Chat request - User: ${finalUserId}, Message: ${message}`);

    // Procesar mensaje con el servicio de chat, pasando el userId para contexto
    const result = await chatService.chat(message, finalUserId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          response: result.response,
          timestamp: result.timestamp,
          userId: finalUserId,
          ragUsed: result.ragUsed || false,
          fallback: result.fallback || false,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Error procesando consulta",
        details: result.error,
        timestamp: result.timestamp,
      });
    }
  } catch (error) {
    logger.error("Error en endpoint /chat:", error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor",
      message: error.message,
    });
  }
});

/**
 * POST /api/chat/search
 * Buscar documentos relevantes sin generar respuesta
 */
router.post("/search", validateChatMessage, async (req, res) => {
  try {
    const { message, limit = 5 } = req.body;

    logger.info(`Search request: ${message}`);

    const documents = await chatService.getRelevantDocuments(message, limit);

    res.json({
      success: true,
      data: {
        query: message,
        documents: documents,
        count: documents.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error en endpoint /chat/search:", error);
    res.status(500).json({
      success: false,
      error: "Error buscando documentos",
      message: error.message,
    });
  }
});

/**
 * GET /api/chat/health
 * Verificar estado del servicio de chat y conexión con Ollama
 */
router.get("/health", async (req, res) => {
  try {
    const ollamaStatus = await chatService.checkOllamaHealth();

    res.json({
      success: true,
      data: {
        chatService: chatService.initialized
          ? "initialized"
          : "not_initialized",
        ollama: ollamaStatus,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error en endpoint /chat/health:", error);
    res.status(500).json({
      success: false,
      error: "Error verificando estado del servicio",
      message: error.message,
    });
  }
});

/**
 * GET /api/chat/diagnose
 * Diagnóstico completo del sistema RAG
 */
router.get("/diagnose", async (req, res) => {
  try {
    logger.info("🔧 Iniciando diagnóstico de RAG via endpoint...");

    const diagnosis = await chatService.diagnoseRAG();

    res.json({
      success: true,
      data: {
        diagnosis: diagnosis,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error en endpoint /chat/diagnose:", error);
    res.status(500).json({
      success: false,
      error: "Error ejecutando diagnóstico",
      message: error.message,
    });
  }
});

/**
 * POST /api/chat/reinitialize
 * Reinicializar el servicio de chat (útil después de actualizar documentos)
 */
router.post("/reinitialize", async (req, res) => {
  try {
    logger.info("Reinicializando servicio de chat...");

    await chatService.initialize();

    res.json({
      success: true,
      data: {
        message: "Servicio de chat reinicializado correctamente",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error reinicializando servicio de chat:", error);
    res.status(500).json({
      success: false,
      error: "Error reinicializando servicio de chat",
      message: error.message,
    });
  }
});

/**
 * GET /api/chat/sessions
 * Obtener estadísticas de sesiones activas
 */
router.get("/sessions", async (req, res) => {
  try {
    const sessionService = require("../services/sessionService");
    const stats = sessionService.getSessionStats();

    res.json({
      success: true,
      data: {
        sessionStats: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error obteniendo estadísticas de sesiones:", error);
    res.status(500).json({
      success: false,
      error: "Error obteniendo estadísticas de sesiones",
      message: error.message,
    });
  }
});

/**
 * DELETE /api/chat/sessions/:userId
 * Limpiar historial de conversación de un usuario específico
 */
router.delete("/sessions/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const sessionService = require("../services/sessionService");

    const deleted = sessionService.clearSession(userId);

    res.json({
      success: true,
      data: {
        message: deleted
          ? "Sesión eliminada correctamente"
          : "Sesión no encontrada",
        userId: userId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Error eliminando sesión:", error);
    res.status(500).json({
      success: false,
      error: "Error eliminando sesión",
      message: error.message,
    });
  }
});

module.exports = router;
