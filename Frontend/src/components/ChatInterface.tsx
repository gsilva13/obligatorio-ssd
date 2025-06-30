
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ChatHeader } from './chat/ChatHeader';
import { ChatMessages } from './chat/ChatMessages';
import { ChatInput } from './chat/ChatInput';
import { ChatDiagnostics } from './chat/ChatDiagnostics';
import { Message } from '@/types/chat';
import { chatService } from '@/services/chatService';
import { useToast } from '@/hooks/use-toast';

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServiceHealthy, setIsServiceHealthy] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const userId = 'user' + Math.random().toString(36).substr(2, 9);
  const { toast } = useToast();

  useEffect(() => {
    checkServiceHealth();
  }, []);

  const checkServiceHealth = async () => {
    try {
      const health = await chatService.checkHealth();
      setIsServiceHealthy(health.success);
      if (health.success) {
        toast({
          title: "✅ Conexión establecida",
          description: "El servicio de chat está funcionando correctamente",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setIsServiceHealthy(false);
      toast({
        title: "❌ Error de conexión",
        description: error instanceof Error ? error.message : "No se pudo conectar con el servidor",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage(content, userId);
      
      if (response.success && response.data) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: response.data.response,
          sender: 'bot',
          timestamp: new Date(response.data.timestamp),
          ragUsed: response.data.ragUsed,
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Mostrar indicador de RAG si se usó
        if (response.data.ragUsed) {
          toast({
            title: "🧠 RAG Activado",
            description: "Respuesta basada en documentos específicos",
            duration: 3000,
          });
        }
      } else {
        throw new Error(response.error || 'Error al procesar el mensaje');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      toast({
        title: "❌ Error al enviar mensaje",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });

      // Agregar mensaje de error al chat
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Lo siento, hubo un error al procesar tu mensaje: ${errorMessage}. Por favor, verifica que el servidor esté funcionando.`,
        sender: 'bot',
        timestamp: new Date(),
        ragUsed: false,
      };
      setMessages(prev => [...prev, errorBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 h-screen flex flex-col">
      <ChatHeader 
        isServiceHealthy={isServiceHealthy}
        onDiagnosticsClick={() => setShowDiagnostics(!showDiagnostics)}
        onRefreshHealth={checkServiceHealth}
      />
      
      {showDiagnostics && (
        <ChatDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
      
      <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={sendMessage} disabled={isLoading || !isServiceHealthy} />
      </Card>
    </div>
  );
};

export default ChatInterface;
