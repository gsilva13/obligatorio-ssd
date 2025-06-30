// Configuración de la API
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  timeout: 100000, // 100 segundos
} as const;

// Endpoints disponibles
export const ENDPOINTS = {
  chat: '/chat',
  chatHealth: '/chat/health',
  chatDiagnose: '/chat/diagnose',
  chatReinitialize: '/chat/reinitialize',
  chatSearch: '/chat/search',
  documentsUpload: '/documents/upload',
  documentsSetup: '/documents/setup',
  documentsStatus: '/documents/status',
  documentsReset: '/documents/reset',
  health: '/health',
  healthDetailed: '/health/detailed',
} as const;
