# 📄 Coloca tus archivos PDF aquí

Esta carpeta debe contener los siguientes archivos PDF para que el chatbot funcione correctamente:

## 📋 Archivos requeridos:

1. **Catálogo de Productos** (ejemplo: `catalogo-productos.pdf`)

   - Información de productos disponibles
   - Precios y stock
   - Códigos de productos

2. **Ubicación de Productos** (ejemplo: `ubicacion-productos.pdf`)

   - Mapeo de productos por góndolas
   - Distribución dentro del supermercado
   - Secciones por categorías

3. **Información de Sucursales** (ejemplo: `informacion-sucursales.pdf`)
   - Direcciones de todas las sucursales
   - Horarios de atención
   - Contactos por sucursal

## 🚀 Una vez que coloques los PDFs:

```bash
# Desde la carpeta Backend, ejecuta:
npm run setup-vector-store
```

Este comando procesará automáticamente todos los archivos PDF en esta carpeta y creará el vector store necesario para el chatbot.

## 💡 Notas importantes:

- Los archivos deben estar en formato PDF
- Asegúrate de que el contenido sea texto (no imágenes escaneadas)
- Los nombres de archivo pueden ser cualquiera, el sistema los detectará automáticamente
- Si no tienes los PDFs reales, puedes crear documentos de prueba con contenido de ejemplo
