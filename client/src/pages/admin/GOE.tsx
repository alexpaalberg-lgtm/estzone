import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  Upload, 
  RefreshCw, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
  Truck
} from 'lucide-react';
import { format } from 'date-fns';
import type { Product, Category, GoeImport, GoeCategoryMapping } from '@shared/schema';

interface GOEStats {
  totalGoeProducts: number;
  lowOwnStock: number;
  totalGoeValue: number;
  lastImport: GoeImport | null;
}

interface LowStockProduct {
  id: string;
  nameEn: string;
  sku: string;
  ownStock: number;
  goeStock: number;
  goePrice: string;
  price: string;
  goePartNo: string;
}

export default function AdminGOE() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importType, setImportType] = useState<'full' | 'stock_update'>('full');
  const [markupMultiplier, setMarkupMultiplier] = useState('2.0');

  const { data: stats, isLoading: statsLoading } = useQuery<GOEStats>({
    queryKey: ['/api/admin/goe/stats'],
  });

  const { data: imports, isLoading: importsLoading } = useQuery<GoeImport[]>({
    queryKey: ['/api/admin/goe/imports'],
  });

  const { data: mappings } = useQuery<GoeCategoryMapping[]>({
    queryKey: ['/api/admin/goe/mappings'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery<LowStockProduct[]>({
    queryKey: ['/api/admin/goe/low-stock'],
  });

  const { data: orderList, isLoading: orderListLoading } = useQuery<LowStockProduct[]>({
    queryKey: ['/api/admin/goe/order-list'],
  });

  const updateMappingMutation = useMutation({
    mutationFn: async ({ goeFormat, categoryId, markup }: { goeFormat: string; categoryId?: string; markup?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/goe/mappings/${goeFormat}`, { categoryId, defaultMarkup: markup });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/goe/mappings'] });
      toast({ title: 'Mapping updated', description: 'Category mapping has been saved.' });
    },
  });

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Please upload an Excel (.xlsx, .xls) or CSV file.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('importType', importType);
    formData.append('markupMultiplier', markupMultiplier);

    try {
      setUploadProgress(30);
      const response = await fetch('/api/admin/goe/import', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      setUploadProgress(70);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      setUploadProgress(100);
      toast({
        title: language === 'et' ? 'Import edukas!' : 'Import successful!',
        description: language === 'et' 
          ? `${result.newProducts} uut toodet, ${result.updatedProducts} uuendatud`
          : `${result.newProducts} new products, ${result.updatedProducts} updated`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/admin/goe'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    } catch (error: any) {
      toast({
        title: language === 'et' ? 'Import ebaõnnestus' : 'Import failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      event.target.value = '';
    }
  }, [importType, markupMultiplier, language, toast]);

  const handleExportOrderList = async () => {
    try {
      const response = await fetch('/api/admin/goe/export-order', { credentials: 'include' });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goe-order-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout title={language === 'et' ? 'GOE Tarnija' : 'GOE Supplier'}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-goe-title">
              {language === 'et' ? 'GOE Tarnija Haldus' : 'GOE Supplier Management'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'et' 
                ? 'Impordi tooteid, halda laoseisu ja loo tellimusi'
                : 'Import products, manage inventory and create orders'}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'et' ? 'GOE Tooted' : 'GOE Products'}
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-goe-product-count">
                  {stats?.totalGoeProducts || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'et' ? 'Madal Laoseis' : 'Low Stock'}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-orange-500" data-testid="text-low-stock-count">
                  {stats?.lowOwnStock || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'et' ? 'GOE Väärtus' : 'GOE Value'}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-goe-value">
                  {formatPrice(stats?.totalGoeValue || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === 'et' ? 'Viimane Import' : 'Last Import'}
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-sm" data-testid="text-last-import">
                  {stats?.lastImport ? format(new Date(stats.lastImport.createdAt), 'dd.MM.yyyy HH:mm') : '-'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import" data-testid="tab-import">
              <Upload className="mr-2 h-4 w-4" />
              {language === 'et' ? 'Import' : 'Import'}
            </TabsTrigger>
            <TabsTrigger value="inventory" data-testid="tab-inventory">
              <Package className="mr-2 h-4 w-4" />
              {language === 'et' ? 'Laoseis' : 'Inventory'}
            </TabsTrigger>
            <TabsTrigger value="order" data-testid="tab-order">
              <ShoppingCart className="mr-2 h-4 w-4" />
              {language === 'et' ? 'Tellimused' : 'Orders'}
            </TabsTrigger>
            <TabsTrigger value="mappings" data-testid="tab-mappings">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {language === 'et' ? 'Kategooriad' : 'Mappings'}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <Clock className="mr-2 h-4 w-4" />
              {language === 'et' ? 'Ajalugu' : 'History'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Impordi GOE Fail' : 'Import GOE File'}</CardTitle>
                <CardDescription>
                  {language === 'et' 
                    ? 'Lae üles GOE Exceli laofail (.xlsx, .xls, .csv)'
                    : 'Upload GOE Excel stock file (.xlsx, .xls, .csv)'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === 'et' ? 'Impordi tüüp' : 'Import Type'}</Label>
                    <Select value={importType} onValueChange={(v: 'full' | 'stock_update') => setImportType(v)}>
                      <SelectTrigger data-testid="select-import-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">
                          {language === 'et' ? 'Täis import (uued tooted + uuendus)' : 'Full import (new products + update)'}
                        </SelectItem>
                        <SelectItem value="stock_update">
                          {language === 'et' ? 'Ainult laoseisu uuendus' : 'Stock update only'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'et' ? 'Hinna kordaja' : 'Price Multiplier'}</Label>
                    <Select value={markupMultiplier} onValueChange={setMarkupMultiplier}>
                      <SelectTrigger data-testid="select-markup">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1.5">1.5x (50% juurdehindlus)</SelectItem>
                        <SelectItem value="1.75">1.75x (75% juurdehindlus)</SelectItem>
                        <SelectItem value="2.0">2.0x (100% juurdehindlus)</SelectItem>
                        <SelectItem value="2.25">2.25x (125% juurdehindlus)</SelectItem>
                        <SelectItem value="2.5">2.5x (150% juurdehindlus)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {language === 'et' ? 'Importimine...' : 'Importing...'}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="max-w-sm"
                    data-testid="input-file-upload"
                  />
                  <Button variant="outline" disabled={uploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {language === 'et' ? 'Vali fail' : 'Select File'}
                  </Button>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">{language === 'et' ? 'Faili formaat' : 'File Format'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' 
                      ? 'GOE laofail peab sisaldama veerge: Part No, Format, Description, Available, EAN, EUR'
                      : 'GOE stock file must contain columns: Part No, Format, Description, Available, EAN, EUR'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Madala Laoseisuga Tooted' : 'Low Stock Products'}</CardTitle>
                <CardDescription>
                  {language === 'et' 
                    ? 'Tooted, mille sinu laoseis on alla 3 tk'
                    : 'Products with your stock below 3 units'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lowStockLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : lowStockProducts && lowStockProducts.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'et' ? 'Toode' : 'Product'}</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>{language === 'et' ? 'Sinu laos' : 'Your Stock'}</TableHead>
                        <TableHead>{language === 'et' ? 'GOE laos' : 'GOE Stock'}</TableHead>
                        <TableHead>{language === 'et' ? 'GOE hind' : 'GOE Price'}</TableHead>
                        <TableHead>{language === 'et' ? 'Müügihind' : 'Sale Price'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStockProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.nameEn}</TableCell>
                          <TableCell>{product.sku}</TableCell>
                          <TableCell>
                            <Badge variant={product.ownStock === 0 ? 'destructive' : 'secondary'}>
                              {product.ownStock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.goeStock > 0 ? 'default' : 'outline'}>
                              {product.goeStock}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(parseFloat(product.goePrice || '0'))}</TableCell>
                          <TableCell>{formatPrice(parseFloat(product.price))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">
                    {language === 'et' ? 'Kõik tooted on laos' : 'All products are in stock'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="order" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle>{language === 'et' ? 'GOE Tellimisnimekiri' : 'GOE Order List'}</CardTitle>
                  <CardDescription>
                    {language === 'et' 
                      ? 'Tooted, mida tellida GOE-lt (laoseis 0, GOE laos saadaval)'
                      : 'Products to order from GOE (stock 0, available at GOE)'}
                  </CardDescription>
                </div>
                <Button onClick={handleExportOrderList} data-testid="button-export-order">
                  <Download className="mr-2 h-4 w-4" />
                  {language === 'et' ? 'Ekspordi CSV' : 'Export CSV'}
                </Button>
              </CardHeader>
              <CardContent>
                {orderListLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : orderList && orderList.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>GOE Part No</TableHead>
                        <TableHead>{language === 'et' ? 'Toode' : 'Product'}</TableHead>
                        <TableHead>{language === 'et' ? 'GOE laos' : 'GOE Stock'}</TableHead>
                        <TableHead>{language === 'et' ? 'GOE hind' : 'GOE Price'}</TableHead>
                        <TableHead>{language === 'et' ? 'Soovitatav kogus' : 'Suggested Qty'}</TableHead>
                        <TableHead>{language === 'et' ? 'Kokku' : 'Total'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderList.map((product) => {
                        const suggestedQty = Math.min(5, product.goeStock);
                        const total = suggestedQty * parseFloat(product.goePrice || '0');
                        return (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono">{product.goePartNo}</TableCell>
                            <TableCell>{product.nameEn}</TableCell>
                            <TableCell>
                              <Badge variant="default">{product.goeStock}</Badge>
                            </TableCell>
                            <TableCell>{formatPrice(parseFloat(product.goePrice || '0'))}</TableCell>
                            <TableCell>{suggestedQty}</TableCell>
                            <TableCell className="font-medium">{formatPrice(total)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">
                    {language === 'et' ? 'Midagi pole vaja tellida' : 'Nothing to order'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Kategooriate Vastendamine' : 'Category Mappings'}</CardTitle>
                <CardDescription>
                  {language === 'et' 
                    ? 'Määra, millisesse EstZone kategooriasse iga GOE formaat läheb'
                    : 'Define which EstZone category each GOE format maps to'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'et' ? 'GOE Formaat' : 'GOE Format'}</TableHead>
                      <TableHead>{language === 'et' ? 'EstZone Kategooria' : 'EstZone Category'}</TableHead>
                      <TableHead>{language === 'et' ? 'Juurdehindlus' : 'Markup'}</TableHead>
                      <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings?.map((mapping) => (
                      <TableRow key={mapping.id}>
                        <TableCell className="font-mono font-medium">{mapping.goeFormat}</TableCell>
                        <TableCell>
                          <Select
                            value={mapping.categoryId || ''}
                            onValueChange={(value) => updateMappingMutation.mutate({ 
                              goeFormat: mapping.goeFormat, 
                              categoryId: value 
                            })}
                          >
                            <SelectTrigger className="w-48" data-testid={`select-category-${mapping.goeFormat}`}>
                              <SelectValue placeholder={language === 'et' ? 'Vali kategooria' : 'Select category'} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories?.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {language === 'et' ? cat.nameEt : cat.nameEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{mapping.defaultMarkup}x</Badge>
                        </TableCell>
                        <TableCell>
                          {mapping.isActive ? (
                            <Badge variant="default"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>
                          ) : (
                            <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Inactive</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Impordi Ajalugu' : 'Import History'}</CardTitle>
              </CardHeader>
              <CardContent>
                {importsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : imports && imports.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{language === 'et' ? 'Kuupäev' : 'Date'}</TableHead>
                        <TableHead>{language === 'et' ? 'Fail' : 'File'}</TableHead>
                        <TableHead>{language === 'et' ? 'Tüüp' : 'Type'}</TableHead>
                        <TableHead>{language === 'et' ? 'Uued' : 'New'}</TableHead>
                        <TableHead>{language === 'et' ? 'Uuendatud' : 'Updated'}</TableHead>
                        <TableHead>{language === 'et' ? 'Vahele jäetud' : 'Skipped'}</TableHead>
                        <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imports.map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell>{format(new Date(imp.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                          <TableCell className="font-mono text-xs">{imp.fileName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{imp.importType}</Badge>
                          </TableCell>
                          <TableCell className="text-green-600">{imp.newProducts}</TableCell>
                          <TableCell className="text-blue-600">{imp.updatedProducts}</TableCell>
                          <TableCell className="text-muted-foreground">{imp.skippedProducts}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                imp.status === 'completed' ? 'default' : 
                                imp.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {imp.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground py-8 text-center">
                    {language === 'et' ? 'Importimisi pole veel tehtud' : 'No imports yet'}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
