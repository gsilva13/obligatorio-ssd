export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  ragUsed?: boolean;
}

export interface ChatResponse {
  success: boolean;
  data?: {
    response: string;
    userId: string;
    timestamp: string;
    ragUsed: boolean;
  };
  error?: string;
  message?: string;
}

export interface HealthResponse {
  success: boolean;
  data?: {
    status: string;
    initialized: boolean;
    ollama: string;
    vectorStore: string;
    timestamp: string;
  };
}

export interface DiagnosisResponse {
  success: boolean;
  data?: {
    diagnosis: {
      timestamp: string;
      initialized: boolean;
      components: {
        ollama: boolean;
        embeddings: boolean;
        vectorStore: boolean;
        chain: boolean;
      };
      tests: {
        ollamaConnection: {
          success: boolean;
          data: any;
        };
        embeddings: {
          success: boolean;
          dimensions: number;
          sampleValues: number[];
        };
        vectorSearch: {
          success: boolean;
          documentsFound: number;
          sampleContent: string[];
        };
        endToEndRAG: {
          success: boolean;
          ragUsed: boolean;
          responseLength: number;
        };
      };
    };
  };
}

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

export interface DocumentsSetupResponse {
  success: boolean;
  data?: {
    success: boolean;
    documentsProcessed: number;
    pdfFiles: string[];
    vectorStorePath: string;
  };
  error?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message?: string;
  timestamp?: string;
}
