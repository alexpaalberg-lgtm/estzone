import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (isOpen) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isOpen]);

  return (
    <>
      {!isOpen && (
        <Button
          size="icon"
          className={`fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 transition-transform duration-300 ${
            isVisible ? 'translate-y-0' : 'translate-y-24'
          }`}
          onClick={() => setIsOpen(true)}
          data-testid="button-chat-launcher"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-96 w-full h-full md:h-[600px] bg-background border border-border rounded-none md:rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Support Assistant</h3>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <ChatPanel />
        </div>
      )}
    </>
  );
}
