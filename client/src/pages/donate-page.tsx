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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Mail, Edit3, Check, ArrowLeft, Info } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [, projectId] = useLocation();
  const id = projectId.split("/")[2];
  
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
      amount: 0,
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
    <div className="bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/projects/${id}`}>
          <Button variant="ghost" className="mb-6 flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Повернутися до проекту
          </Button>
        </Link>
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-heading font-bold mb-2">Допомога {project.name}</h1>
          <p className="text-slate-600">
            Залишилось зібрати, грн
          </p>
          <div className="text-emerald-500 text-4xl font-bold">
            {Math.max(0, project.targetAmount - project.collectedAmount).toLocaleString()}
          </div>
        </div>
        
        <Tabs defaultValue="onetime" value={donationType} onValueChange={(value) => setDonationType(value as "onetime" | "regular")}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="onetime" onClick={() => form.setValue("donationType", "onetime")}>РАЗОВА ДОПОМОГА</TabsTrigger>
            <TabsTrigger value="regular" onClick={() => form.setValue("donationType", "regular")}>РЕГУЛЯРНА ДОПОМОГА</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Вибір валюти оплати</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Виберіть валюту" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="card">Українська гривня</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Ваш внесок автоматично конвертується та зараховується на рахунок у UAH по курсу платіжних систем.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div>
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
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              min="0"
                              step="10"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <span className="text-gray-500">₴</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Сума внеску не має перевищувати залишок
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {donationType === "regular" && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="mr-4">
                      <FormLabel>Підтримати Dobrodziy (за бажанням)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            disabled
                            value="0.00"
                            className="bg-blue-100 border-blue-200"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500">₴</span>
                          </div>
                        </div>
                      </FormControl>
                    </div>
                    <div className="mt-7 text-sm text-blue-600">
                      Інша сума
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-blue-600">
                    Це ваш внесок в існування нашої благодійної платформи
                  </p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Спосіб оплати</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Виберіть спосіб оплати" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="card">Visa, Master Card / Приват24</SelectItem>
                        <SelectItem value="bank">Банківський переказ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Розмір банківської комісії та комісії платіжних систем за здійснення платежу залежить від обраного Вами способу оплати
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
                        Email не відображається на сайті та використовується лише для сповіщення про новини в проектах.
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
                      <FormLabel>Ваш підпис (побажання)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваше побажання" {...field} />
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
                      <FormLabel>Анонімний платіж</FormLabel>
                      <FormDescription>
                        Зробити платіж анонімним (Ваші дані, окрім підпису, не будуть відображатись у переліку донорів)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-medium">Всього до сплати:</span>
                  <span className="text-lg font-bold">{form.watch("amount")} грн</span>
                </div>
                <div className="text-sm text-gray-500 mb-4">
                  Комісія банку за обробку онлайн платежу: 0.00
                </div>
                <div className="text-sm text-gray-500 mb-6">
                  Комісія з платежів власників карт Visa та MasterCard – 0%.
                  Зверніть увагу, що при оплаті карткою не українського банку, фактична сума платежу у валюті, може бути більше на суму банківської комісії вашого банку за конвертацію.
                  Робота Dobrodziy підтримується за рахунок щорічного гранту Фонду Віктора Пінчука та добровільних пожертв донорів.
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
                        <Link href="/terms" className="text-blue-600 hover:underline">
                          Правилами перерахування коштів
                        </Link>{" "}
                        на Dobrodziy від БО МБФ «Українська Біржа Благодійності»
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <Button type="submit" className="px-12 py-6 text-lg" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Обробка...
                    </>
                  ) : (
                    "Сплатити"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </div>
    </div>
  );
}