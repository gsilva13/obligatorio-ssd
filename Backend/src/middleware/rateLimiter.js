const { RateLimiterMemory } = require("rate-limiter-flexible");
const logger = require("../utils/logger");

// Configurar rate limiter
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    // Usar IP como clave, o userId si está disponible
    return req.body?.userId || req.ip || "anonymous";
  },
  points: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Número de requests permitidos
  duration: parseInt(process.env.RATE_LIMIT_WINDOW_MS) / 1000 || 900, // Ventana de tiempo en segundos (15 minutos por defecto)
});

// Rate limiter más estricto para endpoints de chat
const chatRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.body?.userId || req.ip || "anonymous",
  points: 30, // 30 mensajes por ventana
  duration: 900, // 15 minutos
});

// Rate limiter para subida de archivos
const uploadRateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip || "anonymous",
  points: 5, // 5 subidas por ventana
  duration: 3600, // 1 hora
});

// Middleware general de rate limiting
const rateLimitMiddleware = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.body?.userId || req.ip || "anonymous");
    next();
  } catch (rejRes) {
    const remainingPoints = rejRes.remainingPoints || 0;
    const msBeforeNext = rejRes.msBeforeNext || 0;
    const totalHits = rejRes.totalHits || 0;

    logger.warn(`Rate limit exceeded for ${req.ip}`, {
      remainingPoints,
      msBeforeNext,
      totalHits,
      endpoint: req.originalUrl,
    });

    res.set({
      "Retry-After": Math.round(msBeforeNext / 1000) || 1,
      "X-RateLimit-Limit": rateLimiter.points,
      "X-RateLimit-Remaining": remainingPoints,
      "X-RateLimit-Reset": new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      success: false,
      error: "Demasiadas solicitudes",
      message:
        "Has excedido el límite de solicitudes. Intenta nuevamente más tarde.",
      retryAfter: Math.round(msBeforeNext / 1000),
      details: {
        limit: rateLimiter.points,
        remaining: remainingPoints,
        resetTime: new Date(Date.now() + msBeforeNext).toISOString(),
      },
    });
  }
};

// Middleware específico para chat
const chatRateLimitMiddleware = async (req, res, next) => {
  try {
    await chatRateLimiter.consume(req.body?.userId || req.ip || "anonymous");
    next();
  } catch (rejRes) {
    const remainingPoints = rejRes.remainingPoints || 0;
    const msBeforeNext = rejRes.msBeforeNext || 0;

    logger.warn(`Chat rate limit exceeded for ${req.ip}`, {
      remainingPoints,
      msBeforeNext,
      endpoint: req.originalUrl,
    });

    res.set({
      "Retry-After": Math.round(msBeforeNext / 1000) || 1,
      "X-RateLimit-Limit": chatRateLimiter.points,
      "X-RateLimit-Remaining": remainingPoints,
      "X-RateLimit-Reset": new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      success: false,
      error: "Demasiados mensajes de chat",
      message:
        "Has enviado demasiados mensajes. Espera un momento antes de continuar.",
      retryAfter: Math.round(msBeforeNext / 1000),
    });
  }
};

// Middleware específico para subida de archivos
const uploadRateLimitMiddleware = async (req, res, next) => {
  try {
    await uploadRateLimiter.consume(req.ip || "anonymous");
    next();
  } catch (rejRes) {
    const remainingPoints = rejRes.remainingPoints || 0;
    const msBeforeNext = rejRes.msBeforeNext || 0;

    logger.warn(`Upload rate limit exceeded for ${req.ip}`, {
      remainingPoints,
      msBeforeNext,
      endpoint: req.originalUrl,
    });

    res.set({
      "Retry-After": Math.round(msBeforeNext / 1000) || 1,
      "X-RateLimit-Limit": uploadRateLimiter.points,
      "X-RateLimit-Remaining": remainingPoints,
      "X-RateLimit-Reset": new Date(Date.now() + msBeforeNext).toISOString(),
    });

    res.status(429).json({
      success: false,
      error: "Demasiadas subidas de archivos",
      message: "Has subido demasiados archivos. Intenta nuevamente más tarde.",
      retryAfter: Math.round(msBeforeNext / 1000),
    });
  }
};

module.exports = {
  rateLimitMiddleware,
  chatRateLimitMiddleware,
  uploadRateLimitMiddleware,
};

// Exportar el middleware general por defecto
module.exports = rateLimitMiddleware;
