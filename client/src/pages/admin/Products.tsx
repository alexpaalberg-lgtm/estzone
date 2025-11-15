import { useState } from 'react';
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
import { Pencil, Trash2, Plus } from 'lucide-react';

const productFormSchema = insertProductSchema.extend({
  images: z.string().optional(),
});

type ProductFormData = z.infer<typeof productFormSchema>;

export default function AdminProducts() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const { data: productsData, isLoading: productsLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['/api/admin/products'],
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
        title: 'Error',
        description: error.message || 'Failed to create product',
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
        title: 'Error',
        description: error.message || 'Failed to update product',
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
        title: 'Error',
        description: error.message || 'Failed to delete product',
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

  return (
    <AdminLayout title={t.admin.products}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">{t.admin.products}</h2>
          <Button onClick={handleAddProduct} data-testid="button-add-product">
            <Plus className="w-4 h-4 mr-2" />
            {t.admin.addProduct}
          </Button>
        </div>

        {productsLoading ? (
          <div className="text-center py-8" data-testid="text-loading">
            {t.admin.loadingProducts}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>{t.admin.nameEn}</TableHead>
                  <TableHead>{t.admin.nameEt}</TableHead>
                  <TableHead>{t.admin.sku}</TableHead>
                  <TableHead>{t.admin.price}</TableHead>
                  <TableHead>{t.admin.stock}</TableHead>
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
                          alt={product.nameEn}
                          className="w-12 h-12 object-cover rounded"
                          data-testid={`img-product-${product.id}`}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded" />
                      )}
                    </TableCell>
                    <TableCell data-testid={`text-name-en-${product.id}`}>{product.nameEn}</TableCell>
                    <TableCell data-testid={`text-name-et-${product.id}`}>{product.nameEt}</TableCell>
                    <TableCell data-testid={`text-sku-${product.id}`}>{product.sku}</TableCell>
                    <TableCell data-testid={`text-price-${product.id}`}>€{product.price}</TableCell>
                    <TableCell data-testid={`text-stock-${product.id}`}>{product.stock}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
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
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t.admin.editProduct : t.admin.addProduct}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Update product information' : 'Add a new product to the store'}
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
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.nameEn}
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
                      <FormLabel>{t.admin.price}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-price" />
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
                      <FormLabel>{t.admin.salePrice}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" data-testid="input-sale-price" />
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
                      <Input {...field} placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" data-testid="input-images" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
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
                  {t.admin.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : t.admin.save}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.admin.deleteProduct}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.admin.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.admin.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Deleting...' : t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
