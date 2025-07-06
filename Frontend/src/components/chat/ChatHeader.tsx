
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bot, Activity, Settings, RefreshCw } from 'lucide-react';

interface ChatHeaderProps {
  isServiceHealthy: boolean;
  onDiagnosticsClick: () => void;
  onRefreshHealth: () => void;
}

export const ChatHeader = ({ isServiceHealthy, onDiagnosticsClick, onRefreshHealth }: ChatHeaderProps) => {
  return (
    <Card className="mb-4 p-4 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Obligatorio IA - ChatBot RAG</h1>
            <p className="text-sm text-gray-600">Asistente inteligente con búsqueda contextual </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
            <div className={`w-2 h-2 rounded-full ${isServiceHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium text-gray-700">
              {isServiceHealthy ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshHealth}
            className="text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onDiagnosticsClick}
            className="text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
