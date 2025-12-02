import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { PackageSearch, Package, ShoppingCart, FolderTree, LogOut, Globe, Warehouse, Ticket, Brain, Shield, DollarSign, Gift, GraduationCap, Percent, Megaphone, Search, UserCircle, Image, Mail, Gamepad2, Bot, CreditCard, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();

  const { data: authData, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
  });

  useEffect(() => {
    if (!isLoading && !authData?.isAdmin) {
      setLocation('/admin/login');
    }
  }, [authData, isLoading, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      toast({
        title: t.admin.logout,
        description: 'Logged out successfully',
      });
      setLocation('/admin/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to logout',
      });
    }
  };

  const menuItems = [
    {
      title: t.admin.dashboard,
      url: '/admin/dashboard',
      icon: PackageSearch,
    },
    {
      title: t.admin.products,
      url: '/admin/products',
      icon: Package,
    },
    {
      title: t.admin.orders,
      url: '/admin/orders',
      icon: ShoppingCart,
    },
    {
      title: t.admin.categories,
      url: '/admin/categories',
      icon: FolderTree,
    },
    {
      title: t.admin.inventory,
      url: '/admin/inventory',
      icon: Warehouse,
    },
    {
      title: language === 'et' ? 'Kupongid' : 'Coupons',
      url: '/admin/coupons',
      icon: Ticket,
    },
    {
      title: language === 'et' ? 'Kinkekaardid' : 'Gift Cards',
      url: '/admin/gift-cards',
      icon: CreditCard,
    },
    {
      title: language === 'et' ? 'Arvustused' : 'Reviews',
      url: '/admin/reviews',
      icon: Star,
    },
    {
      title: language === 'et' ? 'AI Raportid' : 'AI Reports',
      url: '/admin/ai-reports',
      icon: Brain,
    },
    {
      title: language === 'et' ? 'Süsteemi Tervis' : 'System Health',
      url: '/admin/ai-system',
      icon: Shield,
    },
    {
      title: language === 'et' ? 'AI Hinnastamine' : 'AI Pricing',
      url: '/admin/ai-pricing',
      icon: DollarSign,
    },
    {
      title: language === 'et' ? 'AI Komplektid' : 'AI Bundles',
      url: '/admin/ai-bundles',
      icon: Gift,
    },
    {
      title: language === 'et' ? 'Oskustasemed' : 'Skill Levels',
      url: '/admin/ai-skills',
      icon: GraduationCap,
    },
    {
      title: language === 'et' ? 'AI Kupongid' : 'AI Coupons',
      url: '/admin/ai-personalized-coupons',
      icon: Percent,
    },
    {
      title: language === 'et' ? 'Kampaaniad' : 'Campaigns',
      url: '/admin/ai-campaigns',
      icon: Megaphone,
    },
    {
      title: language === 'et' ? 'AI SEO' : 'AI SEO',
      url: '/admin/ai-seo',
      icon: Search,
    },
    {
      title: language === 'et' ? 'Influencerid' : 'Influencers',
      url: '/admin/ai-influencers',
      icon: UserCircle,
    },
    {
      title: language === 'et' ? 'AR Vaade' : 'AR View',
      url: '/admin/ai-product-viz',
      icon: Image,
    },
    {
      title: language === 'et' ? 'AI Meilid' : 'AI Emails',
      url: '/admin/ai-email-campaigns',
      icon: Mail,
    },
    {
      title: language === 'et' ? 'Autotooted' : 'Auto Products',
      url: '/admin/ai-auto-products',
      icon: Gamepad2,
    },
    {
      title: language === 'et' ? 'Automaatika' : 'Automation',
      url: '/admin/ai-automation',
      icon: Bot,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!authData?.isAdmin) {
    return null;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>EstZone Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                          <item.icon />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
                      <LogOut />
                      <span>{t.admin.logout}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-2xl font-bold" data-testid="text-page-title">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-language-selector">
                    <Globe className="w-4 h-4 mr-2" />
                    {language === 'en' ? 'English' : 'Eesti'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setLanguage('en')}
                    data-testid="menu-item-english"
                    className={language === 'en' ? 'bg-accent' : ''}
                  >
                    EN - English
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLanguage('et')}
                    data-testid="menu-item-estonian"
                    className={language === 'et' ? 'bg-accent' : ''}
                  >
                    ET - Eesti
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
