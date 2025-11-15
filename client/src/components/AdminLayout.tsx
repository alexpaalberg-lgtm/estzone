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
import { PackageSearch, Package, ShoppingCart, FolderTree, LogOut } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
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
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
