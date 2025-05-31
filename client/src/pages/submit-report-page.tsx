import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { SelectTask } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload, FileText, DollarSign, Loader2 } from "lucide-react";
import { Link } from "wouter";

const reportSchema = z.object({
  description: z.string().min(10, "Опис має містити мінімум 10 символів"),
  spentAmount: z.number().optional(),
  expensePurpose: z.string().optional(),
  comment: z.string().optional(),
  financialConfirmed: z.boolean().optional(),
}).refine((data) => {
  // If task requires expenses, financial fields are required
  return true; // We'll check this in the component
}, "Фінансові поля обов'язкові для завдань з витратами");

type ReportFormData = z.infer<typeof reportSchema>;

export default function SubmitReportPage() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);

  const taskId = params.id ? parseInt(params.id) : null;

  // Load task details
  const { data: task, isLoading: taskLoading } = useQuery<SelectTask>({
    queryKey: ["/api/tasks", taskId],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  // Check if report already exists
  const { data: existingReports = [] } = useQuery({
    queryKey: ["/api/tasks", taskId, "reports"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  const existingReport = existingReports.find((report: any) => 
    report.volunteerId === user?.id
  );

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      description: existingReport?.description || "",
      spentAmount: existingReport?.spentAmount || undefined,
      expensePurpose: existingReport?.expensePurpose || "",
      comment: existingReport?.coordinatorComment || "",
      financialConfirmed: existingReport?.financialConfirmed || false,
    },
  });

  // Submit report mutation
  const submitReportMutation = useMutation({
    mutationFn: async (data: ReportFormData) => {
      const formData = new FormData();
      
      // Add text fields
      formData.append("taskId", taskId!.toString());
      formData.append("description", data.description);
      if (data.comment) formData.append("comment", data.comment);
      
      // Add financial fields if task requires expenses
      if (task?.requiresExpenses) {
        if (data.spentAmount) formData.append("spentAmount", data.spentAmount.toString());
        if (data.expensePurpose) formData.append("expensePurpose", data.expensePurpose);
        formData.append("financialConfirmed", data.financialConfirmed ? "true" : "false");
      }
      
      // Add image files
      selectedImages.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      // Add document files
      selectedDocuments.forEach((file, index) => {
        formData.append(`documents`, file);
      });

      const response = await apiRequest("POST", "/api/reports", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Звіт подано успішно",
        description: "Координатор розгляне ваш звіт найближчим часом",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "reports"] });
      queryClient.invalidateQueries({ queryKey: ["/api/volunteer/tasks"] });
      navigate("/dashboard/volunteer");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося подати звіт",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && (file.type === 'image/jpeg' || file.type === 'image/png')
    );
    
    if (selectedImages.length + imageFiles.length > 10) {
      toast({
        title: "Занадто багато файлів",
        description: "Максимум 10 зображень",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedImages(prev => [...prev, ...imageFiles]);
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'image/jpeg' || 
      file.type === 'image/png'
    );
    
    setSelectedDocuments(prev => [...prev, ...validFiles]);
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setSelectedDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: ReportFormData) => {
    // Validate financial fields if required
    if (task?.requiresExpenses) {
      if (!data.spentAmount || !data.expensePurpose || !data.financialConfirmed) {
        toast({
          title: "Заповніть всі обов'язкові поля",
          description: "Для завдань з витратами потрібно заповнити всі фінансові поля",
          variant: "destructive",
        });
        return;
      }
    }

    submitReportMutation.mutate(data);
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Завантаження...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Завдання не знайдено</div>
        </div>
      </div>
    );
  }

  const getReportStatus = () => {
    if (!existingReport) return null;
    
    switch (existingReport.status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">На перевірці</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Прийнято</Badge>;
      case "needs_clarification":
        return <Badge className="bg-red-100 text-red-800">Потрібні уточнення</Badge>;
      default:
        return null;
    }
  };

  const isResubmission = existingReport?.status === "needs_clarification";
  const canSubmit = !existingReport || isResubmission;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/volunteer">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Повернутися до завдань
            </Button>
          </Link>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{task.name}</CardTitle>
                  <p className="text-gray-600 mt-2">{task.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {task.requiresExpenses && (
                    <Badge variant="outline" className="flex items-center">
                      <DollarSign className="h-3 w-3 mr-1" />
                      З витратами
                    </Badge>
                  )}
                  {getReportStatus()}
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              {isResubmission ? "Редагувати та надіслати звіт повторно" : "Подати звіт"}
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {!canSubmit ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  {existingReport.status === "approved" 
                    ? "Звіт вже прийнято координатором"
                    : "Звіт на перевірці у координатора"
                  }
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опис виконаного *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Детально опишіть виконану роботу..."
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Image Upload */}
                  <div>
                    <FormLabel>Фотофіксація (до 10 зображень .jpg/.png)</FormLabel>
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" variant="outline" className="w-full" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Завантажити зображення
                          </span>
                        </Button>
                      </label>
                      
                      {selectedImages.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{file.name}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeImage(index)}
                              >
                                Видалити
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Fields */}
                  {task.requiresExpenses && (
                    <>
                      <FormField
                        control={form.control}
                        name="spentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Сума витрат (грн) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expensePurpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Призначення витрат *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Опишіть на що були витрачені кошти..."
                                {...field}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Document Upload */}
                      <div>
                        <FormLabel>Документи (.jpg, .png, .pdf)</FormLabel>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            multiple
                            onChange={handleDocumentUpload}
                            className="hidden"
                            id="document-upload"
                          />
                          <label htmlFor="document-upload">
                            <Button type="button" variant="outline" className="w-full" asChild>
                              <span>
                                <Upload className="h-4 w-4 mr-2" />
                                Завантажити документи
                              </span>
                            </Button>
                          </label>
                          
                          {selectedDocuments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {selectedDocuments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                  <span className="text-sm">{file.name}</span>
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeDocument(index)}
                                  >
                                    Видалити
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="financialConfirmed"
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
                                Я підтверджую, що всі витрати були здійснені відповідно до мети проєкту *
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {/* Comment */}
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Коментар (необов'язково)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Додаткові коментарі..."
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Coordinator Comment (if exists) */}
                  {existingReport?.coordinatorComment && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-900 mb-2">Коментар координатора:</h4>
                      <p className="text-red-800">{existingReport.coordinatorComment}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={submitReportMutation.isPending}
                  >
                    {submitReportMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Відправка...
                      </>
                    ) : (
                      isResubmission ? "Надіслати повторно" : "Подати звіт"
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}