import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { Send, Bot, User, Gamepad2, Headphones, Gift, HelpCircle, Truck, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: string;
}

interface QuickSuggestion {
  icon: any;
  textEn: string;
  textEt: string;
  queryEn: string;
  queryEt: string;
}

const quickSuggestions: QuickSuggestion[] = [
  {
    icon: Gamepad2,
    textEn: "Best PS5 games",
    textEt: "Parimad PS5 mängud",
    queryEn: "What are the best PS5 games you have?",
    queryEt: "Millised on parimad PS5 mängud, mis teil on?"
  },
  {
    icon: Headphones,
    textEn: "Gaming headsets",
    textEt: "Mänguri kõrvaklapid",
    queryEn: "Show me your best gaming headsets",
    queryEt: "Näita parimaid mänguri kõrvaklappe"
  },
  {
    icon: Gift,
    textEn: "Gift ideas",
    textEt: "Kingiideed",
    queryEn: "I need a gift for a gamer, what do you recommend?",
    queryEt: "Vajan kinki mängurile, mida soovitate?"
  },
  {
    icon: Truck,
    textEn: "Shipping info",
    textEt: "Tarneinfo",
    queryEn: "What are your shipping options and delivery times?",
    queryEt: "Millised on tarnevõimalused ja tarneajad?"
  },
  {
    icon: CreditCard,
    textEn: "Payment methods",
    textEt: "Makseviisid",
    queryEn: "What payment methods do you accept?",
    queryEt: "Milliseid makseviise te aktsepteerite?"
  },
  {
    icon: HelpCircle,
    textEn: "Returns & warranty",
    textEt: "Tagastus ja garantii",
    queryEn: "What is your return policy and warranty?",
    queryEt: "Milline on tagastuspoliitika ja garantii?"
  }
];

export default function ChatPanel() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('estzone_chat_session');
    }
    return null;
  });
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('estzone_chat_session', sessionId);
    }
  }, [sessionId]);
  
  useEffect(() => {
    const loadSessionHistory = async () => {
      if (sessionId) {
        try {
          const response = await fetch(`/api/support/session/${sessionId}`);
          if (response.ok) {
            const history = await response.json();
            if (history && history.length > 0) {
              const loadedMessages: Message[] = history.map((msg: any, index: number) => ({
                role: msg.role,
                content: msg.content,
                id: msg.id || `history-${index}`
              }));
              setMessages(loadedMessages);
              setShowSuggestions(false);
              return;
            }
          }
        } catch (error) {
          console.error('Failed to load session history:', error);
        }
      }
      
      const welcomeMessage: Message = {
        role: 'assistant',
        content: language === 'et'
          ? 'Tere! Olen EstZone virtuaalne assistent. Kuidas saan teid aidata?'
          : 'Hello! I\'m EstZone\'s virtual assistant. How can I help you today?',
        id: 'welcome'
      };
      setMessages([welcomeMessage]);
    };
    
    loadSessionHistory();
  }, [sessionId, language]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
          language,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let newSessionId = sessionId;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.sessionId && !newSessionId) {
                  newSessionId = data.sessionId;
                  setSessionId(data.sessionId);
                }
                
                if (data.chunk) {
                  assistantMessage += data.chunk;
                  // Update the assistant message in real-time
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== 'temp-assistant');
                    return [...filtered, {
                      role: 'assistant',
                      content: assistantMessage,
                      id: 'temp-assistant'
                    }];
                  });
                }
                
                if (data.done) {
                  // Finalize the assistant message
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== 'temp-assistant');
                    return [...filtered, {
                      role: 'assistant',
                      content: assistantMessage,
                      id: Date.now().toString()
                    }];
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: language === 'et'
          ? 'Vabandust, tekkis viga. Palun proovige hiljem uuesti.'
          : 'Sorry, an error occurred. Please try again later.',
        id: Date.now().toString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleSuggestionClick = (suggestion: QuickSuggestion) => {
    const query = language === 'et' ? suggestion.queryEt : suggestion.queryEn;
    setInput(query);
    setShowSuggestions(false);
    setTimeout(() => {
      handleSend();
    }, 100);
  };
  
  const handleSuggestionClickDirect = async (suggestion: QuickSuggestion) => {
    if (isLoading) return;
    
    const query = language === 'et' ? suggestion.queryEt : suggestion.queryEn;
    setShowSuggestions(false);
    
    const userMessage: Message = {
      role: 'user',
      content: query,
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: query,
          language,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let newSessionId = sessionId;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }
                
                if (data.sessionId && !newSessionId) {
                  newSessionId = data.sessionId;
                  setSessionId(data.sessionId);
                }
                
                if (data.chunk) {
                  assistantMessage += data.chunk;
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== 'temp-assistant');
                    return [...filtered, {
                      role: 'assistant',
                      content: assistantMessage,
                      id: 'temp-assistant'
                    }];
                  });
                }
                
                if (data.done) {
                  setMessages(prev => {
                    const filtered = prev.filter(m => m.id !== 'temp-assistant');
                    return [...filtered, {
                      role: 'assistant',
                      content: assistantMessage,
                      id: Date.now().toString()
                    }];
                  });
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: language === 'et'
          ? 'Vabandust, tekkis viga. Palun proovige hiljem uuesti.'
          : 'Sorry, an error occurred. Please try again later.',
        id: Date.now().toString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
              data-testid={`message-${message.role}-${message.id}`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-4 py-2",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          
          {showSuggestions && messages.length <= 1 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">
                {language === 'et' ? 'Kiirvalikud:' : 'Quick suggestions:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClickDirect(suggestion)}
                    disabled={isLoading}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted text-left text-xs transition-colors disabled:opacity-50"
                    data-testid={`button-suggestion-${index}`}
                  >
                    <suggestion.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">
                      {language === 'et' ? suggestion.textEt : suggestion.textEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={scrollRef} />
        </div>
      </ScrollArea>
      
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'et' ? 'Kirjutage sõnum...' : 'Type a message...'}
            className="resize-none min-h-[60px]"
            disabled={isLoading}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            data-testid="button-send-message"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        {isLoading && (
          <p className="text-xs text-muted-foreground mt-2">
            {language === 'et' ? 'Kirjutan...' : 'Typing...'}
          </p>
        )}
      </div>
    </div>
  );
}
