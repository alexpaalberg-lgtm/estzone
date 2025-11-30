import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  DollarSign,
  BarChart3,
  RefreshCw,
  Send,
  Pencil,
  PackageX,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Product, Category } from '@shared/schema';

interface InventoryStats {
  totalProducts: number;
  totalStock: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalStock: number;
    totalValue: number;
    lowStockCount: number;
  }[];
  lowStockProducts: Product[];
  outOfStockProducts: Product[];
  recentlyUpdated: Product[];
}

export default function Inventory() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockDialogOpen, setRestockDialogOpen] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState('');
  const [supplierMessage, setSupplierMessage] = useState('');

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, stock }: { productId: string; stock: number }) => {
      return apiRequest('PATCH', `/api/admin/products/${productId}`, { stock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: t.admin.success,
        description: language === 'et' ? 'Laoseis uuendatud' : 'Stock updated successfully',
      });
      setRestockDialogOpen(false);
      setSelectedProduct(null);
      setRestockQuantity('');
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t.admin.error,
        description: language === 'et' ? 'Laoseisu uuendamine ebaõnnestus' : 'Failed to update stock',
      });
    },
  });

  const getCategoryName = (categoryId: string): string => {
    const category = categories?.find(c => c.id === categoryId);
    if (!category) return '-';
    return language === 'et' ? category.nameEt : category.nameEn;
  };

  const stats: InventoryStats | null = products && categories ? (() => {
    const lowStockThreshold = 10;
    const lowStockProducts = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockThreshold || lowStockThreshold));
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    const categoryBreakdown = categories.map(cat => {
      const categoryProducts = products.filter(p => p.categoryId === cat.id);
      return {
        categoryId: cat.id,
        categoryName: language === 'et' ? cat.nameEt : cat.nameEn,
        productCount: categoryProducts.length,
        totalStock: categoryProducts.reduce((sum, p) => sum + p.stock, 0),
        totalValue: categoryProducts.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0),
        lowStockCount: categoryProducts.filter(p => p.stock <= (p.lowStockThreshold || lowStockThreshold)).length,
      };
    }).filter(c => c.productCount > 0);

    const recentlyUpdated = [...products]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      .slice(0, 10);

    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.stock, 0),
      totalValue: products.reduce((sum, p) => sum + (Number(p.price) * p.stock), 0),
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      categoryBreakdown,
      lowStockProducts,
      outOfStockProducts,
      recentlyUpdated,
    };
  })() : null;

  const handleRestock = (product: Product) => {
    setSelectedProduct(product);
    setRestockQuantity('');
    setSupplierMessage(
      language === 'et' 
        ? `Tere,\n\nPalun saatke meile järgmine toode:\n\nToode: ${product.nameEt}\nSKU: ${product.sku}\nPraegune laoseis: ${product.stock}\nSoovitud kogus: \n\nLugupidamisega,\nEstZone OÜ`
        : `Hello,\n\nPlease send us the following product:\n\nProduct: ${product.nameEn}\nSKU: ${product.sku}\nCurrent stock: ${product.stock}\nRequested quantity: \n\nBest regards,\nEstZone OÜ`
    );
    setRestockDialogOpen(true);
  };

  const handleQuickRestock = () => {
    if (!selectedProduct || !restockQuantity) return;
    const newStock = selectedProduct.stock + parseInt(restockQuantity);
    updateStockMutation.mutate({ productId: selectedProduct.id, stock: newStock });
  };

  const getStockStatusBadge = (product: Product) => {
    const threshold = product.lowStockThreshold || 10;
    if (product.stock === 0) {
      return <Badge variant="destructive"><PackageX className="w-3 h-3 mr-1" />{language === 'et' ? 'Otsas' : 'Out of stock'}</Badge>;
    }
    if (product.stock <= threshold) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><AlertTriangle className="w-3 h-3 mr-1" />{language === 'et' ? 'Madal' : 'Low'}</Badge>;
    }
    return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle2 className="w-3 h-3 mr-1" />{language === 'et' ? 'OK' : 'OK'}</Badge>;
  };

  if (productsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-inventory-title">
            {language === 'et' ? 'Laohaldus' : 'Inventory Management'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'et' ? 'Halda toodete laoseisu ja jälgi varude taset' : 'Manage product stock and monitor inventory levels'}
          </p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/products'] })} data-testid="button-refresh">
          <RefreshCw className="w-4 h-4 mr-2" />
          {language === 'et' ? 'Värskenda' : 'Refresh'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card data-testid="card-total-products">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === 'et' ? 'Tooteid kokku' : 'Total Products'}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-products">
              {stats?.totalProducts || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === 'et' ? 'Ühikuid laos' : 'Total Units'}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-stock">
              {stats?.totalStock?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-value">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === 'et' ? 'Lao väärtus' : 'Inventory Value'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">
              €{stats?.totalValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-low-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === 'et' ? 'Madal laoseis' : 'Low Stock'}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-low-stock">
              {stats?.lowStockCount || 0}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-out-of-stock">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">
              {language === 'et' ? 'Otsas' : 'Out of Stock'}
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-out-of-stock">
              {stats?.outOfStockCount || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            {language === 'et' ? 'Ülevaade' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="low-stock" data-testid="tab-low-stock">
            {language === 'et' ? 'Madal laoseis' : 'Low Stock'}
            {(stats?.lowStockCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">{stats?.lowStockCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="out-of-stock" data-testid="tab-out-of-stock">
            {language === 'et' ? 'Otsas' : 'Out of Stock'}
            {(stats?.outOfStockCount || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">{stats?.outOfStockCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            {language === 'et' ? 'Kategooriad' : 'By Category'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Lao tervis' : 'Inventory Health'}</CardTitle>
                <CardDescription>
                  {language === 'et' ? 'Laoseisu ülevaade protsentides' : 'Stock level overview by percentage'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'et' ? 'Hea laoseis' : 'Healthy Stock'}</span>
                    <span className="text-green-600">
                      {stats ? Math.round(((stats.totalProducts - stats.lowStockCount - stats.outOfStockCount) / stats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats ? ((stats.totalProducts - stats.lowStockCount - stats.outOfStockCount) / stats.totalProducts) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'et' ? 'Madal laoseis' : 'Low Stock'}</span>
                    <span className="text-yellow-600">
                      {stats ? Math.round((stats.lowStockCount / stats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats ? (stats.lowStockCount / stats.totalProducts) * 100 : 0} 
                    className="h-2 [&>div]:bg-yellow-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{language === 'et' ? 'Otsas' : 'Out of Stock'}</span>
                    <span className="text-red-600">
                      {stats ? Math.round((stats.outOfStockCount / stats.totalProducts) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={stats ? (stats.outOfStockCount / stats.totalProducts) * 100 : 0} 
                    className="h-2 [&>div]:bg-red-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Top 5 kategooriat' : 'Top 5 Categories'}</CardTitle>
                <CardDescription>
                  {language === 'et' ? 'Suurima laoväärtusega kategooriad' : 'Categories with highest inventory value'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.categoryBreakdown
                    .sort((a, b) => b.totalValue - a.totalValue)
                    .slice(0, 5)
                    .map((cat, index) => (
                      <div key={cat.categoryId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm w-4">{index + 1}.</span>
                          <span className="font-medium">{cat.categoryName}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">€{cat.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                          <div className="text-xs text-muted-foreground">{cat.totalStock} {language === 'et' ? 'ühikut' : 'units'}</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                {language === 'et' ? 'Madala laoseisuga tooted' : 'Low Stock Products'}
              </CardTitle>
              <CardDescription>
                {language === 'et' ? 'Tooted, mille laoseis on alla määratud piiri' : 'Products with stock below the defined threshold'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'et' ? 'Toode' : 'Product'}</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>{language === 'et' ? 'Kategooria' : 'Category'}</TableHead>
                      <TableHead className="text-center">{language === 'et' ? 'Laoseis' : 'Stock'}</TableHead>
                      <TableHead className="text-center">{language === 'et' ? 'Piir' : 'Threshold'}</TableHead>
                      <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                      <TableHead>{language === 'et' ? 'Tegevused' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.lowStockProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-low-stock-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium">{language === 'et' ? product.nameEt : product.nameEn}</div>
                              <div className="text-xs text-muted-foreground">€{product.price}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                        <TableCell className="text-center">
                          <span className="text-yellow-600 font-bold">{product.stock}</span>
                        </TableCell>
                        <TableCell className="text-center">{product.lowStockThreshold || 10}</TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => handleRestock(product)} data-testid={`button-restock-${product.id}`}>
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {language === 'et' ? 'Täienda' : 'Restock'}
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href="/admin/products">
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <div className="text-lg font-medium text-green-600">
                    {language === 'et' ? 'Kõik tooted on piisava laoseisuga' : 'All products have sufficient stock'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="out-of-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackageX className="w-5 h-5 text-red-500" />
                {language === 'et' ? 'Otsas olevad tooted' : 'Out of Stock Products'}
              </CardTitle>
              <CardDescription>
                {language === 'et' ? 'Tooted, mille laoseis on 0' : 'Products with zero stock'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.outOfStockProducts && stats.outOfStockProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'et' ? 'Toode' : 'Product'}</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>{language === 'et' ? 'Kategooria' : 'Category'}</TableHead>
                      <TableHead>{language === 'et' ? 'Hind' : 'Price'}</TableHead>
                      <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                      <TableHead>{language === 'et' ? 'Tegevused' : 'Actions'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.outOfStockProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-out-of-stock-${product.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.images?.[0] && (
                              <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded" />
                            )}
                            <div>
                              <div className="font-medium">{language === 'et' ? product.nameEt : product.nameEn}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                        <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                        <TableCell>€{product.price}</TableCell>
                        <TableCell>{getStockStatusBadge(product)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="default" size="sm" onClick={() => handleRestock(product)} data-testid={`button-restock-${product.id}`}>
                              <Send className="w-3 h-3 mr-1" />
                              {language === 'et' ? 'Telli' : 'Order'}
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link href="/admin/products">
                                <Pencil className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <div className="text-lg font-medium text-green-600">
                    {language === 'et' ? 'Kõik tooted on laos' : 'All products are in stock'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>{language === 'et' ? 'Laoseis kategooriate lõikes' : 'Stock by Category'}</CardTitle>
              <CardDescription>
                {language === 'et' ? 'Detailne ülevaade iga kategooria laoseisust' : 'Detailed breakdown of inventory by category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === 'et' ? 'Kategooria' : 'Category'}</TableHead>
                    <TableHead className="text-center">{language === 'et' ? 'Tooteid' : 'Products'}</TableHead>
                    <TableHead className="text-center">{language === 'et' ? 'Ühikuid' : 'Units'}</TableHead>
                    <TableHead className="text-right">{language === 'et' ? 'Väärtus' : 'Value'}</TableHead>
                    <TableHead className="text-center">{language === 'et' ? 'Madal laoseis' : 'Low Stock'}</TableHead>
                    <TableHead>{language === 'et' ? 'Tervis' : 'Health'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.categoryBreakdown.map((cat) => {
                    const healthPercent = cat.productCount > 0 
                      ? Math.round(((cat.productCount - cat.lowStockCount) / cat.productCount) * 100)
                      : 100;
                    return (
                      <TableRow key={cat.categoryId} data-testid={`row-category-${cat.categoryId}`}>
                        <TableCell className="font-medium">{cat.categoryName}</TableCell>
                        <TableCell className="text-center">{cat.productCount}</TableCell>
                        <TableCell className="text-center">{cat.totalStock.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          €{cat.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </TableCell>
                        <TableCell className="text-center">
                          {cat.lowStockCount > 0 ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              {cat.lowStockCount}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={healthPercent} className="w-16 h-2" />
                            <span className={`text-sm ${healthPercent >= 80 ? 'text-green-600' : healthPercent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {healthPercent}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {language === 'et' ? 'Täienda laoseisu' : 'Restock Product'}
            </DialogTitle>
            <DialogDescription>
              {selectedProduct && (language === 'et' ? selectedProduct.nameEt : selectedProduct.nameEn)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              {selectedProduct?.images?.[0] && (
                <img src={selectedProduct.images[0]} alt="" className="w-16 h-16 object-cover rounded" />
              )}
              <div>
                <div className="font-medium">{selectedProduct && (language === 'et' ? selectedProduct.nameEt : selectedProduct.nameEn)}</div>
                <div className="text-sm text-muted-foreground">SKU: {selectedProduct?.sku}</div>
                <div className="text-sm">
                  {language === 'et' ? 'Praegune laoseis:' : 'Current stock:'} 
                  <span className="font-bold ml-1">{selectedProduct?.stock}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'et' ? 'Lisa kogus' : 'Add quantity'}
              </label>
              <Input
                type="number"
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(e.target.value)}
                placeholder="0"
                min="1"
                data-testid="input-restock-quantity"
              />
              {restockQuantity && selectedProduct && (
                <p className="text-sm text-muted-foreground">
                  {language === 'et' ? 'Uus laoseis:' : 'New stock:'} 
                  <span className="font-bold ml-1">{selectedProduct.stock + parseInt(restockQuantity || '0')}</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'et' ? 'Sõnum tarnijale (valikuline)' : 'Message to supplier (optional)'}
              </label>
              <Textarea
                value={supplierMessage}
                onChange={(e) => setSupplierMessage(e.target.value)}
                rows={6}
                data-testid="input-supplier-message"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
              {language === 'et' ? 'Tühista' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleQuickRestock}
              disabled={!restockQuantity || updateStockMutation.isPending}
              data-testid="button-confirm-restock"
            >
              {updateStockMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              {language === 'et' ? 'Uuenda laoseisu' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
