import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  AccountCircle, 
  Lock, 
  Email, 
  Badge, 
  ArrowForward,
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

// User profile form schema
const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Введіть коректний email" }),
  username: z.string().min(3, { message: "Ім'я користувача має містити мінімум 3 символи" }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// Password change form schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Введіть поточний пароль" }),
  newPassword: z.string().min(6, { message: "Новий пароль має містити мінімум 6 символів" }),
  confirmPassword: z.string().min(6, { message: "Підтвердження паролю має містити мінімум 6 символів" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Паролі не співпадають",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle profile update
  const onProfileSubmit = async (values: ProfileFormValues) => {
    setIsUpdating(true);
    try {
      const response = await apiRequest("PATCH", "/api/user/profile", values);
      if (response.ok) {
        // Update user data in the cache
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        toast({
          title: "Профіль оновлено",
          description: "Ваші дані успішно змінено",
        });
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити профіль. Спробуйте пізніше.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      const response = await apiRequest("POST", "/api/user/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      
      if (response.ok) {
        toast({
          title: "Пароль змінено",
          description: "Ваш пароль успішно змінено",
        });
        passwordForm.reset();
      }
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося змінити пароль. Перевірте поточний пароль.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Get role translation
  const getRoleLabel = (role: string) => {
    return t(`roles.${role}`);
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
              Профіль користувача
            </h1>
            <p className="mt-1 text-lg text-gray-500">
              Управління особистими даними та налаштуваннями облікового запису
            </p>
          </div>
          <Link href={`/dashboard/${user.role}`}>
            <Button className="mt-4 sm:mt-0 flex items-center">
              Перейти до панелі керування
              <ArrowForward className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                    <AccountCircle className="h-12 w-12 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.username}
                  </h2>
                  <p className="text-gray-500">{user.email}</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className="text-primary" />
                    <div>
                      <p className="text-gray-500 text-sm">Роль</p>
                      <p className="font-medium">{getRoleLabel(user.role)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Email className="text-primary" />
                    <div>
                      <p className="text-gray-500 text-sm">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AccountCircle className="text-primary" />
                    <div>
                      <p className="text-gray-500 text-sm">Ім'я користувача</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="text-center">
                  <Link href={`/dashboard/${user.role}`}>
                    <Button variant="outline" className="w-full">
                      Перейти до панелі керування
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Налаштування профілю</CardTitle>
                <CardDescription>
                  Керуйте налаштуваннями вашого облікового запису
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="profile">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="profile" className="flex items-center justify-center">
                      <AccountCircle className="mr-2 h-4 w-4" />
                      Особисті дані
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center justify-center">
                      <Lock className="mr-2 h-4 w-4" />
                      Безпека
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Profile Tab */}
                  <TabsContent value="profile" className="mt-6 space-y-6">
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ім'я</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ваше ім'я" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Прізвище</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ваше прізвище" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={profileForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ім'я користувача</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={isUpdating}>
                          {isUpdating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Оновлення...
                            </>
                          ) : (
                            "Зберегти зміни"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* Security Tab */}
                  <TabsContent value="security" className="mt-6 space-y-6">
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Поточний пароль</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Новий пароль</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Підтвердження нового пароля</FormLabel>
                              <FormControl>
                                <Input type="password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit" disabled={isChangingPassword}>
                          {isChangingPassword ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Зміна паролю...
                            </>
                          ) : (
                            "Змінити пароль"
                          )}
                        </Button>
                      </form>
                    </Form>
                    
                    <Separator className="my-6" />
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Контакти для підтримки</h3>
                      <p className="text-gray-500 mb-2">
                        Якщо вам потрібна допомога з вашим обліковим записом, зв'яжіться з нами:
                      </p>
                      <p className="font-medium">support@volunteerhub.com</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
