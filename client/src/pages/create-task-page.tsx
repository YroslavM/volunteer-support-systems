import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Plus, Users } from "lucide-react";

// Схема валідації для створення завдання
const createTaskSchema = z.object({
  name: z.string().min(3, "Назва завдання повинна містити принаймні 3 символи"),
  description: z.string().min(10, "Опис повинен містити принаймні 10 символів"),
  type: z.enum(["collection", "on_site", "event_organization", "online_support", "other"]),
  deadline: z.string().optional(),
  location: z.string().optional(),
  volunteersNeeded: z.number().min(1, "Потрібен принаймні 1 волонтер").max(100, "Максимум 100 волонтерів"),
  requiredSkills: z.string().optional(),
  requiresExpenses: z.boolean().default(false),
  estimatedAmount: z.number().optional(),
  expensePurpose: z.string().optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

// Типи завдань з українськими назвами
const taskTypes = [
  { value: "collection", label: "Збір речей" },
  { value: "on_site", label: "Допомога на місці" },
  { value: "event_organization", label: "Організація заходу" },
  { value: "online_support", label: "Онлайн-підтримка" },
  { value: "other", label: "Інше" },
];

export default function CreateTaskPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [assignNow, setAssignNow] = useState(false);

  const projectIdNum = parseInt(projectId || "0");

  // Отримуємо дані проєкту
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: [`/api/projects/${projectIdNum}`],
    enabled: !!projectId && !isNaN(projectIdNum),
  });

  // Отримуємо заявки волонтерів для проєкту
  const { data: applications = [] } = useQuery<any[]>({
    queryKey: [`/api/projects/${projectIdNum}/applications`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!projectId && !isNaN(projectIdNum),
  });

  const approvedApplications = Array.isArray(applications) ? applications.filter((app: any) => app.status === 'approved') : [];

  const taskForm = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "collection",
      deadline: "",
      location: "",
      volunteersNeeded: 1,
      requiredSkills: "",
      requiresExpenses: false,
      estimatedAmount: undefined,
      expensePurpose: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: CreateTaskForm) => {
      const res = await apiRequest("POST", `/api/projects/${projectIdNum}/tasks`, data);
      return await res.json();
    },
    onSuccess: (task) => {
      toast({
        title: "Завдання створено",
        description: `Завдання "${task.name}" успішно створено`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectIdNum}/tasks`] });
      
      // Повертаємося до координаторської панелі
      setLocation(`/coordinator`);
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка створення завдання",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitTask = (data: CreateTaskForm) => {
    createTaskMutation.mutate(data);
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!project || project.coordinatorId !== user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Доступ заборонено</h2>
            <p className="text-gray-600">У вас немає прав для створення завдань у цьому проєкті.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/coordinator")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Повернутися до панелі координатора
        </Button>
        
        <div className="bg-blue-50 p-4 rounded-lg border">
          <h1 className="text-2xl font-bold text-blue-800">Створення нового завдання</h1>
          <p className="text-blue-600 mt-1">Проєкт: {project.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Форма створення завдання */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Нове завдання
              </CardTitle>
              <CardDescription>
                Заповніть деталі завдання для волонтерів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(onSubmitTask)} className="space-y-6">
                  {/* Назва завдання */}
                  <FormField
                    control={taskForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Назва завдання *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Наприклад: Пакування гуманітарних наборів"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Тип завдання */}
                  <FormField
                    control={taskForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип завдання *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Оберіть тип завдання" />
                            </SelectTrigger>
                            <SelectContent>
                              {taskTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Опис завдання */}
                  <FormField
                    control={taskForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опис завдання *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Детальний опис того, що потрібно зробити волонтеру..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Дедлайн */}
                    <FormField
                      control={taskForm.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Термін виконання</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Кількість волонтерів */}
                    <FormField
                      control={taskForm.control}
                      name="volunteersNeeded"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Кількість волонтерів *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Локація */}
                  <FormField
                    control={taskForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Місце виконання</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Наприклад: вул. Хрещатик, 1, Київ або Онлайн"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Потрібні навички */}
                  <FormField
                    control={taskForm.control}
                    name="requiredSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Потрібні навички (опціонально)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Наприклад: досвід роботи з дітьми, водійські права категорії B..."
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Чи потребує завдання витрат */}
                  <FormField
                    control={taskForm.control}
                    name="requiresExpenses"
                    render={({ field }) => (
                      <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium">
                            Чи потребує завдання витрат коштів?
                          </FormLabel>
                          <p className="text-sm text-gray-600">
                            Позначте, якщо волонтер має витрачати кошти для виконання завдання
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Фінансові поля (показуються якщо requiresExpenses = true) */}
                  {taskForm.watch("requiresExpenses") && (
                    <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h3 className="font-medium text-yellow-800">Фінансові деталі</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={taskForm.control}
                          name="estimatedAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Орієнтовна сума (грн) *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  step="0.01"
                                  placeholder="1000"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={taskForm.control}
                          name="expensePurpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Призначення коштів *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Наприклад: закупівля харчових наборів"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Кнопки дій */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={createTaskMutation.isPending}
                      onClick={() => setAssignNow(false)}
                    >
                      {createTaskMutation.isPending ? "Створення..." : "Призначити пізніше"}
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="default"
                      className="flex-1"
                      disabled={createTaskMutation.isPending || approvedApplications.length === 0}
                      onClick={() => setAssignNow(true)}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {createTaskMutation.isPending ? "Створення..." : "Зберегти та призначити волонтерів"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Інформаційна панель */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Доступні волонтери</CardTitle>
            </CardHeader>
            <CardContent>
              {approvedApplications.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Затверджених заявок: {approvedApplications.length}
                  </p>
                  <div className="space-y-1">
                    {approvedApplications.slice(0, 3).map((app: any) => (
                      <div key={app.id} className="text-sm bg-green-50 p-2 rounded">
                        {app.volunteer?.username || "Волонтер"}
                      </div>
                    ))}
                    {approvedApplications.length > 3 && (
                      <p className="text-xs text-gray-500">
                        і ще {approvedApplications.length - 3} волонтерів...
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Немає затверджених заявок волонтерів
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Поради</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-green-700">Опис завдання:</h4>
                <p className="text-gray-600">
                  Будьте конкретними щодо того, що має робити волонтер
                </p>
              </div>
              <div>
                <h4 className="font-medium text-blue-700">Фінансові завдання:</h4>
                <p className="text-gray-600">
                  Якщо завдання потребує витрат, волонтер має надавати фінансові звіти
                </p>
              </div>
              <div>
                <h4 className="font-medium text-purple-700">Призначення:</h4>
                <p className="text-gray-600">
                  Ви можете призначити волонтерів зараз або пізніше
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}