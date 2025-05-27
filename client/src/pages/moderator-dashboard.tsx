import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, X, Clock, AlertTriangle, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { SelectProject } from "@shared/schema";

type ModerateAction = "approve" | "reject";
// Використовуємо статус проєкту як індикатор модерації
// funding = очікує схвалення (pending)
// in_progress = схвалено (approved)
// completed = відхилено (rejected)
type ModerationStatus = "funding" | "in_progress" | "completed" | "all";

export default function ModeratorDashboard() {
  const [statusFilter, setStatusFilter] = useState<ModerationStatus>("funding");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<SelectProject | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isModerateDialogOpen, setIsModerateDialogOpen] = useState(false);
  const [moderationAction, setModerationAction] = useState<ModerateAction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Fetch projects for moderation
  const { data: projects = [], isLoading, error, refetch } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects/moderation", statusFilter, searchTerm],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (statusFilter !== "all") {
        query.append("status", statusFilter);
      }
      if (searchTerm) {
        query.append("search", searchTerm);
      }
      const queryString = query.toString();
      const url = `/api/projects/moderation${queryString ? `?${queryString}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Failed to fetch projects for moderation");
      }
      
      return response.json();
    }
  });

  // Mutation for moderating projects
  const moderationMutation = useMutation({
    mutationFn: async ({ projectId, action, comment }: { projectId: number; action: ModerateAction; comment?: string }) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/moderate`, {
        status: action === "approve" ? "in_progress" : "completed",
        comment: comment || null
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to moderate project");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/moderation"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsModerateDialogOpen(false);
      setRejectionReason("");
      toast({
        title: moderationAction === "approve" ? "Проєкт схвалено" : "Проєкт відхилено",
        description: moderationAction === "approve" 
          ? "Проєкт тепер доступний для всіх користувачів" 
          : "Проєкт відхилено та повернуто координатору",
        variant: moderationAction === "approve" ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося змодерувати проєкт",
        variant: "destructive",
      });
    },
  });

  const handleModerateAction = (projectId: number, action: ModerateAction) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setModerationAction(action);
      setIsModerateDialogOpen(true);
    }
  };

  const confirmModeration = () => {
    if (!selectedProject || !moderationAction) return;
    
    moderationMutation.mutate({
      projectId: selectedProject.id,
      action: moderationAction,
      comment: moderationAction === "reject" ? rejectionReason : undefined
    });
  };

  const viewProjectDetails = (project: SelectProject) => {
    setSelectedProject(project);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "funding":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" /> На розгляді</Badge>;
      case "in_progress":
        return <Badge variant="default" className="flex items-center gap-1"><Check className="h-3 w-3" /> Схвалено</Badge>;
      case "completed":
        return <Badge variant="destructive" className="flex items-center gap-1"><X className="h-3 w-3" /> Відхилено</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filterButtons = [
    { value: "funding", label: "На розгляді", icon: <Clock className="h-4 w-4" /> },
    { value: "in_progress", label: "Схвалені", icon: <Check className="h-4 w-4" /> },
    { value: "completed", label: "Відхилені", icon: <X className="h-4 w-4" /> },
    { value: "all", label: "Усі", icon: null },
  ];

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Панель модератора</h1>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">Проєкти на модерацію</h2>
            <p className="text-muted-foreground">Перевірте та затвердіть проєкти, створені координаторами</p>
          </div>
          <div className="flex gap-2">
            {filterButtons.map((button) => (
              <Button
                key={button.value}
                variant={statusFilter === button.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(button.value as ModerationStatus)}
                className="flex items-center gap-1"
              >
                {button.icon}
                {button.label}
                {button.value === "funding" && (
                  <Badge variant="secondary" className="ml-1">
                    {projects?.filter(p => p.status === "funding").length || 0}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative mb-4">
          <Input
            placeholder="Пошук проєктів..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="mt-2 text-muted-foreground">Завантаження проєктів...</p>
          </div>
        ) : error ? (
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <p>Помилка завантаження проєктів: {(error as Error).message}</p>
              </div>
              <Button onClick={() => refetch()} className="mt-2" variant="outline">
                Спробувати знову
              </Button>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="mb-4">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Немає проєктів для відображення</p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-card rounded-lg border shadow">
            <Table>
              <TableCaption>Список проєктів для модерації</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Назва</TableHead>
                  <TableHead>Координатор</TableHead>
                  <TableHead>Сума</TableHead>
                  <TableHead>Дата створення</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Дії</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>Координатор ID: {project.coordinatorId}</TableCell>
                    <TableCell>{new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(project.targetAmount)}</TableCell>
                    <TableCell>{new Date(project.createdAt).toLocaleDateString('uk-UA')}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => viewProjectDetails(project)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Деталі</span>
                        </Button>
                        
                        {(project.status === "funding") && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleModerateAction(project.id, "approve")}
                            >
                              <Check className="h-4 w-4" />
                              <span className="sr-only">Схвалити</span>
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleModerateAction(project.id, "reject")}
                            >
                              <X className="h-4 w-4" />
                              <span className="sr-only">Відхилити</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Project Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedProject?.name}</DialogTitle>
            <DialogDescription>
              Створено: {selectedProject ? new Date(selectedProject.createdAt).toLocaleDateString('uk-UA') : ''}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div className="space-y-4">
              {selectedProject.imageUrl && (
                <div className="rounded-md overflow-hidden h-[200px]">
                  <img 
                    src={selectedProject.imageUrl} 
                    alt={selectedProject.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-1">Опис</h3>
                  <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Цільова сума</h3>
                    <p>{new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'UAH' }).format(selectedProject.targetAmount)}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Статус проєкту</h3>
                    <p>{selectedProject.status === "funding" ? "Збір коштів" : 
                        selectedProject.status === "in_progress" ? "В процесі" : 
                        selectedProject.status === "completed" ? "Завершено" : selectedProject.status}</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-1">Статус модерації</h3>
                    <div>{getStatusBadge(selectedProject.status)}</div>
                  </div>
                </div>
              </div>
              
              {selectedProject.status === "funding" && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
                    Закрити
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleModerateAction(selectedProject.id, "reject");
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Відхилити
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsDetailsOpen(false);
                      handleModerateAction(selectedProject.id, "approve");
                    }}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Схвалити
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Moderation Confirmation Dialog */}
      <Dialog open={isModerateDialogOpen} onOpenChange={setIsModerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {moderationAction === "approve" ? "Схвалити проєкт" : "Відхилити проєкт"}
            </DialogTitle>
            <DialogDescription>
              {moderationAction === "approve" 
                ? "Проєкт стане публічно доступним для волонтерів та донорів."
                : "Проєкт буде відхилено і повернуто координатору на доопрацювання."}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProject && (
            <div>
              <p className="font-medium">{selectedProject.name}</p>
              
              {moderationAction === "reject" && (
                <div className="mt-4">
                  <Label htmlFor="rejection-reason">Причина відхилення</Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Вкажіть причину відхилення проєкту..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsModerateDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button 
                  variant={moderationAction === "approve" ? "default" : "destructive"}
                  onClick={confirmModeration}
                  disabled={moderationAction === "reject" && !rejectionReason.trim()}
                >
                  {moderationAction === "approve" ? "Підтвердити схвалення" : "Підтвердити відхилення"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}