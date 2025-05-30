import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { SelectProject } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Users, Calendar, MapPin, CheckCircle, Filter, SortAsc, Search } from "lucide-react";
import { Link } from "wouter";

// Types for user applications and filtering
interface UserApplication {
  id: number;
  projectId: number;
  volunteerId: number;
  status: string;
}

interface FilterState {
  search: string;
  amountRange: string;
  dateStart: string;
  collectedPercentage: string;
  remainingAmount: string;
}

interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export default function ProjectsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    amountRange: "",
    dateStart: "",
    collectedPercentage: "",
    remainingAmount: ""
  });
  const [sort, setSort] = useState<SortState>({
    field: "default",
    direction: "asc"
  });

  // Load all projects
  const { data: projects = [], isLoading, error, refetch } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Load user-specific data based on role
  const { data: userApplications = [] } = useQuery<UserApplication[]>({
    queryKey: ["/api/user/applications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: user?.role === "volunteer",
  });

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Search filter
      if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Amount range filter
      if (filters.amountRange) {
        const amount = project.targetAmount;
        switch (filters.amountRange) {
          case "0-10000":
            if (amount >= 10000) return false;
            break;
          case "10000-100000":
            if (amount < 10000 || amount >= 100000) return false;
            break;
          case "100000+":
            if (amount < 100000) return false;
            break;
        }
      }

      // Date filter
      if (filters.dateStart) {
        const projectDate = new Date(project.createdAt);
        const filterDate = new Date(filters.dateStart);
        if (projectDate < filterDate) return false;
      }

      // Collected percentage filter
      if (filters.collectedPercentage) {
        const percentage = (project.collectedAmount / project.targetAmount) * 100;
        switch (filters.collectedPercentage) {
          case "0-25":
            if (percentage >= 25) return false;
            break;
          case "25-50":
            if (percentage < 25 || percentage >= 50) return false;
            break;
          case "50-75":
            if (percentage < 50 || percentage >= 75) return false;
            break;
          case "75-100":
            if (percentage < 75) return false;
            break;
        }
      }

      // Remaining amount filter
      if (filters.remainingAmount) {
        const remaining = project.targetAmount - project.collectedAmount;
        switch (filters.remainingAmount) {
          case "0-5000":
            if (remaining >= 5000) return false;
            break;
          case "5000-20000":
            if (remaining < 5000 || remaining >= 20000) return false;
            break;
          case "20000+":
            if (remaining < 20000) return false;
            break;
        }
      }

      return true;
    });

    // Sort projects
    if (sort.field !== "default") {
      filtered.sort((a, b) => {
        let aValue, bValue;
        
        switch (sort.field) {
          case "remaining":
            aValue = a.targetAmount - a.collectedAmount;
            bValue = b.targetAmount - b.collectedAmount;
            break;
          case "date":
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case "donors":
            // This would require donation count data
            aValue = 0;
            bValue = 0;
            break;
          case "amount-asc":
            aValue = a.targetAmount;
            bValue = b.targetAmount;
            break;
          case "amount-desc":
            aValue = a.targetAmount;
            bValue = b.targetAmount;
            break;
          default:
            return 0;
        }

        if (sort.field === "amount-desc") {
          return bValue - aValue;
        }
        
        return sort.direction === "asc" ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  }, [projects, filters, sort]);

  // Categorize projects based on user role
  const categorizedProjects = useMemo(() => {
    const approved = filteredAndSortedProjects.filter(p => 
      p.status === "funding" || p.status === "in_progress" || p.status === "completed"
    );
    
    const completedProjects = approved.filter(p => p.status === "completed");
    const activeFunding = approved.filter(p => 
      p.status === "funding" && p.collectedAmount < p.targetAmount
    );
    const completedFunding = approved.filter(p => 
      (p.status === "in_progress" || p.status === "completed") && 
      p.collectedAmount >= p.targetAmount
    );

    if (!user || user.role === "donor") {
      return {
        all: approved,
        active: activeFunding,
        completed: completedProjects,
      };
    } else if (user.role === "volunteer") {
      const myProjectIds = userApplications
        .filter(app => app.status === "approved")
        .map(app => app.projectId);
      
      const participating = approved.filter(p => myProjectIds.includes(p.id));
      const available = approved.filter(p => 
        !myProjectIds.includes(p.id) && p.status === "funding"
      );
      
      return {
        all: approved,
        participating,
        available,
        completed: completedProjects,
      };
    } else if (user.role === "coordinator") {
      const mine = approved.filter(p => p.coordinatorId === user.id);
      const other = approved.filter(p => p.coordinatorId !== user.id);
      
      return {
        all: approved,
        mine,
        other,
        completed: completedProjects,
      };
    } else {
      return {
        all: approved,
        active: activeFunding,
        completed: completedProjects,
      };
    }
  }, [filteredAndSortedProjects, user, userApplications]);

  const getProjectsForTab = (tabValue: string) => {
    switch (tabValue) {
      case "all": return categorizedProjects.all;
      case "active": return categorizedProjects.active || [];
      case "participating": return categorizedProjects.participating || [];
      case "available": return categorizedProjects.available || [];
      case "mine": return categorizedProjects.mine || [];
      case "other": return categorizedProjects.other || [];
      case "completed": return categorizedProjects.completed;
      default: return [];
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: 'UAH',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('UAH', 'грн.');
  };

  const getStatusBadge = (project: SelectProject) => {
    const isFullyFunded = project.collectedAmount >= project.targetAmount;
    
    if (project.status === "completed") {
      return <Badge variant="default" className="bg-green-100 text-green-800">Завершено</Badge>;
    } else if (isFullyFunded) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Збір завершено</Badge>;
    } else {
      return <Badge variant="outline" className="border-green-500 text-green-700">Активний збір</Badge>;
    }
  };

  const renderFundingInfo = (project: SelectProject) => {
    const isFullyFunded = project.collectedAmount >= project.targetAmount;
    const percentage = Math.min((project.collectedAmount / project.targetAmount) * 100, 100);
    
    if (isFullyFunded) {
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Зібрано</span>
            <span>Збір завершено</span>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(project.collectedAmount)}
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Зібрано</span>
            <span>Залишилось зібрати</span>
          </div>
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-900">{formatCurrency(project.collectedAmount)}</span>
            <span className="text-gray-900">{formatCurrency(project.targetAmount - project.collectedAmount)}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      );
    }
  };

  const ProjectCard = ({ project }: { project: SelectProject }) => {
    const isCompleted = project.status === "completed";
    const isFullyFunded = project.collectedAmount >= project.targetAmount;
    
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        {project.imageUrl && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img 
              src={project.imageUrl} 
              alt={project.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg line-clamp-2">{project.name}</CardTitle>
            {getStatusBadge(project)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
          
          {renderFundingInfo(project)}
          
          <div className="flex gap-2">
            <Link href={`/projects/${project.id}`}>
              <Button variant="outline" size="sm" className="flex-1">
                Детальніше
              </Button>
            </Link>
            
            {!isCompleted && !isFullyFunded && (
              <>
                {(user?.role === "donor" || !user) && (
                  <Link href={`/donate/${project.id}`}>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Heart className="h-4 w-4 mr-1" />
                      Підтримати
                    </Button>
                  </Link>
                )}
                
                {user?.role === "volunteer" && (
                  <Button size="sm" variant="outline">
                    <Users className="h-4 w-4 mr-1" />
                    Подати заявку
                  </Button>
                )}
              </>
            )}
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
        { value: "completed", label: "Завершені", count: categorizedProjects.completed.length },
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

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Завантаження проєктів...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">Помилка завантаження проєктів</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Волонтерські проєкти</h1>
          
          {/* Search and Controls */}
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Пошук проєктів..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Фільтри
            </Button>
            
            <Select value={sort.field} onValueChange={(value) => setSort(prev => ({ ...prev, field: value }))}>
              <SelectTrigger className="w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Сортування" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">За замовчуванням</SelectItem>
                <SelectItem value="remaining">За залишком збору</SelectItem>
                <SelectItem value="date">За датою публікації</SelectItem>
                <SelectItem value="amount-asc">За сумою (0-9)</SelectItem>
                <SelectItem value="amount-desc">За сумою (9-0)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="amountRange">Потрібна сума</Label>
                  <Select value={filters.amountRange} onValueChange={(value) => setFilters(prev => ({ ...prev, amountRange: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Всі суми" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Всі суми</SelectItem>
                      <SelectItem value="0-10000">0 – 10 000 грн</SelectItem>
                      <SelectItem value="10000-100000">10 000 – 100 000 грн</SelectItem>
                      <SelectItem value="100000+">100 000+ грн</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="dateStart">Дата створення від</Label>
                  <Input
                    type="date"
                    value={filters.dateStart}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateStart: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="collectedPercentage">Зібрано коштів</Label>
                  <Select value={filters.collectedPercentage} onValueChange={(value) => setFilters(prev => ({ ...prev, collectedPercentage: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Всі проєкти" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Всі проєкти</SelectItem>
                      <SelectItem value="0-25">0-25%</SelectItem>
                      <SelectItem value="25-50">25-50%</SelectItem>
                      <SelectItem value="50-75">50-75%</SelectItem>
                      <SelectItem value="75-100">75-100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="remainingAmount">Залишилось зібрати</Label>
                  <Select value={filters.remainingAmount} onValueChange={(value) => setFilters(prev => ({ ...prev, remainingAmount: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Всі суми" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Всі суми</SelectItem>
                      <SelectItem value="0-5000">0 – 5 000 грн</SelectItem>
                      <SelectItem value="5000-20000">5 000 – 20 000 грн</SelectItem>
                      <SelectItem value="20000+">20 000+ грн</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({
                    search: "",
                    amountRange: "",
                    dateStart: "",
                    collectedPercentage: "",
                    remainingAmount: ""
                  })}
                >
                  Очистити фільтри
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:inline-flex lg:h-auto lg:w-auto">
            {getTabsForRole().map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                {tab.label}
                <Badge variant="secondary" className="ml-1">
                  {tab.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {getTabsForRole().map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-8">
              {getProjectsForTab(tab.value).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">
                    {filters.search || filters.amountRange || filters.dateStart || filters.collectedPercentage || filters.remainingAmount
                      ? "Проєкти за вашими критеріями не знайдено"
                      : "Проєктів в цій категорії поки немає"
                    }
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getProjectsForTab(tab.value).map(project => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}