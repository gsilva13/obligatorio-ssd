const logger = require("../utils/logger");

/**
 * Servicio para gestionar sesiones de chat y mantener contexto conversacional
 */
class SessionService {
  constructor() {
    this.sessions = new Map(); // userId -> { messages: [], createdAt: Date, lastActivity: Date }
    this.maxSessionAge = 30 * 60 * 1000; // 30 minutos en millisegundos
    this.maxMessagesPerSession = 20; // Máximo de mensajes a recordar

    // Limpiar sesiones expiradas cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);

    logger.info("SessionService inicializado");
  }

  /**
   * Obtener el historial de mensajes de una sesión
   */
  getSessionHistory(userId) {
    const session = this.sessions.get(userId);
    if (!session) {
      return [];
    }

    // Verificar si la sesión ha expirado
    if (Date.now() - session.lastActivity > this.maxSessionAge) {
      this.sessions.delete(userId);
      logger.info(`Sesión expirada eliminada: ${userId}`);
      return [];
    }

    return session.messages || [];
  }

  /**
   * Agregar un mensaje al historial de la sesión
   */
  addMessage(userId, message, response, isUser = true) {
    let session = this.sessions.get(userId);

    if (!session) {
      session = {
        messages: [],
        createdAt: new Date(),
        lastActivity: new Date(),
      };
      this.sessions.set(userId, session);
      logger.info(`Nueva sesión creada: ${userId}`);
    }

    // Actualizar última actividad
    session.lastActivity = new Date();

    // Agregar mensaje del usuario
    if (isUser) {
      session.messages.push({
        role: "user",
        content: message,
        timestamp: new Date(),
      });
    }

    // Agregar respuesta del asistente si se proporciona
    if (response) {
      session.messages.push({
        role: "assistant",
        content: response,
        timestamp: new Date(),
      });
    }

    // Mantener solo los últimos N mensajes para evitar que la sesión crezca infinitamente
    if (session.messages.length > this.maxMessagesPerSession) {
      const messagesToRemove =
        session.messages.length - this.maxMessagesPerSession;
      session.messages.splice(0, messagesToRemove);
      logger.debug(
        `Mensajes antiguos eliminados de sesión ${userId}: ${messagesToRemove}`
      );
    }

    logger.debug(
      `Mensaje agregado a sesión ${userId}. Total mensajes: ${session.messages.length}`
    );
  }

  /**
   * Obtener el contexto conversacional formateado para el prompt
   */
  getConversationContext(userId) {
    const history = this.getSessionHistory(userId);

    if (history.length === 0) {
      return "";
    }

    // Formatear el historial para incluir en el prompt
    const contextLines = history.slice(-10).map((msg) => {
      // Últimos 10 mensajes
      const role = msg.role === "user" ? "Cliente" : "Asistente";
      return `${role}: ${msg.content}`;
    });

    return contextLines.join("\n");
  }

  /**
   * Limpiar sesión específica
   */
  clearSession(userId) {
    const deleted = this.sessions.delete(userId);
    if (deleted) {
      logger.info(`Sesión eliminada manualmente: ${userId}`);
    }
    return deleted;
  }

  /**
   * Obtener estadísticas de sesiones activas
   */
  getSessionStats() {
    const now = Date.now();
    let activeSessions = 0;
    let totalMessages = 0;

    for (const [userId, session] of this.sessions) {
      if (now - session.lastActivity <= this.maxSessionAge) {
        activeSessions++;
        totalMessages += session.messages.length;
      }
    }

    return {
      activeSessions,
      totalSessions: this.sessions.size,
      totalMessages,
      averageMessagesPerSession:
        activeSessions > 0 ? Math.round(totalMessages / activeSessions) : 0,
    };
  }

  /**
   * Limpiar sesiones expiradas automáticamente
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, session] of this.sessions) {
      if (now - session.lastActivity > this.maxSessionAge) {
        this.sessions.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Sesiones expiradas limpiadas: ${cleaned}`);
    }
  }

  /**
   * Destructor - limpiar interval cuando se destruye el servicio
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    logger.info("SessionService destruido");
  }
}

module.exports = new SessionService();
