# 🚀 Guía de Inicio Rápido - Tienda Alemana Chatbot

## ✅ Configuración Completada

Ya tienes toda la estructura del backend lista. Aquí está el resumen de lo que se ha configurado:

### 📁 Estructura creada:

```
Backend/
├── src/
│   ├── server.js                 # Servidor principal
│   ├── routes/                   # Endpoints del API
│   │   ├── chat.js              # Rutas del chatbot
│   │   ├── documents.js         # Gestión de documentos
│   │   └── health.js            # Estado del sistema
│   ├── services/                # Lógica de negocio
│   │   ├── chatService.js       # RAG y procesamiento de chat
│   │   └── documentService.js   # Procesamiento de PDFs
│   ├── middleware/              # Middlewares
│   │   ├── errorHandler.js      # Manejo de errores
│   │   ├── rateLimiter.js       # Limitación de requests
│   │   └── validation.js        # Validación de datos
│   ├── utils/                   # Utilidades
│   │   └── logger.js            # Sistema de logging
│   └── scripts/                 # Scripts de configuración
│       └── setupVectorStore.js  # Configuración automática
├── data/
│   └── pdfs/                    # 📄 Coloca aquí tus PDFs
├── logs/                        # 📊 Logs del sistema
├── .env                         # Variables de entorno
└── package.json                 # Dependencias
```

## 🔧 Próximos pasos:

### 1. Esperar que termine la descarga del modelo

El modelo `llama3.2:1b` se está descargando. Puedes verificar el progreso ejecutando:

```bash
ollama list
```

### 2. Colocar los archivos PDF

- Ve a la carpeta `Backend/data/pdfs/`
- Coloca tus archivos PDF (catálogo, ubicaciones, sucursales)
- Los nombres pueden ser cualquiera, se detectan automáticamente

### 3. Configurar el vector store

```bash
cd Backend
npm run setup-vector-store
```

### 4. Iniciar el servidor

```bash
# Para desarrollo (con auto-reload)
npm run dev

# Para producción
npm start
```

## 🧪 Probar el chatbot

### Verificar que todo funciona:

```bash
# Estado general
curl http://localhost:3001/api/health

# Estado del chat
curl http://localhost:3001/api/chat/health
```

### Enviar una pregunta (Sistema Híbrido RAG + Contexto):

```bash
# Ejemplo básico (solo mensaje) - se genera userId automático
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cuánto cuesta la leche entera?"
  }'

# Ejemplo con userId personalizado (mantiene contexto conversacional)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Dónde están las sucursales?",
    "userId": "mi_usuario"
  }'

# Conversación con contexto (usando el mismo userId)
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Y cuáles son los horarios?",
    "userId": "mi_usuario"
  }'
```

### Respuesta del sistema:

```json
{
  "success": true,
  "data": {
    "response": "Respuesta del chatbot...",
    "timestamp": "2025-06-30T00:15:21.196Z",
    "userId": "mi_usuario",
    "ragUsed": false,
    "fallback": false
  }
}
```

**Indicadores de estado:**

- `ragUsed: true` - Se usó búsqueda de documentos RAG
- `ragUsed: false` - Se respondió sin RAG (por error de embeddings)
- `fallback: true` - Se usó el sistema de respaldo más básico

### Gestión de sesiones:

```bash
# Ver estadísticas de sesiones activas
curl http://localhost:3001/api/chat/sessions

# Limpiar historial de un usuario específico
curl -X DELETE http://localhost:3001/api/chat/sessions/mi_usuario
```

## 📚 Endpoints disponibles:

### Chat:

- `POST /api/chat` - Enviar mensaje al chatbot (con contexto conversacional)
- `GET /api/chat/health` - Estado del servicio
- `GET /api/chat/sessions` - Estadísticas de sesiones activas
- `DELETE /api/chat/sessions/:userId` - Limpiar historial de conversación

### Documentos:

- `POST /api/documents/upload` - Subir PDFs
- `GET /api/documents/status` - Estado de documentos

### Sistema:

- `GET /api/health` - Estado general
- `GET /` - Información de la API

## 🔍 Verificar logs:

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Ver solo errores
tail -f logs/error.log
```

## 🚨 Solución de problemas:

### Si no funciona Ollama:

```bash
# Verificar que esté corriendo
ollama serve

# En otra terminal, verificar modelos
ollama list
```

### Si faltan PDFs:

- Coloca archivos PDF en `Backend/data/pdfs/`
- Ejecuta `npm run setup-vector-store`

### Si hay errores de conexión:

- Verifica que el puerto 3001 esté libre
- Revisa los logs en `logs/error.log`

## 🎉 ¡Listo!

Una vez completados estos pasos, tendrás un chatbot completamente funcional con:

- ✅ **Sistema Híbrido RAG + Contexto**: Intenta usar documentos, pero funciona sin ellos
- ✅ **Contexto conversacional robusto**: Memoria de chat entre mensajes
- ✅ **Procesamiento de PDFs**: Búsqueda semántica cuando está disponible
- ✅ **Respuestas contextualmente relevantes**: Mantiene coherencia conversacional
- ✅ **Sistema de fallback**: Funciona incluso si hay errores de embeddings
- ✅ **API REST completa**: Endpoints para chat, salud, y gestión de sesiones
- ✅ **Gestión de sesiones**: Memoria temporal con limpieza automática
- ✅ **Logging y monitoreo**: Registro detallado de actividad
- ✅ **Rate limiting y validación**: Protección contra abuso
- ✅ **Indicadores de estado**: Información sobre uso de RAG y fallbacks

### 🔧 **Características del Sistema Híbrido:**

1. **Primer intento**: Busca documentos relevantes con RAG
2. **Si RAG falla**: Continúa con contexto conversacional sin documentos
3. **Fallback final**: Sistema básico de chat si todo lo demás falla
4. **Siempre mantiene**: Contexto conversacional y memoria de sesión
