const express = require("express");
const router = express.Router();

/**
 * GET /api/health
 * Verificar estado general del servidor
 */
router.get("/", (req, res) => {
  const healthData = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
    services: {
      database: "not_applicable",
      ollama: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_MODEL || "llama3.2:1b",
    },
  };

  res.json({
    success: true,
    data: healthData,
  });
});

/**
 * GET /api/health/detailed
 * Verificar estado detallado de todos los servicios
 */
router.get("/detailed", async (req, res) => {
  const healthChecks = {
    server: {
      status: "healthy",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      nodeEnv: process.env.NODE_ENV,
    },
    configuration: {
      port: process.env.PORT,
      ollamaUrl: process.env.OLLAMA_BASE_URL,
      ollamaModel: process.env.OLLAMA_MODEL,
      vectorStorePath: process.env.VECTOR_STORE_PATH,
    },
  };

  res.json({
    success: true,
    data: healthChecks,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
