const { ChatOllama } = require("@langchain/ollama");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const { PromptTemplate } = require("@langchain/core/prompts");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");
const logger = require("../utils/logger");
const sessionService = require("./sessionService");
const path = require("path");

class ChatService {
  constructor() {
    this.ollama = null;
    this.vectorStore = null;
    this.embeddings = null;
    this.chain = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      logger.info("🚀 Inicializando ChatService...");

      // Configurar Ollama
      logger.debug("🤖 Configurando ChatOllama...");
      const ollamaConfig = {
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model: process.env.OLLAMA_MODEL || "llama3.2:1b",
        temperature: 0.7,
      };
      logger.debug("📋 Configuración Ollama:", ollamaConfig);

      this.ollama = new ChatOllama(ollamaConfig);
      logger.info("✅ ChatOllama configurado");

      // Configurar embeddings
      logger.debug("🧮 Configurando OllamaEmbeddings...");
      const embeddingConfig = {
        baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
        model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
      };
      logger.debug("📋 Configuración Embeddings:", embeddingConfig);

      this.embeddings = new OllamaEmbeddings(embeddingConfig);
      logger.info("✅ OllamaEmbeddings configurado");

      // Probar conexión con Ollama antes de continuar
      logger.debug("🔗 Probando conexión con Ollama...");
      try {
        const healthCheck = await this.checkOllamaHealth();
        logger.debug("🏥 Estado de Ollama:", healthCheck);
        if (healthCheck.status !== "connected") {
          throw new Error(`Ollama no está disponible: ${healthCheck.error}`);
        }
        logger.info("✅ Conexión con Ollama verificada");
      } catch (healthError) {
        logger.error("❌ Error verificando conexión Ollama:", healthError);
        throw healthError;
      }

      // Probar embeddings antes de cargar vector store
      logger.debug("🧪 Probando funcionalidad de embeddings...");
      try {
        const testEmbedding = await this.embeddings.embedQuery("test");
        logger.debug(
          `✅ Embeddings funcionando, dimensiones: ${testEmbedding.length}`
        );
      } catch (embeddingError) {
        logger.error("❌ Error en embeddings:", embeddingError);
        throw new Error(`Embeddings no funcionan: ${embeddingError.message}`);
      }

      // Cargar vector store
      logger.debug("📚 Cargando vector store...");
      await this.loadVectorStore();

      // Configurar cadena RAG (mantener la original por ahora)
      logger.debug("⛓️  Configurando cadena RAG...");
      await this.setupRAGChain();

      this.initialized = true;
      logger.info("🎉 ChatService inicializado correctamente");

      // Log de resumen
      logger.info("📊 Resumen de inicialización:");
      logger.info(
        `  - Ollama: ${ollamaConfig.model} en ${ollamaConfig.baseUrl}`
      );
      logger.info(`  - Embeddings: ${embeddingConfig.model}`);
      logger.info(
        `  - Vector Store: ${this.vectorStore ? "CARGADO" : "ERROR"}`
      );
    } catch (error) {
      logger.error("💥 Error crítico inicializando ChatService:", error);
      this.initialized = false;
      throw error;
    }
  }

  async loadVectorStore() {
    try {
      const vectorStorePath =
        process.env.VECTOR_STORE_PATH || "./data/vector-store";
      logger.info(
        `📂 Intentando cargar vector store desde: ${vectorStorePath}`
      );

      // Intentar cargar vector store existente
      try {
        logger.debug("🔄 Cargando vector store existente...");
        this.vectorStore = await FaissStore.load(
          vectorStorePath,
          this.embeddings
        );
        logger.info("✅ Vector store cargado desde archivo exitosamente");

        // Verificar que el vector store tiene contenido real
        const testSearch = await this.vectorStore.similaritySearch("test", 1);
        logger.info(
          `📊 Vector store contiene ${testSearch.length} documentos de prueba`
        );

        if (testSearch.length > 0) {
          logger.debug(
            `📖 Primer documento: ${testSearch[0].pageContent.substring(
              0,
              100
            )}...`
          );
          logger.debug(
            `🏷️  Metadata: ${JSON.stringify(testSearch[0].metadata)}`
          );
        }
      } catch (error) {
        logger.error("❌ Error COMPLETO cargando vector store existente:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
          code: error.code,
        });
        logger.warn(
          "⚠️  No se pudo cargar vector store existente, se necesita crear uno nuevo"
        );
        logger.warn("💡 Ejecuta: npm run setup-vector-store");

        // Crear un vector store vacío temporal
        logger.debug("🔄 Creando vector store temporal vacío...");
        this.vectorStore = await FaissStore.fromTexts(
          [
            "Información no disponible. Por favor, carga los documentos primero.",
          ],
          [{ source: "placeholder" }],
          this.embeddings
        );
        logger.warn("⚠️  Vector store temporal creado (sin documentos reales)");
      }
    } catch (error) {
      logger.error("💥 Error crítico cargando vector store:", error);
      throw error;
    }
  }

  async setupRAGChain() {
    const retriever = this.vectorStore.asRetriever({
      k: 5, // Número de documentos relevantes a recuperar
      searchType: "similarity",
    });

    const promptTemplate = PromptTemplate.fromTemplate(`
Eres un asistente de Tienda Alemana, una cadena de supermercados. Tu trabajo es ayudar a los clientes respondiendo preguntas sobre:
- Productos disponibles, precios y stock
- Ubicación de productos dentro de la tienda (góndolas y secciones)
- Información de sucursales (horarios, direcciones)

Contexto relevante de documentos:
{context}

{conversationHistory}

Pregunta actual del cliente: {question}

Instrucciones:
- Responde de manera amigable y profesional
- Mantén coherencia con la conversación anterior si existe
- Si la información no está disponible en el contexto, dilo claramente
- Para preguntas sobre precios, incluye el símbolo $ y el valor exacto
- Para ubicaciones, menciona la góndola o sección específica
- Para horarios, menciona días y horas completas
- Si el cliente hace referencia a algo mencionado anteriormente, úsalo como contexto
- Si no puedes responder completamente, sugiere contactar con el personal de la tienda

Respuesta:`);

    // Función para formatear documentos
    const formatDocs = (docs) => {
      return docs.map((doc) => doc.pageContent).join("\n\n");
    };

    // Crear la cadena RAG con contexto conversacional
    this.chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocs),
        question: new RunnablePassthrough(),
        conversationHistory: (input) => {
          // Se espera que input tenga la forma: { question: "...", userId: "..." }
          if (input.userId) {
            const history = sessionService.getConversationContext(input.userId);
            return history ? `Historial de conversación:\n${history}\n` : "";
          }
          return "";
        },
      },
      promptTemplate,
      this.ollama,
      new StringOutputParser(),
    ]);

    logger.info("Cadena RAG configurada correctamente");
  }

  async chat(message, userId = null) {
    if (!this.initialized) {
      throw new Error("ChatService no ha sido inicializado");
    }

    try {
      logger.info(
        `Procesando pregunta: ${message}${
          userId ? ` (Usuario: ${userId})` : ""
        }`
      );

      // Si no hay userId, usar uno temporal para esta conversación
      const sessionId = userId || "anonymous_session";

      // Agregar mensaje del usuario al historial de sesión
      sessionService.addMessage(sessionId, message, null, true);

      // Enfoque híbrido: intentar RAG, si falla usar chat simple
      const response = await this.hybridChat(message, sessionId);

      // Agregar respuesta del asistente al historial de sesión
      sessionService.addMessage(sessionId, null, response.response, false);

      logger.info("Respuesta generada correctamente");
      return {
        success: true,
        response: response.response,
        userId: sessionId,
        timestamp: new Date().toISOString(),
        ragUsed: response.ragUsed,
      };
    } catch (error) {
      logger.error("Error en chat:", error);

      // Fallback final: chat simple sin contexto
      try {
        const fallbackResponse = await this.simpleChatFallback(message);
        return {
          success: true,
          response: fallbackResponse,
          userId: sessionId || "anonymous_session",
          timestamp: new Date().toISOString(),
          ragUsed: false,
          fallback: true,
        };
      } catch (fallbackError) {
        logger.error("Error en fallback:", fallbackError);
        return {
          success: false,
          error: "Error procesando la consulta",
          message: error.message,
          timestamp: new Date().toISOString(),
        };
      }
    }
  }

  async hybridChat(message, sessionId) {
    logger.debug(`🔍 Iniciando hybridChat para sessionId: ${sessionId}`);

    // Obtener contexto conversacional
    const history = sessionService.getConversationContext(sessionId);
    logger.debug(
      `💭 Contexto conversacional: ${history ? "DISPONIBLE" : "VACÍO"}`
    );
    if (history) {
      logger.debug(`📝 Historial: ${history.substring(0, 100)}...`);
    }

    // Intentar obtener documentos relevantes con RAG
    let ragContext = "";
    let ragUsed = false;

    try {
      logger.info(`🔍 Iniciando búsqueda RAG para: "${message}"`);

      // Verificar estado del vector store
      if (!this.vectorStore) {
        throw new Error("Vector store no inicializado");
      }
      logger.debug("✅ Vector store disponible");

      // Verificar embeddings
      if (!this.embeddings) {
        throw new Error("Embeddings no inicializados");
      }
      logger.debug("✅ Embeddings disponibles");

      // Probar embedding del mensaje antes de búsqueda
      logger.debug("🧮 Probando generar embedding del mensaje...");
      try {
        const testEmbedding = await this.embeddings.embedQuery(message);
        logger.debug(
          `✅ Embedding generado exitosamente, dimensiones: ${testEmbedding.length}`
        );
      } catch (embError) {
        logger.error("❌ Error generando embedding del mensaje:", embError);
        throw embError;
      }

      // Realizar búsqueda de similitud
      logger.debug("🔍 Ejecutando similaritySearch...");
      const docs = await this.vectorStore.similaritySearch(message, 3);

      logger.info(`📄 Documentos encontrados: ${docs.length}`);

      if (docs.length === 0) {
        logger.warn("⚠️  No se encontraron documentos relevantes");
        ragContext =
          "No se encontraron documentos específicos para esta consulta.";
      } else {
        ragContext = docs
          .map((doc, index) => {
            logger.debug(
              `📖 Doc ${index + 1}: ${doc.pageContent.substring(0, 100)}...`
            );
            logger.debug(`🏷️  Metadata: ${JSON.stringify(doc.metadata)}`);
            return doc.pageContent;
          })
          .join("\n\n");

        logger.info(
          `📚 Contexto RAG generado: ${ragContext.length} caracteres`
        );
        ragUsed = true;
      }
    } catch (ragError) {
      logger.error("❌ Error detallado en RAG:", {
        message: ragError.message,
        stack: ragError.stack,
        name: ragError.name,
      });

      // Logs adicionales para debugging
      logger.debug("🔧 Estado de componentes:");
      logger.debug(
        `  - Vector store: ${this.vectorStore ? "INICIALIZADO" : "NULL"}`
      );
      logger.debug(
        `  - Embeddings: ${this.embeddings ? "INICIALIZADO" : "NULL"}`
      );
      logger.debug(`  - Mensaje: "${message}"`);

      ragContext =
        "Información específica de documentos no disponible en este momento.";
      ragUsed = false;
    }

    // Crear prompt híbrido con contexto conversacional + RAG (si disponible)
    logger.debug("📝 Generando prompt con contexto híbrido...");
    const promptTemplate = PromptTemplate.fromTemplate(`
Eres un asistente de Tienda Alemana, una cadena de supermercados. Tu trabajo es ayudar a los clientes respondiendo preguntas sobre:
- Productos disponibles, precios y stock
- Ubicación de productos dentro de la tienda (góndolas y secciones)
- Información de sucursales (horarios, direcciones)

Información de documentos:
{context}

{conversationHistory}

Pregunta actual del cliente: {question}

Instrucciones:
- Responde de manera amigable y profesional
- Mantén coherencia con la conversación anterior si existe
- Si la información específica no está disponible en los documentos, usa tu conocimiento general sobre supermercados
- Para preguntas sobre precios, incluye el símbolo $ y proporciona rangos realistas
- Para ubicaciones, menciona secciones típicas de supermercado
- Si el cliente hace referencia a algo mencionado anteriormente, úsalo como contexto
- Si no puedes responder completamente, sugiere contactar con el personal de la tienda

Respuesta:`);

    try {
      // Generar respuesta
      logger.debug("🤖 Enviando prompt a Ollama...");
      const chain = promptTemplate
        .pipe(this.ollama)
        .pipe(new StringOutputParser());

      const promptData = {
        context: ragContext,
        conversationHistory: history
          ? `Historial de conversación:\n${history}\n`
          : "",
        question: message,
      };

      logger.debug("📤 Datos del prompt:", {
        contextLength: ragContext.length,
        hasHistory: !!history,
        question: message,
      });

      const response = await chain.invoke(promptData);
      logger.info("✅ Respuesta generada exitosamente");
      logger.debug(`📝 Respuesta: ${response.substring(0, 100)}...`);

      return {
        response: response.trim(),
        ragUsed: ragUsed,
      };
    } catch (ollamaError) {
      logger.error(
        "❌ Error en generación de respuesta con Ollama:",
        ollamaError
      );
      throw ollamaError;
    }
  }

  async simpleChatFallback(message) {
    logger.debug("Usando fallback de chat simple");

    const simplePrompt = PromptTemplate.fromTemplate(`
Eres un asistente de Tienda Alemana. Responde de manera amigable y profesional.

Pregunta: {question}

Respuesta breve y útil:`);

    const chain = simplePrompt.pipe(this.ollama).pipe(new StringOutputParser());
    const response = await chain.invoke({ question: message });

    return response.trim();
  }

  async getRelevantDocuments(query, k = 5) {
    if (!this.vectorStore) {
      throw new Error("Vector store no inicializado");
    }

    try {
      logger.debug(`🔍 Buscando documentos relevantes para: "${query}"`);
      logger.debug(`📊 Número de documentos solicitados: ${k}`);

      const docs = await this.vectorStore.similaritySearch(query, k);

      logger.info(`📄 Documentos encontrados: ${docs.length}`);
      docs.forEach((doc, index) => {
        logger.debug(`📖 Doc ${index + 1}:`, {
          content: doc.pageContent.substring(0, 100) + "...",
          metadata: doc.metadata,
          contentLength: doc.pageContent.length,
        });
      });

      return docs.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: doc.score || 0,
      }));
    } catch (error) {
      logger.error("❌ Error obteniendo documentos relevantes:", error);
      throw error;
    }
  }

  // Método de diagnóstico para RAG
  async diagnoseRAG() {
    logger.info("🔧 Iniciando diagnóstico completo de RAG...");

    const diagnosis = {
      timestamp: new Date().toISOString(),
      initialized: this.initialized,
      components: {},
      tests: {},
    };

    try {
      // Verificar componentes
      diagnosis.components.ollama = !!this.ollama;
      diagnosis.components.embeddings = !!this.embeddings;
      diagnosis.components.vectorStore = !!this.vectorStore;
      diagnosis.components.chain = !!this.chain;

      logger.debug("📋 Estado de componentes:", diagnosis.components);

      // Test 1: Conexión Ollama
      try {
        const health = await this.checkOllamaHealth();
        diagnosis.tests.ollamaConnection = { success: true, data: health };
        logger.debug("✅ Test Ollama: PASSED");
      } catch (error) {
        diagnosis.tests.ollamaConnection = {
          success: false,
          error: error.message,
        };
        logger.error("❌ Test Ollama: FAILED", error.message);
      }

      // Test 2: Embeddings
      try {
        const testEmbedding = await this.embeddings.embedQuery("test query");
        diagnosis.tests.embeddings = {
          success: true,
          dimensions: testEmbedding.length,
          sampleValues: testEmbedding.slice(0, 5),
        };
        logger.debug(
          `✅ Test Embeddings: PASSED (${testEmbedding.length} dims)`
        );
      } catch (error) {
        diagnosis.tests.embeddings = { success: false, error: error.message };
        logger.error("❌ Test Embeddings: FAILED", error.message);
      }

      // Test 3: Vector Store Search
      try {
        const docs = await this.vectorStore.similaritySearch("test", 2);
        diagnosis.tests.vectorSearch = {
          success: true,
          documentsFound: docs.length,
          sampleContent: docs.map((d) => d.pageContent.substring(0, 50)),
        };
        logger.debug(`✅ Test Vector Search: PASSED (${docs.length} docs)`);
      } catch (error) {
        diagnosis.tests.vectorSearch = { success: false, error: error.message };
        logger.error("❌ Test Vector Search: FAILED", error.message);
      }

      // Test 4: End-to-end RAG
      try {
        const ragResult = await this.hybridChat(
          "¿cuáles son los precios?",
          "diagnostic_test"
        );
        diagnosis.tests.endToEndRAG = {
          success: true,
          ragUsed: ragResult.ragUsed,
          responseLength: ragResult.response.length,
        };
        logger.debug(
          `✅ Test End-to-End RAG: PASSED (RAG Used: ${ragResult.ragUsed})`
        );
      } catch (error) {
        diagnosis.tests.endToEndRAG = { success: false, error: error.message };
        logger.error("❌ Test End-to-End RAG: FAILED", error.message);
      }

      // Resumen
      const passedTests = Object.values(diagnosis.tests).filter(
        (t) => t.success
      ).length;
      const totalTests = Object.keys(diagnosis.tests).length;

      logger.info(
        `🎯 Diagnóstico completado: ${passedTests}/${totalTests} tests passed`
      );

      return diagnosis;
    } catch (error) {
      logger.error("💥 Error en diagnóstico:", error);
      diagnosis.tests.diagnostic = { success: false, error: error.message };
      return diagnosis;
    }
  }

  // Método para verificar si Ollama está disponible
  async checkOllamaHealth() {
    try {
      // Usar fetch directo para verificar la conexión con la URL correcta
      const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";

      const response = await fetch(`${baseUrl}/api/version`);
      if (response.ok) {
        const data = await response.json();
        return {
          status: "connected",
          model: process.env.OLLAMA_MODEL,
          version: data.version,
        };
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      logger.error("Error conectando con Ollama:", error);
      return { status: "disconnected", error: error.message };
    }
  }
}

module.exports = new ChatService();
