import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest } from "@/lib/queryClient";

interface NotificationPreferences {
  newProducts: boolean;
  priceDrops: boolean;
  wishlist: boolean;
  orders: boolean;
  promotions: boolean;
}

const texts = {
  en: {
    title: "Push Notifications",
    description: "Get notified about new products, price drops, and exclusive offers.",
    enable: "Enable Notifications",
    enabling: "Enabling...",
    disable: "Disable Notifications",
    disabling: "Disabling...",
    blocked: "Notifications are blocked. Please enable them in your browser settings.",
    newProducts: "New Products",
    priceDrops: "Price Drops",
    wishlistAlerts: "Wishlist Alerts",
    orderUpdates: "Order Updates",
    promotions: "Promotions & Sales",
    subscribed: "Notifications Enabled",
    subscribedDesc: "You will now receive updates about new products, sales, and more!",
    unsubscribed: "Notifications Disabled",
    unsubscribedDesc: "You will no longer receive push notifications.",
    permissionDenied: "Permission Denied",
    enableInSettings: "Please enable notifications in your browser settings.",
    error: "Error",
    subscribeError: "Failed to enable notifications.",
    unsubscribeError: "Failed to disable notifications.",
  },
  et: {
    title: "Teavitused",
    description: "Saa teada uutest toodetest, hinnalangetustest ja eksklusiivsete pakkumistest.",
    enable: "Luba teavitused",
    enabling: "Lubamine...",
    disable: "Keela teavitused",
    disabling: "Keelamine...",
    blocked: "Teavitused on blokeeritud. Palun luba need brauseri seadetes.",
    newProducts: "Uued tooted",
    priceDrops: "Hinnalangetused",
    wishlistAlerts: "Soovinimekirja hoiatused",
    orderUpdates: "Tellimuse uuendused",
    promotions: "Kampaaniad ja soodustused",
    subscribed: "Teavitused lubatud",
    subscribedDesc: "Sa saad nüüd teated uutest toodetest, soodustustest ja muust!",
    unsubscribed: "Teavitused keelatud",
    unsubscribedDesc: "Sa ei saa enam push-teavitusi.",
    permissionDenied: "Luba keelatud",
    enableInSettings: "Palun luba teavitused brauseri seadetes.",
    error: "Viga",
    subscribeError: "Teavituste lubamine ebaõnnestus.",
    unsubscribeError: "Teavituste keelamine ebaõnnestus.",
  }
};

export function PushNotifications() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = texts[language] || texts.en;
  
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    newProducts: true,
    priceDrops: true,
    wishlist: true,
    orders: true,
    promotions: true,
  });

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscriptionStatus();
    }
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        const response = await apiRequest("POST", "/api/push/status", {
          endpoint: subscription.endpoint,
        });
        const data = await response.json();
        setIsSubscribed(data.subscribed);
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  const subscribe = async () => {
    if (!isSupported) return;
    
    setIsLoading(true);
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== "granted") {
        toast({
          title: t.permissionDenied,
          description: t.enableInSettings,
          variant: "destructive",
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const response = await fetch("/api/push/vapid-public-key");
      const { publicKey } = await response.json();
      
      if (!publicKey) {
        throw new Error("VAPID public key not configured");
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await apiRequest("POST", "/api/push/subscribe", {
        subscription: subscription.toJSON(),
        preferences,
      });

      setIsSubscribed(true);
      toast({
        title: t.subscribed,
        description: t.subscribedDesc,
      });
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: t.error,
        description: error.message || t.subscribeError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await apiRequest("POST", "/api/push/unsubscribe", {
          endpoint: subscription.endpoint,
        });
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast({
        title: t.unsubscribed,
        description: t.unsubscribedDesc,
      });
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      toast({
        title: t.error,
        description: error.message || t.unsubscribeError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await apiRequest("PATCH", "/api/push/preferences", {
          endpoint: subscription.endpoint,
          preferences: newPreferences,
        });
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          {isSubscribed ? (
            <BellRing className="h-5 w-5 text-primary" />
          ) : permission === "denied" ? (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {isSubscribed && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">{t.title}</h4>
            {isSubscribed && (
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          
          {!isSubscribed ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.description}</p>
              {permission === "denied" ? (
                <p className="text-sm text-destructive">{t.blocked}</p>
              ) : (
                <Button 
                  onClick={subscribe} 
                  disabled={isLoading}
                  className="w-full"
                  data-testid="button-enable-notifications"
                >
                  {isLoading ? t.enabling : t.enable}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-products" className="text-sm">
                    {t.newProducts}
                  </Label>
                  <Switch
                    id="notify-products"
                    checked={preferences.newProducts}
                    onCheckedChange={(v) => updatePreferences("newProducts", v)}
                    data-testid="switch-notify-products"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-price" className="text-sm">
                    {t.priceDrops}
                  </Label>
                  <Switch
                    id="notify-price"
                    checked={preferences.priceDrops}
                    onCheckedChange={(v) => updatePreferences("priceDrops", v)}
                    data-testid="switch-notify-price"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-wishlist" className="text-sm">
                    {t.wishlistAlerts}
                  </Label>
                  <Switch
                    id="notify-wishlist"
                    checked={preferences.wishlist}
                    onCheckedChange={(v) => updatePreferences("wishlist", v)}
                    data-testid="switch-notify-wishlist"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-orders" className="text-sm">
                    {t.orderUpdates}
                  </Label>
                  <Switch
                    id="notify-orders"
                    checked={preferences.orders}
                    onCheckedChange={(v) => updatePreferences("orders", v)}
                    data-testid="switch-notify-orders"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-promo" className="text-sm">
                    {t.promotions}
                  </Label>
                  <Switch
                    id="notify-promo"
                    checked={preferences.promotions}
                    onCheckedChange={(v) => updatePreferences("promotions", v)}
                    data-testid="switch-notify-promo"
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={unsubscribe}
                disabled={isLoading}
                className="w-full"
                data-testid="button-disable-notifications"
              >
                {isLoading ? t.disabling : t.disable}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
