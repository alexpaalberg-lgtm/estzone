import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Gift, Plus, Copy, Search, DollarSign, Calendar, Check, X, Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';

interface GiftCard {
  id: string;
  code: string;
  initialValue: string;
  currentBalance: string;
  currency: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface GiftCardStats {
  totalCards: number;
  activeCards: number;
  totalValue: string;
  totalRedeemed: string;
}

export default function AdminGiftCards() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  
  const [newAmount, setNewAmount] = useState('');
  const [newCurrency, setNewCurrency] = useState('EUR');
  const [newExpiryMonths, setNewExpiryMonths] = useState('12');
  
  const [batchCount, setBatchCount] = useState('5');
  const [batchAmount, setBatchAmount] = useState('');
  const [batchCurrency, setBatchCurrency] = useState('EUR');
  const [batchExpiryMonths, setBatchExpiryMonths] = useState('12');
  
  const { data: giftCards, isLoading } = useQuery<GiftCard[]>({
    queryKey: ['/api/admin/gift-cards'],
  });
  
  const { data: stats } = useQuery<GiftCardStats>({
    queryKey: ['/api/admin/gift-cards/stats'],
  });
  
  const createMutation = useMutation({
    mutationFn: (data: { amount: number; currency: string; expiryMonths?: number }) =>
      apiRequest('POST', '/api/admin/gift-cards', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/stats'] });
      setIsCreateOpen(false);
      setNewAmount('');
      toast({
        title: 'Gift card created',
        description: `Code: ${data.code}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create gift card',
        variant: 'destructive',
      });
    },
  });
  
  const batchCreateMutation = useMutation({
    mutationFn: (data: { count: number; amount: number; currency: string; expiryMonths?: number }) =>
      apiRequest('POST', '/api/admin/gift-cards/batch', data),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards/stats'] });
      setIsBatchOpen(false);
      setBatchCount('5');
      setBatchAmount('');
      toast({
        title: 'Gift cards created',
        description: `Created ${data.cards?.length || data.count} gift cards`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create gift cards',
        variant: 'destructive',
      });
    },
  });
  
  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('POST', `/api/admin/gift-cards/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gift-cards'] });
      toast({
        title: 'Gift card deactivated',
      });
    },
  });
  
  const handleCreate = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate({
      amount,
      currency: newCurrency,
      expiryMonths: parseInt(newExpiryMonths),
    });
  };
  
  const handleBatchCreate = () => {
    const count = parseInt(batchCount);
    const amount = parseFloat(batchAmount);
    if (isNaN(count) || count <= 0 || count > 100) {
      toast({
        title: 'Error',
        description: 'Please enter a valid count (1-100)',
        variant: 'destructive',
      });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    batchCreateMutation.mutate({
      count,
      amount,
      currency: batchCurrency,
      expiryMonths: parseInt(batchExpiryMonths),
    });
  };
  
  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied',
      description: 'Gift card code copied to clipboard',
    });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatCurrency = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'EUR',
    }).format(parseFloat(amount));
  };
  
  const filteredCards = giftCards?.filter(card =>
    card.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];
  
  return (
    <AdminLayout title="Gift Cards">
      <div className="space-y-6" data-testid="page-admin-gift-cards">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gift Cards</h1>
            <p className="text-muted-foreground">Manage store gift cards</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-batch-create">
                  <Plus className="h-4 w-4 mr-2" />
                  Batch Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Multiple Gift Cards</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Number of Cards</Label>
                    <Input
                      type="number"
                      value={batchCount}
                      onChange={(e) => setBatchCount(e.target.value)}
                      min="1"
                      max="100"
                      data-testid="input-batch-count"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount per Card</Label>
                    <Input
                      type="number"
                      value={batchAmount}
                      onChange={(e) => setBatchAmount(e.target.value)}
                      placeholder="25.00"
                      min="0.01"
                      step="0.01"
                      data-testid="input-batch-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={batchCurrency} onValueChange={setBatchCurrency}>
                      <SelectTrigger data-testid="select-batch-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry (months)</Label>
                    <Select value={batchExpiryMonths} onValueChange={setBatchExpiryMonths}>
                      <SelectTrigger data-testid="select-batch-expiry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleBatchCreate}
                    disabled={batchCreateMutation.isPending}
                    data-testid="button-confirm-batch"
                  >
                    {batchCreateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create {batchCount} Cards
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-gift-card">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Gift Card
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Gift Card</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="50.00"
                      min="0.01"
                      step="0.01"
                      data-testid="input-gift-card-amount"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={newCurrency} onValueChange={setNewCurrency}>
                      <SelectTrigger data-testid="select-gift-card-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry (months)</Label>
                    <Select value={newExpiryMonths} onValueChange={setNewExpiryMonths}>
                      <SelectTrigger data-testid="select-gift-card-expiry">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 months</SelectItem>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleCreate}
                    disabled={createMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Gift Card
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cards</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeCards || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalValue || '0', 'EUR')}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Redeemed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRedeemed || '0', 'EUR')}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-gift-cards"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredCards.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Initial Value</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id} data-testid={`row-gift-card-${card.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            {card.code}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => copyCode(card.code)}
                            data-testid={`button-copy-${card.id}`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(card.initialValue, card.currency)}</TableCell>
                      <TableCell>
                        <span className={parseFloat(card.currentBalance) < parseFloat(card.initialValue) ? 'text-amber-500' : ''}>
                          {formatCurrency(card.currentBalance, card.currency)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {card.isActive ? (
                          <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {card.expiresAt ? formatDate(card.expiresAt) : 'Never'}
                      </TableCell>
                      <TableCell>{formatDate(card.createdAt)}</TableCell>
                      <TableCell>
                        {card.isActive && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deactivateMutation.mutate(card.id)}
                            disabled={deactivateMutation.isPending}
                            data-testid={`button-deactivate-${card.id}`}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No gift cards found</p>
                <p className="text-sm mt-1">Create your first gift card to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
