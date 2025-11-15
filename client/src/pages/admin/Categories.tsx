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
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { insertCategorySchema, type Category } from '@shared/schema';
import { Pencil, Trash2, Plus } from 'lucide-react';

const categoryFormSchema = insertCategorySchema.extend({
  slug: z.string().min(1, 'Slug on kohustuslik').regex(/^[a-z0-9-]+$/, 'Slug peab olema väiketähtedega, ilma tühikuteta (kasutage sidekriipsu)'),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function AdminCategories() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      nameEn: '',
      nameEt: '',
      slug: '',
      descriptionEn: '',
      descriptionEt: '',
      parentId: '',
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormData) => {
      const payload = {
        ...data,
        parentId: data.parentId || null,
      };
      return apiRequest('POST', '/api/admin/categories', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: t.admin.categoryCreated,
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Viga',
        description: error.message || 'Kategooria loomine ebaõnnestus',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryFormData }) => {
      const payload = {
        ...data,
        parentId: data.parentId || null,
      };
      return apiRequest('PUT', `/api/admin/categories/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: t.admin.categoryUpdated,
      });
      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Viga',
        description: error.message || 'Kategooria uuendamine ebaõnnestus',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: t.admin.categoryDeleted,
      });
      setIsDeleteDialogOpen(false);
      setDeletingCategoryId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Viga',
        description: error.message === 'Cannot delete category with products. Please remove or reassign products first.' 
          ? t.admin.categoryHasProducts 
          : error.message || 'Kategooria kustutamine ebaõnnestus',
      });
    },
  });

  const handleAddCategory = () => {
    setEditingCategory(null);
    form.reset({
      nameEn: '',
      nameEt: '',
      slug: '',
      descriptionEn: '',
      descriptionEt: '',
      parentId: '',
      sortOrder: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      nameEn: category.nameEn,
      nameEt: category.nameEt,
      slug: category.slug,
      descriptionEn: category.descriptionEn || '',
      descriptionEt: category.descriptionEt || '',
      parentId: category.parentId || '',
      sortOrder: category.sortOrder || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setDeletingCategoryId(categoryId);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      if (data.parentId === editingCategory.id) {
        toast({
          variant: 'destructive',
          title: 'Viga',
          description: 'Kategooria ei saa olla iseenda ülakategooria',
        });
        return;
      }
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const getParentCategoryName = (parentId: string | null) => {
    if (!parentId) return '-';
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.nameEt : '-';
  };

  const getAvailableParentCategories = () => {
    if (!editingCategory) return categories;
    return categories.filter(c => c.id !== editingCategory.id);
  };

  if (categoriesLoading) {
    return (
      <AdminLayout title={t.admin.categories}>
        <div className="flex items-center justify-center h-64">
          <p data-testid="text-loading">{t.admin.loadingCategories}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t.admin.categories}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold" data-testid="text-page-heading">{t.admin.categories}</h2>
          <Button onClick={handleAddCategory} data-testid="button-add-category">
            <Plus className="mr-2 h-4 w-4" />
            {t.admin.addCategory}
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead data-testid="header-name-en">{t.admin.nameEn}</TableHead>
                <TableHead data-testid="header-name-et">{t.admin.nameEt}</TableHead>
                <TableHead data-testid="header-slug">{t.admin.slug}</TableHead>
                <TableHead data-testid="header-parent">{t.admin.parentCategory}</TableHead>
                <TableHead data-testid="header-sort-order">{t.admin.sortOrder}</TableHead>
                <TableHead data-testid="header-actions">{t.admin.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8" data-testid="text-no-categories">
                    Kategooriaid ei leitud
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                    <TableCell data-testid={`text-name-en-${category.id}`}>{category.nameEn}</TableCell>
                    <TableCell data-testid={`text-name-et-${category.id}`}>{category.nameEt}</TableCell>
                    <TableCell data-testid={`text-slug-${category.id}`}>{category.slug}</TableCell>
                    <TableCell data-testid={`text-parent-${category.id}`}>
                      {getParentCategoryName(category.parentId)}
                    </TableCell>
                    <TableCell data-testid={`text-sort-order-${category.id}`}>{category.sortOrder || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                          data-testid={`button-edit-${category.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id)}
                          data-testid={`button-delete-${category.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-category-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingCategory ? t.admin.editCategory : t.admin.addCategory}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Muuda kategooria detaile' : 'Loo uus kategooria'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.nameEn}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Category Name" data-testid="input-name-en" />
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
                      <Input {...field} placeholder="Kategooria nimi" data-testid="input-name-et" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.slug}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="category-slug" 
                        data-testid="input-slug"
                        onChange={(e) => field.onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriptionEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.descriptionEn}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value ?? ''} placeholder="Category description (optional)" data-testid="input-description-en" />
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
                      <Textarea {...field} value={field.value ?? ''} placeholder="Kategooria kirjeldus (valikuline)" data-testid="input-description-et" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.parentCategory}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger data-testid="select-parent-category">
                          <SelectValue placeholder={t.admin.noneParent} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="" data-testid="select-parent-none">{t.admin.noneParent}</SelectItem>
                        {getAvailableParentCategories().map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id}
                            data-testid={`select-parent-${category.id}`}
                          >
                            {category.nameEt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.admin.sortOrder}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-sort-order"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  data-testid="button-submit"
                >
                  {editingCategory ? t.admin.update : t.admin.create}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-title">{t.admin.deleteCategory}</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-description">
              {t.admin.confirmDeleteCategory}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">{t.admin.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCategoryId && deleteMutation.mutate(deletingCategoryId)}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-confirm"
            >
              {t.admin.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
