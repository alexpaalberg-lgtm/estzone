import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trophy, Users, TrendingUp, Award, Search, Filter, Gift, Plus, Minus, History, Crown, Sparkles, Medal, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';

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
  isActive: boolean;
}

interface UserLoyaltyDetails {
  id: string;
  userId: string;
  currentPoints: number;
  lifetimePoints: number;
  totalSpend: string;
  currentTierId: string | null;
  tierUpdatedAt: string | null;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  tier: VipTier | null;
}

interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId: string | null;
  points: number;
  type: string;
  description: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface LoyaltyStats {
  totalUsers: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  averagePointsPerUser: number;
  tierDistribution: {
    tierId: string;
    tierName: string;
    count: number;
    color: string;
  }[];
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  currentPoints: number;
  lifetimePoints: number;
  totalSpend: string;
  tierName: string;
  tierColor: string;
}

function getTierIcon(tierName: string) {
  switch (tierName?.toLowerCase()) {
    case 'gold':
    case 'platinum':
      return <Crown className="h-4 w-4" />;
    case 'silver':
      return <Medal className="h-4 w-4" />;
    default:
      return <Award className="h-4 w-4" />;
  }
}

export default function AdminLoyalty() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserLoyaltyDetails | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [leaderboardSort, setLeaderboardSort] = useState<'points' | 'spend' | 'tier'>('points');
  
  const t = {
    title: language === 'et' ? 'Lojaalsuse haldus' : 'Loyalty Management',
    description: language === 'et' ? 'Halda lojaalsuspunkte, VIP tasemeid ja kasutajate preemiaid' : 'Manage loyalty points, VIP tiers, and user rewards',
    totalMembers: language === 'et' ? 'Liikmeid kokku' : 'Total Members',
    activeMembers: language === 'et' ? 'Aktiivsed lojaalsusliikmed' : 'Active loyalty members',
    pointsIssued: language === 'et' ? 'Punkte väljastatud' : 'Points Issued',
    lifetimeEarned: language === 'et' ? 'Eluajal teenitud punktid' : 'Lifetime points earned',
    pointsRedeemed: language === 'et' ? 'Punkte kasutatud' : 'Points Redeemed',
    valuePrefix: language === 'et' ? '= €' : '= €',
    valueSuffix: language === 'et' ? ' väärtus' : ' value',
    avgPointsUser: language === 'et' ? 'Keskmised punktid/kasutaja' : 'Avg Points/User',
    currentBalanceAvg: language === 'et' ? 'Keskmine jääk' : 'Current balance average',
    vipTierDistribution: language === 'et' ? 'VIP tasemete jaotus' : 'VIP Tier Distribution',
    members: language === 'et' ? 'Liikmed' : 'Members',
    leaderboard: language === 'et' ? 'Edetabel' : 'Leaderboard',
    transactionHistory: language === 'et' ? 'Tehingute ajalugu' : 'Transaction History',
    vipTiers: language === 'et' ? 'VIP tasemed' : 'VIP Tiers',
    loyaltyMembers: language === 'et' ? 'Lojaalsusliikmed' : 'Loyalty Members',
    searchPlaceholder: language === 'et' ? 'Otsi nime või e-posti järgi...' : 'Search by name or email...',
    filterByTier: language === 'et' ? 'Filtreeri taseme järgi' : 'Filter by tier',
    allTiers: language === 'et' ? 'Kõik tasemed' : 'All Tiers',
    customer: language === 'et' ? 'Klient' : 'Customer',
    vipTier: language === 'et' ? 'VIP tase' : 'VIP Tier',
    currentPoints: language === 'et' ? 'Hetkel punkte' : 'Current Points',
    lifetimePoints: language === 'et' ? 'Eluaja punkte' : 'Lifetime Points',
    totalSpend: language === 'et' ? 'Kokku kulutatud' : 'Total Spend',
    actions: language === 'et' ? 'Tegevused' : 'Actions',
    noMembersFound: language === 'et' ? 'Lojaalsusliikmed puuduvad' : 'No loyalty members found',
    noTier: language === 'et' ? 'Puudub' : 'No Tier',
    adjustPoints: language === 'et' ? 'Muuda punkte' : 'Adjust Points',
    customerLeaderboard: language === 'et' ? 'Klientide edetabel' : 'Customer Leaderboard',
    topCustomersDesc: language === 'et' ? 'Parimad kliendid lojaalsuse näitajate järgi' : 'Top customers ranked by loyalty metrics',
    sortByPoints: language === 'et' ? 'Sorteeri punktide järgi' : 'Sort by Points',
    sortBySpend: language === 'et' ? 'Sorteeri kulutuste järgi' : 'Sort by Spend',
    sortByTier: language === 'et' ? 'Sorteeri taseme järgi' : 'Sort by Tier',
    rank: language === 'et' ? 'Koht' : 'Rank',
    noCustomersFound: language === 'et' ? 'Kliente ei leitud' : 'No customers found',
    recentTransactions: language === 'et' ? 'Viimased tehingud' : 'Recent Transactions',
    transactionsDesc: language === 'et' ? 'Teenitud, kasutatud ja muudetud punktid' : 'Points earned, redeemed, and adjusted',
    date: language === 'et' ? 'Kuupäev' : 'Date',
    type: language === 'et' ? 'Tüüp' : 'Type',
    transactionDescription: language === 'et' ? 'Kirjeldus' : 'Description',
    points: language === 'et' ? 'Punktid' : 'Points',
    balanceAfter: language === 'et' ? 'Jääk pärast' : 'Balance After',
    noTransactions: language === 'et' ? 'Tehingud puuduvad' : 'No transactions yet',
    tiersConfiguration: language === 'et' ? 'VIP tasemete seadistus' : 'VIP Tiers Configuration',
    tiersDesc: language === 'et' ? 'Praegused tasemeläved ja eelised' : 'Current tier thresholds and benefits',
    tier: language === 'et' ? 'Tase' : 'Tier',
    minSpendRequired: language === 'et' ? 'Miinimum kulutus' : 'Min. Spend Required',
    discount: language === 'et' ? 'Allahindlus' : 'Discount',
    pointsMultiplier: language === 'et' ? 'Punktide kordaja' : 'Points Multiplier',
    status: language === 'et' ? 'Staatus' : 'Status',
    active: language === 'et' ? 'Aktiivne' : 'Active',
    inactive: language === 'et' ? 'Mitteaktiivne' : 'Inactive',
    off: language === 'et' ? '% soodustus' : '% off',
    adjustLoyaltyPoints: language === 'et' ? 'Muuda lojaalsuspunkte' : 'Adjust Loyalty Points',
    currentBalance: language === 'et' ? 'Hetkel jääk:' : 'Current balance:',
    operation: language === 'et' ? 'Tegevus' : 'Operation',
    addPoints: language === 'et' ? 'Lisa punkte' : 'Add Points',
    subtractPoints: language === 'et' ? 'Lahuta punkte' : 'Subtract Points',
    numberOfPoints: language === 'et' ? 'Punktide arv' : 'Number of Points',
    enterPoints: language === 'et' ? 'Sisesta punktid...' : 'Enter points...',
    reason: language === 'et' ? 'Põhjus' : 'Reason',
    enterReason: language === 'et' ? 'Sisesta muutmise põhjus...' : 'Enter reason for adjustment...',
    cancel: language === 'et' ? 'Tühista' : 'Cancel',
    saving: language === 'et' ? 'Salvestamine...' : 'Saving...',
    confirmAdjustment: language === 'et' ? 'Kinnita muudatus' : 'Confirm Adjustment',
    pointsAdjusted: language === 'et' ? 'Punktid muudetud' : 'Points adjusted',
    pointsUpdated: language === 'et' ? 'Kasutaja lojaalsuspunktid on uuendatud' : 'User loyalty points have been updated',
    error: language === 'et' ? 'Viga' : 'Error',
    fillAllFields: language === 'et' ? 'Palun täida kõik väljad' : 'Please fill in all fields',
    enterValidPoints: language === 'et' ? 'Palun sisesta kehtiv punktide arv' : 'Please enter a valid number of points',
    failedToAdjust: language === 'et' ? 'Punktide muutmine ebaõnnestus' : 'Failed to adjust points',
  };
  
  const { data: stats, isLoading: statsLoading } = useQuery<LoyaltyStats>({
    queryKey: ['/api/admin/loyalty/stats-full'],
  });
  
  const { data: tiers } = useQuery<VipTier[]>({
    queryKey: ['/api/admin/loyalty/tiers'],
  });
  
  const { data: users, isLoading: usersLoading } = useQuery<UserLoyaltyDetails[]>({
    queryKey: ['/api/admin/loyalty/users', selectedTier],
    queryFn: async () => {
      const url = selectedTier && selectedTier !== 'all'
        ? `/api/admin/loyalty/users?tier=${selectedTier}`
        : '/api/admin/loyalty/users';
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
  
  const { data: transactions } = useQuery<LoyaltyTransaction[]>({
    queryKey: ['/api/admin/loyalty/transactions'],
  });
  
  const { data: leaderboardData, isLoading: leaderboardLoading } = useQuery<{ leaderboard: LeaderboardEntry[], totalUsers: number, sortBy: string }>({
    queryKey: ['/api/admin/loyalty/leaderboard', leaderboardSort],
    queryFn: async () => {
      const response = await fetch(`/api/admin/loyalty/leaderboard?sortBy=${leaderboardSort}&limit=50`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
  });
  
  const leaderboard = leaderboardData?.leaderboard;
  
  const adjustPointsMutation = useMutation({
    mutationFn: (data: { userId: string; points: number; type: string; description: string }) =>
      apiRequest('POST', '/api/admin/loyalty/adjust-points', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/stats-full'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/loyalty/transactions'] });
      setIsAdjustOpen(false);
      setSelectedUser(null);
      setAdjustPoints('');
      setAdjustReason('');
      toast({
        title: t.pointsAdjusted,
        description: t.pointsUpdated,
      });
    },
    onError: (error: any) => {
      toast({
        title: t.error,
        description: error?.message || t.failedToAdjust,
        variant: 'destructive',
      });
    },
  });
  
  const handleAdjustPoints = () => {
    if (!selectedUser || !adjustPoints || !adjustReason) {
      toast({
        title: t.error,
        description: t.fillAllFields,
        variant: 'destructive',
      });
      return;
    }
    
    const points = parseInt(adjustPoints);
    if (isNaN(points) || points <= 0) {
      toast({
        title: t.error,
        description: t.enterValidPoints,
        variant: 'destructive',
      });
      return;
    }
    
    const finalPoints = adjustType === 'subtract' ? -points : points;
    
    adjustPointsMutation.mutate({
      userId: selectedUser.userId,
      points: finalPoints,
      type: adjustType === 'add' ? 'bonus' : 'adjustment',
      description: adjustReason,
    });
  };
  
  const filteredUsers = users?.filter(user => {
    const matchesSearch = searchQuery === '' || 
      user.user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTier = selectedTier === 'all' || user.currentTierId === selectedTier;
    
    return matchesSearch && matchesTier;
  });
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <AdminLayout title={t.title}>
      <div className="space-y-6" data-testid="admin-loyalty-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              {t.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t.description}
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalMembers}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-members">
                {stats?.totalUsers?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">{t.activeMembers}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.pointsIssued}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="stat-points-issued">
                {stats?.totalPointsIssued?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">{t.lifetimeEarned}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.pointsRedeemed}</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="stat-points-redeemed">
                {stats?.totalPointsRedeemed?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">{t.valuePrefix}{((stats?.totalPointsRedeemed || 0) / 100).toFixed(2)}{t.valueSuffix}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.avgPointsUser}</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-points">
                {Math.round(stats?.averagePointsPerUser || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{t.currentBalanceAvg}</p>
            </CardContent>
          </Card>
        </div>
        
        {stats?.tierDistribution && stats.tierDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                {t.vipTierDistribution}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {stats.tierDistribution.map((tier) => (
                  <div 
                    key={tier.tierId}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                    style={{ borderColor: tier.color }}
                  >
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: tier.color + '20', color: tier.color }}
                    >
                      {getTierIcon(tier.tierName)}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: tier.color }}>{tier.tierName}</p>
                      <p className="text-2xl font-bold">{tier.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t.members}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.leaderboard}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t.transactionHistory}
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              {t.vipTiers}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <CardTitle>{t.loyaltyMembers}</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[250px]"
                        data-testid="input-search-users"
                      />
                    </div>
                    <Select value={selectedTier} onValueChange={setSelectedTier}>
                      <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder={t.filterByTier} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.allTiers}</SelectItem>
                        {tiers?.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {language === 'et' ? tier.nameEt : tier.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t.customer}</TableHead>
                        <TableHead>{t.vipTier}</TableHead>
                        <TableHead className="text-right">{t.currentPoints}</TableHead>
                        <TableHead className="text-right">{t.lifetimePoints}</TableHead>
                        <TableHead className="text-right">{t.totalSpend}</TableHead>
                        <TableHead className="text-right">{t.actions}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t.noMembersFound}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers?.map((user) => (
                          <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {user.user.firstName} {user.user.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{user.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {user.tier ? (
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    borderColor: user.tier.color,
                                    color: user.tier.color,
                                    backgroundColor: user.tier.color + '10'
                                  }}
                                  className="gap-1"
                                >
                                  {getTierIcon(user.tier.name)}
                                  {language === 'et' ? user.tier.nameEt : user.tier.nameEn}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">{t.noTier}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {user.currentPoints.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {user.lifetimePoints.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              €{parseFloat(user.totalSpend).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsAdjustOpen(true);
                                }}
                                data-testid={`button-adjust-${user.id}`}
                              >
                                {t.adjustPoints}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      {t.customerLeaderboard}
                    </CardTitle>
                    <CardDescription>{t.topCustomersDesc}</CardDescription>
                  </div>
                  <Select value={leaderboardSort} onValueChange={(v) => setLeaderboardSort(v as 'points' | 'spend' | 'tier')}>
                    <SelectTrigger className="w-[180px]" data-testid="select-leaderboard-sort">
                      <SelectValue placeholder={t.sortByPoints} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">{t.sortByPoints}</SelectItem>
                      <SelectItem value="spend">{t.sortBySpend}</SelectItem>
                      <SelectItem value="tier">{t.sortByTier}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">{t.rank}</TableHead>
                        <TableHead>{t.customer}</TableHead>
                        <TableHead>{t.vipTier}</TableHead>
                        <TableHead className="text-right">{t.currentPoints}</TableHead>
                        <TableHead className="text-right">{t.lifetimePoints}</TableHead>
                        <TableHead className="text-right">{t.totalSpend}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!leaderboard || leaderboard.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t.noCustomersFound}
                          </TableCell>
                        </TableRow>
                      ) : (
                        leaderboard.map((entry) => (
                          <TableRow key={entry.userId} data-testid={`row-leaderboard-${entry.rank}`}>
                            <TableCell>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                entry.rank === 1 ? 'bg-yellow-500/20 text-yellow-500' :
                                entry.rank === 2 ? 'bg-slate-400/20 text-slate-400' :
                                entry.rank === 3 ? 'bg-amber-700/20 text-amber-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {entry.rank <= 3 ? (
                                  <Trophy className={`h-4 w-4 ${
                                    entry.rank === 1 ? 'text-yellow-500' :
                                    entry.rank === 2 ? 'text-slate-400' :
                                    'text-amber-700'
                                  }`} />
                                ) : (
                                  entry.rank
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">
                                  {entry.firstName} {entry.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">{entry.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline"
                                style={{ 
                                  borderColor: entry.tierColor,
                                  color: entry.tierColor,
                                  backgroundColor: entry.tierColor + '10'
                                }}
                                className="gap-1"
                              >
                                {getTierIcon(entry.tierName)}
                                {entry.tierName}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {entry.currentPoints.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-muted-foreground">
                              {entry.lifetimePoints.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              €{parseFloat(entry.totalSpend).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.recentTransactions}</CardTitle>
                <CardDescription>{t.transactionsDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.date}</TableHead>
                      <TableHead>{t.customer}</TableHead>
                      <TableHead>{t.type}</TableHead>
                      <TableHead>{t.transactionDescription}</TableHead>
                      <TableHead className="text-right">{t.points}</TableHead>
                      <TableHead className="text-right">{t.balanceAfter}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {t.noTransactions}
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.slice(0, 50).map((tx) => (
                        <TableRow key={tx.id} data-testid={`row-tx-${tx.id}`}>
                          <TableCell className="text-sm">
                            {formatDate(tx.createdAt)}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">
                              {tx.user?.firstName} {tx.user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{tx.user?.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              tx.type === 'earned' ? 'default' :
                              tx.type === 'redeemed' ? 'secondary' :
                              tx.type === 'bonus' ? 'default' :
                              'outline'
                            }>
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {tx.description || '-'}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-medium ${
                            tx.points > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {tx.balanceAfter.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tiers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.tiersConfiguration}</CardTitle>
                <CardDescription>{t.tiersDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.tier}</TableHead>
                      <TableHead>{t.minSpendRequired}</TableHead>
                      <TableHead className="text-center">{t.discount}</TableHead>
                      <TableHead className="text-center">{t.pointsMultiplier}</TableHead>
                      <TableHead className="text-center">{t.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiers?.map((tier) => (
                      <TableRow key={tier.id} data-testid={`row-tier-${tier.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: tier.color + '20', color: tier.color }}
                            >
                              {getTierIcon(tier.name)}
                            </div>
                            <div>
                              <p className="font-medium" style={{ color: tier.color }}>{tier.nameEn}</p>
                              <p className="text-xs text-muted-foreground">{tier.nameEt}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          €{parseFloat(tier.minSpend).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{tier.discountPercent}{t.off}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {tier.pointsMultiplier}x
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                            {tier.isActive ? t.active : t.inactive}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                {t.adjustLoyaltyPoints}
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedUser.user.firstName} {selectedUser.user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.user.email}</p>
                  <p className="text-sm mt-2">
                    {t.currentBalance} <span className="font-mono font-bold">{selectedUser.currentPoints.toLocaleString()}</span> {t.points.toLowerCase()}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>{t.operation}</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={adjustType === 'add' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setAdjustType('add')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t.addPoints}
                    </Button>
                    <Button
                      type="button"
                      variant={adjustType === 'subtract' ? 'destructive' : 'outline'}
                      className="flex-1"
                      onClick={() => setAdjustType('subtract')}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      {t.subtractPoints}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="points">{t.numberOfPoints}</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    placeholder={t.enterPoints}
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    data-testid="input-adjust-points"
                  />
                  {adjustPoints && !isNaN(parseInt(adjustPoints)) && (
                    <p className="text-xs text-muted-foreground">
                      {t.valuePrefix}{(parseInt(adjustPoints) / 100).toFixed(2)}{t.valueSuffix}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">{t.reason}</Label>
                  <Textarea
                    id="reason"
                    placeholder={t.enterReason}
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    data-testid="input-adjust-reason"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
                {t.cancel}
              </Button>
              <Button 
                onClick={handleAdjustPoints}
                disabled={adjustPointsMutation.isPending}
                data-testid="button-confirm-adjust"
              >
                {adjustPointsMutation.isPending ? t.saving : t.confirmAdjustment}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
