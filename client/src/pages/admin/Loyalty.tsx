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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserLoyaltyDetails | null>(null);
  const [adjustPoints, setAdjustPoints] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('');
  const [leaderboardSort, setLeaderboardSort] = useState<'points' | 'spend' | 'tier'>('points');
  
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
        title: 'Points adjusted',
        description: 'User loyalty points have been updated',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to adjust points',
        variant: 'destructive',
      });
    },
  });
  
  const handleAdjustPoints = () => {
    if (!selectedUser || !adjustPoints || !adjustReason) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }
    
    const points = parseInt(adjustPoints);
    if (isNaN(points) || points <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid number of points',
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
    <AdminLayout title="Loyalty Management">
      <div className="space-y-6" data-testid="admin-loyalty-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Loyalty Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage loyalty points, VIP tiers, and user rewards
            </p>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-total-members">
                {stats?.totalUsers?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Active loyalty members</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Issued</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500" data-testid="stat-points-issued">
                {stats?.totalPointsIssued?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">Lifetime points earned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Redeemed</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="stat-points-redeemed">
                {stats?.totalPointsRedeemed?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">= €{((stats?.totalPointsRedeemed || 0) / 100).toFixed(2)} value</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Points/User</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-avg-points">
                {Math.round(stats?.averagePointsPerUser || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Current balance average</p>
            </CardContent>
          </Card>
        </div>
        
        {stats?.tierDistribution && stats.tierDistribution.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                VIP Tier Distribution
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
              Members
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transaction History
            </TabsTrigger>
            <TabsTrigger value="tiers" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              VIP Tiers
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                  <CardTitle>Loyalty Members</CardTitle>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[250px]"
                        data-testid="input-search-users"
                      />
                    </div>
                    <Select value={selectedTier} onValueChange={setSelectedTier}>
                      <SelectTrigger className="w-[180px]" data-testid="select-tier-filter">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Tiers</SelectItem>
                        {tiers?.map((tier) => (
                          <SelectItem key={tier.id} value={tier.id}>
                            {tier.nameEn}
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
                        <TableHead>Customer</TableHead>
                        <TableHead>VIP Tier</TableHead>
                        <TableHead className="text-right">Current Points</TableHead>
                        <TableHead className="text-right">Lifetime Points</TableHead>
                        <TableHead className="text-right">Total Spend</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No loyalty members found
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
                                  {user.tier.nameEn}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">No Tier</Badge>
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
                                Adjust Points
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
                      Customer Leaderboard
                    </CardTitle>
                    <CardDescription>Top customers ranked by loyalty metrics</CardDescription>
                  </div>
                  <Select value={leaderboardSort} onValueChange={(v) => setLeaderboardSort(v as 'points' | 'spend' | 'tier')}>
                    <SelectTrigger className="w-[180px]" data-testid="select-leaderboard-sort">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Sort by Points</SelectItem>
                      <SelectItem value="spend">Sort by Spend</SelectItem>
                      <SelectItem value="tier">Sort by Tier</SelectItem>
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
                        <TableHead className="w-[60px]">Rank</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>VIP Tier</TableHead>
                        <TableHead className="text-right">Current Points</TableHead>
                        <TableHead className="text-right">Lifetime Points</TableHead>
                        <TableHead className="text-right">Total Spend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!leaderboard || leaderboard.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No customers found
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
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Points earned, redeemed, and adjusted</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Balance After</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No transactions yet
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
                <CardTitle>VIP Tiers Configuration</CardTitle>
                <CardDescription>Current tier thresholds and benefits</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Min. Spend Required</TableHead>
                      <TableHead className="text-center">Discount</TableHead>
                      <TableHead className="text-center">Points Multiplier</TableHead>
                      <TableHead className="text-center">Status</TableHead>
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
                          <Badge variant="secondary">{tier.discountPercent}% off</Badge>
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          {tier.pointsMultiplier}x
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={tier.isActive ? 'default' : 'secondary'}>
                            {tier.isActive ? 'Active' : 'Inactive'}
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
                Adjust Loyalty Points
              </DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedUser.user.firstName} {selectedUser.user.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.user.email}</p>
                  <p className="text-sm mt-2">
                    Current balance: <span className="font-mono font-bold">{selectedUser.currentPoints.toLocaleString()}</span> points
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Operation</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={adjustType === 'add' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setAdjustType('add')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Points
                    </Button>
                    <Button
                      type="button"
                      variant={adjustType === 'subtract' ? 'destructive' : 'outline'}
                      className="flex-1"
                      onClick={() => setAdjustType('subtract')}
                    >
                      <Minus className="h-4 w-4 mr-2" />
                      Subtract Points
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="points">Number of Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    placeholder="Enter points..."
                    value={adjustPoints}
                    onChange={(e) => setAdjustPoints(e.target.value)}
                    data-testid="input-adjust-points"
                  />
                  {adjustPoints && !isNaN(parseInt(adjustPoints)) && (
                    <p className="text-xs text-muted-foreground">
                      = €{(parseInt(adjustPoints) / 100).toFixed(2)} value
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for adjustment..."
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    data-testid="input-adjust-reason"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAdjustPoints}
                disabled={adjustPointsMutation.isPending}
                data-testid="button-confirm-adjust"
              >
                {adjustPointsMutation.isPending ? 'Saving...' : 'Confirm Adjustment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
