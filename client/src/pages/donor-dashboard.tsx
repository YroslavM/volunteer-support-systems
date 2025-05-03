import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SelectProject, SelectDonation } from "@shared/schema";
import { 
  Favorite, 
  AttachMoney, 
  Search, 
  ArrowForward,
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

export default function DonorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-donations");

  // Fetch donor's donations
  const { data: donations, isLoading: donationsLoading } = useQuery<SelectDonation[]>({
    queryKey: ["/api/user/donations"],
  });

  // Fetch projects related to donations
  const { data: donatedProjects, isLoading: donatedProjectsLoading } = useQuery<SelectProject[]>({
    queryKey: ["/api/donor/projects"],
    queryFn: async () => {
      if (!donations?.length) return [];
      
      // Get unique project IDs
      const projectIds = [...new Set(donations.map(d => d.projectId))];
      
      // Fetch projects
      const projects: SelectProject[] = [];
      
      for (const id of projectIds) {
        try {
          const res = await fetch(`/api/projects/${id}`);
          if (res.ok) {
            const project = await res.json();
            projects.push(project);
          }
        } catch (error) {
          console.error(`Failed to fetch project ${id}:`, error);
        }
      }
      
      return projects;
    },
    enabled: !!donations?.length,
  });

  // Fetch recommended projects (funding status)
  const { data: recommendedProjects, isLoading: recommendedProjectsLoading } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects", { status: "funding", limit: 3 }],
    queryFn: async () => {
      const res = await fetch(`/api/projects?status=funding&limit=3`);
      if (!res.ok) throw new Error("Failed to fetch recommended projects");
      return res.json();
    },
  });

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("uk-UA");
  };

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("uk-UA").format(amount);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "funding":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate progress percentage
  const calculateProgress = (collected: number, target: number) => {
    return Math.min(Math.round((collected / target) * 100), 100);
  };

  // Calculate total donations by this donor
  const totalDonated = donations?.reduce((sum, donation) => sum + donation.amount, 0) || 0;

  // Get project by ID
  const getProjectById = (id: number) => {
    return donatedProjects?.find(project => project.id === id);
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 font-heading">
            {t("dashboard.donor.title")}
          </h1>
          <p className="mt-2 text-lg text-gray-500">
            Вітаємо, {user?.firstName || user?.username}! Тут ви можете відстежувати ваші пожертви та знаходити проєкти, які потребують підтримки.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2">
                    <TabsTrigger value="my-donations" className="flex items-center">
                      <Favorite className="mr-2 h-4 w-4" />
                      {t("dashboard.donor.myDonations")}
                    </TabsTrigger>
                    <TabsTrigger value="recommended" className="flex items-center">
                      <Search className="mr-2 h-4 w-4" />
                      {t("dashboard.donor.recommendedProjects")}
                    </TabsTrigger>
                  </TabsList>

                  {/* My Donations Tab */}
                  <TabsContent value="my-donations" className="border-t pt-4">
                    {donationsLoading || donatedProjectsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !donations?.length ? (
                      <div className="text-center py-12">
                        <AttachMoney className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          Ви ще не зробили жодної пожертви
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Оберіть проєкт, який вам подобається, та підтримайте його фінансово
                        </p>
                        <div className="mt-6">
                          <Button
                            variant="outline"
                            onClick={() => setActiveTab("recommended")}
                          >
                            Переглянути рекомендовані проєкти
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {donations.map((donation) => {
                          const project = getProjectById(donation.projectId);
                          
                          return (
                            <div
                              key={donation.id}
                              className="bg-white rounded-lg border p-4 flex flex-col sm:flex-row justify-between"
                            >
                              <div>
                                <div className="flex items-center mb-2">
                                  <Favorite className="text-secondary-500 mr-2" />
                                  <div>
                                    <h3 className="font-medium text-lg text-gray-900">
                                      {project?.name || `Проєкт #${donation.projectId}`}
                                    </h3>
                                    <div className="text-sm text-gray-500">
                                      Ваша пожертва: {formatAmount(donation.amount)} ₴
                                    </div>
                                  </div>
                                </div>
                                {donation.comment && (
                                  <p className="text-gray-600 mb-2 line-clamp-2">
                                    "{donation.comment}"
                                  </p>
                                )}
                                <div className="text-sm text-gray-500">
                                  Дата: {formatDate(donation.createdAt)}
                                </div>
                              </div>
                              <div className="mt-4 sm:mt-0 flex items-center">
                                {project && (
                                  <>
                                    <Badge className={`mr-2 ${getStatusColor(project.status)}`}>
                                      {t(`projects.status.${project.status}`)}
                                    </Badge>
                                    <Link href={`/projects/${project.id}`}>
                                      <Button variant="outline">
                                        {t("dashboard.donor.projectDetails")}
                                      </Button>
                                    </Link>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* Recommended Projects Tab */}
                  <TabsContent value="recommended" className="border-t pt-4">
                    {recommendedProjectsLoading ? (
                      <div className="flex justify-center items-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !recommendedProjects?.length ? (
                      <div className="text-center py-12">
                        <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                          Наразі немає проєктів, які збирають кошти
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Перевірте пізніше або перегляньте всі проєкти
                        </p>
                        <div className="mt-6">
                          <Link href="/projects">
                            <Button variant="outline">Всі проєкти</Button>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recommendedProjects.map((project) => (
                          <div
                            key={project.id}
                            className="bg-white rounded-lg border p-4"
                          >
                            <div className="sm:flex justify-between">
                              <div>
                                <h3 className="font-medium text-lg text-gray-900">{project.name}</h3>
                                <p className="text-gray-600 mb-2 line-clamp-2">{project.description}</p>
                              </div>
                              <div className="mt-4 sm:mt-0 sm:ml-4 flex items-center">
                                <Link href={`/projects/${project.id}/donate`}>
                                  <Button className="bg-secondary-500 hover:bg-secondary-600">
                                    {t("dashboard.donor.donateButton")}
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>{t("home.projects.collected")}: {formatAmount(project.collectedAmount)} ₴</span>
                                <span>{t("home.projects.target")}: {formatAmount(project.targetAmount)} ₴</span>
                              </div>
                              <Progress value={calculateProgress(project.collectedAmount, project.targetAmount)} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-6">
                      <Link href="/projects">
                        <Button variant="outline" className="flex items-center">
                          Переглянути всі проєкти
                          <ArrowForward className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Donation Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ваш внесок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-primary-50 rounded-lg">
                  <AttachMoney className="mx-auto h-12 w-12 text-primary mb-2" />
                  <h3 className="text-3xl font-bold text-primary mb-1">
                    {formatAmount(totalDonated)} ₴
                  </h3>
                  <p className="text-gray-500">Загальна сума ваших пожертв</p>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Підтримані проєкти:</span>
                    <span className="font-medium text-gray-900">
                      {donatedProjects?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Пожертви:</span>
                    <span className="font-medium text-gray-900">
                      {donations?.length || 0}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link href="/projects?status=funding">
                    <Button className="w-full bg-secondary-500 hover:bg-secondary-600 flex items-center justify-center">
                      <AttachMoney className="mr-2 h-4 w-4" />
                      Зробити нову пожертву
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Recently Supported Projects */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Нещодавно підтримані проєкти</CardTitle>
              </CardHeader>
              <CardContent>
                {donatedProjectsLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : !donatedProjects?.length ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500">
                      Ви ще не підтримали жодного проєкту
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {donatedProjects.slice(0, 3).map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center justify-between mt-2">
                            <Badge className={getStatusColor(project.status)}>
                              {t(`projects.status.${project.status}`)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatAmount(
                                donations
                                  ?.filter(d => d.projectId === project.id)
                                  .reduce((sum, d) => sum + d.amount, 0) || 0
                              )} ₴
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                <div className="mt-4">
                  <Link href="/projects">
                    <Button variant="outline" className="w-full">
                      Всі проєкти
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
