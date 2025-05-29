import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Eye, 
  Edit, 
  Users, 
  FileText, 
  Trash2, 
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  DollarSign
} from "lucide-react";

type Task = {
  id: number;
  name: string;
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
};

type Project = {
  id: number;
  name: string;
};

const taskTypes = {
  collection: "Збір речей",
  on_site: "Допомога на місці", 
  event_organization: "Організація заходу",
  online_support: "Онлайн-підтримка",
  other: "Інше"
};

const taskStatuses = {
  pending: { label: "Очікує волонтерів", color: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "Активне", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Завершене", color: "bg-green-100 text-green-800" }
};

export default function CoordinatorTasksPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Завантаження проєктів координатора
  const { data: projects } = useQuery<Project[]>({
    queryKey: [`/api/projects/coordinator/${user?.id}`],
    queryFn: getQueryFn(),
    enabled: !!user?.id,
  });

  // Завантаження всіх завдань для проєктів координатора
  const { data: allTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: [`/api/coordinator/tasks`],
    queryFn: async () => {
      if (!projects?.length) return [];
      
      const taskPromises = projects.map(project => 
        apiRequest("GET", `/api/projects/${project.id}/tasks`)
          .then(res => res.json())
          .catch(() => [])
      );
      
      const taskArrays = await Promise.all(taskPromises);
      return taskArrays.flat();
    },
    enabled: !!projects?.length,
  });

  // Фільтрація завдань
  const filteredTasks = allTasks.filter(task => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesProject = projectFilter === "all" || task.projectId.toString() === projectFilter;
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         taskTypes[task.type].toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesProject && matchesSearch;
  });

  // Статистика завдань
  const taskStats = {
    total: allTasks.length,
    active: allTasks.filter(t => t.status === "in_progress").length,
    completed: allTasks.filter(t => t.status === "completed").length,
    pending: allTasks.filter(t => t.status === "pending").length
  };

  // Мутація для видалення завдання
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
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

  const handleDeleteTask = (taskId: number) => {
    if (window.confirm("Ви впевнені, що хочете видалити це завдання?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // Перевірка, чи термін завдання минув
  const isOverdue = (deadline: string | null, status: string) => {
    if (!deadline || status === "completed") return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => setLocation("/coordinator")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад до панелі
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Мої завдання</h1>
            <p className="text-sm text-gray-500">
              Усього завдань: {taskStats.total} | Активні: {taskStats.active} | Завершені: {taskStats.completed}
            </p>
          </div>
        </div>
        
        <Link href="/create-project">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Створити проєкт
          </Button>
        </Link>
      </div>

      {/* Фільтри */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фільтри
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Пошук
              </label>
              <Input
                placeholder="Назва завдання..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Статус
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі статуси" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі статуси</SelectItem>
                  <SelectItem value="pending">Очікує волонтерів</SelectItem>
                  <SelectItem value="in_progress">Активне</SelectItem>
                  <SelectItem value="completed">Завершене</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Проєкт
              </label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі проєкти" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Всі проєкти</SelectItem>
                  {projects?.map(project => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список завдань */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Завдань не знайдено
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {allTasks.length === 0 
                ? "Ви ще не створили жодного завдання"
                : "Спробуйте змінити фільтри пошуку"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => {
            const project = projects?.find(p => p.id === task.projectId);
            const overdue = isOverdue(task.deadline, task.status);
            
            return (
              <Card key={task.id} className={`transition-shadow hover:shadow-md ${overdue ? 'border-red-200 bg-red-50' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.name}
                        </h3>
                        <Badge className={taskStatuses[task.status].color}>
                          {taskStatuses[task.status].label}
                        </Badge>
                        {task.requiresExpenses && (
                          <Badge variant="outline" className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            Фінанси
                          </Badge>
                        )}
                        {overdue && (
                          <Badge variant="destructive" className="flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Прострочено
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Тип:</span>
                          <br />
                          {taskTypes[task.type]}
                        </div>
                        <div>
                          <span className="font-medium">Проєкт:</span>
                          <br />
                          {project?.name || "Невідомий"}
                        </div>
                        <div>
                          <span className="font-medium">Волонтери:</span>
                          <br />
                          {task.assignedVolunteerId ? "1" : "0"} / {task.volunteersNeeded}
                          {!task.assignedVolunteerId && (
                            <span className="text-orange-600 ml-1">⚠️</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Термін:</span>
                          <br />
                          {task.deadline 
                            ? new Date(task.deadline).toLocaleDateString("uk-UA")
                            : "Не вказано"
                          }
                        </div>
                      </div>
                      
                      {task.location && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Місце:</span> {task.location}
                        </div>
                      )}
                    </div>
                    
                    {/* Кнопки дій */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}