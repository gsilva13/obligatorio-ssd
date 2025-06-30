
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { chatService } from '@/services/chatService';
import { DiagnosisResponse } from '@/types/chat';
import { useToast } from '@/hooks/use-toast';

interface ChatDiagnosticsProps {
  onClose: () => void;
}

export const ChatDiagnostics = ({ onClose }: ChatDiagnosticsProps) => {
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse['data'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    runDiagnosis();
  }, []);

  const runDiagnosis = async () => {
    setIsLoading(true);
    try {
      const response = await chatService.getDiagnosis();
      if (response.success) {
        setDiagnosis(response.data);
      }
    } catch (error) {
      console.error('Diagnosis failed:', error);
      toast({
        title: "Error",
        description: "No se pudo realizar el diagnóstico",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReinitialize = async () => {
    try {
      await chatService.reinitialize();
      toast({
        title: "Éxito",
        description: "Servicio reinicializado correctamente",
      });
      await runDiagnosis();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo reinicializar el servicio",
        variant: "destructive",
      });
    }
  };

  const StatusIcon = ({ success }: { success: boolean }) => (
    success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    )
  );

  return (
    <Card className="mb-4 p-4 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Diagnóstico del Sistema</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnosis}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-600">Ejecutando diagnóstico...</p>
        </div>
      ) : diagnosis ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(diagnosis.diagnosis.components).map(([key, status]) => (
              <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <StatusIcon success={status} />
                <span className="text-sm capitalize">{key}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Pruebas Detalladas:</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Conexión Ollama</span>
                <div className="flex items-center gap-2">
                  <StatusIcon success={diagnosis.diagnosis.tests.ollamaConnection.success} />
                  {diagnosis.diagnosis.tests.ollamaConnection.success && (
                    <Badge variant="secondary" className="text-xs">
                      {diagnosis.diagnosis.tests.ollamaConnection.data?.model}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Embeddings</span>
                <div className="flex items-center gap-2">
                  <StatusIcon success={diagnosis.diagnosis.tests.embeddings.success} />
                  {diagnosis.diagnosis.tests.embeddings.success && (
                    <Badge variant="secondary" className="text-xs">
                      {diagnosis.diagnosis.tests.embeddings.dimensions}D
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Búsqueda Vectorial</span>
                <div className="flex items-center gap-2">
                  <StatusIcon success={diagnosis.diagnosis.tests.vectorSearch.success} />
                  {diagnosis.diagnosis.tests.vectorSearch.success && (
                    <Badge variant="secondary" className="text-xs">
                      {diagnosis.diagnosis.tests.vectorSearch.documentsFound} docs
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">RAG End-to-End</span>
                <div className="flex items-center gap-2">
                  <StatusIcon success={diagnosis.diagnosis.tests.endToEndRAG.success} />
                  {diagnosis.diagnosis.tests.endToEndRAG.success && diagnosis.diagnosis.tests.endToEndRAG.ragUsed && (
                    <Badge variant="secondary" className="text-xs">RAG Activo</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReinitialize}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Reinicializar Servicio
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-4">No se pudo obtener el diagnóstico</p>
      )}
    </Card>
  );
};
