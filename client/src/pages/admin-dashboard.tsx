import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { User, Project, Donation } from "@shared/schema";

// Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  Edit,
  Trash2,
  PlusCircle,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project-card";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("projects");

  // Fetch all projects
  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch all donations
  const {
    data: donations,
    isLoading: isLoadingDonations,
    error: donationsError,
  } = useQuery<Donation[]>({
    queryKey: ["/api/admin/donations"],
    enabled: !!user && user.role === "admin",
  });

  // Statistics
  const totalProjects = projects?.length || 0;
  const totalUsers = users?.length || 0;
  const totalDonations = donations?.reduce((sum, donation) => sum + donation.amount, 0) || 0;
  
  // Projects by status data for pie chart
  const projectsByStatus = [
    {
      name: t("projects.status.funding"),
      value: projects?.filter((p) => p.status === "funding").length || 0,
    },
    {
      name: t("projects.status.in_progress"),
      value: projects?.filter((p) => p.status === "in_progress").length || 0,
    },
    {
      name: t("projects.status.completed"),
      value: projects?.filter((p) => p.status === "completed").length || 0,
    },
  ];
  
  // Users by role data for pie chart
  const usersByRole = [
    {
      name: t("roles.volunteer"),
      value: users?.filter((u) => u.role === "volunteer").length || 0,
    },
    {
      name: t("roles.coordinator"),
      value: users?.filter((u) => u.role === "coordinator").length || 0,
    },
    {
      name: t("roles.donor"),
      value: users?.filter((u) => u.role === "donor").length || 0,
    },
    {
      name: t("roles.admin"),
      value: users?.filter((u) => u.role === "admin").length || 0,
    },
  ];
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  if (!user || user.role !== "admin") {
    return (
      <div className="container max-w-7xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-4">{t("common.error")}</h1>
        <p>{t("common.error")}: {t("dashboard.admin.title")}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.admin.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("account.welcome")}, {user.firstName || user.username}!
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.totalProjects")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <div className="flex items-center mt-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground mr-1" />
              <p className="text-xs text-muted-foreground">
                {projectsByStatus[0].value} {t("projects.status.funding").toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.totalUsers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <div className="flex items-center mt-2">
              <Users className="h-4 w-4 text-muted-foreground mr-1" />
              <p className="text-xs text-muted-foreground">
                {usersByRole[0].value} {t("roles.volunteer").toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.admin.totalDonations")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalDonations.toLocaleString(i18n.language, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
              <p className="text-xs text-muted-foreground">
                {donations?.length || 0} {t("dashboard.donor.myDonations").toLowerCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="projects" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full md:w-[400px] mb-8">
          <TabsTrigger value="projects">{t("dashboard.admin.allProjects")}</TabsTrigger>
          <TabsTrigger value="users">{t("dashboard.admin.allUsers")}</TabsTrigger>
          <TabsTrigger value="statistics">{t("dashboard.admin.systemStatistics")}</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t("dashboard.admin.allProjects")}</h2>
            <Link href="/projects/create">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t("dashboard.admin.createProjectButton")}
              </Button>
            </Link>
          </div>

          {isLoadingProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-video w-full bg-muted">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex justify-between w-full">
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : projectsError ? (
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <p className="text-red-600">
                {t("common.error")}: {(projectsError as Error).message}
              </p>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">{t("common.noProjects")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("common.checkBackLater")}
              </p>
              <Link href="/projects/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {t("dashboard.admin.createProjectButton")}
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t("dashboard.admin.allUsers")}</h2>
          </div>

          {isLoadingUsers ? (
            <div className="w-full">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t("auth.username")}</TableHead>
                        <TableHead>{t("auth.email")}</TableHead>
                        <TableHead>{t("auth.role")}</TableHead>
                        <TableHead>{t("common.edit")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : usersError ? (
            <div className="text-center p-6 bg-red-50 rounded-lg">
              <p className="text-red-600">
                {t("common.error")}: {(usersError as Error).message}
              </p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="w-full">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableCaption>{t("dashboard.admin.allUsers")}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>{t("auth.username")}</TableHead>
                        <TableHead>{t("auth.email")}</TableHead>
                        <TableHead>{t("auth.role")}</TableHead>
                        <TableHead>{t("common.edit")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.id}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={
                              user.role === "admin" 
                                ? "destructive" 
                                : user.role === "coordinator" 
                                  ? "default" 
                                  : user.role === "volunteer" 
                                    ? "secondary" 
                                    : "outline"
                            }>
                              {t(`roles.${user.role}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center p-8 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">{t("common.error")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("common.error")}
              </p>
            </div>
          )}
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t("dashboard.admin.systemStatistics")}</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Projects by Status */}
            <Card>
              <CardHeader>
                <CardTitle>{t("projects.status.title")}</CardTitle>
                <CardDescription>
                  {t("dashboard.admin.totalProjects")}: {totalProjects}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectsByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {projectsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Users by Role */}
            <Card>
              <CardHeader>
                <CardTitle>{t("auth.role")}</CardTitle>
                <CardDescription>
                  {t("dashboard.admin.totalUsers")}: {totalUsers}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersByRole}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {usersByRole.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Donations Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.donor.myDonations")}</CardTitle>
              <CardDescription>
                {t("dashboard.admin.totalDonations")}: ${totalDonations.toLocaleString(i18n.language, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {isLoadingDonations ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : donations && donations.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        projects
                          ?.filter(project => 
                            donations?.some(donation => donation.projectId === project.id)
                          )
                          .map(project => ({
                            name: project.name,
                            amount: donations
                              ?.filter(donation => donation.projectId === project.id)
                              .reduce((sum, donation) => sum + donation.amount, 0) || 0
                          })) || []
                      }
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 100,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="amount" name={t("donate.amount")} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">
                      {t("common.noProjects")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}