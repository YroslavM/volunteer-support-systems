import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Eye, 
  Edit, 
  Users, 
  FileText, 
  Trash2, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  Filter,
  Search
} from "lucide-react";
import { Link } from "wouter";

type Task = {
  id: number;
  name: string;
  description: string;
  type: "collection" | "on_site" | "event_organization" | "online_support" | "other";
  status: "pending" | "in_progress" | "completed";
  projectId: number;
  assignedVolunteerId: number | null;
  deadline: string | null;
  location: string | null;
  volunteersNeeded: number;
  requiredSkills: string | null;
  requiresExpenses: boolean;
  estimatedAmount: number | null;
  expensePurpose: string | null;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    name: string;
  };
  assignedVolunteer?: {
    id: number;
    username: string;
  };
  reports?: any[];
};

const taskTypeLabels = {
  collection: "Збір коштів",
  on_site: "Робота на місці", 
  event_organization: "Організація заходів",
  online_support: "Онлайн підтримка",
  other: "Інше"
};

const statusLabels = {
  pending: "Очікує",
  in_progress: "Виконується", 
  completed: "Завершено"
};

export default function CoordinatorTasksManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Завантажуємо проєкти координатора
  const { data: projects = [] } = useQuery({
    queryKey: [`/api/projects/coordinator/${user?.id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.id,
  });

  // Завантажуємо завдання
  const { data: allTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/coordinator/tasks`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user?.id,
  });

  // Мутація для видалення завдання
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Завдання видалено",
        description: "Завдання успішно видалено",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/tasks`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка видалення",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Фільтруємо завдання
  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesType = typeFilter === "all" || task.type === typeFilter;
    
    return matchesSearch && matchesProject && matchesStatus && matchesType;
  });

  // Статистика
  const stats = {
    total: allTasks.length,
    active: allTasks.filter(t => t.status === "in_progress").length,
    completed: allTasks.filter(t => t.status === "completed").length,
    pending: allTasks.filter(t => t.status === "pending").length,
  };

  const getStatusBadge = (status: string) => {
    const variants: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
      pending: "outline",
      in_progress: "default", 
      completed: "secondary"
    };
    return <Badge variant={variants[status]}>{statusLabels[status as keyof typeof statusLabels]}</Badge>;
  };

  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === "completed") return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Мої завдання</h1>
          <p className="text-muted-foreground mt-2">
            Усього завдань: {stats.total} | Активні: {stats.active} | Завершені: {stats.completed} | Очікують: {stats.pending}
          </p>
        </div>
        <Link href="/coordinator">
          <Button variant="outline">Назад до панелі</Button>
        </Link>
      </div>

      {/* Фільтри */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Фільтри та пошук
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук завдань..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Проєкт" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі проєкти</SelectItem>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі статуси</SelectItem>
                <SelectItem value="pending">Очікує</SelectItem>
                <SelectItem value="in_progress">Виконується</SelectItem>
                <SelectItem value="completed">Завершено</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Тип завдання" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі типи</SelectItem>
                <SelectItem value="collection">Збір коштів</SelectItem>
                <SelectItem value="on_site">Робота на місці</SelectItem>
                <SelectItem value="event_organization">Організація заходів</SelectItem>
                <SelectItem value="online_support">Онлайн підтримка</SelectItem>
                <SelectItem value="other">Інше</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список завдань */}
      <div className="grid gap-4">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Завдань не знайдено</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className={`${isOverdue(task.deadline, task.status) ? 'border-red-500 bg-red-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center">
                      {task.name}
                      {task.requiresExpenses && <DollarSign className="ml-2 h-4 w-4 text-yellow-600" />}
                      {isOverdue(task.deadline, task.status) && (
                        <AlertTriangle className="ml-2 h-4 w-4 text-red-600" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Проєкт: {task.project?.name || `Проєкт #${task.projectId}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(task.status)}
                    <Badge variant="outline">{taskTypeLabels[task.type]}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium">Волонтери</p>
                    <p className="text-sm text-muted-foreground">
                      {task.assignedVolunteer ? (
                        `${task.assignedVolunteer.username} (1/${task.volunteersNeeded})`
                      ) : (
                        <span className="text-yellow-600">Не призначено жодного волонтера</span>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Дата виконання</p>
                    <p className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      {task.deadline ? new Date(task.deadline).toLocaleDateString('uk-UA') : 'Не вказана'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Звіт</p>
                    <p className="text-sm text-muted-foreground">
                      {task.reports && task.reports.length > 0 ? '🧾 Є звіт' : '❌ Немає звіту'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="flex items-center">
                    <Eye className="mr-1 h-3 w-3" />
                    Деталі
                  </Button>
                  
                  <Button size="sm" variant="outline" className="flex items-center">
                    <Edit className="mr-1 h-3 w-3" />
                    Редагувати
                  </Button>
                  
                  <Button size="sm" variant="outline" className="flex items-center">
                    <Users className="mr-1 h-3 w-3" />
                    Призначити волонтерів
                  </Button>
                  
                  <Button size="sm" variant="outline" className="flex items-center">
                    <FileText className="mr-1 h-3 w-3" />
                    Звіти
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center text-red-600 hover:text-red-700"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Видалити
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}