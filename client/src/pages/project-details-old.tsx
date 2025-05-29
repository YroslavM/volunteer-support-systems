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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  SelectProject, 
  SelectUser,
  SelectDonation,
  SelectProjectReport
} from "@shared/schema";
import { 
  AttachMoney, 
  Group, 
  ArrowBack,
  Edit,
  Delete,
  VolunteerActivism,
  Receipt,
  Chat
} from "@mui/icons-material";
import { Loader2, AlertTriangle, HeartHandshake, FileText, Users, MessageCircle } from "lucide-react";

export default function ProjectDetails() {
  const [location] = useLocation();
  // В wouter location - це рядок шляху
  const pathParts = location ? location.split("/") : [];
  const projectId = pathParts.length > 2 ? parseInt(pathParts[2]) : null;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("about");
  
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

  // Fetch project donations
  const { data: donations, isLoading: donationsLoading } = useQuery<SelectDonation[]>({
    queryKey: [`/api/projects/${projectId}/donations`],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/donations`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch project reports
  const { data: reports, isLoading: reportsLoading } = useQuery<SelectProjectReport[]>({
    queryKey: [`/api/projects/${projectId}/reports`],
    enabled: !!projectId,
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/reports`);
      if (!res.ok) return [];
      return res.json();
    },
  });
  
  // Apply to project mutation
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Користувач не авторизований");
      
      const applicationData = {
        message: `Заявка від ${user.firstName} ${user.lastName}`,
        // Дані профілю волонтера автоматично беруться з сесії користувача на бекенді
      };
      
      const response = await apiRequest("POST", `/api/projects/${projectId}/apply`, applicationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Заявку подано",
        description: "Ваша заявка успішно подана. Очікуйте на рішення координатора.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/user/applications`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/has-applied`] });
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
    
    applyMutation.mutate();
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
    ? Math.min(Math.round((project.collectedAmount / project.targetAmount) * 100), 100)
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
        
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 bg-gray-300 relative">
            <img 
              src={project.imageUrl || "https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"} 
              alt={project.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <Badge className={`mb-2 ${getStatusColor(project.status)}`}>
                {t(`projects.status.${project.status}`)}
              </Badge>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            </div>
          </div>
          
          {/* Project Actions */}
          <div className="p-6 border-b">
            <div className="flex flex-wrap gap-3">
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
              
              {/* Кнопки для координатора */}
              {user && user.role === 'coordinator' && project.coordinatorId === user.id && (
                <>
                  <Link href={`/projects/${project.id}/edit`}>
                    <Button variant="outline" className="flex items-center">
                      <Edit className="mr-2 h-4 w-4" />
                      Редагувати
                    </Button>
                  </Link>
                  
                  <Button 
                    variant={showDeleteConfirm ? "destructive" : "outline"} 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="flex items-center"
                  >
                    {deleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Видалення...
                      </>
                    ) : (
                      <>
                        <Delete className="mr-2 h-4 w-4" />
                        {showDeleteConfirm ? "Підтвердити видалення" : "Видалити"}
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Про проєкт
            </TabsTrigger>
            <TabsTrigger value="donors" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Донори
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Звіти та документи
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Коментарі
            </TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about" className="mt-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Опис проєкту</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                    
                    {project.status === 'funding' && (
                      <div className="mt-6">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">{t('home.projects.collected')}: {project.collectedAmount.toLocaleString('uk-UA')} ₴</span>
                          <span className="font-medium">{t('home.projects.target')}: {project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              {/* Coordinator Info Sidebar */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Координатор проєкту</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {coordinatorLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : coordinator ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                            {coordinator.firstName?.[0]}{coordinator.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium">{coordinator.firstName} {coordinator.lastName}</p>
                            <p className="text-sm text-gray-500">@{coordinator.username}</p>
                          </div>
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-sm text-gray-600">{coordinator.bio || "Інформація не вказана"}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Інформація недоступна</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Донори проєкту</CardTitle>
                <CardDescription>
                  Список людей, які підтримали цей проєкт фінансово
                </CardDescription>
              </CardHeader>
              <CardContent>
                {donationsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !donations?.length ? (
                  <div className="text-center py-8">
                    <VolunteerActivism className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Поки немає донорів</h3>
                    <p className="text-gray-500">Станьте першим, хто підтримає цей проєкт!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <AttachMoney className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {donation.donorId ? "Донор" : "Анонімний донор"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(donation.createdAt).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {donation.amount.toLocaleString('uk-UA')} ₴
                          </p>
                          {donation.comment && (
                            <p className="text-sm text-gray-500 mt-1">{donation.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Звіти та документи</CardTitle>
                    <CardDescription>
                      Фінансові звіти та документи проєкту
                    </CardDescription>
                  </div>
                  {user && user.role === 'coordinator' && project.coordinatorId === user.id && (
                    <Button>
                      <FileText className="mr-2 h-4 w-4" />
                      Додати звіт
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : !reports?.length ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Немає звітів</h3>
                    <p className="text-gray-500">Звіти будуть з'являтися по мірі виконання проєкту</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{report.title}</h4>
                            {report.description && (
                              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              {report.period && <span>Період: {report.period}</span>}
                              <span>{new Date(report.createdAt).toLocaleDateString('uk-UA')}</span>
                            </div>
                          </div>
                          {report.fileUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={report.fileUrl} target="_blank" rel="noopener noreferrer">
                                Завантажити
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Коментарі</CardTitle>
                <CardDescription>
                  Обговорення та питання щодо проєкту
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Коментарі поки не доступні</h3>
                  <p className="text-gray-500">Функція коментарів буде додана в майбутньому</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
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
                <div className="text-3xl font-bold">{project.collectedAmount.toLocaleString('uk-UA')} ₴</div>
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