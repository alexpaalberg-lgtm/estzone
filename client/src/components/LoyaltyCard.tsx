import { useQuery } from '@tanstack/react-query';
import { Award, Star, TrendingUp, Gift, Clock, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { format, formatDistanceToNow } from 'date-fns';
import { et, enUS } from 'date-fns/locale';

interface VipTier {
  id: string;
  name: string;
  nameEn: string;
  nameEt: string;
  minSpend: string;
  discountPercent: number;
  pointsMultiplier: string;
  color: string;
  sortOrder: number;
}

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface LoyaltyStatus {
  currentPoints: number;
  lifetimePoints: number;
  totalSpend: string;
  currentTier: VipTier | null;
  allTiers: VipTier[];
  progressToNextTier: {
    nextTierName: string;
    amountNeeded: number;
    progress: number;
  } | null;
  expiringPoints?: {
    total: number;
    nearestExpiry: string | null;
    details: { points: number; expiresAt: string }[];
  };
}

export default function LoyaltyCard() {
  const { language } = useLanguage();

  const { data: loyaltyStatus, isLoading } = useQuery<LoyaltyStatus>({
    queryKey: ['/api/loyalty/status'],
  });

  const { data: transactions } = useQuery<LoyaltyTransaction[]>({
    queryKey: ['/api/loyalty/transactions'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!loyaltyStatus) {
    return null;
  }

  const getTierColor = (tier: VipTier | null) => {
    if (!tier) return 'bg-gray-500';
    switch (tier.name.toLowerCase()) {
      case 'gold': return 'bg-amber-500';
      case 'silver': return 'bg-slate-400';
      case 'bronze': return 'bg-amber-700';
      default: return 'bg-gray-500';
    }
  };

  const getTierGradient = (tier: VipTier | null) => {
    if (!tier) return 'from-gray-600 to-gray-800';
    switch (tier.name.toLowerCase()) {
      case 'gold': return 'from-amber-400 via-yellow-500 to-amber-600';
      case 'silver': return 'from-slate-300 via-gray-400 to-slate-500';
      case 'bronze': return 'from-amber-600 via-orange-700 to-amber-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const tierName = loyaltyStatus.currentTier 
    ? (language === 'et' ? loyaltyStatus.currentTier.nameEt : loyaltyStatus.currentTier.nameEn)
    : (language === 'et' ? 'Pronksliige' : 'Bronze Member');

  const pointsValue = loyaltyStatus.currentPoints / 100;

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${getTierGradient(loyaltyStatus.currentTier)} p-4`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{tierName}</h3>
              <p className="text-white/80 text-sm">
                {language === 'et' ? 'EstZone VIP Programm' : 'EstZone VIP Program'}
              </p>
            </div>
          </div>
          {loyaltyStatus.currentTier && (
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {loyaltyStatus.currentTier.discountPercent > 0 && (
                <span>{loyaltyStatus.currentTier.discountPercent}% {language === 'et' ? 'soodustus' : 'discount'}</span>
              )}
              {parseFloat(loyaltyStatus.currentTier.pointsMultiplier) > 1 && (
                <span className="ml-1">
                  • {loyaltyStatus.currentTier.pointsMultiplier}x {language === 'et' ? 'punktid' : 'points'}
                </span>
              )}
            </Badge>
          )}
        </div>
      </div>
      
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Star className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{loyaltyStatus.currentPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'et' ? 'Punktid' : 'Points'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">€{pointsValue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {language === 'et' ? 'Väärtus' : 'Value'}
            </p>
          </div>
        </div>

        {loyaltyStatus.expiringPoints && loyaltyStatus.expiringPoints.total > 0 && (
          <Alert className="bg-amber-500/10 border-amber-500/30">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-sm">
              <span className="font-semibold text-amber-600">
                {loyaltyStatus.expiringPoints.total.toLocaleString()} {language === 'et' ? 'punkti' : 'points'}
              </span>
              {' '}
              {language === 'et' ? 'aegub' : 'expiring'}
              {loyaltyStatus.expiringPoints.nearestExpiry && (
                <span className="text-muted-foreground ml-1">
                  {formatDistanceToNow(new Date(loyaltyStatus.expiringPoints.nearestExpiry), { 
                    addSuffix: true, 
                    locale: language === 'et' ? et : enUS 
                  })}
                </span>
              )}
              <span className="block text-xs text-muted-foreground mt-1">
                {language === 'et' 
                  ? 'Kasuta enne kui need aeguvad!' 
                  : 'Use them before they expire!'}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {loyaltyStatus.progressToNextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                {language === 'et' ? 'Järgmine tase:' : 'Next tier:'} {loyaltyStatus.progressToNextTier.nextTierName}
              </span>
              <span className="text-muted-foreground">
                €{loyaltyStatus.progressToNextTier.amountNeeded.toFixed(2)} {language === 'et' ? 'jäänud' : 'to go'}
              </span>
            </div>
            <Progress value={Math.min(loyaltyStatus.progressToNextTier.progress, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              {language === 'et' 
                ? `Kulutatud: €${parseFloat(loyaltyStatus.totalSpend).toFixed(2)}`
                : `Total spend: €${parseFloat(loyaltyStatus.totalSpend).toFixed(2)}`
              }
            </p>
          </div>
        )}

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="tiers" className="border-none">
            <AccordionTrigger className="text-sm py-2 hover:no-underline" data-testid="accordion-tiers">
              <span className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                {language === 'et' ? 'VIP Tasemed' : 'VIP Tiers'}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {loyaltyStatus.allTiers.map((tier) => {
                  const isCurrentTier = loyaltyStatus.currentTier?.id === tier.id;
                  return (
                    <div 
                      key={tier.id}
                      className={`flex items-center justify-between p-2 rounded-lg ${isCurrentTier ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className={`text-sm ${isCurrentTier ? 'font-medium' : ''}`}>
                          {language === 'et' ? tier.nameEt : tier.nameEn}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        €{parseFloat(tier.minSpend).toFixed(0)}+ 
                        {tier.discountPercent > 0 && ` • ${tier.discountPercent}%`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>

          {transactions && transactions.length > 0 && (
            <AccordionItem value="history" className="border-none">
              <AccordionTrigger className="text-sm py-2 hover:no-underline" data-testid="accordion-history">
                <span className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  {language === 'et' ? 'Punktide ajalugu' : 'Points History'}
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transactions.slice(0, 10).map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                    >
                      <div className="flex-1">
                        <p className="font-medium truncate">{tx.description}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(tx.createdAt), 'dd.MM.yyyy HH:mm')}
                        </p>
                      </div>
                      <Badge 
                        variant={tx.points > 0 ? 'default' : 'secondary'}
                        className={tx.points > 0 ? 'bg-green-500/10 text-green-600 border-green-500/30' : ''}
                      >
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        <div className="text-center pt-2 border-t space-y-1">
          <p className="text-xs text-muted-foreground">
            {language === 'et' 
              ? '100 punkti = €1 • Teeni 10 punkti iga €1 eest'
              : '100 points = €1 • Earn 10 points per €1 spent'
            }
          </p>
          <p className="text-xs text-muted-foreground/70">
            {language === 'et' 
              ? 'Punktid aeguvad 6 kuu pärast'
              : 'Points expire after 6 months'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
