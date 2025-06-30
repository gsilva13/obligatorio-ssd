const express = require("express");
const router = express.Router();
const { ChatOllama } = require("@langchain/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const sessionService = require("../services/sessionService");
const logger = require("../utils/logger");
const crypto = require("crypto");

// Configuración simple para prueba
let ollama = null;

async function initTestChat() {
  if (!ollama) {
    ollama = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2:1b",
      temperature: 0.7,
    });
  }
}

/**
 * POST /api/test-chat
 * Chat simple sin RAG para probar contexto conversacional
 */
router.post("/", async (req, res) => {
  try {
    await initTestChat();

    const { message, userId } = req.body;
    const finalUserId =
      userId || `user_${crypto.randomBytes(8).toString("hex")}`;

    logger.info(`Test Chat - User: ${finalUserId}, Message: ${message}`);

    // Obtener historial de conversación
    const history = sessionService.getConversationContext(finalUserId);

    // Crear prompt con contexto conversacional
    const promptTemplate = PromptTemplate.fromTemplate(`
Eres un asistente de Tienda Alemana, una cadena de supermercados. 

${history ? `Historial de conversación:\n${history}\n` : ""}

Pregunta actual del cliente: {question}

Responde de manera amigable y profesional. Si el cliente hace referencia a algo mencionado anteriormente, úsalo como contexto.

Respuesta:`);

    // Agregar mensaje del usuario al historial
    sessionService.addMessage(finalUserId, message, null, true);

    // Procesar con LangChain
    const chain = promptTemplate.pipe(ollama).pipe(new StringOutputParser());
    const response = await chain.invoke({ question: message });
    const cleanResponse = response.trim();

    // Agregar respuesta del asistente al historial
    sessionService.addMessage(finalUserId, null, cleanResponse, false);

    logger.info("Test Chat - Respuesta generada correctamente");

    res.json({
      success: true,
      data: {
        response: cleanResponse,
        timestamp: new Date().toISOString(),
        userId: finalUserId,
        hasHistory: !!history,
      },
    });
  } catch (error) {
    logger.error("Error en test-chat:", error);
    res.status(500).json({
      success: false,
      error: "Error procesando la consulta de prueba",
      message: error.message,
    });
  }
});

module.exports = router;
