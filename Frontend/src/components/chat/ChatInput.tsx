
import { useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled: boolean;
}

export const ChatInput = ({ onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50/50">
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={disabled ? "Conectando al servicio..." : "Escribe tu mensaje aquí..."}
          disabled={disabled}
          className="min-h-[44px] max-h-32 resize-none bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="h-11 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
        <span>Presiona Enter para enviar, Shift+Enter para nueva línea</span>
        {disabled}
      </div>
    </div>
  );
};
