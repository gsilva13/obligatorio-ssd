
import { useEffect, useRef } from 'react';
import { Message } from '@/types/chat';
import { Card } from '@/components/ui/card';
import { Bot, User, Database } from 'lucide-react';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatMessages = ({ messages, isLoading }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">¡Hola! Soy tu asistente RAG</h3>
          <p className="text-gray-600 max-w-md">
            Puedo ayudarte a encontrar información sobre productos, precios, ubicaciones y más. 
            ¡Hazme cualquier pregunta!
          </p>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.sender === 'bot' && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          
          <Card className={`max-w-[70%] p-3 ${
            message.sender === 'user'
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0'
              : 'bg-white border border-gray-200'
          }`}>
            <p className="text-sm leading-relaxed">{message.content}</p>
            
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
              <span className={`text-xs ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              {message.sender === 'bot' && message.ragUsed && (
                <div className="flex items-center gap-1">
                  <Database className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-green-600 font-medium">RAG</span>
                </div>
              )}
            </div>
          </Card>
          
          {message.sender === 'user' && (
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3 justify-start">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <Card className="p-3 bg-white border border-gray-200">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
