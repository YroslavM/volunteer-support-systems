import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
} from "@/components/ui/form";
import { SelectProject } from "@shared/schema";
import { AddCircle, FilterList, Search, Refresh, CheckCircle, AttachMoney, Assignment } from "@mui/icons-material";
import { getQueryFn } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Extended filter schema
const filterSchema = z.object({
  status: z.enum(["all", "funding", "in_progress", "completed"]).default("all"),
  search: z.string().optional(),
  fundingStatus: z.enum(["all", "active", "completed"]).default("all"),
});

type FilterFormValues = z.infer<typeof filterSchema>;

type ProjectWithMeta = SelectProject & {
  fundingCompleted: boolean;
  participationStatus?: "participating" | "applied" | "available" | "unavailable";
  hasActiveTasks?: boolean;
};

type UserApplication = {
  id: number;
  projectId: number;
  status: string;
};

type UserProject = {
  id: number;
  name: string;
  status: string;
};

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: "all",
      search: "",
      fundingStatus: "all",
    },
  });

  // Load all projects
  const { data: projects = [], isLoading, error, refetch } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
    queryFn: getQueryFn(),
  });

  // Load user-specific data based on role
  const { data: userApplications = [] } = useQuery<UserApplication[]>({
    queryKey: ["/api/user/applications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "volunteer",
  });

  const { data: userProjects = [] } = useQuery<UserProject[]>({
    queryKey: ["/api/volunteer/projects"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "volunteer",
  });

  const { data: coordinatorProjects = [] } = useQuery<SelectProject[]>({
    queryKey: [`/api/projects/coordinator/${user?.id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user && user.role === "coordinator",
  });

  // Enhanced project processing with metadata
  const processedProjects = useMemo(() => {
    return projects.map((project): ProjectWithMeta => {
      const fundingCompleted = project.collectedAmount >= project.targetAmount;
      let participationStatus: ProjectWithMeta["participationStatus"] = "available";

      if (user && user.role === "volunteer") {
        // Check if user is participating in this project
        const isParticipating = userProjects.some(p => p.id === project.id);
        if (isParticipating) {
          participationStatus = "participating";
        } else {
          // Check if user has applied
          const application = userApplications.find(app => app.projectId === project.id);
          if (application) {
            participationStatus = application.status === "approved" ? "participating" : "applied";
          } else if (fundingCompleted && project.status !== "in_progress") {
            participationStatus = "unavailable";
          }
        }
      } else if (user && user.role === "coordinator") {
        participationStatus = coordinatorProjects.some(p => p.id === project.id) ? "participating" : "available";
      } else if (user && (user.role === "donor" || !user)) {
        participationStatus = fundingCompleted ? "unavailable" : "available";
      }

      return {
        ...project,
        fundingCompleted,
        participationStatus,
        hasActiveTasks: project.status === "in_progress",
      };
    });
  }, [projects, user, userApplications, userProjects, coordinatorProjects]);

  // Categorize projects based on user role and filters
  const categorizedProjects = useMemo(() => {
    const filters = form.watch() || { status: "all", search: "", fundingStatus: "all" };
    
    let filtered = processedProjects.filter(project => {
      // Status filter
      if (filters.status !== "all" && project.status !== filters.status) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!project.name.toLowerCase().includes(searchLower) && 
            !project.description.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Funding status filter
      if (filters.fundingStatus === "active" && project.fundingCompleted) {
        return false;
      }
      if (filters.fundingStatus === "completed" && !project.fundingCompleted) {
        return false;
      }

      return true;
    });

    // Role-based filtering and sorting
    if (!user || user.role === "donor") {
      // For donors and guests: prioritize active funding projects
      const activeFunding = filtered.filter(p => !p.fundingCompleted);
      const completedFunding = filtered.filter(p => p.fundingCompleted);
      
      return {
        all: [...activeFunding, ...completedFunding],
        active: activeFunding,
        completed: completedFunding,
        participating: [],
        available: activeFunding,
      };
    } else if (user.role === "volunteer") {
      const participating = filtered.filter(p => p.participationStatus === "participating");
      const applied = filtered.filter(p => p.participationStatus === "applied");
      const available = filtered.filter(p => p.participationStatus === "available" && !p.fundingCompleted);
      const unavailable = filtered.filter(p => p.participationStatus === "unavailable" || p.fundingCompleted);
      
      return {
        all: [...participating, ...applied, ...available, ...unavailable],
        participating,
        available: [...applied, ...available],
        completed: unavailable,
      };
    } else if (user.role === "coordinator") {
      const myProjects = filtered.filter(p => p.participationStatus === "participating");
      const otherProjects = filtered.filter(p => p.participationStatus !== "participating");
      
      return {
        all: [...myProjects, ...otherProjects],
        mine: myProjects,
        other: otherProjects,
        completed: filtered.filter(p => p.status === "completed"),
      };
    } else {
      // For moderators and admins: show all projects
      return {
        all: filtered,
        active: filtered.filter(p => !p.fundingCompleted && p.status !== "completed"),
        completed: filtered.filter(p => p.fundingCompleted || p.status === "completed"),
      };
    }
  }, [processedProjects, form.watch(), user]);

  const onFilterChange = () => {
    // Trigger re-filtering through form watch
    setTimeout(() => refetch(), 100);
  };

  const resetFilters = () => {
    form.reset();
    onFilterChange();
  };

  const getProjectBadges = (project: ProjectWithMeta) => {
    const badges = [];
    
    if (project.fundingCompleted) {
      badges.push(
        <Badge key="funding-completed" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Збір завершено
        </Badge>
      );
    }

    if (project.participationStatus === "participating") {
      badges.push(
        <Badge key="participating" className="bg-blue-100 text-blue-800">
          <Assignment className="w-3 h-3 mr-1" />
          Ви берете участь
        </Badge>
      );
    }

    if (project.participationStatus === "applied") {
      badges.push(
        <Badge key="applied" className="bg-yellow-100 text-yellow-800">
          Заявку подано
        </Badge>
      );
    }

    return badges;
  };

  const renderProjectCard = (project: ProjectWithMeta) => {
    const isDisabled = project.fundingCompleted && (user?.role === "donor" || !user);
    
    return (
      <Card 
        key={project.id} 
        className={`transition-all duration-200 hover:shadow-lg ${
          isDisabled ? "opacity-60 bg-gray-50" : ""
        }`}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
            <div className="flex flex-wrap gap-1 ml-2">
              {getProjectBadges(project)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
          
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Зібрано коштів</span>
              <span>{project.collectedAmount} / {project.targetAmount} грн</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  project.fundingCompleted ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ 
                  width: `${Math.min((project.collectedAmount / project.targetAmount) * 100, 100)}%` 
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline">
              {t(`projects.status.${project.status}`)}
            </Badge>
            
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}`}>
                <Button variant="outline" size="sm">
                  Деталі
                </Button>
              </Link>
              
              {!isDisabled && !project.fundingCompleted && (
                <Link href={`/donate/${project.id}`}>
                  <Button size="sm">
                    <AttachMoney className="w-4 h-4 mr-1" />
                    Підтримати
                  </Button>
                </Link>
              )}
              
              {user?.role === "volunteer" && project.participationStatus === "available" && (
                <Link href={`/projects/${project.id}`}>
                  <Button size="sm" variant="secondary">
                    Подати заявку
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getTabsForRole = () => {
    if (!user || user.role === "donor") {
      return [
        { value: "all", label: "Всі проєкти", count: categorizedProjects.all.length },
        { value: "active", label: "Активний збір", count: categorizedProjects.active?.length || 0 },
        { value: "completed", label: "Збір завершено", count: categorizedProjects.completed.length },
      ];
    } else if (user.role === "volunteer") {
      return [
        { value: "all", label: "Всі проєкти", count: categorizedProjects.all.length },
        { value: "participating", label: "Мої проєкти", count: categorizedProjects.participating?.length || 0 },
        { value: "available", label: "Доступні", count: categorizedProjects.available?.length || 0 },
        { value: "completed", label: "Завершені", count: categorizedProjects.completed.length },
      ];
    } else if (user.role === "coordinator") {
      return [
        { value: "all", label: "Всі проєкти", count: categorizedProjects.all.length },
        { value: "mine", label: "Мої проєкти", count: categorizedProjects.mine?.length || 0 },
        { value: "other", label: "Інші проєкти", count: categorizedProjects.other?.length || 0 },
        { value: "completed", label: "Завершені", count: categorizedProjects.completed.length },
      ];
    } else {
      return [
        { value: "all", label: "Всі проєкти", count: categorizedProjects.all.length },
        { value: "active", label: "Активні", count: categorizedProjects.active?.length || 0 },
        { value: "completed", label: "Завершені", count: categorizedProjects.completed.length },
      ];
    }
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-heading">
              {t('home.projects.title')}
            </h1>
            <p className="mt-2 text-lg text-gray-500">
              {t('home.projects.subtitle')}
            </p>
          </div>
          
          {user?.role === "coordinator" && (
            <Link href="/create-project">
              <Button className="flex items-center">
                <AddCircle className="mr-2 h-4 w-4" />
                Створити проєкт
              </Button>
            </Link>
          )}
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FilterList className="mr-2" />
              Фільтри
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="grid sm:grid-cols-4 gap-4" onChange={onFilterChange}>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Статус проєкту</Label>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          onFilterChange();
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Всі статуси</SelectItem>
                          <SelectItem value="funding">Збір коштів</SelectItem>
                          <SelectItem value="in_progress">У процесі</SelectItem>
                          <SelectItem value="completed">Завершено</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Стан збору</Label>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          onFilterChange();
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Всі</SelectItem>
                          <SelectItem value="active">Активний збір</SelectItem>
                          <SelectItem value="completed">Збір завершено</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="search"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Пошук</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                        <FormControl>
                          <Input
                            className="pl-8"
                            placeholder="Пошук проєктів..."
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              const timeout = setTimeout(() => {
                                onFilterChange();
                              }, 500);
                              return () => clearTimeout(timeout);
                            }}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters} className="flex items-center">
                    <Refresh className="mr-2 h-4 w-4" />
                    Скинути
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Projects with Tabs */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Помилка завантаження</h2>
              <p className="text-gray-500 mb-6">Не вдалося завантажити проєкти</p>
              <Button onClick={() => refetch()}>Спробувати знову</Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              {getTabsForRole().map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center">
                  {tab.label}
                  <Badge variant="secondary" className="ml-2">
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {getTabsForRole().map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {categorizedProjects[tab.value as keyof typeof categorizedProjects]?.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-lg shadow">
                    <div className="mx-auto max-w-md">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                        Проєктів не знайдено
                      </h2>
                      <p className="text-gray-500 mb-6">
                        У цій категорії немає проєктів або вони не відповідають фільтрам
                      </p>
                      <Button variant="outline" onClick={resetFilters}>
                        Скинути фільтри
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(categorizedProjects[tab.value as keyof typeof categorizedProjects] || []).map(renderProjectCard)}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}