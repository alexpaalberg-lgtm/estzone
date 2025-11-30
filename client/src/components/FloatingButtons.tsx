import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, ChevronUp } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { useLanguage } from "@/contexts/LanguageContext";

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      size="icon"
      variant="outline"
      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg bg-background/95 backdrop-blur-sm border-border hover:bg-muted"
      onClick={scrollToTop}
      data-testid="button-scroll-top"
    >
      <ChevronUp className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );
}

function ChatLauncherButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
      onClick={onClick}
      data-testid="button-chat-launcher"
    >
      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
    </Button>
  );
}

function ChatWindow({ onClose }: { onClose: () => void }) {
  const { language } = useLanguage();

  return (
    <div 
      className="fixed inset-4 sm:inset-auto sm:bottom-24 sm:right-4 sm:w-[380px] sm:h-[500px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{ zIndex: 99999 }}
    >
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <MessageCircle className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {language === 'et' ? 'EstZone Tugi' : 'EstZone Support'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === 'et' ? 'Tavaliselt vastame kohe' : 'Usually replies instantly'}
            </p>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={onClose}
          data-testid="button-close-chat"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <ChatPanel />
    </div>
  );
}

export default function FloatingButtons() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const content = (
    <div 
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-3"
      style={{ zIndex: 99999, pointerEvents: 'auto' }}
    >
      <ScrollToTopButton />
      
      {!isChatOpen && (
        <ChatLauncherButton onClick={() => setIsChatOpen(true)} />
      )}
      
      {isChatOpen && (
        <ChatWindow onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );

  return createPortal(content, document.body);
}
