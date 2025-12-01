import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit, Trash2, Ticket, Copy, Eye } from 'lucide-react';
import { Link } from 'wouter';
import type { Coupon } from '@shared/schema';

export default function AdminCoupons() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showUsage, setShowUsage] = useState<string | null>(null);

  const { data: coupons, isLoading } = useQuery<Coupon[]>({
    queryKey: ['/api/admin/coupons'],
  });

  const { data: usageData } = useQuery<any[]>({
    queryKey: ['/api/admin/coupons', showUsage, 'usage'],
    enabled: !!showUsage,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/coupons', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setShowCreate(false);
      toast({ title: language === 'et' ? 'Kupong loodud!' : 'Coupon created!' });
    },
    onError: (error: any) => {
      toast({ title: language === 'et' ? 'Viga' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest('PATCH', `/api/admin/coupons/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      setEditCoupon(null);
      toast({ title: language === 'et' ? 'Kupong uuendatud!' : 'Coupon updated!' });
    },
    onError: (error: any) => {
      toast({ title: language === 'et' ? 'Viga' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({ title: language === 'et' ? 'Kupong kustutatud!' : 'Coupon deleted!' });
    },
    onError: (error: any) => {
      toast({ title: language === 'et' ? 'Viga' : 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: language === 'et' ? 'Kood kopeeritud!' : 'Code copied!' });
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.expiresAt) return false;
    return new Date(coupon.expiresAt) < new Date();
  };

  const isUsedUp = (coupon: Coupon) => {
    if (!coupon.maxUses) return false;
    return (coupon.usedCount || 0) >= coupon.maxUses;
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: language === 'et' ? 'Mitteaktiivne' : 'Inactive', variant: 'secondary' as const };
    if (isExpired(coupon)) return { label: language === 'et' ? 'Aegunud' : 'Expired', variant: 'destructive' as const };
    if (isUsedUp(coupon)) return { label: language === 'et' ? 'Otsas' : 'Used up', variant: 'destructive' as const };
    return { label: language === 'et' ? 'Aktiivne' : 'Active', variant: 'default' as const };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Ticket className="h-6 w-6 text-primary" />
                {language === 'et' ? 'Kupongid' : 'Coupons'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'et' ? 'Halda sooduskoode' : 'Manage discount codes'}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} data-testid="button-create-coupon">
            <Plus className="h-4 w-4 mr-2" />
            {language === 'et' ? 'Lisa kupong' : 'Add Coupon'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === 'et' ? 'Kõik kupongid' : 'All Coupons'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'et' ? 'Laadin...' : 'Loading...'}
              </div>
            ) : !coupons?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                {language === 'et' ? 'Kuponge pole veel lisatud' : 'No coupons yet'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'et' ? 'Kood' : 'Code'}</TableHead>
                    <TableHead>{language === 'et' ? 'Allahindlus' : 'Discount'}</TableHead>
                    <TableHead>{language === 'et' ? 'Min. summa' : 'Min. Amount'}</TableHead>
                    <TableHead>{language === 'et' ? 'Kasutamine' : 'Usage'}</TableHead>
                    <TableHead>{language === 'et' ? 'Aegub' : 'Expires'}</TableHead>
                    <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                    <TableHead className="text-right">{language === 'et' ? 'Tegevused' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <TableRow key={coupon.id} data-testid={`row-coupon-${coupon.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCode(coupon.code)}
                              data-testid={`button-copy-${coupon.id}`}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-primary font-semibold">-{coupon.discountPercent}%</span>
                        </TableCell>
                        <TableCell>
                          {coupon.minOrderAmount ? `€${coupon.minOrderAmount}` : '-'}
                        </TableCell>
                        <TableCell>
                          {coupon.usedCount || 0}
                          {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                        </TableCell>
                        <TableCell>
                          {coupon.expiresAt 
                            ? new Date(coupon.expiresAt).toLocaleDateString(language === 'et' ? 'et-EE' : 'en-GB')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShowUsage(coupon.id)}
                              data-testid={`button-usage-${coupon.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditCoupon(coupon)}
                              data-testid={`button-edit-${coupon.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm(language === 'et' ? 'Kas oled kindel?' : 'Are you sure?')) {
                                  deleteMutation.mutate(coupon.id);
                                }
                              }}
                              data-testid={`button-delete-${coupon.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <CouponForm
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
          language={language}
        />

        <CouponForm
          open={!!editCoupon}
          onClose={() => setEditCoupon(null)}
          onSubmit={(data) => editCoupon && updateMutation.mutate({ id: editCoupon.id, data })}
          isPending={updateMutation.isPending}
          language={language}
          coupon={editCoupon}
        />

        <Dialog open={!!showUsage} onOpenChange={() => setShowUsage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{language === 'et' ? 'Kasutamise ajalugu' : 'Usage History'}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[400px] overflow-auto">
              {!usageData?.length ? (
                <p className="text-muted-foreground text-center py-4">
                  {language === 'et' ? 'Kasutusi pole' : 'No usage yet'}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>{language === 'et' ? 'Summa' : 'Amount'}</TableHead>
                      <TableHead>{language === 'et' ? 'Kuupäev' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usageData.map((usage: any) => (
                      <TableRow key={usage.id}>
                        <TableCell>{usage.customerEmail}</TableCell>
                        <TableCell>€{usage.discountAmount}</TableCell>
                        <TableCell>
                          {new Date(usage.usedAt).toLocaleDateString(language === 'et' ? 'et-EE' : 'en-GB')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function CouponForm({
  open,
  onClose,
  onSubmit,
  isPending,
  language,
  coupon,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  language: string;
  coupon?: Coupon | null;
}) {
  const [code, setCode] = useState(coupon?.code || '');
  const [discountPercent, setDiscountPercent] = useState(coupon?.discountPercent?.toString() || '10');
  const [minOrderAmount, setMinOrderAmount] = useState(coupon?.minOrderAmount?.toString() || '');
  const [maxUses, setMaxUses] = useState(coupon?.maxUses?.toString() || '');
  const [descriptionEn, setDescriptionEn] = useState(coupon?.descriptionEn || '');
  const [descriptionEt, setDescriptionEt] = useState(coupon?.descriptionEt || '');
  const [startsAt, setStartsAt] = useState(coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '');
  const [expiresAt, setExpiresAt] = useState(coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 16) : '');
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  const handleSubmit = () => {
    const data: any = {
      code: code.toUpperCase(),
      discountPercent: parseInt(discountPercent),
      isActive,
    };
    if (minOrderAmount) data.minOrderAmount = minOrderAmount;
    if (maxUses) data.maxUses = parseInt(maxUses);
    if (descriptionEn) data.descriptionEn = descriptionEn;
    if (descriptionEt) data.descriptionEt = descriptionEt;
    if (startsAt) data.startsAt = new Date(startsAt).toISOString();
    if (expiresAt) data.expiresAt = new Date(expiresAt).toISOString();
    onSubmit(data);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {coupon 
              ? (language === 'et' ? 'Muuda kupongi' : 'Edit Coupon')
              : (language === 'et' ? 'Lisa kupong' : 'Add Coupon')}
          </DialogTitle>
          <DialogDescription>
            {language === 'et' 
              ? 'Loo sooduskood klientidele'
              : 'Create a discount code for customers'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>{language === 'et' ? 'Kood' : 'Code'}</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SUMMER20"
                className="font-mono"
                data-testid="input-coupon-code"
              />
              <Button type="button" variant="outline" onClick={generateCode} data-testid="button-generate-code">
                {language === 'et' ? 'Genereeri' : 'Generate'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'et' ? 'Allahindlus %' : 'Discount %'}</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                data-testid="input-discount-percent"
              />
            </div>
            <div>
              <Label>{language === 'et' ? 'Min. summa (€)' : 'Min. Amount (€)'}</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0.00"
                data-testid="input-min-amount"
              />
            </div>
          </div>

          <div>
            <Label>{language === 'et' ? 'Max kasutusi' : 'Max Uses'}</Label>
            <Input
              type="number"
              min="1"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder={language === 'et' ? 'Piiramatu' : 'Unlimited'}
              data-testid="input-max-uses"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'et' ? 'Kirjeldus (EN)' : 'Description (EN)'}</Label>
              <Textarea
                value={descriptionEn}
                onChange={(e) => setDescriptionEn(e.target.value)}
                rows={2}
                placeholder="Summer sale discount"
                data-testid="input-description-en"
              />
            </div>
            <div>
              <Label>{language === 'et' ? 'Kirjeldus (ET)' : 'Description (ET)'}</Label>
              <Textarea
                value={descriptionEt}
                onChange={(e) => setDescriptionEt(e.target.value)}
                rows={2}
                placeholder="Suvemüügi allahindlus"
                data-testid="input-description-et"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{language === 'et' ? 'Algab' : 'Starts At'}</Label>
              <Input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                data-testid="input-starts-at"
              />
            </div>
            <div>
              <Label>{language === 'et' ? 'Aegub' : 'Expires At'}</Label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                data-testid="input-expires-at"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label>{language === 'et' ? 'Aktiivne' : 'Active'}</Label>
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              data-testid="switch-active"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {language === 'et' ? 'Tühista' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !code || !discountPercent} data-testid="button-save-coupon">
            {isPending 
              ? (language === 'et' ? 'Salvestab...' : 'Saving...')
              : (language === 'et' ? 'Salvesta' : 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
