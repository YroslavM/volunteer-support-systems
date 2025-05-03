import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
// Temporarily commenting out auth for debugging
// import { useAuth } from "@/hooks/use-auth";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  SelectProject, 
  SelectUser, 
  SelectTask, 
  SelectApplication, 
  SelectDonation 
} from "@shared/schema";
import { 
  Person, 
  AttachMoney, 
  Assignment, 
  Group, 
  CalendarToday, 
  ArrowBack 
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

export default function ProjectDetails() {
  const [, params] = useLocation();
  const projectId = params ? parseInt(params.split("/")[2]) : null;
  const { t } = useTranslation();
  // Mocking user for debugging
  const user = null;
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
  
  const { data: tasks, isLoading: tasksLoading } = useQuery<SelectTask[]>({
    queryKey: [`/api/projects/${projectId}/tasks`],
    enabled: !!projectId && !!user,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks`);
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        return [];
      }
    }
  });
  
  const { data: volunteers, isLoading: volunteersLoading } = useQuery<SelectUser[]>({
    queryKey: [`/api/projects/${projectId}/volunteers`],
    enabled: !!projectId && !!user && user.role === "coordinator" && project?.coordinatorId === user.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/volunteers`);
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        return [];
      }
    }
  });
  
  const { data: applications, isLoading: applicationsLoading } = useQuery<SelectApplication[]>({
    queryKey: [`/api/projects/${projectId}/applications`],
    enabled: !!projectId && !!user && user.role === "coordinator" && project?.coordinatorId === user.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/applications`);
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        return [];
      }
    }
  });
  
  const { data: donations, isLoading: donationsLoading } = useQuery<SelectDonation[]>({
    queryKey: [`/api/projects/${projectId}/donations`],
    enabled: !!projectId && !!user && user.role === "coordinator" && project?.coordinatorId === user.id,
    queryFn: async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/donations`);
        if (!res.ok) return [];
        return res.json();
      } catch (error) {
        return [];
      }
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
  
  // Apply to project
  const handleApply = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    
    applyMutation.mutate("");
  };
  
  // Calculate progress percentage
  const progressPercentage = project 
    ? Math.min(Math.round((project.collectedAmount / project.targetAmount) * 100), 100)
    : 0;
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA');
  };
  
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
  
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
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
                  <Badge className={`mb-2 ${getStatusColor(project.status)}`}>
                    {t(`projects.status.${project.status}`)}
                  </Badge>
                  <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 mb-6 whitespace-pre-line">{project.description}</p>
                
                {project.status === 'funding' && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{t('home.projects.collected')}: {project.collectedAmount.toLocaleString('uk-UA')} ₴</span>
                      <span className="font-medium">{t('home.projects.target')}: {project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}
                
                {user && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    {user.role === 'donor' && project.status === 'funding' && (
                      <Link href={`/projects/${project.id}/donate`}>
                        <Button className="bg-secondary-500 hover:bg-secondary-600 flex items-center">
                          <AttachMoney className="mr-2" />
                          {t('projects.details.donateButton')}
                        </Button>
                      </Link>
                    )}
                    
                    {user.role === 'volunteer' && project.status === 'in_progress' && !hasApplied && (
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
                    
                    {user.role === 'volunteer' && hasApplied && (
                      <Badge variant="outline" className="py-2 px-3">
                        Заявку подано
                      </Badge>
                    )}
                    
                    {user.role === 'coordinator' && project.coordinatorId === user.id && (
                      <>
                        <Link href={`/projects/${project.id}/tasks/create`}>
                          <Button variant="outline" className="flex items-center">
                            <Assignment className="mr-2" />
                            Додати завдання
                          </Button>
                        </Link>
                        <Link href={`/projects/${project.id}/edit`}>
                          <Button variant="outline" className="flex items-center">
                            Редагувати проєкт
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Project tabs - Tasks, Volunteers, Donations */}
            {user && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>{project.name} - Деталі</CardTitle>
                  <CardDescription>
                    Керування проєктом та перегляд інформації
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="tasks" className="flex items-center">
                        <Assignment className="mr-2 h-4 w-4" />
                        {t('projects.details.tasks')}
                      </TabsTrigger>
                      <TabsTrigger value="volunteers" className="flex items-center">
                        <Group className="mr-2 h-4 w-4" />
                        {t('projects.details.volunteers')}
                      </TabsTrigger>
                      {user.role === "coordinator" && project.coordinatorId === user.id && (
                        <TabsTrigger value="donations" className="flex items-center">
                          <AttachMoney className="mr-2 h-4 w-4" />
                          {t('projects.details.donations')}
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    {/* Tasks tab */}
                    <TabsContent value="tasks">
                      {tasksLoading ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : !tasks || tasks.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <Assignment className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-2 text-lg font-medium text-gray-900">
                            {t('projects.details.noTasks')}
                          </h3>
                          {user.role === "coordinator" && project.coordinatorId === user.id && (
                            <div className="mt-4">
                              <Link href={`/projects/${project.id}/tasks/create`}>
                                <Button>Створити завдання</Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Назва</TableHead>
                              <TableHead>Статус</TableHead>
                              <TableHead>Волонтер</TableHead>
                              <TableHead>Дедлайн</TableHead>
                              <TableHead className="text-right">Дії</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tasks.map((task) => (
                              <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.title}</TableCell>
                                <TableCell>
                                  <Badge className={getTaskStatusColor(task.status)}>
                                    {t(`tasks.status.${task.status}`)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {task.volunteerId ? (
                                    <div className="flex items-center">
                                      <Person className="mr-1 h-4 w-4 text-gray-500" />
                                      <span>Призначено</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Не призначено</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {task.deadline ? (
                                    <div className="flex items-center">
                                      <CalendarToday className="mr-1 h-4 w-4 text-gray-500" />
                                      {formatDate(task.deadline)}
                                    </div>
                                  ) : (
                                    <span className="text-gray-500">Не вказано</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Link href={`/projects/${project.id}/tasks/${task.id}`}>
                                    <Button size="sm" variant="outline">Деталі</Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </TabsContent>
                    
                    {/* Volunteers tab */}
                    <TabsContent value="volunteers">
                      {user.role === "coordinator" && project.coordinatorId === user.id ? (
                        /* Coordinator view */
                        <>
                          <h3 className="text-lg font-medium mb-4">Активні волонтери</h3>
                          {volunteersLoading ? (
                            <div className="flex justify-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : !volunteers || volunteers.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <Group className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-lg font-medium text-gray-900">
                                Немає активних волонтерів
                              </h3>
                            </div>
                          ) : (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {volunteers.map((volunteer) => (
                                <Card key={volunteer.id}>
                                  <CardContent className="pt-6">
                                    <div className="flex items-center">
                                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                        <Person className="text-primary-600" />
                                      </div>
                                      <div className="ml-3">
                                        <h4 className="font-medium">
                                          {volunteer.firstName || volunteer.username}
                                        </h4>
                                        <p className="text-sm text-gray-500">{volunteer.email}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                          
                          <h3 className="text-lg font-medium mt-8 mb-4">Заявки на участь</h3>
                          {applicationsLoading ? (
                            <div className="flex justify-center py-10">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                          ) : !applications || applications.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <h3 className="text-lg font-medium text-gray-900">
                                Немає нових заявок
                              </h3>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Волонтер</TableHead>
                                  <TableHead>Статус</TableHead>
                                  <TableHead>Дата</TableHead>
                                  <TableHead className="text-right">Дії</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {applications
                                  .filter(app => app.status === "pending")
                                  .map((application) => (
                                  <TableRow key={application.id}>
                                    <TableCell className="font-medium">
                                      {application.volunteerId}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className="bg-yellow-100 text-yellow-800">
                                        {t(`applications.status.${application.status}`)}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {formatDate(application.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200">
                                          {t('dashboard.coordinator.approveButton')}
                                        </Button>
                                        <Button size="sm" variant="outline" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">
                                          {t('dashboard.coordinator.rejectButton')}
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </>
                      ) : (
                        /* Volunteer view */
                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                          <h3 className="text-lg font-medium text-gray-900">
                            Інформація про волонтерів доступна координатору проєкту
                          </h3>
                        </div>
                      )}
                    </TabsContent>
                    
                    {/* Donations tab (coordinator only) */}
                    <TabsContent value="donations">
                      {user.role === "coordinator" && project.coordinatorId === user.id ? (
                        donationsLoading ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : !donations || donations.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <AttachMoney className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">
                              Ще немає донатів на цей проєкт
                            </h3>
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Донор</TableHead>
                                <TableHead>Сума</TableHead>
                                <TableHead>Коментар</TableHead>
                                <TableHead>Дата</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {donations.map((donation) => (
                                <TableRow key={donation.id}>
                                  <TableCell className="font-medium">
                                    {donation.donorId ? donation.donorId : "Анонімно"}
                                  </TableCell>
                                  <TableCell>
                                    {donation.amount.toLocaleString('uk-UA')} ₴
                                  </TableCell>
                                  <TableCell>
                                    {donation.comment || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(donation.createdAt)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )
                      ) : null}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Right column - sidebar info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Інформація про проєкт</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {t('projects.details.coordinator')}
                  </h3>
                  <div className="mt-2 flex items-center">
                    <Person className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-900 font-medium">
                      {coordinatorLoading 
                        ? "Завантаження..." 
                        : coordinator 
                          ? (coordinator.firstName && coordinator.lastName 
                            ? `${coordinator.firstName} ${coordinator.lastName}` 
                            : coordinator.username)
                          : "Невідомо"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    {t('projects.details.status')}
                  </h3>
                  <div className="mt-2">
                    <Badge className={getStatusColor(project.status)}>
                      {t(`projects.status.${project.status}`)}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Створено
                  </h3>
                  <p className="mt-2 text-gray-900">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
                
                {project.status === 'funding' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Фінансування
                    </h3>
                    <div className="mt-2">
                      <div className="flex justify-between mb-2 text-sm">
                        <span>{t('home.projects.collected')}: {project.collectedAmount.toLocaleString('uk-UA')} ₴</span>
                        <span>{t('home.projects.target')}: {project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </div>
                  </div>
                )}
                
                {project.bankDetails && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Банківські реквізити
                    </h3>
                    <p className="mt-2 text-gray-900 break-words">
                      {project.bankDetails}
                    </p>
                  </div>
                )}
                
                {user && user.role === 'donor' && project.status === 'funding' && (
                  <div className="pt-4">
                    <Link href={`/projects/${project.id}/donate`}>
                      <Button className="w-full bg-secondary-500 hover:bg-secondary-600 flex items-center justify-center">
                        <AttachMoney className="mr-2" />
                        {t('projects.details.donateButton')}
                      </Button>
                    </Link>
                  </div>
                )}
                
                {user && user.role === 'volunteer' && project.status === 'in_progress' && !hasApplied && (
                  <div className="pt-4">
                    <Button 
                      className="w-full flex items-center justify-center"
                      onClick={handleApply}
                      disabled={applyMutation.isPending}
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
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
