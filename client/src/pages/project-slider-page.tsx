import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import { SelectProject, SelectUser } from "@shared/schema";
import { 
  Person, 
  AttachMoney, 
  Assignment, 
  Group, 
  CalendarToday, 
  ArrowBack,
  InfoOutlined,
  PhotoLibraryOutlined,
  PublicOutlined,
  LocationOnOutlined
} from "@mui/icons-material";
import { Loader2 } from "lucide-react";

// Список зображень для демонстрації у слайдері
// У реальному проєкті ці зображення мають бути доступні в базі даних
const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1574920162043-b872873f19c8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80",
  "https://images.unsplash.com/photo-1469571486292-b53601010be9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
];

export default function ProjectSliderPage() {
  const [, params] = useLocation();
  const projectId = params ? parseInt(params.split("/")[2]) : null;
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("description");
  
  // Для імітації користувача, буде видалено при підключенні справжньої авторизації
  const user = null;
  
  // Запит даних проєкту
  const { data: project, isLoading: projectLoading } = useQuery<SelectProject>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });
  
  // Запит даних координатора
  const { data: coordinator, isLoading: coordinatorLoading } = useQuery<SelectUser>({
    queryKey: ["/api/users", project?.coordinatorId],
    enabled: !!project?.coordinatorId,
    queryFn: async () => {
      const res = await fetch(`/api/users/${project?.coordinatorId}`);
      if (!res.ok) return null;
      return res.json();
    }
  });
  
  // Розрахунок прогресу збору коштів
  const progressPercentage = project 
    ? Math.min(Math.round((project.collectedAmount / project.targetAmount) * 100), 100)
    : 0;
  
  // Форматування дати
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('uk-UA');
  };
  
  // Визначення кольору для статусу
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
  
  // Стан завантаження
  if (projectLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Проєкт не знайдено
  if (!project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Проєкт не знайдено</h1>
          <p className="text-gray-600 mb-8">Проєкт не існує або був видалений.</p>
          <Link href="/projects">
            <Button>Повернутися до проєктів</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4 flex items-center">
            <ArrowBack className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Основна інформація та слайдер */}
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <CardHeader className="relative p-0">
                <div className="relative h-[400px] w-full">
                  <Carousel className="w-full">
                    <CarouselContent>
                      {/* Основне зображення проєкту */}
                      <CarouselItem>
                        <div className="h-[400px] relative">
                          <img 
                            src={project.imageUrl || DEMO_IMAGES[0]} 
                            alt={project.name} 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                            <Badge className={`self-start mb-2 ${getStatusColor(project.status)}`}>
                              {t(`projects.status.${project.status}`)}
                            </Badge>
                            <h1 className="text-3xl font-bold text-white">{project.name}</h1>
                            <p className="text-white/80 mt-2 line-clamp-2">
                              {project.description.substring(0, 120)}...
                            </p>
                          </div>
                        </div>
                      </CarouselItem>
                      
                      {/* Додаткові зображення для демонстрації */}
                      {DEMO_IMAGES.slice(1).map((image, index) => (
                        <CarouselItem key={index}>
                          <div className="h-[400px] relative">
                            <img 
                              src={image} 
                              alt={`Фото проєкту ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6">
                              <h2 className="text-2xl font-bold text-white">
                                Фото #{index + 1} проєкту {project.name}
                              </h2>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </Carousel>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Вкладки для навігації */}
                <div className="flex border-b border-gray-200 mb-6">
                  <button
                    onClick={() => setActiveTab("description")}
                    className={`pb-2 px-4 flex items-center ${
                      activeTab === "description"
                        ? "border-b-2 border-primary text-primary-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <InfoOutlined className="mr-2 h-4 w-4" />
                    Опис
                  </button>
                  <button
                    onClick={() => setActiveTab("gallery")}
                    className={`pb-2 px-4 flex items-center ${
                      activeTab === "gallery"
                        ? "border-b-2 border-primary text-primary-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <PhotoLibraryOutlined className="mr-2 h-4 w-4" />
                    Галерея
                  </button>
                  <button
                    onClick={() => setActiveTab("location")}
                    className={`pb-2 px-4 flex items-center ${
                      activeTab === "location"
                        ? "border-b-2 border-primary text-primary-600 font-medium"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <LocationOnOutlined className="mr-2 h-4 w-4" />
                    Локація
                  </button>
                </div>
                
                {/* Вміст вкладок */}
                <div className="py-2">
                  {activeTab === "description" && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-line">{project.description}</p>
                      
                      {/* Додаткова інформація */}
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium text-gray-900 mb-2">Деталі проєкту</h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start">
                              <span className="font-medium w-32">Дата початку:</span>
                              <span>{formatDate(project.createdAt)}</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium w-32">Статус:</span>
                              <Badge className={getStatusColor(project.status)}>
                                {t(`projects.status.${project.status}`)}
                              </Badge>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium w-32">Координатор:</span>
                              <span>{coordinator?.firstName} {coordinator?.lastName}</span>
                            </li>
                          </ul>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium text-gray-900 mb-2">Контакти</h3>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start">
                              <span className="font-medium w-32">Email:</span>
                              <span>info@example.com</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium w-32">Телефон:</span>
                              <span>+380 (50) 123-45-67</span>
                            </li>
                            <li className="flex items-start">
                              <span className="font-medium w-32">Веб-сайт:</span>
                              <a href="#" className="text-primary-600 hover:underline">
                                www.example.com
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "gallery" && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Галерея проєкту</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {DEMO_IMAGES.map((image, index) => (
                          <div 
                            key={index} 
                            className="rounded-lg overflow-hidden border border-gray-200 aspect-square relative group"
                          >
                            <img 
                              src={image} 
                              alt={`Фото ${index + 1}`} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button size="sm" variant="secondary">Переглянути</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {activeTab === "location" && (
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Розташування проєкту</h2>
                      <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <iframe
                          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2540.427739569423!2d30.517158276917137!3d50.45130297947514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d4ce50f8b6e3c3%3A0xb528dc4d6dadc4f8!2z0LLRg9C70LjRhtGPINCl0YDQtdGJ0LDRgtC40LosIDEwLCDQmtC40ZfQsiwgMDI0ODE!5e0!3m2!1suk!2sua!4v1714988742344!5m2!1suk!2sua"
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Місцезнаходження проєкту"
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Бічна панель */}
          <div className="lg:col-span-4 space-y-6">
            {/* Інформація про фінансування */}
            {project.status === 'funding' && (
              <Card>
                <CardHeader>
                  <CardTitle>Зібрано коштів</CardTitle>
                  <CardDescription>Фінансова мета проєкту</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">{project.collectedAmount.toLocaleString('uk-UA')} ₴</span>
                      <span className="font-medium">{project.targetAmount.toLocaleString('uk-UA')} ₴</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-sm text-gray-500 mt-2">
                      Зібрано {progressPercentage}% від необхідної суми
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button className="w-full bg-secondary-500 hover:bg-secondary-600 flex items-center justify-center">
                      <AttachMoney className="mr-2" />
                      Підтримати проєкт
                    </Button>
                    <Button variant="outline" className="w-full flex items-center justify-center">
                      <Group className="mr-2" />
                      Стати волонтером
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-gray-50 p-4 text-sm text-gray-500">
                  Підтримано 24 донорами за останній місяць
                </CardFooter>
              </Card>
            )}
            
            {/* Інформація про координатора */}
            <Card>
              <CardHeader>
                <CardTitle>Координатор проєкту</CardTitle>
                <CardDescription>Контактна особа</CardDescription>
              </CardHeader>
              
              {coordinatorLoading ? (
                <CardContent className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              ) : coordinator ? (
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary-100 text-primary-800 p-3 rounded-full">
                      <Person />
                    </div>
                    <div>
                      <h3 className="font-medium">{coordinator.firstName} {coordinator.lastName}</h3>
                      <p className="text-sm text-gray-500">{coordinator.email}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button variant="outline" className="w-full">
                      Зв'язатися
                    </Button>
                  </div>
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-gray-500">Інформація про координатора недоступна</p>
                </CardContent>
              )}
            </Card>
            
            {/* Поширення в соціальних мережах */}
            <Card>
              <CardHeader>
                <CardTitle>Поділитися</CardTitle>
                <CardDescription>Розповісти про проєкт</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" className="rounded-full">
                    <PublicOutlined className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                    </svg>
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7.170 5.009c-1.89 0-3.44 1.554-3.44 3.442s1.55 3.442 3.44 3.442c1.89 0 3.44-1.554 3.44-3.442s-1.55-3.442-3.44-3.442zm9.66 0c-1.89 0-3.44 1.554-3.44 3.442s1.55 3.442 3.44 3.442c1.89 0 3.44-1.554 3.44-3.442s-1.55-3.442-3.44-3.442zm-9.66 1.525c1.052 0 1.907.856 1.907 1.917s-.855 1.917-1.907 1.917-1.907-.856-1.907-1.917.855-1.917 1.907-1.917zm9.66 0c1.052 0 1.907.856 1.907 1.917s-.855 1.917-1.907 1.917-1.907-.856-1.907-1.917.855-1.917 1.907-1.917zM2.005 12.509c-1.89 0-3.44 1.554-3.44 3.442s1.55 3.442 3.44 3.442c1.89 0 3.44-1.554 3.44-3.442s-1.55-3.442-3.44-3.442zm19.32 0c-1.89 0-3.44 1.554-3.44 3.442s1.55 3.442 3.44 3.442c1.89 0 3.44-1.554 3.44-3.442s-1.55-3.442-3.44-3.442zm-9.66 0c-1.89 0-3.44 1.554-3.44 3.442s1.55 3.442 3.44 3.442c1.89 0 3.44-1.554 3.44-3.442s-1.55-3.442-3.44-3.442zm-9.66 1.525c1.052 0 1.907.856 1.907 1.917s-.855 1.917-1.907 1.917-1.907-.856-1.907-1.917.855-1.917 1.907-1.917zm19.32 0c1.052 0 1.907.856 1.907 1.917s-.855 1.917-1.907 1.917-1.907-.856-1.907-1.917.855-1.917 1.907-1.917zm-9.66 0c1.052 0 1.907.856 1.907 1.917s-.855 1.917-1.907 1.917-1.907-.856-1.907-1.917.855-1.917 1.907-1.917z" />
                    </svg>
                  </Button>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="relative">
                    <input
                      type="text"
                      value={`https://volunteerhub.com/projects/${project.id}`}
                      readOnly
                      className="block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-sm"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://volunteerhub.com/projects/${project.id}`);
                        toast({
                          title: "Посилання скопійовано",
                          description: "Посилання на проєкт скопійовано до буферу обміну",
                        });
                      }}
                    >
                      Копіювати
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}