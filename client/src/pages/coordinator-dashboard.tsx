import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectProject, SelectApplication } from "@shared/schema";
import {
  Add,
  Dashboard,
  AccountCircle,
  Assignment,
  Group,
  CheckCircle,
  Cancel,
  AttachMoney,
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CoordinatorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("my-projects");

  // Fetch coordinator's projects
  const { data: projects, isLoading: projectsLoading } = useQuery<SelectProject[]>({
    queryKey: [`/api/projects/coordinator/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch pending applications for all projects
  const { data: applications, isLoading: applicationsLoading } = useQuery<SelectApplication[]>({
    queryKey: [`/api/coordinator/${user?.id}/applications`],
    queryFn: async () => {
      if (!projects?.length) return [];
      
      // Get applications for all projects
      const allApplications: SelectApplication[] = [];
      
      for (const project of projects) {
        try {
          const res = await fetch(`/api/projects/${project.id}/applications`);
          if (res.ok) {
            const projectApplications = await res.json();
            allApplications.push(...projectApplications);
          }
        } catch (error) {
          console.error(`Failed to fetch applications for project ${project.id}:`, error);
        }
      }
      
      return allApplications.filter(app => app.status === "pending");
    },
    enabled: !!projects?.length && !!user?.id,
  });

  // Handle application approval/rejection
  const handleApplicationStatus = async (applicationId: number, status: "approved" | "rejected") => {
    try {
      await apiRequest("PATCH", `/api/applications/${applicationId}/status`, { status });
      
      toast({
        title: status === "approved" ? "Заявку схвалено" : "Заявку відхилено",
        description: status === "approved" 
          ? "Волонтера додано до проєкту" 
          : "Волонтера не буде додано до проєкту",
      });
      
      // Invalidate applications query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/${user?.id}/applications`] });
    } catch (error) {
      toast({
        title: "Помилка",
        description: `Не вдалося ${status === "approved" ? "схвалити" : "відхилити"} заявку`,
        variant: "destructive",
      });
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString("uk-UA");
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("uk-UA").format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "funding":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate progress percentage
  const calculateProgress = (collected: number, target: number) => {
    return Math.min(Math.round((collected / target) * 100), 100);
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
            {t("dashboard.coordinator.title")}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Вітаємо, {user?.firstName || user?.username}! Тут ви можете керувати своїми проєктами, волонтерами та завданнями.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="my-projects" className="flex items-center">
                      <Dashboard className="mr-2 h-4 w-4" />
                      {t("dashboard.coordinator.myProjects")}
                    </TabsTrigger>
                    <TabsTrigger value="applications" className="flex items-center">
                      <Group className="mr-2 h-4 w-4" />
                      {t("dashboard.coordinator.volunteerApplications")}
                    </TabsTrigger>
                  </TabsList>

                  {/* My Projects Tab */}
                  <TabsContent value="my-projects" className="border-t pt-4">
                    {projectsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !projects?.length ? (
                      <div className="text-center py-12">
                        <Assignment className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          У вас ще немає проєктів
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Створіть свій перший проєкт, щоб почати координаторську діяльність
                        </p>
                        <div className="mt-6">
                          <Link href="/create-project">
                            <Button>
                              <Add className="mr-2 h-4 w-4" />
                              {t("dashboard.coordinator.createProjectButton")}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {projects.map((project) => (
                          <div
                            key={project.id}
                            className="bg-white rounded-lg border p-4 flex flex-col"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center mb-2">
                                  <h3 className="font-medium text-lg text-gray-900">{project.name}</h3>
                                  <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                                    {t(`projects.status.${project.status}`)}
                                  </Badge>
                                </div>
                                <p className="text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                              </div>
                              <div className="flex">
                                <Link href={`/projects/${project.id}`}>
                                  <Button variant="outline" className="mr-2">
                                    Деталі
                                  </Button>
                                </Link>
                                <Link href={`/projects/${project.id}/edit`}>
                                  <Button variant="outline">
                                    {t("common.edit")}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              {project.status === "funding" && (
                                <div className="mb-2">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>{t("home.projects.collected")}: {formatAmount(project.collectedAmount)} ₴</span>
                                    <span>{t("home.projects.target")}: {formatAmount(project.targetAmount)} ₴</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${calculateProgress(project.collectedAmount, project.targetAmount)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex mt-4 space-x-2">
                                <Link href={`/projects/${project.id}/volunteers`}>
                                  <Button size="sm" variant="outline" className="flex items-center">
                                    <Group className="mr-1 h-4 w-4" />
                                    {t("dashboard.coordinator.volunteersButton")}
                                  </Button>
                                </Link>
                                <Link href={`/projects/${project.id}/tasks/create`}>
                                  <Button size="sm" variant="outline" className="flex items-center">
                                    <Assignment className="mr-1 h-4 w-4" />
                                    Створити завдання
                                  </Button>
                                </Link>
                                {project.status === "funding" && (
                                  <Link href={`/projects/${project.id}/donations`}>
                                    <Button size="sm" variant="outline" className="flex items-center">
                                      <AttachMoney className="mr-1 h-4 w-4" />
                                      {t("projects.details.donations")}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-6">
                      <Link href="/create-project">
                        <Button className="flex items-center">
                          <Add className="mr-2 h-4 w-4" />
                          {t("dashboard.coordinator.createProjectButton")}
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>

                  {/* Applications Tab */}
                  <TabsContent value="applications" className="border-t pt-4">
                    {applicationsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !applications?.length ? (
                      <div className="text-center py-12">
                        <Group className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          Немає нових заявок на участь
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Коли волонтери будуть подавати заявки на ваші проєкти, вони з'являться тут
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {applications.map((application) => {
                          const project = projects?.find(p => p.id === application.projectId);
                          
                          return (
                            <div
                              key={application.id}
                              className="bg-white rounded-lg border p-6 shadow-sm"
                            >
                              <div className="flex flex-col space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                      <span className="text-lg font-semibold text-blue-700">
                                        {application.volunteer?.firstName?.[0] || 'В'}
                                      </span>
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-lg text-gray-900">
                                        {application.volunteer ? 
                                          `${application.volunteer.lastName} ${application.volunteer.firstName}` 
                                          : `Волонтер #${application.volunteerId}`}
                                      </h3>
                                      <div className="text-sm text-gray-500">
                                        {project ? (
                                          <span>Проєкт: {project.name}</span>
                                        ) : (
                                          <span>Проєкт #{application.projectId}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    {application.status === 'pending' && (
                                      <>
                                        <Button 
                                          size="sm" 
                                          className="bg-green-600 hover:bg-green-700"
                                          onClick={() => handleApplicationStatus(application.id, 'approved')}
                                        >
                                          Прийняти
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="destructive"
                                          onClick={() => handleApplicationStatus(application.id, 'rejected')}
                                        >
                                          Відхилити
                                        </Button>
                                      </>
                                    )}
                                    {application.status === 'approved' && (
                                      <Badge className="bg-green-100 text-green-800">Прийнято</Badge>
                                    )}
                                    {application.status === 'rejected' && (
                                      <Badge className="bg-red-100 text-red-800">Відхилено</Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Детальна інформація про волонтера */}
                                {application.volunteer && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Стать:</span>
                                      <p className="text-sm text-gray-900">{application.volunteer.gender}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Дата народження:</span>
                                      <p className="text-sm text-gray-900">
                                        {new Date(application.volunteer.birthDate).toLocaleDateString('uk-UA')}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Область:</span>
                                      <p className="text-sm text-gray-900">{application.volunteer.region}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Місто:</span>
                                      <p className="text-sm text-gray-900">{application.volunteer.city}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Email:</span>
                                      <p className="text-sm text-gray-900">{application.volunteer.email}</p>
                                    </div>
                                    <div>
                                      <span className="text-sm font-medium text-gray-600">Телефон:</span>
                                      <p className="text-sm text-gray-900">{application.volunteer.phoneNumber}</p>
                                    </div>
                                    <div className="md:col-span-2 lg:col-span-3">
                                      <span className="text-sm font-medium text-gray-600">Про себе:</span>
                                      <p className="text-sm text-gray-900 mt-1">{application.volunteer.bio}</p>
                                    </div>
                                  </div>
                                )}

                                {application.message && (
                                  <div className="p-3 bg-blue-50 rounded-md">
                                    <span className="text-sm font-medium text-blue-800">Повідомлення:</span>
                                    <p className="text-sm text-blue-700 mt-1">
                                      {application.message}
                                    </p>
                                  </div>
                                )}
                                
                                <div className="text-sm text-gray-500">
                                  Дата подання: {formatDate(application.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-blue-700 font-medium text-lg">
                      {projects?.length || 0}
                    </h3>
                    <p className="text-blue-500 text-sm">Проєктів</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-green-700 font-medium text-lg">
                      {applications?.length || 0}
                    </h3>
                    <p className="text-green-500 text-sm">Заявок</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-purple-700 font-medium text-lg">
                      {projects?.filter(p => p.status === "funding").length || 0}
                    </h3>
                    <p className="text-purple-500 text-sm">Збір коштів</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-yellow-700 font-medium text-lg">
                      {projects?.filter(p => p.status === "in_progress").length || 0}
                    </h3>
                    <p className="text-yellow-500 text-sm">В процесі</p>
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <Link href="/create-project">
                    <Button className="w-full flex items-center justify-center">
                      <Add className="mr-2 h-4 w-4" />
                      {t("dashboard.coordinator.createProjectButton")}
                    </Button>
                  </Link>
                  <Link href="/coordinator/tasks">
                    <Button variant="outline" className="w-full flex items-center justify-center">
                      <Assignment className="mr-2 h-4 w-4" />
                      Мої завдання
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Останні проєкти</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !projects?.length ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      У вас ще немає проєктів
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.slice(0, 3).map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <Badge className={getStatusColor(project.status)}>
                              {t(`projects.status.${project.status}`)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(project.createdAt)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full">
                      Всі проєкти
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
