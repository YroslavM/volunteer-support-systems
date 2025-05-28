import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
// Temporarily commenting out auth for debugging
// import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { VolunteerActivism, East } from "@mui/icons-material";
import { Loader2 } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  email: z.string().email({ message: "Введіть коректний email" }),
  password: z.string().min(6, { message: "Пароль має містити мінімум 6 символів" }),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Registration form schema
const registerSchema = z.object({
  email: z.string().email({ message: "Введіть коректний email" }),
  username: z.string().min(3, { message: "Ім'я користувача має містити мінімум 3 символи" }),
  password: z.string().min(6, { message: "Пароль має містити мінімум 6 символів" }),
  confirmPassword: z.string(),
  role: z.enum(["volunteer", "coordinator", "donor"], {
    required_error: "Будь ласка, оберіть роль",
  }),
  firstName: z.string().min(1, { message: "Ім'я є обов'язковим" }),
  lastName: z.string().min(1, { message: "Прізвище є обов'язковим" }),
  bio: z.string().min(10, "Опис має містити мінімум 10 символів").max(500, "Опис не може перевищувати 500 символів"),
  region: z.string().min(1, "Область є обов'язковою"),
  city: z.string().min(1, "Місто є обов'язковим"),
  phoneNumber: z.string().regex(/^\+380\d{9}$/, "Номер телефону має бути у форматі +380XXXXXXXXX"),
  gender: z.enum(["Чоловіча", "Жіноча", "Інше"], { 
    required_error: "Оберіть стать" 
  }),
  birthDate: z.string().min(1, "Дата народження є обов'язковою").refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate <= today;
  }, { message: "Дата народження не може бути в майбутньому" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  // Mock auth data for debugging
  const user = null;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const loginMutation = {
    mutate: async (credentials: any) => {
      console.log('Login mutation called', credentials);
      setIsLoggingIn(true);
      
      try {
        // Реальний запит до API сервера для автентифікації
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Помилка входу');
        }
        
        // Отримуємо дані користувача з відповіді сервера
        const userData = await response.json();
        console.log('Successful login with user data:', userData);
        
        // Зберігаємо дані користувача в sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('username', userData.username);
        sessionStorage.setItem('userId', userData.id.toString());
        
        // Перенаправляємо на відповідну панель
        if (userData.role === 'volunteer') {
          window.location.href = '/dashboard/volunteer';
        } else if (userData.role === 'coordinator') {
          window.location.href = '/dashboard/coordinator';
        } else if (userData.role === 'donor') {
          window.location.href = '/dashboard/donor';
        } else if (userData.role === 'admin') {
          window.location.href = '/dashboard/admin';
        }
      } catch (error) {
        console.error('Login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Помилка входу';
        
        toast({
          title: "Помилка входу",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoggingIn(false);
      }
    },
    isPending: isLoggingIn
  };
  
  const registerMutation = {
    mutate: async (data: any) => {
      console.log('Register mutation called', data);
      setIsRegistering(true);
      
      try {
        // Реальний запит до API сервера для реєстрації
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Помилка реєстрації');
        }
        
        // Отримуємо дані користувача з відповіді сервера
        const userData = await response.json();
        console.log('Successful registration with user data:', userData);
        
        // Зберігаємо дані користувача в sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', userData.role);
        sessionStorage.setItem('username', userData.username);
        sessionStorage.setItem('userId', userData.id.toString());
        
        // Перенаправляємо на відповідну панель в залежності від ролі
        if (userData.role === 'volunteer') {
          window.location.href = '/dashboard/volunteer';
        } else if (userData.role === 'coordinator') {
          window.location.href = '/dashboard/coordinator';
        } else if (userData.role === 'donor') {
          window.location.href = '/dashboard/donor';
        } else if (userData.role === 'admin') {
          window.location.href = '/dashboard/admin';
        }
      } catch (error) {
        console.error('Registration error:', error);
        // Покращене відображення помилок
        const errorMessage = error instanceof Error ? error.message : 'Помилка реєстрації';
        
        toast({
          title: "Помилка реєстрації",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsRegistering(false);
      }
    },
    isPending: isRegistering
  };
  const [activeTab, setActiveTab] = useState<string>("login");

  // Check URL parameter for active tab and set it accordingly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && (tabParam === 'login' || tabParam === 'register')) {
      setActiveTab(tabParam);
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      role: "volunteer",
      firstName: "",
      lastName: "",
      bio: "",
      region: "",
      city: "",
      phoneNumber: "+380",
      gender: "Чоловіча",
      birthDate: "",
    },
  });

  const onLoginSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      email: values.email,
      password: values.password,
    });
  };

  const onRegisterSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      email: values.email,
      username: values.username,
      password: values.password,
      confirmPassword: values.confirmPassword,
      role: values.role,
      firstName: values.firstName,
      lastName: values.lastName,
      bio: values.bio,
      region: values.region,
      city: values.city,
      phoneNumber: values.phoneNumber,
      gender: values.gender,
      birthDate: values.birthDate,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          {/* Auth Forms */}
          <Card className="shadow-xl">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-2">
                <VolunteerActivism className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl text-center font-heading">
                {activeTab === "login" ? t('auth.login') : t('auth.register')}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === "login" 
                  ? t('auth.noAccount') + " " 
                  : t('auth.hasAccount') + " "}
                <button
                  onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
                  className="text-primary font-medium hover:underline"
                >
                  {activeTab === "login" ? t('auth.register') : t('auth.login')}
                </button>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                  <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="login-email">{t('auth.email')}</FormLabel>
                            <FormControl>
                              <Input 
                                id="login-email"
                                type="email" 
                                placeholder="email@example.com" 
                                autoComplete="email" 
                                {...field} 
                              />
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
                            <FormLabel htmlFor="login-password">{t('auth.password')}</FormLabel>
                            <FormControl>
                              <Input 
                                id="login-password"
                                type="password" 
                                autoComplete="current-password" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-center justify-between">
                        <FormField
                          control={loginForm.control}
                          name="rememberMe"
                          render={({ field }) => (
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="rememberMe"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                              <Label htmlFor="rememberMe" className="text-sm font-medium leading-none">
                                {t('auth.rememberMe')}
                              </Label>
                            </div>
                          )}
                        />
                        <a href="#" className="text-sm text-primary hover:underline">
                          {t('auth.forgotPassword')}
                        </a>
                      </div>

                      <Button 
                        type="submit" 
                        variant="default"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          t('auth.login')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      {/* 1. Прізвище та Ім'я */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Прізвище *</FormLabel>
                              <FormControl>
                                <Input placeholder="Введіть прізвище" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ім'я *</FormLabel>
                              <FormControl>
                                <Input placeholder="Введіть ім'я" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 2. Ім'я користувача */}
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="register-username">Ім'я користувача *</FormLabel>
                            <FormControl>
                              <Input 
                                id="register-username"
                                placeholder="Введіть ім'я користувача" 
                                autoComplete="username" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 3. Стать */}
                      <FormField
                        control={registerForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Стать *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть стать" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Чоловіча">Чоловіча</SelectItem>
                                <SelectItem value="Жіноча">Жіноча</SelectItem>
                                <SelectItem value="Інше">Інше</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 4. Область та Місто */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="region"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Область *</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Оберіть область" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Київська область">Київська область</SelectItem>
                                  <SelectItem value="Львівська область">Львівська область</SelectItem>
                                  <SelectItem value="Харківська область">Харківська область</SelectItem>
                                  <SelectItem value="Одеська область">Одеська область</SelectItem>
                                  <SelectItem value="Дніпропетровська область">Дніпропетровська область</SelectItem>
                                  <SelectItem value="Запорізька область">Запорізька область</SelectItem>
                                  <SelectItem value="Полтавська область">Полтавська область</SelectItem>
                                  <SelectItem value="Вінницька область">Вінницька область</SelectItem>
                                  <SelectItem value="Житомирська область">Житомирська область</SelectItem>
                                  <SelectItem value="Чернігівська область">Чернігівська область</SelectItem>
                                  <SelectItem value="Сумська область">Сумська область</SelectItem>
                                  <SelectItem value="Черкаська область">Черкаська область</SelectItem>
                                  <SelectItem value="Кіровоградська область">Кіровоградська область</SelectItem>
                                  <SelectItem value="Миколаївська область">Миколаївська область</SelectItem>
                                  <SelectItem value="Херсонська область">Херсонська область</SelectItem>
                                  <SelectItem value="Волинська область">Волинська область</SelectItem>
                                  <SelectItem value="Рівненська область">Рівненська область</SelectItem>
                                  <SelectItem value="Тернопільська область">Тернопільська область</SelectItem>
                                  <SelectItem value="Хмельницька область">Хмельницька область</SelectItem>
                                  <SelectItem value="Чернівецька область">Чернівецька область</SelectItem>
                                  <SelectItem value="Івано-Франківська область">Івано-Франківська область</SelectItem>
                                  <SelectItem value="Закарпатська область">Закарпатська область</SelectItem>
                                  <SelectItem value="Луганська область">Луганська область</SelectItem>
                                  <SelectItem value="Донецька область">Донецька область</SelectItem>
                                  <SelectItem value="АР Крим">АР Крим</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Місто *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Введіть назву міста"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 5. Email */}
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="register-email">Email *</FormLabel>
                            <FormControl>
                              <Input 
                                id="register-email"
                                type="email" 
                                placeholder="email@example.com" 
                                autoComplete="email" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 6. Номер телефону */}
                      <FormField
                        control={registerForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Номер телефону *</FormLabel>
                            <FormControl>
                              <Input 
                                type="tel"
                                placeholder="+380XXXXXXXXX"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 7. Дата народження */}
                      <FormField
                        control={registerForm.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата народження *</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 8. Пароль та Підтвердження */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel htmlFor="register-password">Пароль *</FormLabel>
                              <FormControl>
                                <Input 
                                  id="register-password"
                                  type="password" 
                                  placeholder="Введіть пароль"
                                  autoComplete="new-password" 
                                  {...field} 
                                />
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
                              <FormLabel htmlFor="confirm-password">Підтвердження пароля *</FormLabel>
                              <FormControl>
                                <Input 
                                  id="confirm-password"
                                  type="password" 
                                  placeholder="Повторіть пароль"
                                  autoComplete="new-password" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 9. Роль */}
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Оберіть роль *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Оберіть вашу роль" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="volunteer">Волонтер</SelectItem>
                                <SelectItem value="coordinator">Координатор</SelectItem>
                                <SelectItem value="donor">Донор</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* 10. Про себе */}
                      <FormField
                        control={registerForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Про себе *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Розкажіть коротко про себе, ваш досвід та мотивацію (мінімум 10 символів)"
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('common.loading')}
                          </>
                        ) : (
                          t('auth.register')
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Hero Section */}
          <div className="relative rounded-lg overflow-hidden shadow-xl min-h-[500px] hidden md:block">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1593113616828-6f22bca04804?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
                alt="Volunteers helping" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-primary-900 mix-blend-multiply opacity-70"></div>
            </div>
            <div className="relative h-full flex flex-col justify-center p-8">
              <h1 className="text-4xl font-bold text-white mb-4 font-heading">
                {t('app.name')}
              </h1>
              <p className="text-white text-lg mb-8">
                {t('app.tagline')}
              </p>
              <ul className="space-y-4">
                <li className="flex items-center text-white">
                  <East className="h-5 w-5 mr-2 text-primary-300" />
                  <span>{t('home.roles.volunteer.description')}</span>
                </li>
                <li className="flex items-center text-white">
                  <East className="h-5 w-5 mr-2 text-primary-300" />
                  <span>{t('home.roles.coordinator.description')}</span>
                </li>
                <li className="flex items-center text-white">
                  <East className="h-5 w-5 mr-2 text-primary-300" />
                  <span>{t('home.roles.donor.description')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
