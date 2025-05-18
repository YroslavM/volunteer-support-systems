import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowBack, CloudUpload, Image } from "@mui/icons-material";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Project creation form schema
const createProjectSchema = z.object({
  name: z.string().min(5, { message: "Назва проєкту має містити мінімум 5 символів" }),
  description: z.string().min(20, { message: "Опис проєкту має містити мінімум 20 символів" }),
  imageUrl: z.string().url({ message: "Введіть коректний URL зображення" }).optional().or(z.literal("")),
  targetAmount: z.coerce.number().positive({ message: "Сума має бути більшою за нуль" }),
  bankDetails: z.string().min(5, { message: "Введіть реквізити для збору коштів" }),
});

// For file upload form
const createProjectWithFileSchema = z.object({
  name: z.string().min(5, { message: "Назва проєкту має містити мінімум 5 символів" }),
  description: z.string().min(20, { message: "Опис проєкту має містити мінімум 20 символів" }),
  targetAmount: z.coerce.number().positive({ message: "Сума має бути більшою за нуль" }),
  bankDetails: z.string().min(5, { message: "Введіть реквізити для збору коштів" }),
});

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

export default function CreateProject() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is a coordinator
  if (user && user.role !== "coordinator") {
    navigate("/");
    return null;
  }

  // Project form
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      targetAmount: 0,
      bankDetails: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: CreateProjectFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", "/api/projects", values);
      const newProject = await response.json();
      
      // Update projects cache
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/projects"] });
      
      toast({
        title: t("projects.create.success"),
        description: `Проєкт "${newProject.name}" успішно створено`,
      });
      
      // Redirect to the new project page
      navigate(`/projects/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити проєкт. Перевірте дані та спробуйте знову.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard/coordinator">
          <Button variant="ghost" className="mb-6 flex items-center">
            <ArrowBack className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </Link>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">
              {t("projects.create.title")}
            </CardTitle>
            <CardDescription>
              Заповніть форму, щоб створити новий проєкт для збору коштів
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.create.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Введіть назву проєкту" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.create.description")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Детальний опис проєкту, його мета та план реалізації" 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.create.imageUrl")}</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input placeholder="https://example.com/image.jpg" {...field} />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Введіть URL-адресу зображення для вашого проєкту
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.create.targetAmount")}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            min="0"
                            step="100"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-500">₴</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bankDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("projects.create.bankDetails")}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Номер картки, реквізити рахунку або інша інформація для збору коштів" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Link href="/dashboard/coordinator">
                    <Button variant="outline" type="button">
                      {t("common.cancel")}
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("common.loading")}
                      </>
                    ) : (
                      t("projects.create.submit")
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
