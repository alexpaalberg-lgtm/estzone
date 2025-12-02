import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, Send, Users, History, Smartphone, Laptop, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface PushSubscription {
  id: string;
  userId: string | null;
  endpoint: string;
  userAgent: string | null;
  notifyNewProducts: boolean;
  notifyPriceDrops: boolean;
  notifyWishlist: boolean;
  notifyOrders: boolean;
  notifyPromotions: boolean;
  createdAt: string;
}

interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  url: string | null;
  type: string;
  targetType: string;
  sentCount: number;
  failedCount: number;
  sentAt: string;
  sentBy: string | null;
}

export default function AdminPushNotifications() {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("general");

  const { data: subscriptions = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery<PushSubscription[]>({
    queryKey: ["/api/admin/push/subscriptions"],
  });

  const { data: history = [], isLoading: loadingHistory, refetch: refetchHistory } = useQuery<NotificationHistory[]>({
    queryKey: ["/api/admin/push/history"],
  });

  const sendMutation = useMutation({
    mutationFn: async (data: { title: string; body: string; url?: string; type: string }) => {
      const response = await apiRequest("POST", "/api/admin/push/send", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Notification Sent",
        description: `Sent to ${data.sent} subscribers (${data.failed} failed)`,
      });
      setTitle("");
      setBody("");
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/push/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Error",
        description: "Title and body are required",
        variant: "destructive",
      });
      return;
    }
    sendMutation.mutate({ title, body, url: url || undefined, type });
  };

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Smartphone className="h-4 w-4" />;
    if (userAgent.toLowerCase().includes("mobile") || userAgent.toLowerCase().includes("android")) {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Laptop className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "new_product": return "bg-green-500/20 text-green-400";
      case "price_drop": return "bg-blue-500/20 text-blue-400";
      case "order_update": return "bg-yellow-500/20 text-yellow-400";
      case "promotion": return "bg-purple-500/20 text-purple-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Push Notifications
          </h1>
          <p className="text-muted-foreground">
            Send push notifications to subscribers
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            {subscriptions.length} Subscribers
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            Send Notification
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="gap-2">
            <Users className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Compose Notification</CardTitle>
              <CardDescription>
                Send a push notification to all subscribers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Notification title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    data-testid="input-notification-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger data-testid="select-notification-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="new_product">New Product</SelectItem>
                      <SelectItem value="price_drop">Price Drop</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                      <SelectItem value="order_update">Order Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  placeholder="Notification message..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={3}
                  data-testid="input-notification-body"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="url">Link URL (optional)</Label>
                <Input
                  id="url"
                  placeholder="https://estzone.eu/products/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  data-testid="input-notification-url"
                />
              </div>
              
              <Button 
                onClick={handleSend}
                disabled={sendMutation.isPending || !title.trim() || !body.trim()}
                className="w-full"
                data-testid="button-send-notification"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending ? "Sending..." : `Send to ${subscriptions.length} Subscribers`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>
                  Devices registered for push notifications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchSubs()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingSubs ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading subscribers...
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No subscribers yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Preferences</TableHead>
                      <TableHead>Subscribed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(sub.userAgent)}
                            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {sub.userAgent?.split(" ")[0] || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sub.userId ? (
                            <Badge variant="outline">{sub.userId.slice(0, 8)}...</Badge>
                          ) : (
                            <span className="text-muted-foreground">Anonymous</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {sub.notifyNewProducts && <Badge variant="secondary" className="text-xs">Products</Badge>}
                            {sub.notifyPriceDrops && <Badge variant="secondary" className="text-xs">Prices</Badge>}
                            {sub.notifyWishlist && <Badge variant="secondary" className="text-xs">Wishlist</Badge>}
                            {sub.notifyOrders && <Badge variant="secondary" className="text-xs">Orders</Badge>}
                            {sub.notifyPromotions && <Badge variant="secondary" className="text-xs">Promos</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(sub.createdAt), "MMM d, yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  Previously sent notifications
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications sent yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Sent/Failed</TableHead>
                      <TableHead>Sent By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {item.body}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(item.type)}>
                            {item.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-500">{item.sentCount}</span>
                          {" / "}
                          <span className="text-red-500">{item.failedCount}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.sentBy || "System"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(item.sentAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
