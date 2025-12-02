import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, Snowflake, PartyPopper, Gift, Sun, Leaf, Sparkles, Calendar, Eye, EyeOff } from 'lucide-react';
import { format, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';
import type { SeasonalTheme } from '@shared/schema';

const DECORATION_TYPES = [
  { value: 'christmas', label: 'Christmas', labelEt: 'Joulud', icon: Snowflake },
  { value: 'new_year', label: 'New Year', labelEt: 'Uusaasta', icon: PartyPopper },
  { value: 'valentines', label: "Valentine's Day", labelEt: 'Valentinipäev', icon: Gift },
  { value: 'easter', label: 'Easter', labelEt: 'Lihavõtted', icon: Sun },
  { value: 'summer', label: 'Summer Sale', labelEt: 'Suvine müük', icon: Sun },
  { value: 'autumn', label: 'Autumn Sale', labelEt: 'Sügisene müük', icon: Leaf },
  { value: 'black_friday', label: 'Black Friday', labelEt: 'Must reede', icon: Sparkles },
  { value: 'cyber_monday', label: 'Cyber Monday', labelEt: 'Küberesmaspäev', icon: Sparkles },
  { value: 'custom', label: 'Custom', labelEt: 'Kohandatud', icon: Calendar },
];

const getStatusBadge = (theme: SeasonalTheme, lang: string) => {
  const now = new Date();
  const start = new Date(theme.startDate);
  const end = new Date(theme.endDate);
  
  if (!theme.isActive) {
    return <Badge variant="outline" className="bg-muted">{lang === 'et' ? 'Mitteaktiivne' : 'Inactive'}</Badge>;
  }
  
  if (isWithinInterval(now, { start, end })) {
    return <Badge className="bg-green-500">{lang === 'et' ? 'Aktiivne' : 'Live Now'}</Badge>;
  }
  
  if (isBefore(now, start)) {
    return <Badge variant="secondary">{lang === 'et' ? 'Ootel' : 'Scheduled'}</Badge>;
  }
  
  return <Badge variant="outline" className="bg-muted">{lang === 'et' ? 'Lõppenud' : 'Ended'}</Badge>;
};

interface ThemeFormData {
  name: string;
  nameEn: string;
  nameEt: string;
  startDate: string;
  endDate: string;
  decorationType: string;
  primaryColor: string;
  secondaryColor: string;
  showSnowflakes: boolean;
  showConfetti: boolean;
  bannerTextEn: string;
  bannerTextEt: string;
  bannerBgColor: string;
  discountPercent: number;
  discountCategories: string[];
  isActive: boolean;
}

const defaultFormData: ThemeFormData = {
  name: '',
  nameEn: '',
  nameEt: '',
  startDate: '',
  endDate: '',
  decorationType: 'christmas',
  primaryColor: '#DC2626',
  secondaryColor: '#15803D',
  showSnowflakes: false,
  showConfetti: false,
  bannerTextEn: '',
  bannerTextEt: '',
  bannerBgColor: '#DC2626',
  discountPercent: 0,
  discountCategories: [],
  isActive: true,
};

export default function SeasonalThemes() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<SeasonalTheme | null>(null);
  const [formData, setFormData] = useState<ThemeFormData>(defaultFormData);
  
  const { data: themes, isLoading } = useQuery<SeasonalTheme[]>({
    queryKey: ['/api/admin/seasonal-themes'],
  });
  
  const createMutation = useMutation({
    mutationFn: async (data: ThemeFormData) => {
      return apiRequest('POST', '/api/admin/seasonal-themes', {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-themes'] });
      setIsCreateOpen(false);
      setFormData(defaultFormData);
      toast({
        title: language === 'et' ? 'Teema loodud' : 'Theme Created',
        description: language === 'et' ? 'Hooajateema on edukalt loodud' : 'Seasonal theme has been created successfully',
      });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ThemeFormData> }) => {
      return apiRequest('PATCH', `/api/admin/seasonal-themes/${id}`, {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-themes'] });
      setEditingTheme(null);
      setFormData(defaultFormData);
      toast({
        title: language === 'et' ? 'Teema uuendatud' : 'Theme Updated',
        description: language === 'et' ? 'Hooajateema on edukalt uuendatud' : 'Seasonal theme has been updated successfully',
      });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/seasonal-themes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/seasonal-themes'] });
      toast({
        title: language === 'et' ? 'Teema kustutatud' : 'Theme Deleted',
        description: language === 'et' ? 'Hooajateema on edukalt kustutatud' : 'Seasonal theme has been deleted',
      });
    },
  });
  
  const handleSubmit = () => {
    if (editingTheme) {
      updateMutation.mutate({ id: editingTheme.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const openEdit = (theme: SeasonalTheme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      nameEn: theme.nameEn,
      nameEt: theme.nameEt,
      startDate: format(new Date(theme.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(theme.endDate), 'yyyy-MM-dd'),
      decorationType: theme.decorationType,
      primaryColor: theme.primaryColor || '#DC2626',
      secondaryColor: theme.secondaryColor || '#15803D',
      showSnowflakes: theme.showSnowflakes ?? false,
      showConfetti: theme.showConfetti ?? false,
      bannerTextEn: theme.bannerTextEn || '',
      bannerTextEt: theme.bannerTextEt || '',
      bannerBgColor: theme.bannerBgColor || '#DC2626',
      discountPercent: theme.discountPercent || 0,
      discountCategories: theme.discountCategories || [],
      isActive: theme.isActive ?? true,
    });
  };
  
  const closeDialog = () => {
    setIsCreateOpen(false);
    setEditingTheme(null);
    setFormData(defaultFormData);
  };
  
  const ThemeForm = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Teema nimi' : 'Theme Name'}</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Christmas 2024"
            data-testid="input-theme-name"
          />
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Kujunduse tüüp' : 'Decoration Type'}</Label>
          <Select
            value={formData.decorationType}
            onValueChange={(value) => setFormData({ ...formData, decorationType: value })}
          >
            <SelectTrigger data-testid="select-decoration-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DECORATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {language === 'et' ? type.labelEt : type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Nimi (EN)' : 'Name (EN)'}</Label>
          <Input
            value={formData.nameEn}
            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
            placeholder="Christmas Sale"
            data-testid="input-name-en"
          />
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Nimi (ET)' : 'Name (ET)'}</Label>
          <Input
            value={formData.nameEt}
            onChange={(e) => setFormData({ ...formData, nameEt: e.target.value })}
            placeholder="Joulumüük"
            data-testid="input-name-et"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Alguskuupäev' : 'Start Date'}</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            data-testid="input-start-date"
          />
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Lõppkuupäev' : 'End Date'}</Label>
          <Input
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            data-testid="input-end-date"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Põhivärv' : 'Primary Color'}</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="w-12 h-9 p-1 cursor-pointer"
              data-testid="input-primary-color"
            />
            <Input
              value={formData.primaryColor}
              onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Teine värv' : 'Secondary Color'}</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              className="w-12 h-9 p-1 cursor-pointer"
              data-testid="input-secondary-color"
            />
            <Input
              value={formData.secondaryColor}
              onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Banneri taust' : 'Banner Background'}</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={formData.bannerBgColor}
              onChange={(e) => setFormData({ ...formData, bannerBgColor: e.target.value })}
              className="w-12 h-9 p-1 cursor-pointer"
              data-testid="input-banner-bg-color"
            />
            <Input
              value={formData.bannerBgColor}
              onChange={(e) => setFormData({ ...formData, bannerBgColor: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Banneri tekst (EN)' : 'Banner Text (EN)'}</Label>
          <Textarea
            value={formData.bannerTextEn}
            onChange={(e) => setFormData({ ...formData, bannerTextEn: e.target.value })}
            placeholder="Christmas Sale - Up to 50% OFF!"
            rows={2}
            data-testid="input-banner-en"
          />
        </div>
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Banneri tekst (ET)' : 'Banner Text (ET)'}</Label>
          <Textarea
            value={formData.bannerTextEt}
            onChange={(e) => setFormData({ ...formData, bannerTextEt: e.target.value })}
            placeholder="Joulumüük - Kuni 50% soodustust!"
            rows={2}
            data-testid="input-banner-et"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{language === 'et' ? 'Allahindlus %' : 'Discount %'}</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={formData.discountPercent}
            onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })}
            data-testid="input-discount-percent"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="snowflakes"
            checked={formData.showSnowflakes}
            onCheckedChange={(checked) => setFormData({ ...formData, showSnowflakes: checked })}
            data-testid="switch-snowflakes"
          />
          <Label htmlFor="snowflakes" className="flex items-center gap-1">
            <Snowflake className="w-4 h-4" />
            {language === 'et' ? 'Lumehelbed' : 'Snowflakes'}
          </Label>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id="confetti"
            checked={formData.showConfetti}
            onCheckedChange={(checked) => setFormData({ ...formData, showConfetti: checked })}
            data-testid="switch-confetti"
          />
          <Label htmlFor="confetti" className="flex items-center gap-1">
            <PartyPopper className="w-4 h-4" />
            {language === 'et' ? 'Konfetid' : 'Confetti'}
          </Label>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Switch
          id="active"
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          data-testid="switch-active"
        />
        <Label htmlFor="active">
          {language === 'et' ? 'Aktiivne (aktiveerub automaatselt kuupäeva saabumisel)' : 'Active (will auto-activate when date arrives)'}
        </Label>
      </div>
    </div>
  );
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            {language === 'et' ? 'Hooajateemad' : 'Seasonal Themes'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === 'et' 
              ? 'Halda hooajalisi teemasid ja kujundusi (jõulud, uusaasta jne)'
              : 'Manage seasonal themes and decorations (Christmas, New Year, etc.)'}
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-theme">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'et' ? 'Lisa teema' : 'Add Theme'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {language === 'et' ? 'Loo uus hooajateema' : 'Create New Seasonal Theme'}
              </DialogTitle>
              <DialogDescription>
                {language === 'et' 
                  ? 'Teema aktiveerub automaatselt määratud kuupäeval'
                  : 'Theme will automatically activate on the specified date'}
              </DialogDescription>
            </DialogHeader>
            <ThemeForm />
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
                {language === 'et' ? 'Tühista' : 'Cancel'}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createMutation.isPending}
                data-testid="button-save-theme"
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {language === 'et' ? 'Loo teema' : 'Create Theme'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {language === 'et' ? 'Muuda hooajateemat' : 'Edit Seasonal Theme'}
            </DialogTitle>
          </DialogHeader>
          <ThemeForm />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-edit">
              {language === 'et' ? 'Tühista' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateMutation.isPending}
              data-testid="button-update-theme"
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {language === 'et' ? 'Salvesta' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Themes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {themes?.map((theme) => {
          const decorationType = DECORATION_TYPES.find(d => d.value === theme.decorationType);
          const DecorIcon = decorationType?.icon || Calendar;
          
          return (
            <Card key={theme.id} className="relative overflow-hidden" data-testid={`card-theme-${theme.id}`}>
              <div 
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: theme.primaryColor || '#DC2626' }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DecorIcon className="w-5 h-5" style={{ color: theme.primaryColor || undefined }} />
                    <CardTitle className="text-lg">
                      {language === 'et' ? theme.nameEt : theme.nameEn}
                    </CardTitle>
                  </div>
                  {getStatusBadge(theme, language)}
                </div>
                <CardDescription className="text-xs">
                  {format(new Date(theme.startDate), 'MMM d, yyyy')} - {format(new Date(theme.endDate), 'MMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {theme.showSnowflakes && (
                    <Badge variant="outline" className="text-xs">
                      <Snowflake className="w-3 h-3 mr-1" />
                      {language === 'et' ? 'Lumehelbed' : 'Snowflakes'}
                    </Badge>
                  )}
                  {theme.showConfetti && (
                    <Badge variant="outline" className="text-xs">
                      <PartyPopper className="w-3 h-3 mr-1" />
                      {language === 'et' ? 'Konfetid' : 'Confetti'}
                    </Badge>
                  )}
                  {(theme.discountPercent || 0) > 0 && (
                    <Badge className="text-xs bg-green-600">
                      -{theme.discountPercent}%
                    </Badge>
                  )}
                </div>
                
                {(theme.bannerTextEn || theme.bannerTextEt) && (
                  <div 
                    className="p-2 rounded text-white text-sm text-center"
                    style={{ backgroundColor: theme.bannerBgColor || '#DC2626' }}
                  >
                    {language === 'et' ? theme.bannerTextEt : theme.bannerTextEn}
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(theme)}
                    data-testid={`button-edit-theme-${theme.id}`}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    {language === 'et' ? 'Muuda' : 'Edit'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateMutation.mutate({ 
                      id: theme.id, 
                      data: { isActive: !theme.isActive } 
                    })}
                    data-testid={`button-toggle-theme-${theme.id}`}
                  >
                    {theme.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-1" />
                        {language === 'et' ? 'Peida' : 'Disable'}
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-1" />
                        {language === 'et' ? 'Aktiveeri' : 'Enable'}
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(language === 'et' ? 'Kas olete kindel?' : 'Are you sure?')) {
                        deleteMutation.mutate(theme.id);
                      }
                    }}
                    data-testid={`button-delete-theme-${theme.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {(!themes || themes.length === 0) && (
          <Card className="col-span-full p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {language === 'et' ? 'Hooajateemasid pole' : 'No Seasonal Themes'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Looge esimene hooajateema, mis aktiveerub automaatselt määratud kuupäeval'
                : 'Create your first seasonal theme that will auto-activate on the specified date'}
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-theme">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'et' ? 'Lisa esimene teema' : 'Add First Theme'}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
