# 🤖 Tienda Alemana - Chat Engine - Backend

Backend para el sistema de chatbot inteligente de Tienda Alemana, construido con Node.js, Express, LangChain y Ollama usando arquitectura RAG (Retrieval-Augmented Generation).

## 📋 Contexto del Proyecto Original

Tienda Alemana es una cadena de supermercados que busca mejorar la experiencia de
atención a sus clientes, ofreciendo un canal de soporte automatizado mediante un chatbot
inteligente. Con el fin de resolver consultas frecuentes como precios, disponibilidad,
ubicación de productos dentro de la tienda, horarios y direcciones de sus sucursales.

### Documentos requeridos:

- **Catálogo de Productos**: Artículos, precios y stock disponible
- **Ubicación Física de Productos**: Detalle de qué sección o góndola corresponde a cada artículo
- **Información General del Local**: Datos de cada sucursal (nombre, horario y dirección)

## 🚀 Características

- **RAG (Retrieval-Augmented Generation)**: Procesamiento inteligente de documentos PDF
- **LangChain**: Framework para aplicaciones con LLM
- **Ollama**: Modelo de lenguaje local (llama3.2:1b)
- **Vector Store**: FAISS para búsqueda semántica
- **API REST**: Endpoints completos para el chatbot
- **Rate Limiting**: Protección contra abuso
- **Logging**: Sistema completo de logs
- **Validación**: Validación robusta de datos de entrada

## 📋 Prerrequisitos

- **Node.js** (v18 o superior)
- **Ollama** instalado y ejecutándose
- **Archivos PDF** del negocio (catálogo, ubicaciones, sucursales)

## ⚙️ Instalación

### 1. Instalar dependencias

```bash
cd Backend
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tu configuración:

```env
PORT=3001
NODE_ENV=development
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b
PDFS_FOLDER=./data/pdfs
VECTOR_STORE_PATH=./data/vector-store
```

### 3. Preparar Ollama

```bash
# Iniciar Ollama (en otra terminal)
ollama serve

# Descargar modelo
ollama pull llama3.2:1b
```

### 4. Preparar documentos PDF

```
# Coloca los archivos PDF en data/pdfs/:
# - catalogo-productos.pdf
# - ubicacion-productos.pdf
# - informacion-sucursales.pdf
```

### 5. Configurar vector store

Una vez colocados los archivos PDFs en la ubicacion anterior, ejecutar el siguiente comando para crear nuestro vector store con esos PDFs.

```bash
npm run setup-vector-store
```

### 6. Iniciar servidor

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 API Endpoints

### Chat

- `POST /api/chat` - Enviar mensaje al chatbot
- `POST /api/chat/search` - Buscar documentos relevantes
- `GET /api/chat/health` - Estado del servicio de chat
- `POST /api/chat/reinitialize` - Reinicializar servicio

### Documentos

- `POST /api/documents/upload` - Subir y procesar PDFs
- `POST /api/documents/setup` - Configurar desde PDFs por defecto
- `GET /api/documents/status` - Estado de documentos
- `DELETE /api/documents/reset` - Reiniciar vector store

### Sistema

- `GET /api/health` - Estado general del servidor
- `GET /api/health/detailed` - Estado detallado de servicios

## 🔧 Ejemplos de uso

### Enviar mensaje al chatbot

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto cuesta la leche entera de 1 litro?"
  }'
```

### Subir documentos PDF

```bash
curl -X POST http://localhost:3001/api/documents/upload \
  -F "pdfs=@catalogo.pdf" \
  -F "pdfs=@ubicaciones.pdf"
```

### Verificar estado

```bash
curl http://localhost:3001/api/health
```

## 🏗️ Arquitectura

```
src/
├── server.js              # Servidor principal
├── routes/                # Endpoints de la API
│   ├── chat.js           # Rutas del chatbot
│   ├── documents.js      # Rutas de documentos
│   └── health.js         # Rutas de salud
├── services/             # Lógica de negocio
│   ├── chatService.js    # Servicio RAG y chat
│   └── documentService.js # Procesamiento PDFs
├── middleware/           # Middlewares
│   ├── errorHandler.js   # Manejo de errores
│   ├── rateLimiter.js    # Rate limiting
│   └── validation.js     # Validación de datos
├── utils/               # Utilidades
│   └── logger.js        # Sistema de logs
└── scripts/             # Scripts de configuración
    └── setupVectorStore.js
```

## 🎯 Preguntas de ejemplo para evaluar el chatbot

### Catálogo de productos

- "¿Cuánto cuesta la Leche Entera de 1 litro?"
- "¿Cuántas unidades hay disponibles de Queso Muzzarella?"
- "¿Qué productos están por debajo de $80?"
- "¿Tienen stock de Atún en lata?"
- "¿Cuál es el precio del detergente con aroma a limón?"

### Ubicación de productos

- "¿En qué góndola puedo encontrar el Yogur de frutilla?"
- "¿Dónde está ubicado el arroz de 1 kg dentro del supermercado?"
- "¿En qué sección se encuentran los fideos?"
- "¿Dónde puedo encontrar el jugo de naranja?"
- "¿Qué productos están en la góndola 5?"

### Información de sucursales

- "¿Cuál es la dirección de la sucursal de Tienda Alemana en Pocitos?"
- "¿Hasta qué hora abre Tienda Alemana Central?"
- "¿Cuáles son los horarios de atención de la sucursal de Carrasco?"
- "¿Qué días abre la tienda ubicada en Av. Brasil?"
- "¿Tienen alguna tienda abierta los domingos?"

## 🔍 Logs y monitoreo

Los logs se guardan en `logs/`:

- `app.log` - Logs generales
- `error.log` - Solo errores
- `exceptions.log` - Excepciones no capturadas

## 🛠️ Desarrollo

### Comandos disponibles

```bash
npm run dev          # Desarrollo con nodemon
npm start           # Producción
npm run setup-vector-store  # Configurar vector store
```

### Variables de entorno

- `PORT` - Puerto del servidor (3001)
- `OLLAMA_BASE_URL` - URL de Ollama (http://localhost:11434)
- `OLLAMA_MODEL` - Modelo a usar (llama3.2:1b)
- `PDFS_FOLDER` - Carpeta de PDFs (./data/pdfs)
- `VECTOR_STORE_PATH` - Ruta del vector store (./data/vector-store)

## 🚨 Solución de problemas

### Error: Cannot connect to Ollama

```bash
# Verificar que Ollama esté ejecutándose
ollama serve

# Verificar que el modelo esté disponible
ollama list
```

### Error: No PDF files found

```bash
# Crear carpeta y agregar PDFs
mkdir -p data/pdfs
# Copiar archivos PDF a data/pdfs/
```

### Error: Vector store not found

```bash
# Configurar vector store
npm run setup-vector-store
```

## 📝 Notas adicionales

- El modelo `llama3.2:1b` es pequeño y rápido, ideal para desarrollo local
- Los PDFs se procesan en chunks de 1000 caracteres con overlap de 200
- Rate limiting: 100 requests por 15 minutos por IP/usuario
