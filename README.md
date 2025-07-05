# Obligatorio IA - Sistemas de soporte de decisión
Realizado por:
- Fernando Spillere - 274924
- Guillermo Silva - 210802
- Gimena Alamón - (nro de Estudiante)

## 🤖 Tienda Alemana - Chatbot RAG

Sistema de chatbot inteligente para Tienda Alemana con arquitectura RAG (Retrieval-Augmented Generation) que responde preguntas sobre productos, precios, ubicaciones y sucursales basándose en documentos PDF.

## 🏗️ Arquitectura del Proyecto

```
obligatorio-ssd/
├── Backend/          # API Node.js + LangChain + Ollama + RAG
└── Frontend/         # Interfaz web del chatbot (React/Vue/etc)
```

## 📋 Prerrequisitos

- **Node.js** (v18 o superior)
- **Ollama** instalado en el sistema
- **Git** para clonar el repositorio

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd obligatorio-ssd
```

### 2. Configurar el Backend

#### 2.1. Instalar Ollama

**En Windows:**

```bash
# Descargar e instalar desde: https://ollama.ai/download
# O usar winget:
winget install Ollama.Ollama
```

**En Linux/macOS:**

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 2.2. Descargar Modelos de IA

```bash
# Iniciar Ollama (en una terminal separada)
ollama serve

# En otra terminal, descargar los modelos necesarios:
ollama pull llama3.2:1b          # Modelo de chat (1.3GB)
ollama pull nomic-embed-text     # Modelo de embeddings (274MB)

# Verificar que se descargaron correctamente
ollama list
```

#### 2.3. Instalar Dependencias del Backend

```bash
cd Backend
npm install
```

#### 2.4. Configurar Variables de Entorno

```bash
# Copiar archivo de configuración
cp .env.example .env

# El archivo .env ya tiene la configuración por defecto:
# PORT=3001
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# OLLAMA_MODEL=llama3.2:1b
# OLLAMA_EMBEDDING_MODEL=nomic-embed-text
```

#### 2.5. Preparar Documentos PDF

```bash
# Los PDFs de ejemplo ya están en la carpeta correcta
# Si quieres agregar tus propios PDFs:
# - Copia los archivos PDF a: Backend/data/pdfs/
# - Los archivos deben contener información sobre productos, precios, ubicaciones

# Verificar que los PDFs estén en su lugar
ls Backend/data/pdfs/
```

#### 2.6. Configurar Vector Store (Base de Datos de Documentos)

```bash
# Este comando procesa los PDFs y crea la base de datos vectorial
# Asegurarse de estar en el directorio OBLIGATORIO-SSD/backend/
npm run setup-vector-store
```

#### 2.7. Iniciar el Backend

```bash
# Ejecutar en modo desarrollo (con auto-reload)
npm run dev

# El servidor estará disponible en: http://localhost:3001
```

### 3. Configurar el Frontend

```bash
# Cambiar al directorio del frontend
cd ../Frontend

# Instalar dependencias
npm install

# Iniciar el frontend
npm start

# El frontend estará disponible en: http://localhost:3000 (o el puerto que se configure)
```

## 🎯 Verificar que Todo Funciona

### 1. Verificar Backend

```bash
# Test de salud del servidor
curl http://localhost:3001/api/health

# Test de diagnóstico completo
curl http://localhost:3001/api/chat/diagnose

# Test de chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Qué productos tienes disponibles?"}'
```

### 2. Verificar Frontend

- Abrir http://localhost:3000 en el navegador
- Debería mostrar la interfaz del chatbot
- Probar enviar un mensaje como: "¿Cuánto cuesta la leche?"

## 💬 Ejemplos de Preguntas para Probar

### Consultas sobre Productos y Precios

- "¿Cuánto cuesta la leche de 1 litro?"
- "¿Qué productos tienes disponibles?"
- "¿Tienen stock de yogur de frutilla?"
- "¿Cuál es el precio del jugo de naranja?"

### Consultas sobre Ubicaciones

- "¿Dónde encuentro el arroz en la tienda?"
- "¿En qué góndola está el detergente?"
- "¿Qué productos hay en la sección de lácteos?"

### Consultas sobre Sucursales

- "¿Cuáles son los horarios de atención?"
- "¿Dónde está ubicada la sucursal principal?"
- "¿Qué días están abiertos?"

## 🚨 Solución de Problemas Comunes

### Error: No se puede conectar a Ollama

```bash
# Verificar que Ollama esté ejecutándose
ollama serve

# En otra terminal, verificar que responda
curl http://localhost:11434/api/version
```

### Error: Modelos no encontrados

```bash
# Verificar que los modelos estén descargados
ollama list

# Si no están, descargarlos
ollama pull llama3.2:1b
ollama pull nomic-embed-text
```

### Error: Vector store no encontrado

```bash
cd Backend
npm run setup-vector-store
```

### Error: Puerto ocupado

```bash
# Si el puerto 3001 está ocupado, cambiar en Backend/.env:
# PORT=3002

# Si el puerto 3000 está ocupado para el frontend, generalmente
# el sistema preguntará si usar otro puerto automáticamente
```

## 📁 Estructura de Archivos Importante

```
Backend/
├── data/
│   ├── pdfs/             # Documentos PDF del negocio
│   └── vector-store/     # Base de datos vectorial (se crea automáticamente)
├── src/
│   ├── server.js         # Servidor principal
│   ├── routes/           # Endpoints de la API
│   └── services/         # Lógica de negocio (RAG, Chat)
├── .env                  # Variables de configuración
└── package.json

Frontend/
├── src/
│   └── (archivos del frontend)
├── package.json
└── (archivos de configuración del framework usado)
```

## 🛠️ Comandos Útiles

### Backend

```bash
cd Backend
npm run dev              # Desarrollo con auto-reload
npm start               # Producción
npm run setup-vector-store  # Recrear base de datos de documentos
```

### Frontend

```bash
cd Frontend
npm start               # Iniciar frontend
npm run build          # Build para producción
```

## 📚 Más Información

- **Backend**: Ver `Backend/README.md` para documentación técnica completa
- **API Endpoints**: http://localhost:3001/api/ (cuando el backend esté ejecutándose)
- **Logs**: Los logs del backend se guardan en `Backend/logs/`

## 🎉 ¡Listo para Usar!

Una vez completados estos pasos, tendrás:

- ✅ Backend ejecutándose en http://localhost:3001
- ✅ Frontend ejecutándose en http://localhost:3000
- ✅ Chatbot funcional con información real de los PDFs
- ✅ Sistema RAG completamente operativo

¡El chatbot está listo para responder preguntas sobre Tienda Alemana!
