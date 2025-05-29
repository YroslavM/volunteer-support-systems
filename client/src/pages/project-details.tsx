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

  // Запити до API
  const { data: project, isLoading: isProjectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    queryFn: () => 
      fetch(`/api/projects/${projectId}`)
        .then(res => res.json()),
  });

  const { data: coordinator } = useQuery({
    queryKey: ["/api/users", project?.coordinatorId],
    queryFn: () => 
      fetch(`/api/users/${project?.coordinatorId}`)
        .then(res => res.json()),
    enabled: !!project?.coordinatorId,
  });

  const { data: donations = [], isLoading: isDonationsLoading } = useQuery<Donation[]>({
    queryKey: ["/api/projects", projectId, "donations"],
    queryFn: () => 
      fetch(`/api/projects/${projectId}/donations`)
        .then(res => res.json()),
  });

  const { data: reports = [], isLoading: isReportsLoading } = useQuery<ProjectReport[]>({
    queryKey: ["/api/projects", projectId, "reports"],
    queryFn: () => 
      fetch(`/api/projects/${projectId}/reports`)
        .then(res => res.json()),
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/projects", projectId, "applications"],
    queryFn: () => 
      fetch(`/api/projects/${projectId}/applications`)
        .then(res => res.json()),
  });

  // Мутація для подачі заявки
  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/apply`, {
        message: `Заявка від ${user!.firstName || user!.username}`
      });
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

  // Мутація для донатів
  const donateMutation = useMutation({
    mutationFn: async () => {
      const amount = prompt("Введіть суму донату (грн):");
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        throw new Error("Некоректна сума");
      }
      
      const comment = prompt("Коментар (необов'язково):");
      
      const res = await apiRequest("POST", `/api/projects/${projectId}/donate`, {
        amount: Number(amount),
        comment: comment || null
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Донат успішно здійснено",
        description: "Дякуємо за підтримку проєкту!",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/donations`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка при здійсненні донату",
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

  const userApplication = Array.isArray(applications) ? applications.find(app => app.volunteerId === user?.id) : null;
  const canApply = user?.role === 'volunteer' && !userApplication && project.status !== 'completed';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH'
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('uk-UA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Заголовок з кнопкою назад */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Деталі проєкту</h1>
        </div>



        {/* Основна інформація про проєкт */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Фотографія проєкту зліва */}
              <div className="lg:w-1/2">
                {project.imageUrl ? (
                  <div className="relative">
                    <img
                      src={project.imageUrl}
                      alt={project.name}
                      className="w-full h-64 lg:h-80 object-cover rounded-lg"
                    />
                    <Badge 
                      className="absolute top-4 left-4"
                      variant={
                        project.status === 'funding' ? 'default' :
                        project.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {project.status === 'funding' ? 'Збір коштів' :
                       project.status === 'in_progress' ? 'У процесі' : 'Завершено'}
                    </Badge>
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded text-lg font-semibold">
                      {project.name}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 lg:h-80 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">Немає зображення</span>
                  </div>
                )}

              </div>

              {/* Блок "Зібрано коштів" справа */}
              <div className="lg:w-1/2">
                <div className="bg-white border rounded-lg p-6 h-fit">
                  {/* Інформація про проєкт */}
                  <div className="mb-6 space-y-2">
                    <h2 className="text-xl font-bold">{project.name}</h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>Створено: {formatDate(project.createdAt)}</div>
                      <div>Координатор: {coordinator ? `${coordinator.firstName || coordinator.username} ${coordinator.lastName || ''}`.trim() : 'Завантаження...'}</div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Зібрано коштів</h3>
                  <p className="text-gray-600 mb-4">Фінансова мета проєкту</p>
                  
                  <div className="mb-4">
                    <div className="text-3xl font-bold mb-1">
                      {formatCurrency(project.collectedAmount)}
                    </div>
                    <p className="text-gray-600">
                      Зібрано {progressPercentage}% від необхідної суми
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <Progress value={progressPercentage} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0 ₴</span>
                      <span>{formatCurrency(project.targetAmount)}</span>
                    </div>
                  </div>

                  {/* Кнопки дії */}
                  <div className="mt-6 space-y-3">
                    {/* Кнопка донату - тільки для проєктів зі статусом "funding" */}
                    {project.status === 'funding' && (
                      <Button 
                        className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        size="lg"
                        onClick={() => donateMutation.mutate()}
                        disabled={donateMutation.isPending}
                      >
                        <Heart className="h-5 w-5" />
                        {donateMutation.isPending ? "Обробка..." : "Надати допомогу"}
                      </Button>
                    )}

                    {/* Кнопка заявки - тільки для волонтерів */}
                    {canApply && (
                      <Button 
                        onClick={() => applyMutation.mutate()}
                        disabled={applyMutation.isPending}
                        className="w-full flex items-center gap-2"
                        size="lg"
                        variant="outline"
                      >
                        <Users className="h-5 w-5" />
                        {applyMutation.isPending ? "Подача заявки..." : "Подати заявку"}
                      </Button>
                    )}
                    
                    {userApplication && (
                      <div className="text-center">
                        <Badge variant={
                          userApplication.status === 'pending' ? 'default' :
                          userApplication.status === 'approved' ? 'secondary' : 'destructive'
                        } className="text-base py-2 px-4">
                          Заявка: {
                            userApplication.status === 'pending' ? 'На розгляді' :
                            userApplication.status === 'approved' ? 'Схвалено' : 'Відхилено'
                          }
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Про проєкт
            </TabsTrigger>
            <TabsTrigger value="donors" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Донори
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Звіти
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Коментарі
            </TabsTrigger>
          </TabsList>

          {/* Вміст вкладки "Про проєкт" */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Деталі проєкту</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Опис</h4>
                    <p className="text-gray-700">{project.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вміст вкладки "Донори" */}
          <TabsContent value="donors" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Список донорів</CardTitle>
                <CardDescription>
                  Загалом донорів: {donations.length}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDonationsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : !donations || donations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Поки що немає донорів
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(donations) && donations.map((donation) => (
                      <div key={donation.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">
                            {donation.donorId ? "Донор" : "Анонімний донор"}
                          </p>
                          {donation.comment && (
                            <p className="text-sm text-gray-600 mt-1">{donation.comment}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(donation.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(donation.amount)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вміст вкладки "Звіти" */}
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Звіти та документи</CardTitle>
                <CardDescription>
                  Звіти про виконання проєкту
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isReportsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Поки що немає звітів
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{report.title}</h4>
                            <p className="text-gray-600 mt-1">{report.description}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              Період: {report.period}
                            </p>
                            <p className="text-xs text-gray-500">
                              Створено: {formatDate(report.createdAt)}
                            </p>
                          </div>
                          {report.fileUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(report.fileUrl!, '_blank')}
                            >
                              Завантажити
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

          {/* Вміст вкладки "Коментарі" */}
          <TabsContent value="comments" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Коментарі</CardTitle>
                <CardDescription>
                  Обговорення проєкту
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Функція коментарів буде додана пізніше
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}