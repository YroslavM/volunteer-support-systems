import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectProject, SelectUser } from "@shared/schema";
import { 
  Check, 
  X, 
  Filter, 
  Search, 
  Calendar,
  User
} from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

// Типи для модерації проектів
type ModerateAction = "approve" | "reject";

type ModerationStatus = "pending" | "approved" | "rejected" | "all";

export default function ModeratorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Стан фільтрації
  const [statusFilter, setStatusFilter] = useState<ModerationStatus>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [currentAction, setCurrentAction] = useState<ModerateAction | null>(null);

  // Отримання всіх проектів
  const { data: projects, isLoading: projectsLoading, refetch } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
    retry: 1
  });

  // Отримання координаторів проектів
  const [coordinators, setCoordinators] = useState<Record<number, SelectUser>>({});

  // Завантаження даних координаторів для проектів
  useEffect(() => {
    if (projects && projects.length > 0) {
      const loadCoordinators = async () => {
        const coordinatorsMap: Record<number, SelectUser> = {};
        
        for (const project of projects) {
          if (!coordinatorsMap[project.coordinatorId]) {
            try {
              const res = await fetch(`/api/users/${project.coordinatorId}`);
              if (res.ok) {
                const coordinator = await res.json();
                coordinatorsMap[project.coordinatorId] = coordinator;
              }
            } catch (error) {
              console.error("Failed to fetch coordinator:", error);
            }
          }
        }
        
        setCoordinators(coordinatorsMap);
      };
      
      loadCoordinators();
    }
  }, [projects]);

  // Мутація для модерації проекту
  const moderateProjectMutation = useMutation({
    mutationFn: async ({ projectId, action, comment }: { projectId: number; action: ModerateAction; comment?: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/moderate`, {
        status: action,
        comment: comment || undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: currentAction === "approve" ? "Проект схвалено" : "Проект відхилено",
        description: currentAction === "approve" 
          ? "Проект успішно опубліковано і тепер доступний для волонтерів" 
          : "Проект відхилено і повернуто координатору на доопрацювання",
      });
      
      // Оновити список проектів
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      refetch();
      
      // Скинути стан
      setCurrentProjectId(null);
      setRejectionReason("");
      setIsAlertOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: `Не вдалося ${currentAction === "approve" ? "схвалити" : "відхилити"} проект: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Обробник схвалення/відхилення проекту
  const handleModerateAction = (projectId: number, action: ModerateAction) => {
    setCurrentProjectId(projectId);
    setCurrentAction(action);
    
    if (action === "reject") {
      setIsAlertOpen(true);
    } else {
      moderateProjectMutation.mutate({ projectId, action });
    }
  };

  // Підтвердження відхилення проекту з коментарем
  const confirmReject = () => {
    if (currentProjectId) {
      moderateProjectMutation.mutate({ 
        projectId: currentProjectId, 
        action: "reject", 
        comment: rejectionReason 
      });
    }
  };

  // Фільтрація проектів за статусом та пошуковим запитом
  const filteredProjects = () => {
    if (!projects) return [];
    
    return projects.filter(project => {
      // Фільтрація за текстом
      const matchesSearch = 
        searchQuery === "" || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Фільтрація за статусом модерації (наразі всі проекти вважаються pending)
      const matchesStatus = statusFilter === "all" || statusFilter === "pending";
      
      return matchesSearch && matchesStatus;
    });
  };

  // Форматування дати
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "d MMMM yyyy, HH:mm", { locale: uk });
  };

  // Отримати відформатоване ім'я координатора
  const getCoordinatorName = (coordinatorId: number) => {
    const coordinator = coordinators[coordinatorId];
    if (coordinator) {
      return coordinator.firstName && coordinator.lastName 
        ? `${coordinator.firstName} ${coordinator.lastName}` 
        : coordinator.username;
    }
    return `Координатор #${coordinatorId}`;
  };

  return (
    <div className="bg-gray-50 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
            Панель модератора
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Вітаємо, {user?.firstName || user?.username}! Тут ви можете переглядати та модерувати проєкти перед їх публікацією.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Модерація проєктів</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Фільтри */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  className="pl-10"
                  placeholder="Пошук проєктів за назвою або описом..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2 items-center">
                <Filter size={18} className="text-gray-400" />
                <Label className="whitespace-nowrap">Статус:</Label>
                <select 
                  className="border rounded px-3 py-2 bg-white"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ModerationStatus)}
                >
                  <option value="pending">Очікують перевірки</option>
                  <option value="approved">Схвалені</option>
                  <option value="rejected">Відхилені</option>
                  <option value="all">Усі</option>
                </select>
              </div>
            </div>

            {/* Список проєктів */}
            {projectsLoading ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">Завантаження проєктів...</p>
              </div>
            ) : (
              filteredProjects().length === 0 ? (
                <div className="text-center py-20">
                  <Filter className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    Проєктів не знайдено
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Немає проєктів, що відповідають вибраним фільтрам
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects().map((project) => (
                    <div key={project.id} className="bg-white border rounded-lg p-4 shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 px-2 py-0.5 md:ml-2">
                              Очікує перевірки
                            </Badge>
                          </div>
                          
                          <div className="text-gray-500 mb-2 text-sm flex items-center">
                            <User size={16} className="mr-1" />
                            {getCoordinatorName(project.coordinatorId)}
                          </div>
                          
                          <div className="text-gray-500 mb-2 text-sm flex items-center">
                            <Calendar size={16} className="mr-1" />
                            Створено: {formatDate(project.createdAt)}
                          </div>
                          
                          <div className="mt-2">
                            <h4 className="font-medium mb-1">Опис проєкту:</h4>
                            <p className="text-gray-700">{project.description}</p>
                          </div>
                          
                          {project.imageUrl && (
                            <div className="mt-4">
                              <img 
                                src={project.imageUrl} 
                                alt={project.name} 
                                className="rounded-md max-h-48 object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-1">Цільова сума:</h4>
                              <p className="text-gray-700">{project.targetAmount.toLocaleString()} ₴</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Зібрано:</h4>
                              <p className="text-gray-700">{project.collectedAmount.toLocaleString()} ₴</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Статус:</h4>
                              <p className="text-gray-700">{project.status}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-1">Дата створення:</h4>
                              <p className="text-gray-700">{formatDate(project.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 md:mt-0 md:ml-4 flex md:flex-col gap-2">
                          <Button 
                            className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none" 
                            onClick={() => handleModerateAction(project.id, "approve")}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Схвалити
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-red-300 text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                            onClick={() => handleModerateAction(project.id, "reject")}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Відхилити
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </div>

      {/* Діалог для відхилення проекту */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Відхилити проект</AlertDialogTitle>
            <AlertDialogDescription>
              Вкажіть, будь ласка, причину відхилення проекту. Цей коментар буде надіслано координатору проекту.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Опишіть причину відхилення..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-red-600 hover:bg-red-700">
              Відхилити проект
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}