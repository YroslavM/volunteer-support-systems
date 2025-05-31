import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { SelectProject, SelectTask, SelectApplication } from "@shared/schema";
import {
  Assignment,
  CalendarToday,
  FolderOpen,
  AssignmentTurnedIn,
  Search,
  ArrowForward,
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

export default function VolunteerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current-tasks");
  const [applicationFilter, setApplicationFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Fetch volunteer's tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery<SelectTask[]>({
    queryKey: ["/api/volunteer/tasks"],
  });

  // Fetch volunteer's projects
  const { data: projects, isLoading: projectsLoading } = useQuery<SelectProject[]>({
    queryKey: ["/api/volunteer/projects"],
  });

  // Fetch available projects (status = in_progress)
  const { data: availableProjects, isLoading: availableProjectsLoading } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects", { status: "in_progress" }],
    queryFn: async () => {
      const res = await fetch(`/api/projects?status=in_progress`);
      if (!res.ok) throw new Error("Failed to fetch available projects");
      return res.json();
    },
  });

  // Fetch volunteer's applications
  const { data: applications, isLoading: applicationsLoading } = useQuery<SelectApplication[]>({
    queryKey: ["/api/user/applications"],
    queryFn: async () => {
      const res = await fetch(`/api/user/applications`, {
        credentials: 'include'
      });
      if (!res.ok) {
        console.error('Failed to fetch applications:', res.status);
        return [];
      }
      const data = await res.json();
      console.log('Applications data:', data);
      return data;
    },
  });

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA");
  };

  // Get status badge color
  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter tasks by status
  const pendingTasks = tasks?.filter((task) => task.status !== "completed") || [];
  const completedTasks = tasks?.filter((task) => task.status === "completed") || [];

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
            {t("dashboard.volunteer.title")}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Вітаємо, {user?.firstName || user?.username}! Тут ви можете керувати своїми завданнями та проєктами.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="current-tasks" className="flex items-center">
                      <Assignment className="mr-2 h-4 w-4" />
                      {t("dashboard.volunteer.currentTasks")}
                    </TabsTrigger>
                    <TabsTrigger value="my-applications" className="flex items-center">
                      <AssignmentTurnedIn className="mr-2 h-4 w-4" />
                      Мої заявки
                    </TabsTrigger>
                    <TabsTrigger value="available-projects" className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      {t("dashboard.volunteer.availableProjects")}
                    </TabsTrigger>
                    <TabsTrigger value="completed-tasks" className="flex items-center">
                      <FolderOpen className="mr-2 h-4 w-4" />
                      {t("dashboard.volunteer.completedTasks")}
                    </TabsTrigger>
                  </TabsList>

                  {/* My Applications Tab */}
                  <TabsContent value="my-applications" className="border-t pt-4">
                    <div className="mb-4">
                      <div className="flex space-x-2">
                        <Button
                          variant={applicationFilter === "pending" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setApplicationFilter("pending")}
                        >
                          На розгляді
                        </Button>
                        <Button
                          variant={applicationFilter === "approved" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setApplicationFilter("approved")}
                        >
                          Схвалені
                        </Button>
                        <Button
                          variant={applicationFilter === "rejected" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setApplicationFilter("rejected")}
                        >
                          Відхилені
                        </Button>
                        <Button
                          variant={applicationFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setApplicationFilter("all")}
                        >
                          Усі заявки
                        </Button>
                      </div>
                    </div>

                    {applicationsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !applications || applications.length === 0 ? (
                      <div className="text-center py-10">
                        <AssignmentTurnedIn className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Немає заявок</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Ви ще не подавали заявок на участь у проєктах
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(applications || [])
                          .filter(app => applicationFilter === "all" || app.status === applicationFilter)
                          .map((application) => {
                            console.log('Rendering application:', application);
                            return (
                              <div
                                key={application.id}
                                className="bg-white rounded-lg border p-4 shadow-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div>
                                      <h3 className="font-medium text-lg text-gray-900">
                                        Проєкт #{application.projectId}
                                      </h3>
                                      <p className="text-sm text-gray-500">
                                        Подано: {formatDate(application.createdAt?.toString())}
                                      </p>
                                      {application.message && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          {application.message}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {application.status === 'pending' && (
                                      <Badge className="bg-yellow-100 text-yellow-800">На розгляді</Badge>
                                    )}
                                    {application.status === 'approved' && (
                                      <Badge className="bg-green-100 text-green-800">Схвалено</Badge>
                                    )}
                                    {application.status === 'rejected' && (
                                      <Badge className="bg-red-100 text-red-800">Відхилено</Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Current Tasks Tab */}
                  <TabsContent value="current-tasks" className="border-t pt-4">
                    {tasksLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !pendingTasks.length ? (
                      <div className="text-center py-12">
                        <Assignment className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          У вас немає активних завдань
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Перегляньте доступні проєкти, щоб долучитися до волонтерської діяльності.
                        </p>
                        <div className="mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("available-projects")}
                          >
                            Переглянути доступні проєкти
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pendingTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row justify-between"
                          >
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="font-medium text-lg text-gray-900">{task.name}</h3>
                                <Badge className={`ml-2 ${getTaskStatusColor(task.status)}`}>
                                  {t(`tasks.status.${task.status}`)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarToday className="h-4 w-4 mr-1" />
                                {task.deadline ? (
                                  <span>Термін: {formatDate(task.deadline)}</span>
                                ) : (
                                  <span>Без терміну</span>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0 flex items-center">
                              <Link href={`/tasks/${task.id}`}>
                                <Button variant="outline" className="w-full sm:w-auto">
                                  Деталі
                                </Button>
                              </Link>
                              {task.status === "in_progress" && (
                                <Link href={`/tasks/${task.id}/report`}>
                                  <Button className="ml-2 w-full sm:w-auto">Звіт</Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Available Projects Tab */}
                  <TabsContent value="available-projects" className="border-t pt-4">
                    {availableProjectsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !availableProjects?.length ? (
                      <div className="text-center py-12">
                        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          Наразі немає доступних проєктів
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Перевірте пізніше або перегляньте всі проєкти
                        </p>
                        <div className="mt-6">
                          <Link href="/projects">
                            <Button variant="outline">Всі проєкти</Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableProjects.map((project) => {
                          // Check if the volunteer has already applied
                          const hasApplied = applications?.some(
                            (app) => app.projectId === project.id
                          );

                          return (
                            <div
                              key={project.id}
                              className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row justify-between"
                            >
                              <div>
                                <h3 className="font-medium text-lg text-gray-900">
                                  {project.name}
                                </h3>
                                <p className="text-gray-600 mb-2 line-clamp-2">
                                  {project.description}
                                </p>
                                <div className="flex items-center text-sm text-gray-500">
                                  <span>
                                    Створено: {formatDate(project.createdAt)}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-0 flex items-center">
                                <Link href={`/projects/${project.id}`}>
                                  <Button variant="outline" className="w-full sm:w-auto">
                                    Деталі
                                  </Button>
                                </Link>
                                {!hasApplied ? (
                                  <Link href={`/projects/${project.id}`}>
                                    <Button className="ml-2 w-full sm:w-auto">
                                      {t("dashboard.volunteer.applyButton")}
                                    </Button>
                                  </Link>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 py-1 px-2 h-9"
                                  >
                                    Заявку подано
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Completed Tasks Tab */}
                  <TabsContent value="completed-tasks" className="border-t pt-4">
                    {tasksLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !completedTasks.length ? (
                      <div className="text-center py-12">
                        <AssignmentTurnedIn className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          У вас немає завершених завдань
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Завершені завдання будуть відображатися тут
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {completedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row justify-between"
                          >
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="font-medium text-lg text-gray-900">{task.name}</h3>
                                <Badge className="ml-2 bg-green-100 text-green-800">
                                  {t(`tasks.status.${task.status}`)}
                                </Badge>
                              </div>
                              <p className="text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <CalendarToday className="h-4 w-4 mr-1" />
                                <span>Завершено: {formatDate(task.updatedAt)}</span>
                              </div>
                            </div>
                            <div className="mt-4 sm:mt-0">
                              <Link href={`/tasks/${task.id}`}>
                                <Button variant="outline">Деталі</Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardHeader>
              <CardContent>
                {activeTab === "current-tasks" && pendingTasks.length > 0 && (
                  <div className="flex justify-end mt-4">
                    <Link href="/projects">
                      <Button variant="outline" className="flex items-center">
                        Переглянути всі проєкти
                        <ArrowForward className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* My Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Мої проєкти</CardTitle>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !projects?.length ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Ви ще не берете участі в жодному проєкті
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline">
                              {t(`projects.status.${project.status}`)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {pendingTasks.filter(t => t.projectId === project.id).length} завдань
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full flex items-center justify-center">
                      Переглянути всі проєкти
                      <ArrowForward className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* My Applications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Мої заявки</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !applications?.length ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Ви ще не подали жодної заявки
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applications.map((application) => (
                      <div key={application.id} className="p-3 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Проєкт #{application.projectId}</span>
                          <Badge className={getApplicationStatusColor(application.status)}>
                            {t(`applications.status.${application.status}`)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {formatDate(application.createdAt)}
                        </div>
                      </div>
                    ))}
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
