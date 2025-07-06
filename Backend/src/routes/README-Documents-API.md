# 📄 API de Gestión de Documentos - Tienda Alemana

API REST para la gestión y procesamiento de documentos PDF que alimentan el sistema RAG (Retrieval-Augmented Generation) del chatbot de Tienda Alemana.

## 📋 Descripción

Esta API permite:

- **Subir nuevos documentos PDF** para expandir la base de conocimiento
- **Configurar el vector store** desde PDFs por defecto
- **Consultar el estado** de documentos y vector store
- **Reiniciar el sistema** para desarrollo y testing

## 🔗 Base URL

```
http://localhost:3001/api/documents
```

## 📚 Endpoints Disponibles

### 1. GET /status

**Verificar estado de documentos y vector store**

#### Request

```bash
GET /api/documents/status
```

#### Response Exitosa

```json
{
  "success": true,
  "data": {
    "vectorStore": {
      "exists": true,
      "path": "./data/vector-store"
    },
    "pdfs": {
      "folder": "./data/pdfs",
      "available": [
        "Catálogo de Productos.pdf",
        "Información de Locales.pdf",
        "Ubicación Física de Productos.pdf"
      ],
      "count": 3
    },
    "timestamp": "2025-06-30T02:00:40.127Z"
  }
}
```

#### Ejemplo de Uso

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/documents/status" -Method GET

# curl (CMD)
curl http://localhost:3001/api/documents/status

# curl (Linux/macOS)
curl -X GET http://localhost:3001/api/documents/status
```

---

### 2. POST /setup

**Configurar vector store desde PDFs por defecto**

Procesa todos los archivos PDF ubicados en la carpeta `Backend/data/pdfs/` y crea/actualiza el vector store.

#### Request

```bash
POST /api/documents/setup
Content-Type: application/json
```

#### Response Exitosa

```json
{
  "success": true,
  "data": {
    "success": true,
    "documentsProcessed": 4,
    "pdfFiles": [
      "Catálogo de Productos.pdf",
      "Información de Locales.pdf",
      "Ubicación Física de Productos.pdf"
    ],
    "vectorStorePath": "./data/vector-store"
  }
}
```

#### Ejemplo de Uso

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/documents/setup" -Method POST

# curl (CMD/Linux/macOS)
curl -X POST http://localhost:3001/api/documents/setup
```

---

### 3. POST /upload

**Subir y procesar nuevos archivos PDF**

Permite subir uno o múltiples archivos PDF que serán procesados y agregados al vector store.

#### Request

```bash
POST /api/documents/upload
Content-Type: multipart/form-data
```

**Form Data:**

- `pdfs`: Archivo(s) PDF (máximo 10 archivos, 10MB cada uno)

#### Response Exitosa

```json
{
  "success": true,
  "data": {
    "message": "Documentos procesados correctamente",
    "filesProcessed": ["Catalogo-Test.pdf"],
    "documentsCreated": 2,
    "vectorStorePath": "./data/vector-store",
    "timestamp": "2025-06-30T02:02:29.342Z"
  }
}
```

#### Errores Comunes

```json
// Archivo demasiado grande
{
  "success": false,
  "error": "Archivo demasiado grande (máximo 10MB)"
}

// No se proporcionaron archivos
{
  "success": false,
  "error": "No se proporcionaron archivos PDF"
}

// Formato no válido
{
  "success": false,
  "error": "Solo se permiten archivos PDF"
}
```

#### Ejemplos de Uso

**Subir un archivo:**

```bash
# PowerShell (usando CMD internamente)
cmd /c 'curl -X POST -F "pdfs=@\"C:\ruta\a\tu\archivo.pdf\"" http://localhost:3001/api/documents/upload'

# curl (Linux/macOS)
curl -X POST -F "pdfs=@/ruta/a/tu/archivo.pdf" http://localhost:3001/api/documents/upload
```

**Subir múltiples archivos:**

```bash
# curl
curl -X POST \
  -F "pdfs=@archivo1.pdf" \
  -F "pdfs=@archivo2.pdf" \
  -F "pdfs=@archivo3.pdf" \
  http://localhost:3001/api/documents/upload
```

---

### 4. DELETE /reset

**Reiniciar vector store (desarrollo)**

Elimina completamente el vector store. Útil para desarrollo y testing.

#### Request

```bash
DELETE /api/documents/reset
```

#### Response Exitosa

```json
{
  "success": true,
  "data": {
    "message": "Vector store reiniciado",
    "timestamp": "2025-06-30T02:00:58.660Z"
  }
}
```

#### Ejemplo de Uso

```bash
# PowerShell
Invoke-WebRequest -Uri "http://localhost:3001/api/documents/reset" -Method DELETE

# curl
curl -X DELETE http://localhost:3001/api/documents/reset
```

## 🔄 Flujos de Trabajo Típicos

### Configuración Inicial (Recomendado)

```bash
# 1. Verificar estado
curl http://localhost:3001/api/documents/status

# 2. Configurar desde PDFs por defecto
curl -X POST http://localhost:3001/api/documents/setup

# 3. Verificar que se creó correctamente
curl http://localhost:3001/api/documents/status
```

### Agregar Nuevos Documentos

```bash
# 1. Subir nuevos PDFs
curl -X POST -F "pdfs=@mi-nuevo-catalogo.pdf" http://localhost:3001/api/documents/upload

# 2. Verificar que se procesaron
curl http://localhost:3001/api/documents/status
```

### Reset y Reconfiguración (Desarrollo)

```bash
# 1. Resetear vector store
curl -X DELETE http://localhost:3001/api/documents/reset

# 2. Reconfigurar desde cero
curl -X POST http://localhost:3001/api/documents/setup
```

## 📁 Estructura de Archivos

```
Backend/
├── data/
│   ├── pdfs/                    # Archivos PDF fuente
│   │   ├── Catálogo de Productos.pdf
│   │   ├── Información de Locales.pdf
│   │   └── Ubicación Física de Productos.pdf
│   └── vector-store/            # Vector store FAISS (generado automáticamente)
│       ├── faiss.index
│       ├── docstore.json
│       └── args.json
└── src/
    └── routes/
        └── documents.js         # Este archivo - rutas de la API
```

## ⚙️ Configuración

### Variables de Entorno

```env
# Configuración de documentos
PDFS_FOLDER=./data/pdfs          # Carpeta de PDFs por defecto
VECTOR_STORE_PATH=./data/vector-store  # Ruta del vector store

# Configuración de procesamiento
CHUNK_SIZE=1000                  # Tamaño de chunks de texto
CHUNK_OVERLAP=200               # Overlap entre chunks
```

### Límites de Upload

- **Tamaño máximo por archivo**: 10MB
- **Número máximo de archivos**: 10 por request
- **Formatos permitidos**: Solo PDF (.pdf)

## 🧪 Testing de la API

### Script de Prueba Completo

```bash
#!/bin/bash
echo "=== Testing API de Documentos ==="

echo "1. Verificando estado inicial..."
curl -s http://localhost:3001/api/documents/status | jq

echo -e "\n2. Reseteando vector store..."
curl -s -X DELETE http://localhost:3001/api/documents/reset | jq

echo -e "\n3. Configurando desde PDFs por defecto..."
curl -s -X POST http://localhost:3001/api/documents/setup | jq

echo -e "\n4. Verificando estado final..."
curl -s http://localhost:3001/api/documents/status | jq

echo -e "\n=== Testing completado ==="
```

### Verificación Manual (PowerShell)

```powershell
# Test completo de la API
Write-Host "=== Testing API de Documentos ===" -ForegroundColor Green

Write-Host "`n1. Status inicial:" -ForegroundColor Yellow
(Invoke-WebRequest -Uri "http://localhost:3001/api/documents/status").Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n2. Reset:" -ForegroundColor Yellow
(Invoke-WebRequest -Uri "http://localhost:3001/api/documents/reset" -Method DELETE).Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n3. Setup:" -ForegroundColor Yellow
(Invoke-WebRequest -Uri "http://localhost:3001/api/documents/setup" -Method POST).Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n4. Status final:" -ForegroundColor Yellow
(Invoke-WebRequest -Uri "http://localhost:3001/api/documents/status").Content | ConvertFrom-Json | ConvertTo-Json

Write-Host "`n=== Testing completado ===" -ForegroundColor Green
```

## 📊 Métricas y Logging

### Logs Relevantes

Los logs de la API se registran en:

- **Nivel INFO**: Operaciones exitosas, archivos procesados
- **Nivel ERROR**: Errores de procesamiento, archivos corruptos
- **Nivel WARN**: Archivos no encontrados, permisos

### Ejemplo de Logs

```
[INFO] Procesando 1 archivos PDF
[INFO] Configurando vector store desde PDFs por defecto
[INFO] Vector store eliminado
[WARN] No se pudo eliminar vector store (puede que no exista)
[ERROR] Error procesando documentos: Invalid PDF format
```

## 🚨 Solución de Problemas

### Error: "No se proporcionaron archivos PDF"

```bash
# Verificar que el archivo existe
ls -la mi-archivo.pdf

# Verificar formato del comando curl
curl -X POST -F "pdfs=@mi-archivo.pdf" http://localhost:3001/api/documents/upload
```

### Error: "Archivo demasiado grande"

```bash
# Verificar tamaño del archivo
ls -lh mi-archivo.pdf

# Comprimir PDF si es necesario o dividir en partes
```

### Error: "Vector store no encontrado"

```bash
# Ejecutar setup inicial
curl -X POST http://localhost:3001/api/documents/setup
```

### Error 500: Error interno del servidor

```bash
# Verificar logs del servidor
tail -f Backend/logs/error.log

# Verificar que Ollama esté funcionando
curl http://localhost:11434/api/version
```

## 📋 Checklist de Verificación

### ✅ Pre-requisitos

- [ ] Servidor backend ejecutándose en puerto 3001
- [ ] Ollama ejecutándose en puerto 11434
- [ ] Modelos descargados (llama3.2:1b, nomic-embed-text)
- [ ] Archivos PDF en `Backend/data/pdfs/`

### ✅ Tests de Endpoints

- [ ] GET /status responde con información correcta
- [ ] POST /setup procesa PDFs exitosamente
- [ ] POST /upload acepta archivos PDF
- [ ] DELETE /reset elimina vector store

### ✅ Funcionalidad RAG

- [ ] Vector store se crea correctamente
- [ ] Documentos se procesan en chunks
- [ ] Embeddings se generan sin errores
- [ ] Búsqueda semántica funciona

## 🔗 Referencias

- **API Principal**: [Backend README](../README.md)
- **Chatbot API**: [Chat Routes](./chat.js)
- **Health Checks**: [Health Routes](./health.js)
- **LangChain Docs**: [https://docs.langchain.com/](https://docs.langchain.com/)
- **FAISS Docs**: [https://github.com/facebookresearch/faiss](https://github.com/facebookresearch/faiss)

---

_Documentación generada automáticamente - Última actualización: Junio 2025_
