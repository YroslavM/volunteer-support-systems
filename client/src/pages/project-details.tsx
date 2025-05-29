import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Project, Application, Donation, ProjectReport } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Users, Target, Calendar, FileText, Heart, Upload } from "lucide-react";

export default function ProjectDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("about");

  // Отримуємо ID проєкту з URL
  const projectId = window.location.pathname.split('/').pop();

  // Запити для отримання даних
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: [`/api/projects/${projectId}/applications`],
    enabled: !!projectId,
  });

  const { data: donations = [] } = useQuery<Donation[]>({
    queryKey: [`/api/projects/${projectId}/donations`],
    enabled: !!projectId,
  });

  const { data: reports = [] } = useQuery<ProjectReport[]>({
    queryKey: [`/api/projects/${projectId}/reports`],
    enabled: !!projectId,
  });

  // Мутація для подачі заявки
  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/apply`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Заявка подана успішно",
        description: "Координатор розгляне вашу заявку найближчим часом",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "applications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка при подачі заявки",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isProjectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Проєкт не знайдено</h2>
          <Button onClick={() => setLocation("/")}>Повернутися на головну</Button>
        </div>
      </div>
    );
  }

  const progressPercentage = project.targetAmount > 0 
    ? Math.round((project.collectedAmount / project.targetAmount) * 100) 
    : 0;

  const statusBadgeColor = {
    funding: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
  }[project.status] || "bg-gray-100 text-gray-800";

  const statusText = {
    funding: "Збір коштів",
    in_progress: "В процесі",
    completed: "Завершено",
  }[project.status] || project.status;

  // Перевіряємо чи може користувач подавати заявку
  const userApplication = applications?.find(app => app.volunteerId === user?.id);
  const canApply = user?.role === "volunteer" && 
                   project.status === "funding" && 
                   !userApplication;

  // Функція форматування валюти
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('uk-UA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Функція форматування дати
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Кнопка повернення */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={() => setLocation("/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
            Повернутися до проєктів
          </Button>
        </div>

        {/* Основний контент */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ліва колонка - зображення проєкту */}
          <div className="lg:col-span-2">
            {project.imageUrl && (
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={project.imageUrl}
                  alt={project.name}
                  className="w-full h-64 lg:h-80 object-cover"
                />
              </div>
            )}

            {/* Вкладки з контентом */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">Про проєкт</TabsTrigger>
                <TabsTrigger value="donors">Донори</TabsTrigger>
                <TabsTrigger value="reports">Звіти</TabsTrigger>
                <TabsTrigger value="comments">Коментарі</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Опис проєкту
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {project.description}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="donors" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Донори ({donations?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {donations && donations.length > 0 ? (
                      <div className="space-y-4">
                        {donations.map((donation) => (
                          <div key={donation.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">Анонімний донор</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(donation.createdAt.toString())}
                              </p>
                              {donation.comment && (
                                <p className="text-sm text-gray-600 mt-1">"{donation.comment}"</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatCurrency(donation.amount)} грн
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Поки що немає донорів
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Звіти проєкту
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reports && reports.length > 0 ? (
                      <div className="space-y-4">
                        {reports.map((report) => (
                          <div key={report.id} className="p-4 border rounded-lg">
                            <h3 className="font-medium mb-2">{report.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                            <p className="text-xs text-gray-500">
                              Період: {report.period} | Дата: {formatDate(report.createdAt.toString())}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-8">
                        Поки що немає звітів
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Коментарі</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-center py-8">
                      Коментарі будуть додані в майбутніх оновленнях
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Права колонка - інформація та дії */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <Badge className={statusBadgeColor}>
                    {statusText}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Прогрес збору коштів */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Прогрес збору</span>
                    <span className="text-sm text-gray-500">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="mb-3" />
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Зібрано: {formatCurrency(project.collectedAmount)} грн
                    </span>
                    <span className="font-medium">
                      Мета: {formatCurrency(project.targetAmount)} грн
                    </span>
                  </div>
                </div>

                {/* Інформація проєкту */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Створено: {formatDate(project.createdAt.toString())}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Target className="h-4 w-4" />
                    <span>Статус: {statusText}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Заявок: {applications?.length || 0}</span>
                  </div>
                </div>

                {/* Кнопки дії */}
                <div className="mt-6 space-y-3">
                  {/* Кнопка донату - тільки для проєктів зі статусом "funding" */}
                  {project.status === 'funding' && (
                    <Button 
                      className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={() => setLocation(`/donate/${projectId}`)}
                    >
                      <Heart className="h-5 w-5" />
                      Надати допомогу
                    </Button>
                  )}

                  {/* Кнопка заявки - тільки для волонтерів */}
                  {canApply && (
                    <Button 
                      className="w-full"
                      variant="outline"
                      onClick={() => applyMutation.mutate()}
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? "Подача заявки..." : "Подати заявку на участь"}
                    </Button>
                  )}

                  {/* Інформація про заявку */}
                  {userApplication && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        Ваша заявка: {
                          userApplication.status === "pending" ? "На розгляді" :
                          userApplication.status === "approved" ? "Схвалена" :
                          "Відхилена"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}