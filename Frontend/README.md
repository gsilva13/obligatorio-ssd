# Frontend - Chat RAG Interface

Interfaz de usuario React + TypeScript + Vite para el chatbot RAG que responde preguntas sobre PDFs de supermercado.

## 🚀 Tecnologías

- **React 18** con TypeScript
- **Vite** como bundler y servidor de desarrollo
- **Tailwind CSS** para estilos
- **shadcn/ui** para componentes UI
- **Lucide React** para iconos
- **Axios** para llamadas HTTP

## 📋 Prerrequisitos

- Node.js v18 o superior
- npm o yarn
- Backend ejecutándose en `http://localhost:3001`

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo template
cp .env.example .env

# Editar el archivo .env con tu configuración
# Por defecto apunta al backend en http://localhost:3001/api
```

#### Variables de entorno disponibles:

- `VITE_API_BASE_URL`: URL base de la API del backend (por defecto: `http://localhost:3001/api`)
- `VITE_ENV`: Entorno de ejecución (`development` o `production`)

### 3. Ejecutar en modo desarrollo

```bash
npm run dev
```

El servidor se ejecutará en `http://localhost:5173` (o el siguiente puerto disponible como 8080, 8081, etc.)

## 📁 Estructura del proyecto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI base (shadcn/ui)
│   ├── chat/           # Componentes específicos del chat
│   └── ChatInterface.tsx # Interfaz principal del chat
├── config/             # Configuración
│   └── api.ts          # Configuración de endpoints de la API
├── services/           # Servicios para llamadas a la API
│   └── chatService.ts  # Servicio del chat y documentos
├── types/              # Definiciones de tipos TypeScript
│   └── chat.ts         # Tipos para el chat
└── main.tsx           # Punto de entrada de la aplicación
```

## 🔧 Scripts disponibles

```bash
# Desarrollo
npm run dev          # Ejecutar servidor de desarrollo

# Construcción
npm run build        # Construir para producción
npm run preview      # Vista previa de la build de producción

# Linting
npm run lint         # Ejecutar ESLint
```

## 🌐 Configuración de la API

El frontend se comunica con el backend mediante los siguientes endpoints:

### Chat

- `POST /api/chat` - Enviar mensaje al chatbot
- `GET /api/chat/health` - Estado del servicio de chat

### Documentos

- `POST /api/documents/upload` - Subir PDFs
- `POST /api/documents/setup` - Configurar vector store
- `GET /api/documents/status` - Estado de los documentos
- `DELETE /api/documents/reset` - Limpiar documentos

### Salud del sistema

- `GET /api/health` - Estado general
- `GET /api/health/detailed` - Estado detallado

## 🔧 Configuración para desarrollo

### Cambiar puerto del servidor

Si necesitas cambiar el puerto del servidor de desarrollo:

```bash
# Opción 1: Variable de entorno
PORT=3000 npm run dev

# Opción 2: Modificar vite.config.ts
```

### Configurar proxy para desarrollo

Si el backend está en un puerto diferente, actualiza `VITE_API_BASE_URL` en el archivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:PUERTO_BACKEND/api
```

## 🚨 Troubleshooting

### Error de CORS

Si ves errores de CORS, asegúrate de que:

1. El backend está ejecutándose
2. El backend tiene configurado el puerto del frontend en su whitelist de CORS
3. La URL en `VITE_API_BASE_URL` es correcta

### Puerto ocupado

Si el puerto está ocupado, Vite automáticamente buscará el siguiente puerto disponible. Verifica la consola para ver en qué puerto se ejecuta.

### Variables de entorno no funcionan

- Asegúrate de que las variables empiecen con `VITE_`
- Reinicia el servidor de desarrollo después de cambiar el `.env`
- Verifica que el archivo `.env` esté en la raíz del proyecto Frontend

## 📱 Uso

1. Asegúrate de que el backend esté ejecutándose
2. Abre la aplicación en el navegador
3. Carga PDFs usando la API de documentos del backend
4. Comienza a chatear con el bot sobre el contenido de los PDFs

## 🎨 Personalización

### Cambiar tema o colores

Los estilos están en Tailwind CSS. Puedes modificar:

- `src/components/chat/ChatMessages.tsx` - Estilos de los mensajes
- `src/components/ChatInterface.tsx` - Interfaz principal
- `tailwind.config.js` - Configuración global de Tailwind

### Cambiar favicon

Reemplaza el archivo en `public/` y actualiza la referencia en `index.html`
