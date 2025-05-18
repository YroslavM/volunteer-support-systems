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
  const [activeTab, setActiveTab] = useState("url");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is a coordinator
  if (user && user.role !== "coordinator") {
    navigate("/");
    return null;
  }

  // Project form for URL-based images
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
  
  // File upload form
  const fileForm = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema.omit({ imageUrl: true })),
    defaultValues: {
      name: "",
      description: "",
      targetAmount: 0,
      bankDetails: "",
    },
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear file selection
  const clearFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle URL form submission
  const onSubmitUrlForm = async (values: CreateProjectFormValues) => {
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
      
      // Redirect to the coordinator dashboard
      navigate("/dashboard/coordinator");
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
  
  // Handle file upload form submission
  const onSubmitFileForm = async (values: any) => {
    if (!selectedFile) {
      toast({
        title: "Відсутнє зображення",
        description: "Будь ласка, оберіть файл зображення для проєкту",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Create FormData object
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("description", values.description);
      formData.append("targetAmount", values.targetAmount.toString());
      formData.append("bankDetails", values.bankDetails);
      formData.append("projectImage", selectedFile);
      
      // Send request with FormData
      const response = await fetch("/api/projects/with-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create project");
      }
      
      const newProject = await response.json();
      
      // Update projects cache
      queryClient.invalidateQueries({ queryKey: ["/api/coordinator/projects"] });
      
      toast({
        title: t("projects.create.success"),
        description: `Проєкт "${newProject.name}" успішно створено`,
      });
      
      // Redirect to the coordinator dashboard
      navigate("/dashboard/coordinator");
    } catch (error) {
      console.error("Failed to create project with file:", error);
      toast({
        title: "Помилка",
        description: error instanceof Error ? error.message : "Не вдалося створити проєкт. Перевірте дані та спробуйте знову.",
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
            <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL-зображення</TabsTrigger>
                <TabsTrigger value="file">Завантажити файл</TabsTrigger>
              </TabsList>
              
              {/* URL Image Form */}
              <TabsContent value="url">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitUrlForm)} className="space-y-6">
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
              </TabsContent>
              
              {/* File Upload Form */}
              <TabsContent value="file">
                <Form {...fileForm}>
                  <form onSubmit={fileForm.handleSubmit(onSubmitFileForm)} className="space-y-6">
                    <FormField
                      control={fileForm.control}
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
                      control={fileForm.control}
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
                    
                    <div className="space-y-2">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium leading-none mb-2">
                          Зображення проєкту
                        </label>
                        
                        <div className="flex flex-col space-y-2">
                          <div 
                            className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedFile ? "border-blue-400" : "border-gray-300"
                            }`}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {previewUrl ? (
                              <>
                                <div className="relative w-full max-w-md">
                                  <img 
                                    src={previewUrl} 
                                    alt="Preview" 
                                    className="mx-auto max-h-[200px] object-contain rounded-md"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      clearFileSelection();
                                    }}
                                  >
                                    X
                                  </Button>
                                </div>
                                <p className="mt-2 text-sm text-gray-500">
                                  {selectedFile?.name} ({selectedFile && selectedFile.size ? Math.round(selectedFile.size / 1024) : 0} KB)
                                </p>
                              </>
                            ) : (
                              <>
                                <CloudUpload className="h-12 w-12 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                  Натисніть, щоб обрати або перетягніть зображення сюди
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Підтримувані формати: JPG, PNG, GIF (макс. 5MB)
                                </p>
                              </>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <FormField
                      control={fileForm.control}
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
                      control={fileForm.control}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
