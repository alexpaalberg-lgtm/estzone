import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, Bot, User, Gamepad2, Headphones, Gift, HelpCircle, Truck, CreditCard,
  ShoppingCart, Package, RotateCcw, Shield, Search, Sparkles, Percent, Monitor,
  Joystick, Glasses, Zap, Clock, MapPin, Phone, Mail
} from "lucide-react";
import { cn } from "@/lib/utils";

function detectMessageLanguage(text: string): 'en' | 'et' {
  const estonianWords = ['tere', 'palun', 'aitäh', 'tänan', 'on', 'ja', 'ei', 'see', 'kui', 'võib', 'saab', 'kas', 'mis', 'kus', 'kes', 'mida', 'kuidas', 'miks', 'mängu', 'toode', 'tellimus', 'soodustus', 'hind', 'laos', 'soovitan', 'otsin', 'vajan', 'konsool', 'mäng', 'pult', 'kõrvaklapid', 'tahan', 'tahaks', 'soovin', 'osta', 'korvi', 'halloo', 'hei', 'tsau', 'näita', 'soov', 'pole', 'veel', 'jah', 'hästi', 'hea', 'super', 'aitab', 'head', 'päeva', 'õhtut', 'öö', 'mängud', 'parimad', 'millised', 'teil', 'mul', 'mulle', 'sulle', 'teile', 'meile', 'nende', 'neid', 'seda', 'need', 'kõik', 'mõned', 'uued', 'vanad', 'hommikust', 'tervitus', 'tervist', 'kohale'];
  const englishWords = ['hello', 'please', 'thanks', 'thank', 'the', 'is', 'and', 'no', 'this', 'if', 'can', 'get', 'what', 'where', 'who', 'how', 'why', 'game', 'product', 'order', 'sale', 'price', 'stock', 'recommend', 'looking', 'need', 'console', 'controller', 'headset', 'want', 'buy', 'cart', 'hi', 'hey', 'show', 'yes', 'okay', 'good', 'great', 'nice', 'help', 'have', 'you', 'your', 'for', 'with', 'games', 'best', 'which', 'do', 'are', 'my', 'me', 'to', 'we', 'them', 'these', 'those', 'all', 'some', 'new', 'old', 'morning', 'evening'];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  let estonianScore = 0;
  let englishScore = 0;
  
  words.forEach(word => {
    const cleanWord = word.replace(/[^a-zõäöü]/gi, '');
    if (cleanWord.length < 2) return;
    if (estonianWords.some(ew => cleanWord === ew || cleanWord.startsWith(ew) || ew.startsWith(cleanWord))) estonianScore++;
    if (englishWords.some(ew => cleanWord === ew || cleanWord.startsWith(ew) || ew.startsWith(cleanWord))) englishScore++;
  });
  
  const hasEstonianChars = /[õäöü]/i.test(text);
  if (hasEstonianChars) estonianScore += 10;
  
  if (estonianScore === 0 && englishScore === 0) {
    const browserLang = typeof navigator !== 'undefined' ? navigator.language : 'et';
    return browserLang.startsWith('et') ? 'et' : 'en';
  }
  
  return estonianScore >= englishScore ? 'et' : 'en';
}

function getBrowserLanguage(): 'en' | 'et' {
  if (typeof navigator === 'undefined') return 'et';
  const browserLang = navigator.language || 'et';
  return browserLang.startsWith('et') || browserLang.startsWith('ee') ? 'et' : 'en';
}

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
  category: 'products' | 'orders' | 'support' | 'info';
}

const allSuggestions: QuickSuggestion[] = [
  {
    icon: Gamepad2,
    textEn: "Best PS5 games",
    textEt: "Parimad PS5 mängud",
    queryEn: "What are the best PS5 games you have?",
    queryEt: "Millised on parimad PS5 mängud, mis teil on?",
    category: 'products'
  },
  {
    icon: Monitor,
    textEn: "Xbox games",
    textEt: "Xbox mängud",
    queryEn: "Show me Xbox Series X games",
    queryEt: "Näita Xbox Series X mänge",
    category: 'products'
  },
  {
    icon: Joystick,
    textEn: "Nintendo Switch",
    textEt: "Nintendo Switch",
    queryEn: "What Nintendo Switch games do you have?",
    queryEt: "Millised Nintendo Switch mängud teil on?",
    category: 'products'
  },
  {
    icon: Headphones,
    textEn: "Gaming headsets",
    textEt: "Mänguri kõrvaklapid",
    queryEn: "Show me your best gaming headsets",
    queryEt: "Näita parimaid mänguri kõrvaklappe",
    category: 'products'
  },
  {
    icon: Glasses,
    textEn: "VR headsets",
    textEt: "VR prillid",
    queryEn: "What VR headsets do you sell?",
    queryEt: "Milliseid VR prille te müüte?",
    category: 'products'
  },
  {
    icon: Zap,
    textEn: "Controllers",
    textEt: "Puldid",
    queryEn: "Show me gaming controllers",
    queryEt: "Näita mängupulte",
    category: 'products'
  },
  {
    icon: Gift,
    textEn: "Gift ideas",
    textEt: "Kingiideed",
    queryEn: "I need a gift for a gamer, what do you recommend?",
    queryEt: "Vajan kinki mängurile, mida soovitate?",
    category: 'products'
  },
  {
    icon: Percent,
    textEn: "Sales & offers",
    textEt: "Soodustused",
    queryEn: "What products are on sale right now?",
    queryEt: "Mis tooted on praegu allahinnatud?",
    category: 'products'
  },
  {
    icon: Sparkles,
    textEn: "New arrivals",
    textEt: "Uued tooted",
    queryEn: "What new products have arrived recently?",
    queryEt: "Millised uued tooted on hiljuti saabunud?",
    category: 'products'
  },
  {
    icon: ShoppingCart,
    textEn: "Place an order",
    textEt: "Tee tellimus",
    queryEn: "I want to place an order, how do I proceed?",
    queryEt: "Soovin tellimuse teha, kuidas toimida?",
    category: 'orders'
  },
  {
    icon: Package,
    textEn: "Track my order",
    textEt: "Jälgi tellimust",
    queryEn: "I want to check my order status. My order number is...",
    queryEt: "Soovin oma tellimuse staatust kontrollida. Mu tellimuse number on...",
    category: 'orders'
  },
  {
    icon: Clock,
    textEn: "Delivery time",
    textEt: "Tarneaeg",
    queryEn: "How long does delivery take?",
    queryEt: "Kui kaua tarne aega võtab?",
    category: 'orders'
  },
  {
    icon: Truck,
    textEn: "Shipping options",
    textEt: "Tarneviisid",
    queryEn: "What are your shipping options and costs?",
    queryEt: "Millised on tarneviisid ja hinnad?",
    category: 'info'
  },
  {
    icon: CreditCard,
    textEn: "Payment methods",
    textEt: "Makseviisid",
    queryEn: "What payment methods do you accept?",
    queryEt: "Milliseid makseviise te aktsepteerite?",
    category: 'info'
  },
  {
    icon: RotateCcw,
    textEn: "Return a product",
    textEt: "Tagasta toode",
    queryEn: "I want to return a product, how does that work?",
    queryEt: "Soovin toodet tagastada, kuidas see käib?",
    category: 'support'
  },
  {
    icon: Shield,
    textEn: "Warranty info",
    textEt: "Garantiiinfo",
    queryEn: "What is the warranty on your products?",
    queryEt: "Milline on toodete garantii?",
    category: 'support'
  },
  {
    icon: HelpCircle,
    textEn: "Product problem",
    textEt: "Toote probleem",
    queryEn: "I have a problem with a product I bought",
    queryEt: "Mul on probleem ostetud tootega",
    category: 'support'
  },
  {
    icon: MapPin,
    textEn: "Store location",
    textEt: "Poe asukoht",
    queryEn: "Where is your store located?",
    queryEt: "Kus teie pood asub?",
    category: 'info'
  },
  {
    icon: Phone,
    textEn: "Contact us",
    textEt: "Kontakt",
    queryEn: "How can I contact you?",
    queryEt: "Kuidas teiega ühendust saada?",
    category: 'info'
  },
  {
    icon: Search,
    textEn: "Find a product",
    textEt: "Otsi toodet",
    queryEn: "I'm looking for a specific product...",
    queryEt: "Otsin kindlat toodet...",
    category: 'products'
  }
];

function renderMessageWithLinks(content: string) {
  const urlRegex = /(https?:\/\/[^\s\)]+)/g;
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      const displayText = part.length > 50 
        ? part.substring(0, 47) + '...' 
        : part;
      return (
        <a 
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary/80 break-all"
        >
          {displayText}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function getContextualSuggestions(messages: Message[], language: 'en' | 'et'): QuickSuggestion[] {
  if (messages.length <= 1) {
    return allSuggestions.slice(0, 6);
  }
  
  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant')?.content.toLowerCase() || '';
  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')?.content.toLowerCase() || '';
  
  let relevantSuggestions: QuickSuggestion[] = [];
  
  if (lastAssistantMessage.includes('tellimus') || lastAssistantMessage.includes('order') ||
      lastUserMessage.includes('tellimus') || lastUserMessage.includes('order')) {
    relevantSuggestions = allSuggestions.filter(s => s.category === 'orders');
  } else if (lastAssistantMessage.includes('tagast') || lastAssistantMessage.includes('return') ||
             lastAssistantMessage.includes('garantii') || lastAssistantMessage.includes('warranty')) {
    relevantSuggestions = allSuggestions.filter(s => s.category === 'support');
  } else if (lastAssistantMessage.includes('mäng') || lastAssistantMessage.includes('game') ||
             lastAssistantMessage.includes('konsool') || lastAssistantMessage.includes('console')) {
    relevantSuggestions = allSuggestions.filter(s => s.category === 'products');
  } else {
    const categories = ['products', 'orders', 'support', 'info'] as const;
    relevantSuggestions = categories.flatMap(cat => 
      allSuggestions.filter(s => s.category === cat).slice(0, 2)
    );
  }
  
  const alreadyAsked = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());
  
  relevantSuggestions = relevantSuggestions.filter(s => {
    const query = (language === 'et' ? s.queryEt : s.queryEn).toLowerCase();
    return !alreadyAsked.some(asked => 
      asked.includes(query.slice(0, 20)) || query.includes(asked.slice(0, 20))
    );
  });
  
  return relevantSuggestions.slice(0, 4);
}

interface ChatPanelProps {
  onLanguageChange?: (language: 'en' | 'et') => void;
}

export interface ChatPanelRef {
  clearChat: () => void;
}

const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ onLanguageChange }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personaName, setPersonaName] = useState<string | null>(null);
  const [chatLanguage, setChatLanguage] = useState<'en' | 'et'>(() => getBrowserLanguage());
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('estzone_chat_session');
    }
    return null;
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const clearChat = () => {
    localStorage.removeItem('estzone_chat_session');
    setSessionId(null);
    setMessages([]);
    setPersonaName(null);
    setInput("");
    const initialLang = getBrowserLanguage();
    setChatLanguage(initialLang);
    const welcomeMessage: Message = {
      role: 'assistant',
      content: initialLang === 'et'
        ? 'Tere! Olen EstZone virtuaalne assistent. Kuidas saan aidata?'
        : 'Hello! I\'m EstZone\'s virtual assistant. How can I help you today?',
      id: 'welcome-new'
    };
    setMessages([welcomeMessage]);
  };

  useImperativeHandle(ref, () => ({
    clearChat
  }));
  
  useEffect(() => {
    onLanguageChange?.(chatLanguage);
  }, [chatLanguage, onLanguageChange]);
  
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
              
              const userMessages = history.filter((m: any) => m.role === 'user');
              if (userMessages.length > 0) {
                const lastUserMessage = userMessages[userMessages.length - 1].content;
                const detectedLang = detectMessageLanguage(lastUserMessage);
                setChatLanguage(detectedLang);
                onLanguageChange?.(detectedLang);
              }
              return;
            }
          }
        } catch (error) {
          console.error('Failed to load session history:', error);
        }
      }
      
      const initialLang = getBrowserLanguage();
      setChatLanguage(initialLang);
      
      const welcomeMessage: Message = {
        role: 'assistant',
        content: initialLang === 'et'
          ? 'Tere! Olen EstZone virtuaalne assistent. Kuidas saan aidata?'
          : 'Hello! I\'m EstZone\'s virtual assistant. How can I help you today?',
        id: 'welcome'
      };
      setMessages([welcomeMessage]);
    };
    
    loadSessionHistory();
  }, [sessionId]);
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: Date.now().toString()
    };
    
    const detectedLang = detectMessageLanguage(userMessage.content);
    setChatLanguage(detectedLang);
    onLanguageChange?.(detectedLang);
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.content,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let newSessionId = sessionId;
      
      const readWithTimeout = async (reader: ReadableStreamDefaultReader<Uint8Array>, timeout: number) => {
        let timeoutHandle: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reader.cancel();
            reject(new Error('Response timeout'));
          }, timeout);
        });
        
        try {
          const result = await Promise.race([reader.read(), timeoutPromise]);
          clearTimeout(timeoutHandle!);
          return result;
        } catch (err) {
          clearTimeout(timeoutHandle!);
          throw err;
        }
      };
      
      if (reader) {
        while (true) {
          const { done, value } = await readWithTimeout(reader, 30000);
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
                  if (data.personaName && !personaName) {
                    setPersonaName(data.personaName);
                  }
                  
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
      clearTimeout(timeoutId);
      setMessages(prev => prev.filter(m => m.id !== 'temp-assistant'));
      
      const isTimeout = error.name === 'AbortError' || error.message === 'Response timeout';
      const errorMessage: Message = {
        role: 'assistant',
        content: chatLanguage === 'et'
          ? isTimeout 
            ? 'Vabandust, vastamine võttis liiga kaua aega. Palun proovige uuesti.'
            : 'Vabandust, tekkis viga. Palun proovige hiljem uuesti.'
          : isTimeout
            ? 'Sorry, the response took too long. Please try again.'
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
  
  const handleSuggestionClickDirect = async (suggestion: QuickSuggestion) => {
    if (isLoading) return;
    
    const query = chatLanguage === 'et' ? suggestion.queryEt : suggestion.queryEn;
    
    const detectedLang = detectMessageLanguage(query);
    setChatLanguage(detectedLang);
    
    const userMessage: Message = {
      role: 'user',
      content: query,
      id: Date.now().toString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: query,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let newSessionId = sessionId;
      
      const readWithTimeout = async (reader: ReadableStreamDefaultReader<Uint8Array>, timeout: number) => {
        let timeoutHandle: ReturnType<typeof setTimeout>;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutHandle = setTimeout(() => {
            reader.cancel();
            reject(new Error('Response timeout'));
          }, timeout);
        });
        
        try {
          const result = await Promise.race([reader.read(), timeoutPromise]);
          clearTimeout(timeoutHandle!);
          return result;
        } catch (err) {
          clearTimeout(timeoutHandle!);
          throw err;
        }
      };
      
      if (reader) {
        while (true) {
          const { done, value } = await readWithTimeout(reader, 30000);
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
      clearTimeout(timeoutId);
      setMessages(prev => prev.filter(m => m.id !== 'temp-assistant'));
      
      const isTimeout = error.name === 'AbortError' || error.message === 'Response timeout';
      const errorMessage: Message = {
        role: 'assistant',
        content: chatLanguage === 'et'
          ? isTimeout 
            ? 'Vabandust, vastamine võttis liiga kaua aega. Palun proovige uuesti.'
            : 'Vabandust, tekkis viga. Palun proovige hiljem uuesti.'
          : isTimeout
            ? 'Sorry, the response took too long. Please try again.'
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
                <div className="flex flex-col items-center gap-1">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  {personaName && (
                    <span className="text-[10px] text-muted-foreground font-medium">{personaName}</span>
                  )}
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
                <div className="text-sm whitespace-pre-wrap">
                  {message.role === 'assistant' 
                    ? renderMessageWithLinks(message.content)
                    : message.content
                  }
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
          
          {!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-3">
                {chatLanguage === 'et' ? 'Veel küsimusi:' : 'More questions:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {getContextualSuggestions(messages, chatLanguage).map((suggestion: QuickSuggestion, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClickDirect(suggestion)}
                    disabled={isLoading}
                    className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted text-left text-xs transition-colors disabled:opacity-50"
                    data-testid={`button-suggestion-${index}`}
                  >
                    <suggestion.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="line-clamp-1">
                      {chatLanguage === 'et' ? suggestion.textEt : suggestion.textEn}
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
            placeholder={chatLanguage === 'et' ? 'Kirjutage sõnum...' : 'Type a message...'}
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
            {chatLanguage === 'et' ? 'Kirjutan...' : 'Typing...'}
          </p>
        )}
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
