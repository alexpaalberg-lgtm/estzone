import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertProductSchema, type Product, type Category } from '@shared/schema';
import { Pencil, Trash2, Plus, Star, Sparkles, Eye, EyeOff, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const productFormSchema = insertProductSchema.extend({
  images: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminProducts() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, sortBy]);

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', pageSize.toString());
    params.set('status', statusFilter);
    params.set('sort', sortBy);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter);
    return params.toString();
  };

  const { data: productsData, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: ['/api/admin/products', currentPage, pageSize, debouncedSearch, categoryFilter, statusFilter, sortBy],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products?${buildQueryParams()}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      nameEn: '',
      nameEt: '',
      descriptionEn: '',
      descriptionEt: '',
      categoryId: '',
      price: '0',
      salePrice: '',
      sku: '',
      stock: 0,
      lowStockThreshold: 10,
      isNew: false,
      isFeatured: false,
      isActive: true,
      images: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload = {
        ...data,
        images: data.images ? data.images.split(',').map(url => url.trim()) : [],
      };
      return apiRequest('POST', '/api/admin/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: t.admin.productCreated,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t.admin.error,
        description: error.message || t.admin.failedToCreate,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) => {
      const payload = {
        ...data,
        images: data.images ? data.images.split(',').map(url => url.trim()) : [],
      };
      return apiRequest('PUT', `/api/admin/products/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: t.admin.productUpdated,
      });
      setIsDialogOpen(false);
      setEditingProduct(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t.admin.error,
        description: error.message || t.admin.failedToUpdate,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: t.admin.productDeleted,
      });
      setIsDeleteDialogOpen(false);
      setDeletingProductId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: t.admin.error,
        description: error.message || t.admin.failedToDelete,
      });
    },
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.reset({
      nameEn: '',
      nameEt: '',
      descriptionEn: '',
      descriptionEt: '',
      categoryId: '',
      price: '0',
      salePrice: '',
      sku: '',
      stock: 0,
      lowStockThreshold: 10,
      isNew: false,
      isFeatured: false,
      isActive: true,
      images: '',
    });
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      nameEn: product.nameEn,
      nameEt: product.nameEt,
      descriptionEn: product.descriptionEn ?? '',
      descriptionEt: product.descriptionEt ?? '',
      categoryId: product.categoryId,
      price: product.price,
      salePrice: product.salePrice ?? '',
      sku: product.sku,
      stock: product.stock,
      lowStockThreshold: product.lowStockThreshold ?? 10,
      isNew: product.isNew ?? false,
      isFeatured: product.isFeatured ?? false,
      isActive: product.isActive ?? true,
      images: product.images?.join(', ') ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setDeletingProductId(productId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProductId) {
      deleteMutation.mutate(deletingProductId);
    }
  };

  const onSubmit = (data: ProductFormData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 1;
  
  const getCategoryName = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    return language === 'et' ? (category?.nameEt || category?.nameEn || '-') : (category?.nameEn || '-');
  };

  const getProductName = (product: Product) => {
    return language === 'et' ? product.nameEt : product.nameEn;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return (
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm text-muted-foreground" data-testid="text-pagination-info">
          {language === 'et' 
            ? `Näitan ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalProducts)} / ${totalProducts} tootest`
            : `Showing ${((currentPage - 1) * pageSize) + 1}-${Math.min(currentPage * pageSize, totalProducts)} of ${totalProducts} products`
          }
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            data-testid="button-first-page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {pages.map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                variant={page === currentPage ? 'default' : 'outline'}
                size="icon"
                onClick={() => goToPage(page)}
                data-testid={`button-page-${page}`}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-muted-foreground">...</span>
            )
          ))}
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            data-testid="button-last-page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout title={t.admin.products}>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">{t.admin.products}</h2>
            <Badge variant="secondary" data-testid="badge-total-products">
              {totalProducts}
            </Badge>
          </div>
          <Button onClick={handleAddProduct} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            {t.admin.addProduct}
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'et' ? 'Otsi nime, SKU järgi...' : 'Search by name, SKU...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder={language === 'et' ? 'Kategooria' : 'Category'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'et' ? 'Kõik kategooriad' : 'All Categories'}
                  </SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {language === 'et' ? category.nameEt : category.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'inactive')}>
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder={language === 'et' ? 'Staatus' : 'Status'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {language === 'et' ? 'Kõik staatused' : 'All Statuses'}
                  </SelectItem>
                  <SelectItem value="active">
                    {language === 'et' ? 'Aktiivsed' : 'Active'}
                  </SelectItem>
                  <SelectItem value="inactive">
                    {language === 'et' ? 'Peidetud' : 'Hidden'}
                  </SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger data-testid="select-sort">
                  <SelectValue placeholder={language === 'et' ? 'Sorteeri' : 'Sort by'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {language === 'et' ? 'Uusimad enne' : 'Newest First'}
                  </SelectItem>
                  <SelectItem value="oldest">
                    {language === 'et' ? 'Vanemad enne' : 'Oldest First'}
                  </SelectItem>
                  <SelectItem value="name_az">
                    {language === 'et' ? 'Nimi A-Z' : 'Name A-Z'}
                  </SelectItem>
                  <SelectItem value="name_za">
                    {language === 'et' ? 'Nimi Z-A' : 'Name Z-A'}
                  </SelectItem>
                  <SelectItem value="price_asc">
                    {language === 'et' ? 'Hind: odavaim enne' : 'Price: Low to High'}
                  </SelectItem>
                  <SelectItem value="price_desc">
                    {language === 'et' ? 'Hind: kallim enne' : 'Price: High to Low'}
                  </SelectItem>
                  <SelectItem value="stock_low">
                    {language === 'et' ? 'Laoseis: väikseim enne' : 'Stock: Low to High'}
                  </SelectItem>
                  <SelectItem value="stock_high">
                    {language === 'et' ? 'Laoseis: suurim enne' : 'Stock: High to Low'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {productsLoading ? (
          <div className="flex items-center justify-center py-12" data-testid="text-loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">{t.admin.loadingProducts}</span>
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground" data-testid="text-no-products">
                {debouncedSearch 
                  ? (language === 'et' ? 'Tooteid ei leitud' : 'No products found')
                  : (language === 'et' ? 'Tooteid pole veel' : 'No products yet')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">{t.admin.images}</TableHead>
                    <TableHead>{language === 'et' ? 'Nimi' : 'Name'}</TableHead>
                    <TableHead className="hidden lg:table-cell">{t.admin.category}</TableHead>
                    <TableHead>{t.admin.sku}</TableHead>
                    <TableHead>{t.admin.price}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t.admin.salePrice}</TableHead>
                    <TableHead>{t.admin.stock}</TableHead>
                    <TableHead className="hidden xl:table-cell">{t.admin.status}</TableHead>
                    <TableHead>{t.admin.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                      <TableCell>
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={getProductName(product)}
                            className="w-12 h-12 object-cover rounded"
                            data-testid={`img-product-${product.id}`}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.png';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            {t.admin.noImage}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-[200px]">
                          <span className="font-medium truncate" data-testid={`text-name-${product.id}`} title={getProductName(product)}>
                            {getProductName(product)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell" data-testid={`text-category-${product.id}`}>
                        {getCategoryName(product.categoryId)}
                      </TableCell>
                      <TableCell data-testid={`text-sku-${product.id}`}>
                        <span className="font-mono text-xs">{product.sku}</span>
                      </TableCell>
                      <TableCell data-testid={`text-price-${product.id}`}>
                        <span className="font-semibold">€{product.price}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" data-testid={`text-sale-${product.id}`}>
                        {product.salePrice ? (
                          <span className="text-green-500 font-medium">€{product.salePrice}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell data-testid={`text-stock-${product.id}`}>
                        <span className={product.stock <= (product.lowStockThreshold || 10) ? 'text-red-500 font-bold' : ''}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {product.isActive ? (
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              <Eye className="w-3 h-3 mr-1" />
                              {t.admin.activeStatus}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-red-500 border-red-500">
                              <EyeOff className="w-3 h-3 mr-1" />
                              {t.admin.hiddenStatus}
                            </Badge>
                          )}
                          {product.isFeatured && (
                            <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                              <Star className="w-3 h-3 mr-1" />
                              {t.admin.featuredStatus}
                            </Badge>
                          )}
                          {product.isNew && (
                            <Badge variant="outline" className="text-blue-500 border-blue-500">
                              <Sparkles className="w-3 h-3 mr-1" />
                              {t.admin.newStatus}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  {renderPagination()}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t.admin.editProduct : t.admin.addProduct}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? (language === 'et' ? 'Muuda toote andmeid' : 'Edit product details')
                : (language === 'et' ? 'Lisa uus toode' : 'Add a new product')
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.nameEn}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nameEt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.nameEt}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-name-et" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="descriptionEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.descriptionEn}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ''} rows={3} data-testid="input-description-en" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descriptionEt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.descriptionEt}</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ''} rows={3} data-testid="input-description-et" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.category}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={language === 'et' ? 'Vali kategooria' : 'Select a category'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {language === 'et' ? category.nameEt : category.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.price} (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" data-testid="input-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.salePrice} (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" min="0" data-testid="input-sale-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.sku}</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-sku" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.stock}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lowStockThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.admin.lowStockThreshold}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? 10}
                          type="number"
                          min="0"
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-low-stock-threshold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="images"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.images}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t.admin.imagesPlaceholder} data-testid="input-images" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6 flex-wrap">
                <FormField
                  control={form.control}
                  name="isNew"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-new"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">{t.admin.isNew}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isFeatured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-featured"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">{t.admin.isFeatured}</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                          data-testid="switch-is-active"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">{t.admin.isActive}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  {language === 'et' ? 'Tühista' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <span className="animate-spin mr-2">⏳</span>
                  )}
                  {editingProduct ? t.admin.save : t.admin.create}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'et' ? 'Kustuta toode?' : 'Delete Product?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'et' 
                ? 'See tegevus on pöördumatu. Toode kustutatakse jäädavalt.'
                : 'This action cannot be undone. The product will be permanently deleted.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              {language === 'et' ? 'Tühista' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending 
                ? (language === 'et' ? 'Kustutan...' : 'Deleting...')
                : (language === 'et' ? 'Kustuta' : 'Delete')
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
