import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { et, enGB } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCcw,
  Shield,
  Wrench,
  ImageOff,
  FileText,
  DollarSign,
  Package,
  Languages,
  Search,
  Zap,
  Clock
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SystemIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  productId?: string;
  productName?: string;
  message: string;
  messageEt: string;
  autoFixable: boolean;
  autoFixApplied?: boolean;
  fixDetails?: string;
  detectedAt: string;
}

interface SystemHealthReport {
  timestamp: string;
  overallHealth: 'healthy' | 'warning' | 'critical';
  healthScore: number;
  issuesFound: number;
  issuesFixed: number;
  issues: SystemIssue[];
  checksPerformed: string[];
  recommendations: string[];
}

export default function AISystemHealth() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [autoFix, setAutoFix] = useState(true);

  const { data: report, isLoading } = useQuery<SystemHealthReport>({
    queryKey: ['/api/admin/ai/system-health'],
  });

  const runCheckMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/system-check', { autoFix });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/system-health'] });
      toast({
        title: language === 'et' ? 'Kontroll lõpetatud!' : 'Check completed!',
        description: language === 'et' 
          ? 'Süsteemi tervisekontroll on tehtud' 
          : 'System health check has been performed',
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

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthBg = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500/10';
      case 'warning': return 'bg-yellow-500/10';
      case 'critical': return 'bg-red-500/10';
      default: return 'bg-muted';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle2 className="h-8 w-8 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-8 w-8 text-yellow-500" />;
      case 'critical': return <XCircle className="h-8 w-8 text-red-500" />;
      default: return <Activity className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getIssueIcon = (category: string) => {
    switch (category) {
      case 'missing_image': return <ImageOff className="h-4 w-4" />;
      case 'missing_description': return <FileText className="h-4 w-4" />;
      case 'price_issue': return <DollarSign className="h-4 w-4" />;
      case 'stock_issue': return <Package className="h-4 w-4" />;
      case 'seo_issue': return <Search className="h-4 w-4" />;
      case 'translation_issue': return <Languages className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getIssueBadgeVariant = (type: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { en: string; et: string }> = {
      missing_image: { en: 'Missing Image', et: 'Puuduv pilt' },
      missing_description: { en: 'Missing Description', et: 'Puuduv kirjeldus' },
      price_issue: { en: 'Price Issue', et: 'Hinnaprobleem' },
      stock_issue: { en: 'Stock Issue', et: 'Laoprobleem' },
      seo_issue: { en: 'SEO Issue', et: 'SEO probleem' },
      translation_issue: { en: 'Translation Issue', et: 'Tõlkeprobleem' },
    };
    return labels[category]?.[language] || category;
  };

  const groupedIssues = report?.issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, SystemIssue[]>) || {};

  return (
    <AdminLayout title={language === 'et' ? 'Süsteemi Tervis' : 'System Health'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-system-health-title">
                {language === 'et' ? 'AI Süsteemikontroll' : 'AI System Health'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Automaatne kataloogi kontroll ja parandus' 
                  : 'Automatic catalog check and repair'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-fix"
                checked={autoFix}
                onCheckedChange={setAutoFix}
              />
              <Label htmlFor="auto-fix" className="text-sm">
                {language === 'et' ? 'Automaatne parandus' : 'Auto-fix issues'}
              </Label>
            </div>
            
            <Button
              onClick={() => runCheckMutation.mutate()}
              disabled={runCheckMutation.isPending}
              data-testid="button-run-check"
            >
              {runCheckMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {language === 'et' ? 'Käivita kontroll' : 'Run Check'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !report ? (
          <Card className="p-12 text-center">
            <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Kontrolli pole veel tehtud' : 'No check performed yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Käivita kontroll" süsteemi analüüsimiseks'
                : 'Click "Run Check" to analyze the system'}
            </p>
            <Button onClick={() => runCheckMutation.mutate()} disabled={runCheckMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Käivita kontroll' : 'Run Check'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className={cn("border-2", getHealthBg(report.overallHealth))} data-testid="card-health-status">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Üldine seisund' : 'Overall Health'}
                  </CardTitle>
                  {getHealthIcon(report.overallHealth)}
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", getHealthColor(report.overallHealth))}>
                    {report.overallHealth === 'healthy' ? (language === 'et' ? 'Terve' : 'Healthy') :
                     report.overallHealth === 'warning' ? (language === 'et' ? 'Hoiatus' : 'Warning') :
                     language === 'et' ? 'Kriitiline' : 'Critical'}
                  </div>
                  <Progress value={report.healthScore} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {language === 'et' ? 'Skoor' : 'Score'}: {report.healthScore}/100
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-issues-found">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Probleemid' : 'Issues Found'}
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{report.issuesFound}</div>
                  <p className="text-xs text-muted-foreground">
                    {report.issues.filter(i => i.type === 'error').length} {language === 'et' ? 'viga' : 'errors'}, 
                    {' '}{report.issues.filter(i => i.type === 'warning').length} {language === 'et' ? 'hoiatust' : 'warnings'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-issues-fixed">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Parandatud' : 'Issues Fixed'}
                  </CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{report.issuesFixed}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'Automaatselt parandatud' : 'Auto-fixed by AI'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-last-check">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Viimane kontroll' : 'Last Check'}
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {format(new Date(report.timestamp), 'HH:mm', { locale: language === 'et' ? et : enGB })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(report.timestamp), 'dd.MM.yyyy', { locale: language === 'et' ? et : enGB })}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2" data-testid="card-issues-list">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    {language === 'et' ? 'Leitud probleemid' : 'Issues Found'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' 
                      ? `${report.checksPerformed.length} kontrolli tehtud`
                      : `${report.checksPerformed.length} checks performed`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {Object.keys(groupedIssues).length === 0 ? (
                      <div className="text-center py-8 text-green-500">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2" />
                        <p className="font-medium">
                          {language === 'et' ? 'Probleeme ei leitud!' : 'No issues found!'}
                        </p>
                      </div>
                    ) : (
                      <Accordion type="multiple" className="space-y-2">
                        {Object.entries(groupedIssues).map(([category, issues]) => (
                          <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3">
                                {getIssueIcon(category)}
                                <span>{getCategoryLabel(category)}</span>
                                <Badge variant="secondary">{issues.length}</Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-2">
                                {issues.map((issue) => (
                                  <div 
                                    key={issue.id} 
                                    className={cn(
                                      "p-3 rounded-lg border",
                                      issue.autoFixApplied && "bg-green-500/5 border-green-500/20"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Badge variant={getIssueBadgeVariant(issue.type)}>
                                            {issue.type}
                                          </Badge>
                                          {issue.autoFixApplied && (
                                            <Badge variant="outline" className="text-green-500 border-green-500">
                                              <Wrench className="h-3 w-3 mr-1" />
                                              {language === 'et' ? 'Parandatud' : 'Fixed'}
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm">
                                          {language === 'et' ? issue.messageEt : issue.message}
                                        </p>
                                        {issue.fixDetails && (
                                          <p className="text-xs text-green-500 mt-1">
                                            {issue.fixDetails}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card data-testid="card-checks-performed">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      {language === 'et' ? 'Tehtud kontrollid' : 'Checks Performed'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.checksPerformed.map((check, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{check}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-recommendations">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'Soovitused' : 'Recommendations'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {report.recommendations.map((rec, i) => (
                          <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
