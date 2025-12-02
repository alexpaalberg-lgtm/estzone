import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { et, enGB } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot,
  Play,
  Pause,
  RefreshCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Mail,
  TrendingUp,
  Package,
  Search,
  Heart,
  DollarSign,
  Zap,
  Settings,
  History
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ScheduledTask {
  id: string;
  name: string;
  nameEt: string;
  description: string;
  descriptionEt: string;
  schedule: 'hourly' | 'daily' | 'weekly' | 'custom';
  hour?: number;
  dayOfWeek?: number;
  enabled: boolean;
  lastRun?: string;
  lastResult?: 'success' | 'error' | 'skipped';
  lastError?: string;
  runCount: number;
}

interface AutomationSettings {
  enabled: boolean;
  tasks: Record<string, ScheduledTask>;
  timezone: string;
  lastUpdated: string;
}

interface AutomationData {
  settings: AutomationSettings;
  logs: any[];
}

const taskIcons: Record<string, any> = {
  dailyReport: TrendingUp,
  lowStockAlerts: AlertTriangle,
  weeklyNewsletter: Mail,
  inactiveCustomerWinback: Heart,
  abandonedCartReminders: Package,
  priceOptimization: DollarSign,
  seoAudit: Search,
  wishlistPriceAlerts: Heart,
  autoProducts: Package,
};

const scheduleLabels: Record<string, { en: string; et: string }> = {
  hourly: { en: 'Every hour', et: 'Iga tund' },
  daily: { en: 'Daily', et: 'Iga päev' },
  weekly: { en: 'Weekly', et: 'Iga nädal' },
  custom: { en: 'Custom', et: 'Kohandatud' },
};

const dayNames: Record<number, { en: string; et: string }> = {
  0: { en: 'Sunday', et: 'Pühapäev' },
  1: { en: 'Monday', et: 'Esmaspäev' },
  2: { en: 'Tuesday', et: 'Teisipäev' },
  3: { en: 'Wednesday', et: 'Kolmapäev' },
  4: { en: 'Thursday', et: 'Neljapäev' },
  5: { en: 'Friday', et: 'Reede' },
  6: { en: 'Saturday', et: 'Laupäev' },
};

export default function AIAutomation() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = useState<AutomationSettings | null>(null);

  const { data, isLoading, refetch } = useQuery<AutomationData>({
    queryKey: ['/api/admin/automation'],
  });

  useEffect(() => {
    if (data?.settings && !localSettings) {
      setLocalSettings(data.settings);
    }
  }, [data?.settings, localSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: AutomationSettings) => {
      return apiRequest('POST', '/api/admin/automation/settings', settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/automation'] });
      toast({
        title: language === 'et' ? 'Seaded salvestatud!' : 'Settings saved!',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message,
      });
    },
  });

  const runTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return apiRequest('POST', `/api/admin/automation/run/${taskId}`, {});
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/automation'] });
      toast({
        title: language === 'et' ? 'Ülesanne käivitatud!' : 'Task executed!',
        description: language === 'et' ? result.messageEt : result.message,
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message,
      });
    },
  });

  const toggleGlobalEnabled = () => {
    if (!localSettings) return;
    const newSettings = { ...localSettings, enabled: !localSettings.enabled };
    setLocalSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const toggleTaskEnabled = (taskId: string) => {
    if (!localSettings) return;
    const newSettings = {
      ...localSettings,
      tasks: {
        ...localSettings.tasks,
        [taskId]: {
          ...localSettings.tasks[taskId],
          enabled: !localSettings.tasks[taskId].enabled,
        },
      },
    };
    setLocalSettings(newSettings);
    saveSettingsMutation.mutate(newSettings);
  };

  const getScheduleDisplay = (task: ScheduledTask) => {
    const scheduleLabel = scheduleLabels[task.schedule] || { en: task.schedule, et: task.schedule };
    let details = '';
    
    if (task.schedule === 'daily' && task.hour !== undefined) {
      details = ` ${language === 'et' ? 'kell' : 'at'} ${task.hour}:00`;
    } else if (task.schedule === 'weekly' && task.dayOfWeek !== undefined) {
      const day = dayNames[task.dayOfWeek] || { en: 'Unknown', et: 'Teadmata' };
      details = ` (${language === 'et' ? day.et : day.en}${task.hour !== undefined ? ` ${task.hour}:00` : ''})`;
    }
    
    return (language === 'et' ? scheduleLabel.et : scheduleLabel.en) + details;
  };

  const getResultBadge = (result?: 'success' | 'error' | 'skipped') => {
    switch (result) {
      case 'success':
        return <Badge className="bg-green-500">{language === 'et' ? 'Edukas' : 'Success'}</Badge>;
      case 'error':
        return <Badge className="bg-red-500">{language === 'et' ? 'Viga' : 'Error'}</Badge>;
      case 'skipped':
        return <Badge variant="secondary">{language === 'et' ? 'Vahele jäetud' : 'Skipped'}</Badge>;
      default:
        return <Badge variant="outline">{language === 'et' ? 'Pole käivitatud' : 'Not run'}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  const settings = localSettings || data?.settings;
  const tasks = settings?.tasks ? Object.values(settings.tasks) : [];
  const enabledTasks = tasks.filter(t => t.enabled).length;
  const successfulRuns = tasks.filter(t => t.lastResult === 'success').length;
  const totalRuns = tasks.reduce((sum, t) => sum + t.runCount, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                {language === 'et' ? 'Automaatika keskus' : 'Automation Center'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'et' 
                  ? 'Halda kõiki automaatseid ülesandeid ühest kohast' 
                  : 'Manage all automated tasks from one place'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label>{language === 'et' ? 'Automaatika' : 'Automation'}</Label>
              <Switch
                checked={settings?.enabled || false}
                onCheckedChange={toggleGlobalEnabled}
                data-testid="switch-global-enabled"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              data-testid="button-refresh"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Värskenda' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  settings?.enabled ? "bg-green-500/10" : "bg-gray-500/10"
                )}>
                  {settings?.enabled ? (
                    <Play className="h-5 w-5 text-green-500" />
                  ) : (
                    <Pause className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Staatus' : 'Status'}
                  </p>
                  <p className="font-semibold">
                    {settings?.enabled 
                      ? (language === 'et' ? 'Aktiivne' : 'Active')
                      : (language === 'et' ? 'Peatatud' : 'Paused')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Aktiivsed ülesanded' : 'Active Tasks'}
                  </p>
                  <p className="font-semibold">{enabledTasks} / {tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Edukad käivitused' : 'Successful Runs'}
                  </p>
                  <p className="font-semibold">{successfulRuns}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <History className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Kokku käivitusi' : 'Total Runs'}
                  </p>
                  <p className="font-semibold">{totalRuns}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks">
          <TabsList>
            <TabsTrigger value="tasks" data-testid="tab-tasks">
              <Settings className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Ülesanded' : 'Tasks'}
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <History className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Logid' : 'Logs'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {tasks.map((task) => {
                const Icon = taskIcons[task.id] || Bot;
                return (
                  <Card key={task.id} className={cn(!task.enabled && "opacity-60")}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {language === 'et' ? task.nameEt : task.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {getScheduleDisplay(task)}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={() => toggleTaskEnabled(task.id)}
                          data-testid={`switch-${task.id}`}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {language === 'et' ? task.descriptionEt : task.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getResultBadge(task.lastResult)}
                          {task.lastRun && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.lastRun), 'dd.MM HH:mm', {
                                locale: language === 'et' ? et : enGB
                              })}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTaskMutation.mutate(task.id)}
                          disabled={runTaskMutation.isPending}
                          data-testid={`button-run-${task.id}`}
                        >
                          {runTaskMutation.isPending ? (
                            <RefreshCcw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {task.lastError && (
                        <p className="text-xs text-red-500 mt-2 truncate">
                          {task.lastError}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Viimased tegevused' : 'Recent Activity'}</CardTitle>
              </CardHeader>
              <CardContent>
                {data?.logs && data.logs.length > 0 ? (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {data.logs.map((log, idx) => (
                        <div 
                          key={idx}
                          className="flex items-start gap-3 p-3 border rounded-lg"
                        >
                          <div className="p-1.5 bg-primary/10 rounded">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{log.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.timestamp || log.generatedAt ? 
                                format(new Date(log.timestamp || log.generatedAt), 'dd MMM yyyy HH:mm', {
                                  locale: language === 'et' ? et : enGB
                                }) : 'N/A'}
                            </p>
                            {log.automated && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {language === 'et' ? 'Automaatne' : 'Automated'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <History className="h-12 w-12 mb-4 opacity-50" />
                    <p>{language === 'et' ? 'Logisid pole veel' : 'No logs yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
