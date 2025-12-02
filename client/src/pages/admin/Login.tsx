import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest } from '@/lib/queryClient';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast({
        variant: 'destructive',
        title: t.admin.loginError,
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/admin/login', { password });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: t.admin.loginButton,
          description: t.admin.welcomeBack,
        });
        // Use window.location for reliable redirect
        window.location.href = '/admin/products';
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t.admin.loginError,
        description: error.message || t.admin.loginFailed,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
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
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t.admin.login}</CardTitle>
          <CardDescription>
            {t.admin.loginDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" data-testid="label-password">
                {t.admin.password}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t.admin.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? t.admin.loggingIn : t.admin.loginButton}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
