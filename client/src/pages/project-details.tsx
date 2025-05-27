import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  SelectProject, 
  SelectUser
} from "@shared/schema";
import { 
  AttachMoney, 
  Group, 
  ArrowBack,
  Edit,
  Delete
} from "@mui/icons-material";
import { Loader2, AlertTriangle, HeartHandshake } from "lucide-react";

export default function ProjectDetails() {
  const [location] = useLocation();
  // В wouter location - це рядок шляху
  const pathParts = location ? location.split("/") : [];
  const projectId = pathParts.length > 2 ? parseInt(pathParts[2]) : null;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Queries
  const { data: project, isLoading: projectLoading } = useQuery<SelectProject>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  const { data: coordinator, isLoading: coordinatorLoading } = useQuery<SelectUser>({
    queryKey: ["/api/users", project?.coordinatorId],
    enabled: !!project?.coordinatorId,
    queryFn: async () => {
      const res = await fetch(`/api/users/${project?.coordinatorId}`);
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  // Apply to project mutation
  const applyMutation = useMutation({
    mutationFn: async (message: string = "") => {
      return apiRequest("POST", `/api/projects/${projectId}/apply`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Заявку подано",
        description: "Ваша заявка успішно подана. Очікуйте на рішення координатора.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/applications`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Check if current volunteer has already applied
  const { data: hasApplied } = useQuery<boolean>({
    queryKey: [`/api/projects/${projectId}/has-applied`],
    enabled: !!projectId && !!user && user.role === "volunteer",
    queryFn: async () => {
      try {
        const res = await fetch(`/api/user/applications?projectId=${projectId}`);
        if (!res.ok) return false;
        const applications = await res.json();
        return applications.length > 0;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Delete project mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Проєкт видалено",
        description: "Проєкт було успішно видалено.",
      });
      // Перенаправлення на сторінку проєктів або на дашборд координатора
      setTimeout(() => {
        if (user?.role === 'coordinator') {
          navigate("/dashboard/coordinator");
        } else {
          navigate("/projects");
        }
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка видалення",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Apply to project
  const handleApply = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    applyMutation.mutate("");
  };
  
  // Delete project
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
      // Авто-закриття діалогу підтвердження через 5 секунд
      setTimeout(() => setShowDeleteConfirm(false), 5000);
    }
  };
  
  // Calculate progress percentage
  const progressPercentage = project 
    ? Math.min(Math.round((project.currentAmount / project.targetAmount) * 100), 100)
    : 0;
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Loading state
  if (projectLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Project not found
  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Проєкт не знайдено</h1>
          <p className="text-gray-600 mb-8">Проєкт не існує або був видалений.</p>
          <Link href="/projects">
            <Button>Повернутися до проєктів</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4 flex items-center">
            <ArrowBack className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left column - project details */}
          <div className="col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-64 bg-gray-300 relative">
                <img 
                  src={project.imageUrl || "https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"} 
                  alt={project.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <Badge className={`mb-2 ${getStatusColor(project.projectStatus)}`}>
                    {t(`projects.status.${project.projectStatus}`)}
                  </Badge>
                  <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-6 whitespace-pre-line">{project.description}</p>
                
                {project.status === 'funding' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('home.projects.collected')}: {project.currentAmount?.toLocaleString('uk-UA') || '0'} ₴</span>
                      <span className="font-medium">{t('home.projects.target')}: {project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
                
                <div className="mt-6 flex flex-wrap gap-3">
                  {/* Кнопка "Підтримати" для всіх користувачів, якщо проект у стані збору коштів */}
                  {project.status === 'funding' && (
                    <Link href={`/donate/${project.id}`}>
                      <Button className="bg-green-600 hover:bg-green-700 text-white flex items-center">
                        <HeartHandshake className="mr-2 h-5 w-5" />
                        Підтримати
                      </Button>
                    </Link>
                  )}
                  
                  {/* Кнопки для волонтерів */}
                  {user && user.role === 'volunteer' && project.status === 'in_progress' && hasApplied === false && (
                    <Button 
                      onClick={handleApply} 
                      disabled={applyMutation.isPending}
                      className="flex items-center"
                    >
                      {applyMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading')}
                        </>
                      ) : (
                        <>
                          <Group className="mr-2" />
                          {t('projects.details.applyButton')}
                        </>
                      )}
                    </Button>
                  )}
                  
                  {user && user.role === 'volunteer' && hasApplied && (
                    <Badge variant="outline" className="py-2 px-3">
                      Заявку подано
                    </Badge>
                  )}
                  
                  {/* Координаторські кнопки */}
                  {user && user.role === 'coordinator' && project.coordinatorId === user.id && (
                    <>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Button variant="outline" className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" />
                          Редагувати проєкт
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        className="flex items-center"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Видалення...
                          </>
                        ) : showDeleteConfirm ? (
                          <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Підтвердити видалення
                          </>
                        ) : (
                          <>
                            <Delete className="mr-2 h-4 w-4" />
                            Видалити проєкт
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  
                  {/* Адмінські кнопки */}
                  {user && user.role === 'admin' && (
                    <>
                      <Link href={`/projects/${project.id}/edit`}>
                        <Button variant="outline" className="flex items-center bg-amber-100">
                          <Edit className="mr-2 h-4 w-4" />
                          Редагувати проєкт (Адмін)
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        className="flex items-center"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Видалення...
                          </>
                        ) : showDeleteConfirm ? (
                          <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Підтвердити видалення (Адмін)
                          </>
                        ) : (
                          <>
                            <Delete className="mr-2 h-4 w-4" />
                            Видалити проєкт (Адмін)
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - project details */}
          <div>
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Зібрано коштів</CardTitle>
                <CardDescription>Фінансова мета проекту</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{project.currentAmount?.toLocaleString('uk-UA') || '0'} ₴</div>
                <div className="text-sm text-gray-500 mt-1">
                  Зібрано {progressPercentage}% від необхідної суми
                </div>
                
                <div className="mt-6">
                  <Progress value={progressPercentage} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm">
                    <span>0 ₴</span>
                    <span>{project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                  </div>
                </div>
                
                {project.status === 'funding' && (
                  <div className="mt-6">
                    <Link href={`/donate/${project.id}`}>
                      <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Підтримати проєкт
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle>Координатор проєкту</CardTitle>
                <CardDescription>Контактна особа</CardDescription>
              </CardHeader>
              <CardContent>
                {coordinatorLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : coordinator ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-700">
                        {coordinator.firstName?.[0] || coordinator.username[0]}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">
                        {coordinator.firstName && coordinator.lastName 
                          ? `${coordinator.firstName} ${coordinator.lastName}` 
                          : coordinator.username}
                      </div>
                      <div className="text-sm text-gray-500">{coordinator.email}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">Інформація про координатора недоступна</div>
                )}
                
                <Button variant="outline" className="w-full mt-4">
                  Зв'язатися
                </Button>
              </CardContent>
            </Card>
            
            <Card className="mt-6 shadow-md">
              <CardHeader>
                <CardTitle>Поділитися</CardTitle>
                <CardDescription>Розповісти про проєкт</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 justify-center">
                  <Button variant="outline" size="icon" className="w-9 h-9 rounded-full">
                    <span className="text-lg">F</span>
                  </Button>
                  <Button variant="outline" size="icon" className="w-9 h-9 rounded-full">
                    <span className="text-lg">T</span>
                  </Button>
                  <Button variant="outline" size="icon" className="w-9 h-9 rounded-full">
                    <span className="text-lg">TG</span>
                  </Button>
                </div>
                
                <div className="mt-3 border rounded p-2 text-sm">
                  <code className="text-xs break-all">
                    https://volunteerhub.com/projects/{project.id}
                  </code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-2 h-6 px-2 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `https://volunteerhub.com/projects/${project.id}`
                      );
                      toast({
                        title: "Скопійовано",
                        description: "Посилання скопійовано в буфер обміну",
                        duration: 2000,
                      });
                    }}
                  >
                    Копіювати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}