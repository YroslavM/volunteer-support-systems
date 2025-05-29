import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Heart } from "lucide-react";

// Схема для валідації форми донату
const donationSchema = z.object({
  amount: z.number().min(1, "Сума повинна бути більше 0"),
  email: z.string().email("Невірний формат email"),
  comment: z.string().optional(),
  anonymous: z.boolean().default(false),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: "Необхідно погодитися з правилами"
  }),
});

type DonationForm = z.infer<typeof donationSchema>;

// Функція форматування валюти
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uk-UA', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DonatePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Отримуємо ID проєкту з URL
  const projectId = window.location.pathname.split('/').pop();

  // Запит для отримання даних проєкту
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Форма для донатів
  const donationForm = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 0,
      email: user?.email || "",
      comment: "",
      anonymous: false,
      agreeToTerms: false,
    },
  });

  // Мутація для донатів
  const donateMutation = useMutation({
    mutationFn: async (data: DonationForm) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/donate`, {
        amount: data.amount,
        comment: data.comment || null
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успішно",
        description: "Дякуємо за вашу пожертву! Кошти будуть передані на проєкт.",
        duration: 5000,
      });
      donationForm.reset();
      // Повертаємося до сторінки проєкту
      setLocation(`/projects/${projectId}`);
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      if (error.message.includes("502") || error.message.includes("Bad Gateway")) {
        errorMessage = "Помилка з'єднання з сервером (502: Bad Gateway). Спробуйте пізніше.";
      }
      toast({
        title: "Помилка при здійсненні донату",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const onSubmitDonation = (data: DonationForm) => {
    if (!project) return;
    
    // Перевіряємо чи сума не перевищує залишок
    const remainingAmount = project.targetAmount - project.collectedAmount;
    if (data.amount > remainingAmount) {
      toast({
        title: "Помилка",
        description: `Сума не може перевищувати залишок ${formatCurrency(remainingAmount)} грн`,
        variant: "destructive",
      });
      return;
    }
    
    donateMutation.mutate(data);
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Проєкт не знайдено</h1>
          <Button onClick={() => setLocation("/")}>
            Повернутися на головну
          </Button>
        </div>
      </div>
    );
  }

  const remainingAmount = project.targetAmount - project.collectedAmount;

  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Кнопка повернення */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={() => setLocation(`/projects/${projectId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
            Повернутися до проєкту
          </Button>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Допомога проєкту</h1>
          <h2 className="text-xl text-green-600 font-medium mb-4">{project.name}</h2>
          <div>
            <p className="text-sm text-gray-600 mb-1">Залишилося зібрати, грн</p>
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Форма донату */}
        <Card className="bg-white shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Heart className="h-6 w-6" />
              Зробити внесок
            </CardTitle>
            <CardDescription className="text-green-600">
              Ваша допомога важлива для реалізації цього проєкту
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <Form {...donationForm}>
              <form onSubmit={donationForm.handleSubmit(onSubmitDonation)} className="space-y-6">
                <FormField
                  control={donationForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Сума внеску</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="10000"
                            min="1"
                            max={remainingAmount}
                            className="text-right pr-8 h-12 text-lg"
                            {...field}
                            onChange={(e) => {
                              let value = Number(e.target.value);
                              // Автоматично обмежуємо значення
                              if (value < 1) value = 1;
                              if (value > remainingAmount) value = remainingAmount;
                              field.onChange(value);
                            }}
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">₴</span>
                        </div>
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        Сума внеску не має перевищувати залишок {formatCurrency(remainingAmount)} грн
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={donationForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="your@email.com"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-gray-500">
                          Email не відображається публічно
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={donationForm.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Ваш коментар</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Коментар"
                            className="h-12"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={donationForm.control}
                  name="anonymous"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-base font-medium">Анонімний внесок</FormLabel>
                        <p className="text-sm text-gray-500">
                          Ваше ім'я не буде відображатися у списку донорів
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-medium">Всього до сплати:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(donationForm.watch("amount") || 0)} грн
                    </span>
                  </div>
                  
                  <FormField
                    control={donationForm.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-6">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-gray-600">
                            Я прочитав і погоджуюся з{" "}
                            <span className="text-blue-600 underline cursor-pointer">
                              Правилами переказування коштів
                            </span>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                    disabled={
                      donateMutation.isPending ||
                      !donationForm.watch("amount") ||
                      donationForm.watch("amount") < 1 ||
                      !donationForm.watch("email") ||
                      !donationForm.watch("agreeToTerms")
                    }
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    {donateMutation.isPending ? "Обробка..." : "Надіслати допомогу"}
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