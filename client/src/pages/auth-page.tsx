import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();
  // Mock auth data for debugging
  const user = null;
  const loginMutation = {
    mutate: (credentials: any) => console.log('Login mutation called', credentials),
    isPending: false
  };
  const registerMutation = {
    mutate: (data: any) => console.log('Register mutation called', data),
    isPending: false
  };
  const [activeTab, setActiveTab] = useState<string>("login");

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
                            <FormLabel>{t('auth.email')}</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
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
                            <FormLabel>{t('auth.password')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
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
                        className="w-full" 
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
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.email')}</FormLabel>
                            <FormControl>
                              <Input placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.username')}</FormLabel>
                            <FormControl>
                              <Input placeholder={t('auth.username')} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('auth.firstName')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('auth.firstName')} {...field} />
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
                              <FormLabel>{t('auth.lastName')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('auth.lastName')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.password')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
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
                            <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('auth.role')}</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('auth.role')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="volunteer">{t('roles.volunteer')}</SelectItem>
                                <SelectItem value="coordinator">{t('roles.coordinator')}</SelectItem>
                                <SelectItem value="donor">{t('roles.donor')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button 
                        type="submit" 
                        className="w-full" 
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
