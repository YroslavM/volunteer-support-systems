import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowBack, 
  CalendarToday, 
  AccessTime, 
  Assignment, 
  Person,
  LocationOn,
  Phone,
  Email,
  AttachMoney,
  Description,
  CheckCircle,
  Schedule,
  Pending
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

type TaskDetails = {
  id: number;
  name: string;
  description: string;
  type: string;
  status: string;
  deadline: string | null;
  volunteersNeeded: number;
  assignedVolunteerId: number | null;
  requiredSkills: string | null;
  budget: number | null;
  expenseAmount: number | null;
  expensePurpose: string | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: number;
    name: string;
    description: string;
    coordinatorId: number;
  };
  assignedVolunteer?: {
    id: number;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
  };
};

type Report = {
  id: number;
  content: string;
  expenseAmount: number | null;
  expensePurpose: string | null;
  createdAt: string;
};

export default function TaskDetailsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Завантажуємо дані завдання
  const { data: task, isLoading: taskLoading } = useQuery<TaskDetails>({
    queryKey: [`/api/tasks/${taskId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  // Завантажуємо звіти для завдання
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({
    queryKey: [`/api/tasks/${taskId}/reports`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Pending className="h-4 w-4" />;
      case "in_progress":
        return <Schedule className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Assignment className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      collection: "Збір коштів",
      on_site: "Робота на місці",
      event_organization: "Організація заходів",
      online_support: "Онлайн підтримка",
      other: "Інше"
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Очікування",
      in_progress: "В процесі",
      completed: "Завершено"
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isAssignedToTask = task?.assignedVolunteerId === user?.id;
  const canSubmitReport = isAssignedToTask && task?.status === "in_progress";

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Завдання не знайдено
          </h2>
          <p className="text-gray-600 mb-4">
            Можливо, завдання було видалено або у вас немає доступу до нього.
          </p>
          <Button onClick={() => setLocation("/volunteer-dashboard")}>
            Повернутися до дашборду
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/volunteer-dashboard")}
            className="mr-4"
          >
            <ArrowBack className="mr-2 h-4 w-4" />
            Назад до дашборду
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.name}</h1>
            <p className="text-sm text-gray-600">
              Проєкт: <Link href={`/projects/${task.project.id}`} className="text-blue-600 hover:underline">
                {task.project.name}
              </Link>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Assignment className="mr-2 h-5 w-5" />
                  Інформація про завдання
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className={`${getStatusColor(task.status)} mr-2`}>
                      {getStatusIcon(task.status)}
                      <span className="ml-1">{getStatusLabel(task.status)}</span>
                    </Badge>
                    <Badge variant="outline">
                      {getTypeLabel(task.type)}
                    </Badge>
                  </div>
                  {isAssignedToTask && (
                    <Badge className="bg-green-100 text-green-800">
                      <Person className="mr-1 h-3 w-3" />
                      Ви призначені
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Опис</h3>
                  <p className="text-gray-700 leading-relaxed">{task.description}</p>
                </div>

                {task.requiredSkills && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Необхідні навички</h3>
                    <p className="text-gray-700">{task.requiredSkills}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarToday className="mr-2 h-4 w-4" />
                    <span>Створено: {formatDate(task.createdAt)}</span>
                  </div>
                  {task.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AccessTime className="mr-2 h-4 w-4" />
                      <span>Дедлайн: {formatDate(task.deadline)}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Person className="mr-2 h-4 w-4" />
                    <span>Волонтерів потрібно: {task.volunteersNeeded}</span>
                  </div>
                  {task.budget && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AttachMoney className="mr-2 h-4 w-4" />
                      <span>Бюджет: {task.budget} грн</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card>
              <CardHeader>
                <CardTitle>Про проєкт</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{task.project.name}</h3>
                    <p className="text-gray-700 mt-1">{task.project.description}</p>
                  </div>
                  <Link href={`/projects/${task.project.id}`}>
                    <Button variant="outline">
                      Переглянути повну інформацію про проєкт
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Reports Section */}
            {(reports.length > 0 || canSubmitReport) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Description className="mr-2 h-5 w-5" />
                      Звіти
                    </span>
                    {canSubmitReport && (
                      <Link href={`/tasks/${task.id}/report`}>
                        <Button size="sm">
                          Подати звіт
                        </Button>
                      </Link>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reportsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : reports.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Звітів ще немає
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-500">
                              {formatDate(report.createdAt)}
                            </span>
                            {report.expenseAmount && (
                              <Badge variant="outline">
                                Витрати: {report.expenseAmount} грн
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{report.content}</p>
                          {report.expensePurpose && (
                            <p className="text-sm text-gray-600">
                              <strong>Призначення витрат:</strong> {report.expensePurpose}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Volunteer */}
            {task.assignedVolunteer && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Призначений волонтер</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Person className="mr-2 h-4 w-4 text-gray-600" />
                      <span className="font-medium">
                        {task.assignedVolunteer.firstName} {task.assignedVolunteer.lastName}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600">
                        @{task.assignedVolunteer.username}
                      </span>
                    </div>
                    {task.assignedVolunteer.email && (
                      <div className="flex items-center">
                        <Email className="mr-2 h-4 w-4 text-gray-600" />
                        <span className="text-sm">{task.assignedVolunteer.email}</span>
                      </div>
                    )}
                    {task.assignedVolunteer.phoneNumber && (
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-600" />
                        <span className="text-sm">{task.assignedVolunteer.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financial Information */}
            {(task.budget || task.expenseAmount) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Фінансова інформація</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.budget && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Бюджет:</span>
                      <span className="font-medium">{task.budget} грн</span>
                    </div>
                  )}
                  {task.expenseAmount && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Витрати:</span>
                      <span className="font-medium">{task.expenseAmount} грн</span>
                    </div>
                  )}
                  {task.expensePurpose && (
                    <div>
                      <span className="text-sm text-gray-600 block mb-1">Призначення:</span>
                      <span className="text-sm">{task.expensePurpose}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/projects/${task.project.id}`} className="block">
                  <Button variant="outline" className="w-full">
                    Переглянути проєкт
                  </Button>
                </Link>
                {canSubmitReport && (
                  <Link href={`/tasks/${task.id}/report`} className="block">
                    <Button className="w-full">
                      Подати звіт
                    </Button>
                  </Link>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => setLocation("/volunteer-dashboard")}
                >
                  <ArrowBack className="mr-2 h-4 w-4" />
                  Повернутися до дашборду
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}