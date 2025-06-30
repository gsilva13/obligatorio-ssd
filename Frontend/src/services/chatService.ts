import { ChatResponse, HealthResponse, DiagnosisResponse } from '@/types/chat';
import { API_CONFIG, ENDPOINTS } from '@/config/api';

// Tipos para respuestas de documentos
export interface DocumentsStatusResponse {
  success: boolean;
  data?: {
    vectorStore: {
      exists: boolean;
      path: string;
    };
    pdfs: {
      folder: string;
      available: string[];
      count: number;
    };
    timestamp: string;
  };
  error?: string;
}

export interface DocumentsUploadResponse {
  success: boolean;
  data?: {
    message: string;
    filesProcessed: string[];
    documentsCreated: number;
    vectorStorePath: string;
    timestamp: string;
  };
  error?: string;
}

class ChatService {
  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout: El servidor tardó demasiado en responder');
      }
      throw error;
    }
  }

  async sendMessage(message: string, userId?: string): Promise<ChatResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.chat}`, {
        method: 'POST',
        body: JSON.stringify({
          message,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido al enviar mensaje');
    }
  }

  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.chatHealth}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al verificar estado del servicio');
    }
  }

  async getDiagnosis(): Promise<DiagnosisResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.chatDiagnose}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Diagnosis failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener diagnóstico');
    }
  }

  async reinitialize(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.chatReinitialize}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Reinitialize failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al reinicializar servicio');
    }
  }

  async searchDocuments(query: string, limit = 5) {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.chatSearch}`, {
        method: 'POST',
        body: JSON.stringify({
          query,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document search failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al buscar documentos');
    }
  }

  // Métodos adicionales para gestión de documentos
  async getDocumentsStatus(): Promise<DocumentsStatusResponse> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.documentsStatus}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Documents status failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al verificar estado de documentos');
    }
  }

  async uploadDocuments(files: FileList): Promise<DocumentsUploadResponse> {
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('pdfs', file);
      });

      const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.documentsUpload}`, {
        method: 'POST',
        body: formData,
        // No incluir Content-Type para que el browser lo configure automáticamente para multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error('Document upload failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al subir documentos');
    }
  }

  async setupDocuments(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.documentsSetup}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document setup failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al configurar documentos');
    }
  }

  async resetDocuments(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await this.fetchWithTimeout(`${API_CONFIG.baseUrl}${ENDPOINTS.documentsReset}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Document reset failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al resetear documentos');
    }
  }
}

export const chatService = new ChatService();
