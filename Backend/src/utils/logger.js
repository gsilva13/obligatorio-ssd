const winston = require("winston");
const path = require("path");

// Configurar formatos de log
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Formato para consola (más legible)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    // Agregar metadatos si existen
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Crear directorio de logs si no existe
const logDir = path.dirname(process.env.LOG_FILE || "./logs/app.log");
require("fs").mkdirSync(logDir, { recursive: true });

// Configurar transportes
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: consoleFormat,
    handleExceptions: true,
  }),

  // File transport para todos los logs
  new winston.transports.File({
    filename: process.env.LOG_FILE || "./logs/app.log",
    level: process.env.LOG_LEVEL || "info",
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    handleExceptions: true,
  }),

  // File transport solo para errores
  new winston.transports.File({
    filename: path.join(
      path.dirname(process.env.LOG_FILE || "./logs/app.log"),
      "error.log"
    ),
    level: "error",
    format: logFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    handleExceptions: true,
  }),
];

// Crear logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  transports: transports,
  exitOnError: false,
  // Manejar exceptions y rejections no capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(
        path.dirname(process.env.LOG_FILE || "./logs/app.log"),
        "exceptions.log"
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(
        path.dirname(process.env.LOG_FILE || "./logs/app.log"),
        "rejections.log"
      ),
    }),
  ],
});

// Métodos de conveniencia
logger.request = (req, res, responseTime) => {
  logger.info("HTTP Request", {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });
};

logger.chat = (message, response, userId = null) => {
  logger.info("Chat Interaction", {
    userId: userId || "anonymous",
    messageLength: message.length,
    responseLength: response.length,
    timestamp: new Date().toISOString(),
  });
};

logger.document = (action, details) => {
  logger.info("Document Operation", {
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// En desarrollo, agregar más detalles
if (process.env.NODE_ENV === "development") {
  logger.level = "debug";

  // Log de queries SQL si existieran
  logger.query = (query, duration) => {
    logger.debug("Database Query", {
      query: query.substring(0, 200) + (query.length > 200 ? "..." : ""),
      duration: `${duration}ms`,
    });
  };
}

module.exports = logger;
