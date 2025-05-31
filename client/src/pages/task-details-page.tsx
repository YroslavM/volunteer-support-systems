import { useParams, Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowBack, CalendarToday, Person, Assignment } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function TaskDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: task, isLoading } = useQuery({
    queryKey: ["/api/tasks", id],
    enabled: !!id,
  });

  const { data: reports } = useQuery({
    queryKey: ["/api/tasks", id, "reports"],
    enabled: !!id,
  });

  const getTaskStatusColor = (status: string) => {
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

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case "collection":
        return "Збір коштів";
      case "on_site":
        return "На місці";
      case "event_organization":
        return "Організація заходів";
      case "online_support":
        return "Онлайн підтримка";
      case "other":
        return "Інше";
      default:
        return type;
    }
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Завдання не знайдено
          </h1>
          <p className="text-gray-600 mb-6">
            Можливо, завдання було видалено або у вас немає доступу до нього.
          </p>
          <Button onClick={() => setLocation("/")}>
            Повернутися до дашборду
          </Button>
        </div>
      </div>
    );
  }

  const isAssignedVolunteer = user?.role === "volunteer" && task.assignedVolunteerId === user.id;
  const isCoordinator = user?.role === "coordinator";
  const isModerator = user?.role === "moderator" || user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowBack className="mr-2 h-4 w-4" />
            Назад до дашборду
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {task.name}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge className={getTaskStatusColor(task.status)}>
                  {t(`tasks.status.${task.status}`)}
                </Badge>
                <Badge variant="outline">
                  {getTaskTypeLabel(task.type)}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 flex space-x-2">
              {isAssignedVolunteer && task.status === "in_progress" && (
                <Link href={`/tasks/${task.id}/report`}>
                  <Button>Подати звіт</Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Assignment className="mr-2 h-5 w-5" />
                  Інформація про завдання
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Опис</h3>
                    <p className="text-gray-600">{task.description}</p>
                  </div>

                  {task.requiredSkills && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Необхідні навички
                      </h3>
                      <p className="text-gray-600">{task.requiredSkills}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarToday className="h-4 w-4 mr-2" />
                      <div>
                        <span className="block">Створено: {formatDate(task.createdAt)}</span>
                        {task.deadline && (
                          <span className="block">Термін: {formatDate(task.deadline)}</span>
                        )}
                      </div>
                    </div>

                    {task.assignedVolunteerId && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Person className="h-4 w-4 mr-2" />
                        <span>Волонтер призначено: #{task.assignedVolunteerId}</span>
                      </div>
                    )}
                  </div>

                  {task.hasFinancialExpenses && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">
                        Фінансова інформація
                      </h3>
                      <div className="space-y-2 text-sm text-blue-800">
                        {task.allocatedBudget && (
                          <p>Виділений бюджет: {task.allocatedBudget} грн</p>
                        )}
                        {task.expensePurpose && (
                          <p>Призначення витрат: {task.expensePurpose}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reports Section */}
            {(isAssignedVolunteer || isCoordinator || isModerator) && (
              <Card>
                <CardHeader>
                  <CardTitle>Звіти</CardTitle>
                </CardHeader>
                <CardContent>
                  {!reports?.length ? (
                    <p className="text-gray-500 text-center py-4">
                      Звітів ще немає
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report: any) => (
                        <div key={report.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              Звіт #{report.id}
                            </span>
                            <Badge
                              className={
                                report.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : report.status === "needs_clarification"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                              }
                            >
                              {report.status === "approved"
                                ? "Прийнято"
                                : report.status === "needs_clarification"
                                ? "Потрібні уточнення"
                                : "На перевірці"}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-2">{report.description}</p>
                          
                          <div className="text-sm text-gray-500">
                            Подано: {formatDate(report.createdAt)}
                          </div>
                          
                          {report.coordinatorComment && (
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <span className="font-medium text-sm">Коментар координатора:</span>
                              <p className="text-sm text-gray-600">{report.coordinatorComment}</p>
                            </div>
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
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Про проєкт</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Це завдання є частиною проєкту #{task.projectId}
                </p>
                <Link href={`/projects/${task.projectId}`}>
                  <Button variant="outline" className="w-full">
                    Переглянути повну інформацію про проєкт
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Actions */}
            {isAssignedVolunteer && (
              <Card>
                <CardHeader>
                  <CardTitle>Дії</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {task.status === "in_progress" && (
                    <Link href={`/tasks/${task.id}/report`}>
                      <Button className="w-full">Подати звіт</Button>
                    </Link>
                  )}
                  <Link href={`/projects/${task.projectId}`}>
                    <Button variant="outline" className="w-full">
                      Повернутися до проєкту
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}