import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SelectProject, SelectUser } from "@shared/schema";
import { Link } from "wouter";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Edit,
  Delete,
  SupervisorAccount,
  Assessment,
  Dashboard,
  Group,
  Person,
  Info,
  ArrowUpward,
  ArrowDownward,
  FilterList,
  Add,
  VerifiedUser,
  Block,
  Money,
  Assignment,
  AttachMoney
} from "@mui/icons-material";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortField, setSortField] = useState<string>("name");

  // Get all projects
  const { data: projects, isLoading: projectsLoading } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });

  // Get all users
  const { data: users, isLoading: usersLoading } = useQuery<SelectUser[]>({
    queryKey: ["/api/users"],
    enabled: !!user,
  });

  // Filter and sort projects
  const filteredProjects = projects
    ? projects.filter(project => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortField === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === "status") {
      return sortOrder === "asc" 
        ? a.status.localeCompare(b.status) 
        : b.status.localeCompare(a.status);
    } else if (sortField === "collectedAmount") {
      return sortOrder === "asc" 
        ? a.collectedAmount - b.collectedAmount 
        : b.collectedAmount - a.collectedAmount;
    }
    return 0;
  });

  // Filter and sort users
  const filteredUsers = users
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortField === "username") {
      return sortOrder === "asc" 
        ? a.username.localeCompare(b.username)
        : b.username.localeCompare(a.username);
    } else if (sortField === "role") {
      return sortOrder === "asc" 
        ? a.role.localeCompare(b.role) 
        : b.role.localeCompare(a.role);
    } else if (sortField === "isVerified") {
      return sortOrder === "asc" 
        ? (a.isVerified ? 1 : 0) - (b.isVerified ? 1 : 0) 
        : (b.isVerified ? 1 : 0) - (a.isVerified ? 1 : 0);
    }
    return 0;
  });

  // Calculate progress percentage
  const calculateProgress = (project: SelectProject) => {
    return Math.min(Math.round((project.collectedAmount / project.targetAmount) * 100), 100);
  };

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => {
      return apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Проєкт видалено",
        description: "Проєкт був успішно видалений.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify user mutation
  const verifyUserMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiRequest("POST", `/api/users/${userId}/verify`);
    },
    onSuccess: () => {
      toast({
        title: "Користувача верифіковано",
        description: "Користувач був успішно верифікований.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: (userId: number) => {
      return apiRequest("POST", `/api/users/${userId}/block`);
    },
    onSuccess: () => {
      toast({
        title: "Користувача заблоковано",
        description: "Користувач був успішно заблокований.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle sort toggle
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Handle delete project
  const handleDeleteProject = (projectId: number) => {
    if (window.confirm(t('dashboard.admin.confirmDeleteProject'))) {
      deleteProjectMutation.mutate(projectId);
    }
  };

  // Handle verify user
  const handleVerifyUser = (userId: number) => {
    verifyUserMutation.mutate(userId);
  };

  // Handle block user
  const handleBlockUser = (userId: number) => {
    if (window.confirm(t('dashboard.admin.confirmBlockUser'))) {
      blockUserMutation.mutate(userId);
    }
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('uk-UA');
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'coordinator':
        return 'bg-blue-100 text-blue-800';
      case 'volunteer':
        return 'bg-green-100 text-green-800';
      case 'donor':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Statistics data for charts
  const projectStatusData = projects
    ? [
        {
          name: t('projects.status.funding'),
          value: projects.filter(p => p.status === 'funding').length,
          color: '#3b82f6',
        },
        {
          name: t('projects.status.in_progress'),
          value: projects.filter(p => p.status === 'in_progress').length,
          color: '#eab308',
        },
        {
          name: t('projects.status.completed'),
          value: projects.filter(p => p.status === 'completed').length,
          color: '#22c55e',
        },
      ]
    : [];

  const userRoleData = users
    ? [
        {
          name: t('auth.roles.admin'),
          value: users.filter(u => u.role === 'admin').length,
          color: '#a855f7',
        },
        {
          name: t('auth.roles.coordinator'),
          value: users.filter(u => u.role === 'coordinator').length,
          color: '#3b82f6',
        },
        {
          name: t('auth.roles.volunteer'),
          value: users.filter(u => u.role === 'volunteer').length,
          color: '#22c55e',
        },
        {
          name: t('auth.roles.donor'),
          value: users.filter(u => u.role === 'donor').length,
          color: '#eab308',
        },
      ]
    : [];

  // Loading state
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.admin.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('dashboard.admin.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-full shadow-sm px-4 py-2">
            <Badge className={getRoleColor("admin")}>
              {t('auth.roles.admin')}
            </Badge>
            <span className="mx-2">|</span>
            <div className="flex items-center">
              <Person className="text-gray-500 mr-1" />
              <span className="font-medium">{user.username}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.admin.statistics')}</CardTitle>
            <CardDescription>{t('dashboard.admin.statisticsSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-4">{t('dashboard.admin.projectStatus')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, t('dashboard.admin.projectCount')]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-4">{t('dashboard.admin.userRole')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, t('dashboard.admin.userCount')]} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="mb-8 mx-auto flex w-full max-w-md">
          <TabsTrigger value="projects" className="flex-1">
            <Assignment className="mr-2 h-5 w-5" />
            {t('dashboard.admin.projectsTab')}
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            <Group className="mr-2 h-5 w-5" />
            {t('dashboard.admin.usersTab')}
          </TabsTrigger>
        </TabsList>
        
        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="flex justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={t('dashboard.admin.searchProjects')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/projects"] })}
                className="flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('common.refresh')}
              </Button>
              <Link href="/projects/create">
                <Button className="flex items-center">
                  <Add className="mr-2 h-4 w-4" />
                  {t('dashboard.admin.createProject')}
                </Button>
              </Link>
            </div>
          </div>
          
          {projectsLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Assignment className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {t('dashboard.admin.noProjects')}
              </h3>
              <p className="mt-1 text-gray-500">
                {t('dashboard.admin.createProjectPrompt')}
              </p>
              <div className="mt-6">
                <Link href="/projects/create">
                  <Button>
                    {t('dashboard.admin.createProject')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.projectName')}
                        {sortField === "name" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.status')}
                        {sortField === "status" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      {t('dashboard.admin.coordinator')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("collectedAmount")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.funding')}
                        {sortField === "collectedAmount" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {t(`projects.status.${project.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <SupervisorAccount className="mr-1 text-primary-600 h-4 w-4" />
                          <span>ID: {project.coordinatorId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.status === 'funding' ? (
                          <div>
                            <div className="flex justify-between mb-1 text-xs">
                              <span>{project.collectedAmount.toLocaleString('uk-UA')} ₴</span>
                              <span>{project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                            </div>
                            <Progress value={calculateProgress(project)} className="h-2" />
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/projects/${project.id}`}>
                            <Button size="sm" variant="outline">
                              <Info className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}/edit`}>
                            <Button size="sm" variant="outline" className="bg-amber-50">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
        
        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex justify-between mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder={t('dashboard.admin.searchUsers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {t('common.refresh')}
            </Button>
          </div>
          
          {usersLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Group className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                {t('dashboard.admin.noUsers')}
              </h3>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("username")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.username')}
                        {sortField === "username" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead>
                      {t('dashboard.admin.email')}
                    </TableHead>
                    <TableHead>
                      {t('dashboard.admin.name')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("role")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.role')}
                        {sortField === "role" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("isVerified")}
                    >
                      <div className="flex items-center">
                        {t('dashboard.admin.status')}
                        {sortField === "isVerified" && (
                          sortOrder === "asc" ? 
                          <ArrowUpward className="ml-1 h-4 w-4" /> : 
                          <ArrowDownward className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      {t('common.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.firstName && user.lastName 
                          ? `${user.firstName} ${user.lastName}`
                          : user.firstName || user.lastName || "-"
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {t(`auth.roles.${user.role}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">
                            {t('dashboard.admin.verified')}
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            {t('dashboard.admin.notVerified')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!user.isVerified && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                              onClick={() => handleVerifyUser(user.id)}
                            >
                              <VerifiedUser className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== 'admin' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                              onClick={() => handleBlockUser(user.id)}
                            >
                              <Block className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}