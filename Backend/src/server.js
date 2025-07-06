const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");

// Importar rutas
const chatRoutes = require("./routes/chat");
// const testChatRoutes = require("./routes/test-chat"); // Comentado: archivo no existe
const healthRoutes = require("./routes/health");
const documentsRoutes = require("./routes/documents");

// Importar middlewares
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");
const logger = require("./utils/logger");

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares de seguridad
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://tudominio.com"]
        : [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:8080",
          ],
    credentials: true,
  })
);

// Middlewares de parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use(rateLimiter);

// Logging de requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// Rutas
app.use("/api/health", healthRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/api/test-chat", testChatRoutes); // Comentado: archivo no existe
app.use("/api/documents", documentsRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "Tienda Alemana Chatbot Backend API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      chat: "/api/chat",
      documents: "/api/documents",
    },
  });
});

// Middleware de manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    message: `La ruta ${req.originalUrl} no existe`,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  logger.info(`🚀 Servidor corriendo en puerto ${PORT}`);
  logger.info(`📱 Ambiente: ${process.env.NODE_ENV}`);
  logger.info(`🤖 Modelo Ollama: ${process.env.OLLAMA_MODEL}`);
});

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

module.exports = app;
