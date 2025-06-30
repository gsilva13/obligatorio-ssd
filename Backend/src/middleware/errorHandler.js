const logger = require("../utils/logger");

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  // Si ya se envió una respuesta, pasar al siguiente middleware de error
  if (res.headersSent) {
    return next(err);
  }

  // Log del error
  logger.error("Error Handler:", {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Determinar código de estado y mensaje de error
  let statusCode = 500;
  let errorMessage = "Error interno del servidor";
  let errorDetails = null;

  // Errores específicos
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorMessage = "Datos de entrada inválidos";
    errorDetails = err.details || err.message;
  } else if (err.name === "UnauthorizedError") {
    statusCode = 401;
    errorMessage = "No autorizado";
  } else if (err.name === "ForbiddenError") {
    statusCode = 403;
    errorMessage = "Acceso denegado";
  } else if (err.name === "NotFoundError") {
    statusCode = 404;
    errorMessage = "Recurso no encontrado";
  } else if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 413;
    errorMessage = "Archivo demasiado grande";
    errorDetails = "El archivo excede el tamaño máximo permitido (10MB)";
  } else if (err.code === "LIMIT_FILE_COUNT") {
    statusCode = 413;
    errorMessage = "Demasiados archivos";
    errorDetails = "Máximo 10 archivos permitidos por subida";
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    errorMessage = "Tipo de archivo no permitido";
    errorDetails = "Solo se permiten archivos PDF";
  } else if (err.message && err.message.includes("ECONNREFUSED")) {
    statusCode = 503;
    errorMessage = "Servicio no disponible";
    errorDetails =
      "No se puede conectar con Ollama. Verifica que esté ejecutándose.";
  } else if (err.status) {
    statusCode = err.status;
    errorMessage = err.message || errorMessage;
  }

  // Construir respuesta de error
  const errorResponse = {
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Agregar detalles en desarrollo
  if (process.env.NODE_ENV === "development") {
    errorResponse.details = errorDetails || err.message;
    errorResponse.stack = err.stack;
  } else if (errorDetails) {
    errorResponse.details = errorDetails;
  }

  // Responder con el error
  res.status(statusCode).json(errorResponse);
};

// Middleware para capturar errores async
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para errores 404
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.status = 404;
  error.name = "NotFoundError";
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
};

// Exportar el middleware principal por defecto
module.exports = errorHandler;
