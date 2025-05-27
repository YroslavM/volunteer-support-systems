import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
import {
  VolunteerActivism,
  ManageAccounts,
  Favorite,
  ArrowForward,
  AccountCircle,
  CheckCircle,
  CalendarToday,
  Money,
  Add,
  Work,
  LocalAtm,
  HourglassEmpty,
  ExpandMore,
  PeopleAlt,
  LightbulbOutlined,
  Apartment,
  EmojiEvents,
  Diversity3,
  HandshakeOutlined,
} from "@mui/icons-material";
import { SelectProject } from "@shared/schema";

export default function HomePage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<SelectProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"volunteer" | "coordinator" | "donor">("volunteer");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Додаємо обробник прокрутки для анімації
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Load projects
    fetch("/api/projects?status=fundraising")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setProjectsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
        setProjectsLoading(false);
      });
      
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTabChange = (tab: "volunteer" | "coordinator" | "donor") => {
    setActiveTab(tab);
  };
  
  const scrollToNextSection = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Фон з сучасним дизайном */}
        <div className="absolute inset-0 bg-neutral-950 overflow-hidden">
          {/* Головний фон */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(67,56,202,0.12),transparent_40%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_40%)]"></div>
          
          {/* Мерехтливі кулі (імітація світлодіодів) */}
          <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          
          {/* Сітка точок (технічний вигляд) */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] bg-repeat opacity-20"></div>
        </div>

        {/* Основна секція */}
        <div className="flex-1 relative flex items-center justify-center z-10">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              {/* Текст і кнопки */}
              <div className="flex-1">
                <div className={`transition-all duration-700 ${scrolled ? 'opacity-70' : 'opacity-100'}`}>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-900/30 border border-primary-700/50 mb-6 backdrop-blur-sm">
                    <div className="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-white/90">{t('home.hero.badge') || 'Волонтерство змінює світ'}</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                    <span className="block">
                      {t('home.hero.title').split(' ').slice(0, 2).join(' ')}
                    </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-secondary-400">
                      {t('home.hero.title').split(' ').slice(2).join(' ')}
                    </span>
                  </h1>
                  
                  <p className="text-xl text-white/70 font-medium leading-relaxed mb-10 max-w-2xl">
                    {t('home.hero.subtitle')}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/auth">
                      <Button variant="default" size="lg" className="flex items-center justify-center px-8 py-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-900/20 hover:shadow-blue-800/40">
                        <span className="font-medium">{t('home.hero.joinButton')}</span>
                        <ArrowForward className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/projects">
                      <Button variant="outline" size="lg" className="flex items-center justify-center px-8 py-4 rounded-xl border border-gray-400 text-gray-800 dark:text-white dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300">
                        <span className="font-medium">{t('home.hero.viewProjects')}</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Герб/зображення */}
              <div className="flex-1 flex justify-center lg:justify-end max-w-md lg:max-w-xl">
                <div className="w-full relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 rounded-2xl blur-3xl transform scale-95"></div>
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm shadow-xl">
                    <div className="aspect-[4/3] w-full flex items-center justify-center">
                      <div className="flex items-center justify-center p-8">
                        <div className="relative">
                          <Diversity3 className="h-32 w-32 text-primary-400 opacity-70" />
                          <div className="absolute -inset-4 rounded-full border-2 border-dashed border-primary-500/50 animate-[spin_16s_linear_infinite]"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <HandshakeOutlined className="h-16 w-16 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Кнопка прокрутки вниз */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <button 
            onClick={scrollToNextSection}
            className="flex items-center justify-center h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-300 animate-bounce"
            aria-label="Прокрутити вниз"
          >
            <ExpandMore className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="relative py-24 bg-slate-50 overflow-hidden">
        {/* Декоративні елементи */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        <div className="absolute left-0 top-1/3 w-32 h-32 bg-primary-100 opacity-30 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/3 w-32 h-32 bg-primary-100 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Заголовок секції */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 border border-primary-200 mb-6">
              <span className="text-sm font-semibold text-primary-800">{t('home.mission.title')}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {t('home.mission.subtitle')}
            </h2>
            
            <p className="max-w-2xl mx-auto text-lg text-slate-600">
              {t('home.mission.description')}
            </p>
          </div>

          {/* Картки ролей */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Картка волонтера */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl border border-slate-200 hover:border-primary-200">
              <div className="absolute h-1 left-0 right-0 top-0 bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600">
                    <VolunteerActivism className="h-7 w-7" />
                  </div>
                  <h3 className="ml-5 text-xl font-bold text-slate-900">{t('home.roles.volunteer.title')}</h3>
                </div>
                
                <p className="text-slate-600 mb-8 h-32">
                  {t('home.roles.volunteer.description')}
                </p>
                
                <div className="flex justify-between items-center">
                  <Link href="/auth">
                    <Button variant="link" className="flex items-center text-primary-600 hover:text-primary-800 font-medium transition-colors duration-300 p-0">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Button>
                  </Link>
                  
                  <span className="flex h-8 w-8 rounded-full bg-primary-50 text-primary-500 items-center justify-center">
                    <span className="text-sm font-semibold">01</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Картка координатора */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl border border-slate-200 hover:border-secondary-200">
              <div className="absolute h-1 left-0 right-0 top-0 bg-secondary-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-secondary-100 text-secondary-600">
                    <ManageAccounts className="h-7 w-7" />
                  </div>
                  <h3 className="ml-5 text-xl font-bold text-slate-900">{t('home.roles.coordinator.title')}</h3>
                </div>
                
                <p className="text-slate-600 mb-8 h-32">
                  {t('home.roles.coordinator.description')}
                </p>
                
                <div className="flex justify-between items-center">
                  <Link href="/auth">
                    <Button variant="link" className="flex items-center text-secondary-600 hover:text-secondary-800 font-medium transition-colors duration-300 p-0">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Button>
                  </Link>
                  
                  <span className="flex h-8 w-8 rounded-full bg-secondary-50 text-secondary-500 items-center justify-center">
                    <span className="text-sm font-semibold">02</span>
                  </span>
                </div>
              </div>
            </div>
            
            {/* Картка донора */}
            <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl border border-slate-200 hover:border-yellow-200">
              <div className="absolute h-1 left-0 right-0 top-0 bg-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 text-yellow-600">
                    <Favorite className="h-7 w-7" />
                  </div>
                  <h3 className="ml-5 text-xl font-bold text-slate-900">{t('home.roles.donor.title')}</h3>
                </div>
                
                <p className="text-slate-600 mb-8 h-32">
                  {t('home.roles.donor.description')}
                </p>
                
                <div className="flex justify-between items-center">
                  <Link href="/auth">
                    <Button variant="link" className="flex items-center text-yellow-600 hover:text-yellow-800 font-medium transition-colors duration-300 p-0">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </Button>
                  </Link>
                  
                  <span className="flex h-8 w-8 rounded-full bg-yellow-50 text-yellow-500 items-center justify-center">
                    <span className="text-sm font-semibold">03</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Section */}
      <div className="bg-white py-24 relative" id="active-projects">
        {/* Декоративні елементи заднього плану */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-0 top-1/4 w-72 h-72 bg-primary-50 opacity-40 rounded-full blur-3xl"></div>
          <div className="absolute right-0 bottom-1/4 w-72 h-72 bg-secondary-50 opacity-40 rounded-full blur-3xl"></div>
          <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-slate-100 opacity-30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Заголовок з міткою */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-100 border border-secondary-200 mb-6">
              <span className="text-sm font-semibold text-secondary-800">{t('home.projects.title')}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {t('home.projects.subtitle')}
            </h2>
            
            <p className="max-w-3xl mx-auto text-lg text-slate-600">
              {t('home.projects.description') || 'Долучайтеся до проєктів, які потребують вашої підтримки вже зараз.'}
            </p>
          </div>

          {/* Картки проєктів */}
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projectsLoading ? (
                // Skeleton для завантаження проєктів
                Array(3).fill(0).map((_, index) => (
                  <div key={index} className="flex flex-col rounded-2xl shadow-md overflow-hidden bg-white border border-slate-200 animate-pulse">
                    <div className="relative h-52 bg-slate-200">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-200 to-transparent"></div>
                    </div>
                    <div className="flex-1 p-6">
                      <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6 mb-6"></div>
                      <div className="h-2 bg-slate-200 rounded-full mb-2"></div>
                      <div className="flex justify-between mt-2">
                        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
                        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : !projects || projects.length === 0 ? (
                // Порожній стан
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-16">
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="rounded-full bg-slate-100 p-4 mb-4">
                      <HourglassEmpty className="h-12 w-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-700 mb-2">{t('common.noProjects')}</h3>
                    <p className="text-slate-500 max-w-lg">
                      {t('common.checkBackLater')}
                    </p>
                  </div>
                </div>
              ) : (
                // Проєкти
                (Array.isArray(projects) ? projects : []).slice(0, 3).map((project) => (
                  <div key={project.id} className="group relative rounded-2xl shadow-sm hover:shadow-xl overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:border-secondary-200 flex flex-col">
                    {/* Верхня частина карточки */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      {project.imageUrl ? (
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-200 to-primary-200 opacity-50"></div>
                      )}
                      
                      {/* Градієнт для кращого читання тексту */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                      
                      {/* Статус і назва */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                            {project.status === 'fundraising' ? t('projects.status.funding') : 
                             project.status === 'in_progress' ? t('projects.status.in_progress') : 
                             t('projects.status.completed')}
                          </span>
                        </div>
                        <h3 className="mt-2 text-xl font-bold text-white truncate">{project.name}</h3>
                      </div>
                    </div>
                    
                    {/* Нижня частина карточки */}
                    <div className="flex-1 p-5">
                      <p className="text-slate-600 line-clamp-3 mb-6 h-18">
                        {project.description}
                      </p>
                      
                      {/* Прогрес бар і кнопки */}
                      <div className="mt-auto">
                        {project.status === 'fundraising' && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700">
                                {t('projects.funded')}
                              </span>
                              <span className="font-medium text-secondary-700">
                                {Math.floor((project.currentAmount / project.targetAmount) * 100)}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary-500 rounded-full" 
                                style={{width: `${Math.min(100, Math.floor((project.currentAmount / project.targetAmount) * 100))}%`}}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <Link href={`/projects/${project.id}`}>
                            <Button variant="link" className="text-secondary-600 hover:text-secondary-800 font-medium transition-colors duration-300 flex items-center p-0">
                              <span>{t('projects.learnMore')}</span>
                              <ArrowForward className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </Button>
                          </Link>
                          
                          <div className="flex items-center text-slate-500 text-sm">
                            {project.createdAt && (
                              <span>
                                {new Date(project.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Затертий край */}
            {projects && projects.length > 0 && (
              <div className="absolute -right-4 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent md:hidden"></div>
            )}
          </div>

          {/* Кнопка "Переглянути всі" */}
          <div className="mt-16 text-center">
            <Link href="/projects">
              <Button className="px-6 py-3 text-white bg-secondary-600 hover:bg-secondary-700 transition-all duration-300 rounded-xl font-medium shadow-md hover:shadow-lg hover:translate-y-[-2px]">
                <span>{t('home.projects.seeAll')}</span>
                <ArrowForward className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="bg-slate-50 py-24 relative overflow-hidden">
        {/* Декоративні елементи */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
        <div className="absolute -right-32 top-32 w-96 h-96 bg-primary-100 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -left-32 bottom-32 w-96 h-96 bg-secondary-100 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Заголовок секції */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 border border-primary-200 mb-6">
              <span className="text-sm font-semibold text-primary-800">{t('home.dashboard.title')}</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {t('home.dashboard.subtitle')}
            </h2>
            
            <p className="max-w-2xl mx-auto text-lg text-slate-600 mb-8">
              {t('home.dashboard.description') || 'Отримайте доступ до інтерактивної панелі інструментів, яка дозволяє ефективно керувати своїми волонтерськими активностями.'}
            </p>
          </div>

          {/* Інтерактивний перемикач ролей */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-slate-200 rounded-xl shadow-inner">
              <button 
                onClick={() => handleTabChange("volunteer")}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === "volunteer" 
                    ? "bg-white text-primary-700 shadow-sm" 
                    : "text-slate-600 hover:text-primary-600"
                }`}
              >
                <div className="flex items-center">
                  <VolunteerActivism className="h-5 w-5 mr-2" />
                  <span>{t('roles.volunteer')}</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleTabChange("coordinator")}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === "coordinator" 
                    ? "bg-white text-secondary-700 shadow-sm" 
                    : "text-slate-600 hover:text-secondary-600"
                }`}
              >
                <div className="flex items-center">
                  <ManageAccounts className="h-5 w-5 mr-2" />
                  <span>{t('roles.coordinator')}</span>
                </div>
              </button>
              
              <button 
                onClick={() => handleTabChange("donor")}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === "donor" 
                    ? "bg-white text-yellow-700 shadow-sm" 
                    : "text-slate-600 hover:text-yellow-600"
                }`}
              >
                <div className="flex items-center">
                  <Favorite className="h-5 w-5 mr-2" />
                  <span>{t('roles.donor')}</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Вміст приладової панелі - контейнер */}
          <div className="relative max-w-5xl mx-auto rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
            {/* Верхня частина з моковими дашборд-елементами */}
            <div className="border-b border-slate-200">
              <div className="grid grid-cols-3 divide-x divide-slate-200">
                {/* Перший елемент */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500">
                      {activeTab === "volunteer" && t('dashboard.volunteer.tasksDone')}
                      {activeTab === "coordinator" && t('dashboard.coordinator.activeProjects')}
                      {activeTab === "donor" && t('dashboard.donor.totalDonated')}
                    </span>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      activeTab === "volunteer" ? "bg-green-100 text-green-600" :
                      activeTab === "coordinator" ? "bg-purple-100 text-purple-600" :
                      "bg-yellow-100 text-yellow-600"
                    }`}>
                      {activeTab === "volunteer" && <CheckCircle className="h-4 w-4" />}
                      {activeTab === "coordinator" && <Work className="h-4 w-4" />}
                      {activeTab === "donor" && <Money className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex items-end space-x-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {activeTab === "volunteer" && "12"}
                      {activeTab === "coordinator" && "3"}
                      {activeTab === "donor" && "₴15,800"}
                    </span>
                    <span className="text-sm font-medium text-green-600 mb-0.5">+4%</span>
                  </div>
                </div>
                
                {/* Другий елемент */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500">
                      {activeTab === "volunteer" && t('dashboard.volunteer.projectsJoined')}
                      {activeTab === "coordinator" && t('dashboard.coordinator.activeVolunteers')}
                      {activeTab === "donor" && t('dashboard.donor.projectsSupported')}
                    </span>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      activeTab === "volunteer" ? "bg-blue-100 text-blue-600" :
                      activeTab === "coordinator" ? "bg-indigo-100 text-indigo-600" :
                      "bg-green-100 text-green-600"
                    }`}>
                      {activeTab === "volunteer" && <CalendarToday className="h-4 w-4" />}
                      {activeTab === "coordinator" && <PeopleAlt className="h-4 w-4" />}
                      {activeTab === "donor" && <Work className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex items-end space-x-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {activeTab === "volunteer" && "4"}
                      {activeTab === "coordinator" && "28"}
                      {activeTab === "donor" && "6"}
                    </span>
                    <span className="text-sm font-medium text-green-600 mb-0.5">+2%</span>
                  </div>
                </div>
                
                {/* Третій елемент */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-slate-500">
                      {activeTab === "volunteer" && t('dashboard.volunteer.hoursVolunteered')}
                      {activeTab === "coordinator" && t('dashboard.coordinator.pendingTasks')}
                      {activeTab === "donor" && t('dashboard.donor.lastDonation')}
                    </span>
                    <div className={`flex items-center justify-center h-8 w-8 rounded-full ${
                      activeTab === "volunteer" ? "bg-primary-100 text-primary-600" :
                      activeTab === "coordinator" ? "bg-secondary-100 text-secondary-600" :
                      "bg-primary-100 text-primary-600"
                    }`}>
                      {activeTab === "volunteer" && <VolunteerActivism className="h-4 w-4" />}
                      {activeTab === "coordinator" && <Add className="h-4 w-4" />}
                      {activeTab === "donor" && <LocalAtm className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="flex items-end space-x-1">
                    <span className="text-2xl font-bold text-slate-900">
                      {activeTab === "volunteer" && "48"}
                      {activeTab === "coordinator" && "7"}
                      {activeTab === "donor" && "₴2,500"}
                    </span>
                    <span className="text-sm font-medium text-green-600 mb-0.5">+8%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Основний вміст панелі */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">
                  {activeTab === "volunteer" && t('dashboard.volunteer.activeTasks')}
                  {activeTab === "coordinator" && t('dashboard.coordinator.projectAnalytics')}
                  {activeTab === "donor" && t('dashboard.donor.supportedProjects')}
                </h3>
                
                <div className="flex space-x-2">
                  <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </button>
                  <button className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-primary-600 hover:border-primary-300 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Вміст в залежності від вибраної ролі */}
              {activeTab === "volunteer" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-slate-200">
                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <VolunteerActivism className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Розподіл їжі для бездомних</div>
                          <div className="text-xs text-slate-500">Допомога Спільноти • Завтра, 10:00</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {t('tasks.status.in_progress')}
                      </span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <Work className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Збирання сміття в парку</div>
                          <div className="text-xs text-slate-500">Еко Майбутнє • 15 червня 2023</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {t('tasks.status.completed')}
                      </span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <LightbulbOutlined className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Навчання дітей програмуванню</div>
                          <div className="text-xs text-slate-500">IT Волонтери • Щонеділі</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        {t('tasks.status.pending')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "coordinator" && (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Apartment className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-slate-900">Допомога Спільноти</div>
                      </div>
                      <div className="text-sm font-semibold text-primary-600">85%</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                      <div style={{ width: "85%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <LightbulbOutlined className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-slate-900">Еко Майбутнє</div>
                      </div>
                      <div className="text-sm font-semibold text-secondary-600">62%</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                      <div style={{ width: "62%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-2">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <EmojiEvents className="h-4 w-4 text-yellow-600" />
                          </div>
                        </div>
                        <div className="text-sm font-medium text-slate-900">Спортивні змагання для дітей</div>
                      </div>
                      <div className="text-sm font-semibold text-yellow-600">35%</div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-200">
                      <div style={{ width: "35%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "donor" && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="divide-y divide-slate-200">
                    <div className="p-4 bg-slate-50 flex items-center justify-between">
                      <div className="flex-1 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <VolunteerActivism className="h-5 w-5 text-amber-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Тваринний притулок</div>
                          <div className="text-xs text-slate-500">₴5,000 • 14 травня 2023</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        {t('projects.status.completed')}
                      </span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Apartment className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Освітній центр для дітей</div>
                          <div className="text-xs text-slate-500">₴2,500 • 2 травня 2023</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {t('projects.status.in_progress')}
                      </span>
                    </div>
                    
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex-1 flex items-center">
                        <div className="flex-shrink-0 mr-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <LightbulbOutlined className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">Технології для шкіл</div>
                          <div className="text-xs text-slate-500">₴8,300 • 15 квітня 2023</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {t('projects.status.in_progress')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Нижня частина з кнопкою */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-center">
              <Link href="/auth">
                <button className="flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium shadow-sm hover:bg-primary-700 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5">
                  <span>{t('dashboard.startNow')}</span>
                  <ArrowForward className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 font-heading">
              {t('home.testimonials.title')}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('home.testimonials.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <AccountCircle className="text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 font-heading">Наталія Кравець</h3>
                    <p className="text-sm text-gray-500">{t('roles.volunteer')}</p>
                  </div>
                </div>
                <p className="text-gray-700">"Завдяки платформі я знайшла відмінні можливості для волонтерства. Зручний інтерфейс дозволяє швидко знаходити проєкти та відстежувати свої завдання."</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <AccountCircle className="text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 font-heading">Михайло Дорошенко</h3>
                    <p className="text-sm text-gray-500">{t('roles.coordinator')}</p>
                  </div>
                </div>
                <p className="text-gray-700">"Як координатор, я ціную можливість легко керувати командою волонтерів, розподіляти завдання та відстежувати прогрес в режимі реального часу."</p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <AccountCircle className="text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900 font-heading">Оксана Литвин</h3>
                    <p className="text-sm text-gray-500">{t('roles.donor')}</p>
                  </div>
                </div>
                <p className="text-gray-700">"Прозорість — головне, чому я обрала цю платформу. Я бачу, як використовуються мої кошти, і можу відстежувати прогрес проєктів, які підтримую."</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Space */}
      <div className="h-12"></div>
    </div>
  );
}