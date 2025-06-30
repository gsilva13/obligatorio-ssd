const documentService = require("../services/documentService");
const logger = require("../utils/logger");

/**
 * Script para configurar el vector store desde archivos PDF por defecto
 * Ejecutar con: npm run setup-vector-store
 */

async function setupVectorStore() {
  try {
    logger.info("🚀 Iniciando configuración del vector store...");

    console.log("📋 Configurando vector store desde PDFs por defecto...");
    console.log(
      "📁 Carpeta de PDFs:",
      process.env.PDFS_FOLDER || "./data/pdfs"
    );
    console.log(
      "💾 Destino vector store:",
      process.env.VECTOR_STORE_PATH || "./data/vector-store"
    );
    console.log("");

    const result = await documentService.setupVectorStoreFromDefaultPDFs();

    console.log("✅ Vector store configurado exitosamente!");
    console.log("📊 Estadísticas:");
    console.log(`   - Archivos procesados: ${result.pdfFiles.length}`);
    console.log(`   - Documentos creados: ${result.documentsProcessed}`);
    console.log(`   - Vector store guardado en: ${result.vectorStorePath}`);
    console.log("");
    console.log("📄 Archivos PDF procesados:");
    result.pdfFiles.forEach((file) => {
      console.log(`   - ${file}`);
    });
    console.log("");
    console.log(
      "🎉 ¡Configuración completada! El chatbot está listo para funcionar."
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error configurando vector store:", error.message);
    logger.error("Setup script error:", error);

    if (error.message.includes("No se encontraron archivos PDF")) {
      console.log("");
      console.log("💡 Instrucciones:");
      console.log('1. Crea la carpeta "data/pdfs" en la raíz del proyecto');
      console.log("2. Coloca los archivos PDF en esa carpeta:");
      console.log("   - Catálogo de productos");
      console.log("   - Ubicación de productos");
      console.log("   - Información de sucursales");
      console.log("3. Ejecuta nuevamente: npm run setup-vector-store");
    } else if (error.message.includes("ECONNREFUSED")) {
      console.log("");
      console.log("💡 Verifica que Ollama esté ejecutándose:");
      console.log("1. Inicia Ollama: ollama serve");
      console.log("2. Descarga el modelo: ollama pull llama3.2:1b");
      console.log("3. Ejecuta nuevamente: npm run setup-vector-store");
    }

    process.exit(1);
  }
}

// Verificar configuración antes de ejecutar
function checkConfiguration() {
  console.log("🔧 Verificando configuración...");

  const requiredEnvVars = [
    "OLLAMA_BASE_URL",
    "OLLAMA_MODEL",
    "PDFS_FOLDER",
    "VECTOR_STORE_PATH",
  ];

  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.log(
      "⚠️  Variables de entorno faltantes (usando valores por defecto):"
    );
    missing.forEach((varName) => {
      const defaultValue = {
        OLLAMA_BASE_URL: "http://localhost:11434",
        OLLAMA_MODEL: "llama3.2:1b",
        PDFS_FOLDER: "./data/pdfs",
        VECTOR_STORE_PATH: "./data/vector-store",
      }[varName];
      console.log(`   - ${varName}: ${defaultValue}`);
    });
    console.log("");
  }

  console.log("✅ Configuración verificada");
  console.log("");
}

// Ejecutar script
if (require.main === module) {
  // Cargar variables de entorno
  require("dotenv").config();

  checkConfiguration();
  setupVectorStore();
}

module.exports = { setupVectorStore };
