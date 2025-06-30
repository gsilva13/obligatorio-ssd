const PDFParse = require("pdf-parse");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { OllamaEmbeddings } = require("@langchain/community/embeddings/ollama");
const fs = require("fs").promises;
const path = require("path");
const logger = require("../utils/logger");

class DocumentService {
  constructor() {
    this.embeddings = null;
    this.textSplitter = null;
    this.setupComponents();
  }

  setupComponents() {
    // Configurar embeddings
    this.embeddings = new OllamaEmbeddings({
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
    });

    // Configurar text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.CHUNK_SIZE) || 1000,
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 200,
      separators: ["\n\n", "\n", ". ", " ", ""],
    });
  }

  async extractTextFromPDF(pdfBuffer, filename) {
    try {
      logger.info(`Extrayendo texto de PDF: ${filename}`);

      const data = await PDFParse(pdfBuffer);

      if (!data.text || data.text.length === 0) {
        throw new Error("El PDF no contiene texto extraíble");
      }

      logger.info(
        `Texto extraído: ${data.text.length} caracteres de ${filename}`
      );

      return {
        text: data.text,
        numPages: data.numpages,
        info: data.info,
        filename: filename,
      };
    } catch (error) {
      logger.error(`Error extrayendo PDF ${filename}:`, error);
      throw new Error(
        `No se pudo procesar el PDF ${filename}: ${error.message}`
      );
    }
  }

  async splitTextIntoChunks(text, metadata = {}) {
    try {
      const chunks = await this.textSplitter.splitText(text);

      // Agregar metadata a cada chunk
      const documentsWithMetadata = chunks.map((chunk, index) => ({
        pageContent: chunk,
        metadata: {
          ...metadata,
          chunkIndex: index,
          chunkSize: chunk.length,
        },
      }));

      logger.info(`Texto dividido en ${chunks.length} chunks`);
      return documentsWithMetadata;
    } catch (error) {
      logger.error("Error dividiendo texto:", error);
      throw error;
    }
  }

  async processMultiplePDFs(pdfFiles) {
    try {
      logger.info(`Procesando ${pdfFiles.length} archivos PDF`);

      const allDocuments = [];

      for (const pdfFile of pdfFiles) {
        // Extraer texto del PDF
        const { text, filename, numPages } = await this.extractTextFromPDF(
          pdfFile.buffer,
          pdfFile.originalname
        );

        // Determinar el tipo de documento basado en el nombre del archivo
        const documentType = this.determineDocumentType(filename);

        // Dividir en chunks
        const chunks = await this.splitTextIntoChunks(text, {
          source: filename,
          type: documentType,
          numPages: numPages,
          processedAt: new Date().toISOString(),
        });

        allDocuments.push(...chunks);
      }

      logger.info(`Total de chunks procesados: ${allDocuments.length}`);
      return allDocuments;
    } catch (error) {
      logger.error("Error procesando PDFs:", error);
      throw error;
    }
  }

  determineDocumentType(filename) {
    const lowerFilename = filename.toLowerCase();

    if (
      lowerFilename.includes("catalogo") ||
      lowerFilename.includes("producto")
    ) {
      return "catalog";
    } else if (
      lowerFilename.includes("ubicacion") ||
      lowerFilename.includes("gondola")
    ) {
      return "location";
    } else if (
      lowerFilename.includes("sucursal") ||
      lowerFilename.includes("local")
    ) {
      return "store_info";
    } else {
      return "general";
    }
  }

  async createVectorStore(documents) {
    try {
      logger.info("Creando vector store...");

      if (!documents || documents.length === 0) {
        throw new Error("No hay documentos para procesar");
      }

      // Extraer textos y metadatos
      const texts = documents.map((doc) => doc.pageContent);
      const metadatas = documents.map((doc) => doc.metadata);

      // Crear vector store
      const vectorStore = await FaissStore.fromTexts(
        texts,
        metadatas,
        this.embeddings
      );

      logger.info("Vector store creado correctamente");
      return vectorStore;
    } catch (error) {
      logger.error("Error creando vector store:", error);
      throw error;
    }
  }

  async saveVectorStore(vectorStore, savePath) {
    try {
      logger.info(`Guardando vector store en: ${savePath}`);

      // Crear directorio si no existe
      const dir = path.dirname(savePath);
      await fs.mkdir(dir, { recursive: true });

      // Guardar vector store
      await vectorStore.save(savePath);

      logger.info("Vector store guardado correctamente");
    } catch (error) {
      logger.error("Error guardando vector store:", error);
      throw error;
    }
  }

  async loadDefaultPDFs() {
    try {
      const pdfsFolder = process.env.PDFS_FOLDER || "./data/pdfs";

      // Verificar si la carpeta existe
      try {
        await fs.access(pdfsFolder);
      } catch (error) {
        logger.warn(`Carpeta de PDFs no encontrada: ${pdfsFolder}`);
        return [];
      }

      const files = await fs.readdir(pdfsFolder);
      const pdfFiles = files.filter((file) =>
        file.toLowerCase().endsWith(".pdf")
      );

      if (pdfFiles.length === 0) {
        logger.warn("No se encontraron archivos PDF en la carpeta");
        return [];
      }

      const loadedPDFs = [];

      for (const filename of pdfFiles) {
        const filePath = path.join(pdfsFolder, filename);
        const buffer = await fs.readFile(filePath);

        loadedPDFs.push({
          buffer: buffer,
          originalname: filename,
          size: buffer.length,
        });
      }

      logger.info(`Cargados ${loadedPDFs.length} archivos PDF por defecto`);
      return loadedPDFs;
    } catch (error) {
      logger.error("Error cargando PDFs por defecto:", error);
      throw error;
    }
  }

  async setupVectorStoreFromDefaultPDFs() {
    try {
      logger.info("Configurando vector store desde PDFs por defecto...");

      // Cargar PDFs por defecto
      const pdfFiles = await this.loadDefaultPDFs();

      if (pdfFiles.length === 0) {
        throw new Error("No se encontraron archivos PDF para procesar");
      }

      // Procesar PDFs
      const documents = await this.processMultiplePDFs(pdfFiles);

      // Crear vector store
      const vectorStore = await this.createVectorStore(documents);

      // Guardar vector store
      const savePath = process.env.VECTOR_STORE_PATH || "./data/vector-store";
      await this.saveVectorStore(vectorStore, savePath);

      return {
        success: true,
        documentsProcessed: documents.length,
        pdfFiles: pdfFiles.map((f) => f.originalname),
        vectorStorePath: savePath,
      };
    } catch (error) {
      logger.error("Error configurando vector store:", error);
      throw error;
    }
  }
}

module.exports = new DocumentService();
