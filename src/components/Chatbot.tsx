import { useState, useRef, useEffect, memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

const CHAT_API_URL = 'https://increscendo-api.vercel.app/api/chat';

import DOMPurify from 'dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'strong', 'b', 'em', 'i', 'a', 'br', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const TypingIndicator = memo(() => (
  <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/80 rounded-lg w-fit">
    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: sanitizeHtml('<p>¡Hola! Soy tu <strong>asistente virtual</strong> de Increscendo Fintech. ¿En qué puedo ayudarte hoy?</p>'),
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const messageText = inputValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        throw new Error('Chat API error');
      }

      const { html } = await response.json();

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: sanitizeHtml(html),
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: sanitizeHtml('<p>¡Ups! Parece que tuve un problemita. Por favor intenta de nuevo en un momento. Si el problema persiste, puedes contactarnos por <a href="https://wa.me/525590207001" target="_blank" rel="noopener">WhatsApp</a> o <a href="https://increscendofintech.com/contacto" target="_blank" rel="noopener">formulario de contacto</a>. ¡Gracias por tu paciencia!</p>'),
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 lg:bottom-6 lg:right-6 h-12 w-12 lg:h-14 lg:w-14 rounded-full shadow-glow z-50 border border-white/20"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] h-[70dvh] lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px] lg:h-[520px] shadow-2xl z-50 flex flex-col rounded-2xl overflow-hidden border border-white/20">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4 bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold text-white">Asistente Virtual</CardTitle>
            <p className="text-xs text-white/70">Increscendo Fintech</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 hover:bg-white/20 text-white rounded-lg"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-3 overflow-hidden bg-muted/20">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {message.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2.5 ${
                    message.sender === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-card border border-border/50 text-foreground rounded-bl-md shadow-sm'
                  }`}
                  >
                    <div
                      className="text-sm leading-relaxed [&_a]:text-primary [&_a]:underline [&_a]:font-medium"
                      dangerouslySetInnerHTML={{ __html: message.text }}
                    />
                    <p className={`text-[10px] mt-1.5 ${
                    message.sender === 'user' ? 'text-white/60' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mb-1">
                    <User className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-end gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mb-1">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md shadow-sm px-4 py-3">
                  <TypingIndicator />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 pt-2 border-t bg-background rounded-xl px-3 py-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe tu mensaje..."
            className="flex-1 bg-muted/50 border-0 focus-visible:ring-1 text-[16px] h-9"
          />
          <Button onClick={handleSend} size="sm" className="h-9 w-9 p-0" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
