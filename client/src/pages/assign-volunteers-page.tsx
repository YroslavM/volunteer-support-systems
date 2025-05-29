import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Search, 
  MapPin, 
  User, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  UserCheck
} from "lucide-react";

type Volunteer = {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  region: string | null;
  city: string | null;
  phoneNumber: string | null;
};

type Application = {
  id: number;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  projectId: number;
  volunteerId: number;
  createdAt: string;
  volunteer: Volunteer;
  project: {
    id: number;
    name: string;
  };
};

type Task = {
  id: number;
  name: string;
  description: string;
  type: string;
  requiredSkills: string | null;
  volunteersNeeded: number;
  project: {
    id: number;
    name: string;
  };
};

export default function AssignVolunteersPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("approved");
  const [regionFilter, setRegionFilter] = useState("all");

  // Завантажуємо завдання
  const { data: task, isLoading: taskLoading } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  // Завантажуємо заявки волонтерів для проєкту завдання
  const { data: applications = [], isLoading: applicationsLoading } = useQuery<Application[]>({
    queryKey: [`/api/projects/${task?.project.id}/applications`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!task?.project.id,
  });

  // Завантажуємо вже призначених волонтерів для завдання
  const { data: assignedVolunteers = [] } = useQuery<any[]>({
    queryKey: [`/api/tasks/${taskId}/assigned-volunteers`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!taskId,
  });

  // Мутація для призначення волонтерів
  const assignVolunteersMutation = useMutation({
    mutationFn: async (volunteerIds: number[]) => {
      const responses = await Promise.all(
        volunteerIds.map(volunteerId =>
          apiRequest("POST", `/api/tasks/${taskId}/assign`, { volunteerId })
        )
      );
      return responses.map(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Волонтерів призначено",
        description: `${selectedVolunteers.size} волонтер(ів) успішно призначено до завдання`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/assigned-volunteers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/coordinator/tasks`] });
      setLocation("/coordinator/tasks");
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка призначення",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Фільтруємо заявки
  const filteredApplications = applications.filter((app) => {
    const volunteer = app.volunteer;
    const matchesSearch = 
      volunteer.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesRegion = regionFilter === "all" || volunteer.region === regionFilter;
    
    // Виключаємо вже призначених волонтерів
    const isAlreadyAssigned = assignedVolunteers.some(av => av.volunteerId === volunteer.id || av.volunteer?.id === volunteer.id);
    
    return matchesSearch && matchesStatus && matchesRegion && !isAlreadyAssigned;
  });

  // Унікальні регіони для фільтра
  const uniqueRegions = [...new Set(applications
    .map(app => app.volunteer.region)
    .filter(Boolean)
  )];

  const handleVolunteerSelect = (volunteerId: number, checked: boolean) => {
    const newSelected = new Set(selectedVolunteers);
    if (checked) {
      newSelected.add(volunteerId);
    } else {
      newSelected.delete(volunteerId);
    }
    setSelectedVolunteers(newSelected);
  };

  const handleAssignSelected = () => {
    if (selectedVolunteers.size === 0) {
      toast({
        title: "Помилка",
        description: "Виберіть принаймні одного волонтера",
        variant: "destructive",
      });
      return;
    }

    // Перевіряємо, чи не перевищуємо ліміт
    const remainingSlots = task ? task.volunteersNeeded - assignedVolunteers.length : 0;
    if (selectedVolunteers.size > remainingSlots) {
      toast({
        title: "Помилка",
        description: `Можна призначити лише ${remainingSlots} волонтер(ів). Усі місця зайняті.`,
        variant: "destructive",
      });
      return;
    }
    
    assignVolunteersMutation.mutate(Array.from(selectedVolunteers));
  };

  // Обчислюємо доступні місця
  const remainingSlots = task ? task.volunteersNeeded - assignedVolunteers.length : 0;
  const allSlotsFilled = remainingSlots <= 0;

  const checkSkillsMatch = (volunteer: Volunteer, requiredSkills: string | null) => {
    if (!requiredSkills || !volunteer.bio) return null;
    
    const skills = requiredSkills.toLowerCase().split(',').map(s => s.trim());
    const bio = volunteer.bio.toLowerCase();
    const matchedSkills = skills.filter(skill => bio.includes(skill));
    
    return {
      total: skills.length,
      matched: matchedSkills.length,
      percentage: (matchedSkills.length / skills.length) * 100
    };
  };

  if (taskLoading || applicationsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Завдання не знайдено</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation("/coordinator/tasks")}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Призначення волонтерів</h1>
          <p className="text-muted-foreground">
            Завдання: {task.name} | Проєкт: {task.project.name}
          </p>
        </div>
      </div>

      {/* Інформація про завдання */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Деталі завдання
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Потрібно волонтерів</p>
              <p className="text-lg">{task.volunteersNeeded}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Вже призначено</p>
              <p className="text-lg">{assignedVolunteers.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Залишилось призначити</p>
              <p className={`text-lg ${remainingSlots > 0 ? "text-orange-600" : "text-green-600"}`}>
                {remainingSlots}
                {remainingSlots === 0 && " (Усі місця зайняті)"}
              </p>
            </div>
          </div>
          {task.requiredSkills && (
            <div className="mt-4">
              <p className="text-sm font-medium">Потрібні навички</p>
              <p className="text-sm text-muted-foreground">{task.requiredSkills}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Фільтри */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Пошук та фільтри</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за іменем..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Статус заявки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі статуси</SelectItem>
                <SelectItem value="approved">Схвалені</SelectItem>
                <SelectItem value="pending">Очікують</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Регіон" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Усі регіони</SelectItem>
                {uniqueRegions.map((region) => (
                  <SelectItem key={region} value={region!}>
                    {region}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Список волонтерів */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Доступні волонтери ({filteredApplications.length})</span>
            <span className="text-sm font-normal text-muted-foreground">
              Вибрано: {selectedVolunteers.size}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Немає доступних волонтерів для призначення
            </p>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => {
                const volunteer = application.volunteer;
                const skillsMatch = checkSkillsMatch(volunteer, task.requiredSkills);
                
                return (
                  <div 
                    key={volunteer.id} 
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedVolunteers.has(volunteer.id)}
                      onCheckedChange={(checked) => 
                        handleVolunteerSelect(volunteer.id, checked as boolean)
                      }
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <h3 className="font-semibold">
                          {volunteer.firstName} {volunteer.lastName} (@{volunteer.username})
                        </h3>
                        <Badge variant={application.status === "approved" ? "default" : "secondary"}>
                          {application.status === "approved" ? "Схвалено" : "Очікує"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {volunteer.region}, {volunteer.city}
                        </div>
                        {volunteer.phoneNumber && (
                          <span>{volunteer.phoneNumber}</span>
                        )}
                      </div>
                      
                      {volunteer.bio && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {volunteer.bio}
                        </p>
                      )}
                      
                      {skillsMatch && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">
                            Відповідність навичкам: {skillsMatch.matched}/{skillsMatch.total} 
                            ({Math.round(skillsMatch.percentage)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Кнопки дій */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => setLocation("/coordinator/tasks")}
        >
          <Clock className="mr-2 h-4 w-4" />
          Призначити пізніше
        </Button>
        
        <Button
          onClick={handleAssignSelected}
          disabled={selectedVolunteers.size === 0 || assignVolunteersMutation.isPending || allSlotsFilled}
          className="flex items-center"
        >
          <UserCheck className="mr-2 h-4 w-4" />
          {assignVolunteersMutation.isPending 
            ? "Призначення..." 
            : allSlotsFilled
            ? "Усі місця зайняті"
            : `Призначити вибраних (${selectedVolunteers.size})`
          }
        </Button>
      </div>
    </div>
  );
}