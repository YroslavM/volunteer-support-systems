import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, ArrowLeft, HeartHandshake } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { insertDonationSchema } from "@shared/schema";

// Розширена схема валідації для пожертви
const donationSchema = insertDonationSchema.extend({
  email: z.string().email({ message: "Введіть коректну email адресу" }),
  paymentMethod: z.enum(["card", "bank"], {
    required_error: "Виберіть спосіб оплати",
  }),
  donationType: z.enum(["onetime", "regular"], {
    required_error: "Виберіть тип допомоги",
  }),
  anonymous: z.boolean().default(false),
  consentToRules: z.boolean().refine((val) => val === true, {
    message: "Ви повинні погодитися з правилами перерахування коштів",
  }),
});

type DonationFormValues = z.infer<typeof donationSchema>;

export default function DonatePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [donationType, setDonationType] = useState<"onetime" | "regular">("onetime");
  
  // Отримуємо ID проекту з URL
  const [location] = useLocation();
  const id = location.split("/")[2];
  
  // Отримуємо дані проекту
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['/api/projects', id],
    queryFn: async () => {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) {
        throw new Error('Не вдалося завантажити проект');
      }
      return await response.json();
    },
    enabled: !!id
  });

  // Форма пожертви
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      projectId: parseInt(id),
      amount: 100,
      donorId: user?.id,
      comment: "",
      email: user?.email || "",
      paymentMethod: "card",
      donationType: "onetime",
      anonymous: false,
      consentToRules: false,
    },
  });

  // Обробка відправки форми
  const onSubmit = async (values: DonationFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/donations", {
        projectId: parseInt(id),
        amount: values.amount,
        donorId: user?.id || null,
        comment: values.comment || null,
      });
      
      const donation = await response.json();
      
      // Оновлюємо кеш проектів, щоб відображати оновлену суму пожертв
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id] });
      
      toast({
        title: "Успішно",
        description: "Дякуємо за вашу пожертву! Кошти будуть передані на проект.",
      });
      
      // Перенаправлення на сторінку проекту
      setTimeout(() => {
        navigate(`/projects/${id}`);
      }, 2000);
    } catch (error) {
      console.error("Помилка при створенні пожертви:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося зробити пожертву. Спробуйте пізніше.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Поки завантажуються дані проекту
  if (isLoadingProject) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Якщо проект не знайдено
  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Проект не знайдено</CardTitle>
            <CardDescription>
              На жаль, проект не знайдено. Перевірте посилання або спробуйте пізніше.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">Повернутися до списку проектів</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-emerald-50 to-white py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" className="mb-6 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Повернутися до проекту
          </Button>
        </Link>
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading font-bold mb-2">Допомога проекту</h1>
          <h2 className="text-2xl text-emerald-700 font-semibold mb-4">{project.name}</h2>
          <p className="text-slate-600">
            Залишилось зібрати, грн
          </p>
          <div className="text-emerald-500 text-4xl font-bold">
            {Math.max(0, project.targetAmount - project.collectedAmount).toLocaleString()}
          </div>
        </div>
        
        <Card className="border-emerald-100 shadow-lg">
          <CardHeader className="bg-emerald-50 border-b border-emerald-100">
            <CardTitle className="flex items-center text-emerald-700">
              <HeartHandshake className="mr-2 h-5 w-5" />
              Зробити внесок
            </CardTitle>
            <CardDescription>
              Ваша допомога важлива для реалізації цього проекту
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сума внеску</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            min="1"
                            step="10"
                            className="text-lg pr-8"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500">₴</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Сума внеску не має перевищувати залишок {Math.max(0, project.targetAmount - project.collectedAmount).toLocaleString()} грн
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Email не відображається публічно
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ваш коментар</FormLabel>
                        <FormControl>
                          <Input placeholder="Ваше побажання або коментар" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="anonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Анонімний внесок</FormLabel>
                        <FormDescription>
                          Ваше ім'я не буде відображатись у списку донорів
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex justify-between mb-4">
                    <span className="text-lg font-medium">Всього до сплати:</span>
                    <span className="text-xl font-bold text-emerald-600">{form.watch("amount")} грн</span>
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="consentToRules"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Я прочитав і погоджуюсь з{" "}
                          <Link href="/terms" className="text-emerald-600 hover:underline">
                            Правилами перерахування коштів
                          </Link>
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-center">
                  <Button 
                    type="submit" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-6 text-lg w-full md:w-auto" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Обробка...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Надіслати допомогу
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}