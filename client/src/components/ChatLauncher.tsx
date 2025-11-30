import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      {!isOpen && (
        <Button
          size="icon"
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-[9999] bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
          data-testid="button-chat-launcher"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}
      
      {isOpen && (
        <div className="fixed inset-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] bg-background border border-border rounded-lg shadow-xl z-[9999] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                {language === 'et' ? 'Tugiassistent' : 'Support Assistant'}
              </h3>
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
