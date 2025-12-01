import { useState } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Mail, Lock, User, Phone, Gamepad2 } from 'lucide-react';
import { SiReplit } from 'react-icons/si';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Auth() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');

  const t = {
    login: {
      title: language === 'et' ? 'Logi sisse' : 'Sign In',
      subtitle: language === 'et' ? 'Logi oma kontole sisse' : 'Sign in to your account',
      email: language === 'et' ? 'E-post' : 'Email',
      password: language === 'et' ? 'Parool' : 'Password',
      button: language === 'et' ? 'Logi sisse' : 'Sign In',
      noAccount: language === 'et' ? 'Pole kontot?' : "Don't have an account?",
      register: language === 'et' ? 'Registreeru' : 'Register',
    },
    register: {
      title: language === 'et' ? 'Loo konto' : 'Create Account',
      subtitle: language === 'et' ? 'Liitu EstZone kogukonnaga' : 'Join the EstZone community',
      firstName: language === 'et' ? 'Eesnimi' : 'First Name',
      lastName: language === 'et' ? 'Perekonnanimi' : 'Last Name',
      email: language === 'et' ? 'E-post' : 'Email',
      phone: language === 'et' ? 'Telefon (valikuline)' : 'Phone (optional)',
      password: language === 'et' ? 'Parool' : 'Password',
      confirmPassword: language === 'et' ? 'Kinnita parool' : 'Confirm Password',
      button: language === 'et' ? 'Registreeru' : 'Register',
      hasAccount: language === 'et' ? 'Juba on konto?' : 'Already have an account?',
      login: language === 'et' ? 'Logi sisse' : 'Sign In',
    },
    or: language === 'et' ? 'VÕI' : 'OR',
    replitLogin: language === 'et' ? 'Jätka Replit kontoga' : 'Continue with Replit',
  };

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiRequest('POST', '/api/auth/login', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: language === 'et' ? 'Sisselogimine õnnestus' : 'Login successful',
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: language === 'et' ? 'Sisselogimine ebaõnnestus' : 'Login failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...rest } = data;
      return apiRequest('POST', '/api/auth/register', rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: language === 'et' ? 'Registreerimine õnnestus' : 'Registration successful',
        description: language === 'et' ? 'Tere tulemast EstZone\'i!' : 'Welcome to EstZone!',
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: language === 'et' ? 'Registreerimine ebaõnnestus' : 'Registration failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const handleReplitLogin = () => {
    window.location.href = '/api/login';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gamepad2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {activeTab === 'login' ? t.login.title : t.register.title}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' ? t.login.subtitle : t.register.subtitle}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Button
              variant="outline"
              className="w-full mb-6"
              onClick={handleReplitLogin}
              data-testid="button-replit-login"
            >
              <SiReplit className="h-5 w-5 mr-2" />
              {t.replitLogin}
            </Button>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
              </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">{t.login.title}</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">{t.register.title}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit((data) => loginMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.login.email}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="email" 
                                className="pl-10" 
                                placeholder="you@example.com"
                                data-testid="input-login-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.login.password}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10"
                                data-testid="input-login-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? '...' : t.login.button}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.register.firstName}</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  className="pl-10"
                                  data-testid="input-register-firstname"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.register.lastName}</FormLabel>
                            <FormControl>
                              <Input 
                                {...field}
                                data-testid="input-register-lastname"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.register.email}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="email" 
                                className="pl-10"
                                placeholder="you@example.com"
                                data-testid="input-register-email"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.register.phone}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="tel" 
                                className="pl-10"
                                placeholder="+372 5555 5555"
                                data-testid="input-register-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.register.password}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10"
                                data-testid="input-register-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.register.confirmPassword}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                {...field} 
                                type="password" 
                                className="pl-10"
                                data-testid="input-register-confirm-password"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? '...' : t.register.button}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
