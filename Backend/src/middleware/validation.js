const Joi = require("joi");
const logger = require("../utils/logger");

// Esquema de validación para mensajes de chat
const chatMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(1000).required().messages({
    "string.empty": "El mensaje no puede estar vacío",
    "string.min": "El mensaje debe tener al menos 1 carácter",
    "string.max": "El mensaje no puede exceder 1000 caracteres",
    "any.required": "El mensaje es requerido",
  }),
  userId: Joi.string().alphanum().min(3).max(50).optional().messages({
    "string.alphanum": "El ID de usuario debe ser alfanumérico",
    "string.min": "El ID de usuario debe tener al menos 3 caracteres",
    "string.max": "El ID de usuario no puede exceder 50 caracteres",
  }),
  limit: Joi.number().integer().min(1).max(20).optional().default(5),
});

// Middleware de validación para mensajes de chat
const validateChatMessage = (req, res, next) => {
  const { error, value } = chatMessageSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    logger.warn("Validation error:", errorMessages);

    return res.status(400).json({
      success: false,
      error: "Datos de entrada inválidos",
      details: errorMessages,
    });
  }

  // Reemplazar req.body con los datos validados y limpiados
  req.body = value;
  next();
};

// Esquema de validación para archivos
const fileUploadSchema = Joi.object({
  maxFiles: Joi.number().integer().min(1).max(10).optional().default(10),
  maxSize: Joi.number()
    .integer()
    .min(1024) // 1KB mínimo
    .max(10 * 1024 * 1024) // 10MB máximo
    .optional()
    .default(10 * 1024 * 1024),
});

// Middleware de validación para subida de archivos
const validateFileUpload = (req, res, next) => {
  const { error, value } = fileUploadSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      error: "Parámetros de subida inválidos",
      details: errorMessages,
    });
  }

  req.uploadConfig = value;
  next();
};

// Validación de parámetros de consulta generales
const queryParamsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(10),
  sort: Joi.string().valid("asc", "desc").optional().default("desc"),
  search: Joi.string().trim().max(200).optional(),
});

const validateQueryParams = (req, res, next) => {
  const { error, value } = queryParamsSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessages = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    return res.status(400).json({
      success: false,
      error: "Parámetros de consulta inválidos",
      details: errorMessages,
    });
  }

  req.query = value;
  next();
};

module.exports = {
  validateChatMessage,
  validateFileUpload,
  validateQueryParams,
};
