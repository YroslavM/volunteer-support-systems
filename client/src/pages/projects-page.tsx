import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { ProjectCard } from "@/components/project-card";
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
// Temporary commenting out auth for debugging
// import { useAuth } from "@/hooks/use-auth";
import { AddCircle, FilterList, Search, Refresh, CheckCircle, AttachMoney } from "@mui/icons-material";
import { Loader2 } from "lucide-react";

// Filter schema
const filterSchema = z.object({
  status: z.enum(["all", "funding", "in_progress", "completed"]).default("all"),
  search: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

export default function ProjectsPage() {
  const { t } = useTranslation();
  // Temporary mock of user to avoid auth context for debugging
  const user = null; 
  const [projects, setProjects] = useState<SelectProject[]>([]);
  
  // Form for filters
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      status: "all",
      search: "",
    },
  });
  
  // Get current filter values
  const status = form.watch("status");
  const search = form.watch("search");
  
  // Fetch projects with filters
  const { data, isLoading, refetch } = useQuery<SelectProject[]>({
    queryKey: ["/api/projects", { status, search }],
    queryFn: async () => {
      let url = "/api/projects";
      const params = new URLSearchParams();
      
      if (status && status !== "all") {
        params.append("status", status);
      }
      
      if (search) {
        params.append("search", search);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: true,
  });
  
  useEffect(() => {
    if (data) {
      setProjects(data);
    }
  }, [data]);
  
  // Handle filter changes
  const onFilterChange = () => {
    refetch();
  };
  
  // Reset filters
  const resetFilters = () => {
    form.reset({
      status: "all",
      search: "",
    });
    refetch();
  };

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 font-heading">{t('home.projects.title')}</h1>
            <p className="mt-2 text-lg text-gray-500">{t('home.projects.subtitle')}</p>
          </div>
          
          {/* Create project button removed for debugging */}
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FilterList className="mr-2" />
              {t('projects.filter.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="grid sm:grid-cols-3 gap-4" onChange={onFilterChange}>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <Label>{t('projects.filter.status')}</Label>
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
                          <SelectItem value="all">Всі проєкти</SelectItem>
                          <SelectItem value="funding">{t('projects.status.funding')}</SelectItem>
                          <SelectItem value="in_progress">{t('projects.status.in_progress')}</SelectItem>
                          <SelectItem value="completed">{t('projects.status.completed')}</SelectItem>
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
                      <Label>{t('projects.filter.search')}</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-3 h-4 w-4 text-gray-500" />
                        <FormControl>
                          <Input
                            className="pl-8"
                            placeholder="Пошук проєктів..."
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              // Debounce search
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
                    {t('projects.filter.reset')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <div className="mx-auto max-w-md">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Проєктів не знайдено</h2>
              <p className="text-gray-500 mb-6">Спробуйте змінити параметри пошуку або перегляньте всі проєкти</p>
              <Button variant="outline" onClick={resetFilters}>
                Переглянути всі проєкти
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
