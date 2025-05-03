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
    fetch("/api/projects?status=funding")
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
                      <button className="flex items-center justify-center px-8 py-4 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-all duration-300 shadow-lg shadow-primary-900/20 hover:shadow-primary-800/40">
                        <span className="font-medium">{t('home.hero.joinButton')}</span>
                        <ArrowForward className="ml-2 h-5 w-5" />
                      </button>
                    </Link>
                    <Link href="/projects">
                      <button className="flex items-center justify-center px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all duration-300">
                        <span className="font-medium">{t('home.hero.viewProjects')}</span>
                      </button>
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
                    <button className="flex items-center text-primary-600 hover:text-primary-800 font-medium transition-colors duration-300">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
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
                    <button className="flex items-center text-secondary-600 hover:text-secondary-800 font-medium transition-colors duration-300">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
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
                    <button className="flex items-center text-yellow-600 hover:text-yellow-800 font-medium transition-colors duration-300">
                      <span>{t('common.learnMore')}</span>
                      <ArrowForward className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                    </button>
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
                projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="group relative rounded-2xl shadow-sm hover:shadow-xl overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:border-secondary-200 flex flex-col">
                    {/* Верхня частина карточки */}
                    <div className="relative h-52 bg-slate-100 overflow-hidden">
                      {project.image ? (
                        <img
                          src={project.image}
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
                            {project.status === 'funding' ? t('projects.status.funding') : 
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
                        {project.status === 'funding' && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700">
                                {t('projects.funded')}
                              </span>
                              <span className="font-medium text-secondary-700">
                                {Math.floor((project.collectedAmount / project.targetAmount) * 100)}%
                              </span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-secondary-500 rounded-full" 
                                style={{width: `${Math.min(100, Math.floor((project.collectedAmount / project.targetAmount) * 100))}%`}}
                              ></div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <Link href={`/projects/${project.id}`}>
                            <button className="text-secondary-600 hover:text-secondary-800 font-medium transition-colors duration-300 flex items-center">
                              <span>{t('projects.learnMore')}</span>
                              <ArrowForward className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                            </button>
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
              <button className="inline-flex items-center justify-center px-6 py-3 text-white bg-secondary-600 hover:bg-secondary-700 transition-all duration-300 rounded-xl font-medium shadow-md hover:shadow-lg hover:translate-y-[-2px]">
                <span>{t('home.projects.seeAll')}</span>
                <ArrowForward className="ml-2 h-5 w-5" />
              </button>
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

          <div className="mt-10 relative">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Sidebar tabs */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-primary-100">
                    <h3 className="text-lg font-semibold text-primary-900">
                      {t('dashboard.choose')}
                    </h3>
                  </div>
                  <ul className="divide-y divide-gray-100">
                    <li>
                      <button 
                        className={`w-full p-4 text-left transition-all duration-200 ${
                          activeTab === "volunteer" 
                            ? "bg-primary-50 text-primary-700 font-medium border-l-4 border-primary-700" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleTabChange("volunteer")}
                      >
                        <div className="flex items-center">
                          <VolunteerActivism className={`mr-3 h-5 w-5 ${activeTab === "volunteer" ? "text-primary-700" : "text-gray-400"}`} />
                          <span>{t('roles.volunteer')}</span>
                        </div>
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`w-full p-4 text-left transition-all duration-200 ${
                          activeTab === "coordinator" 
                            ? "bg-primary-50 text-primary-700 font-medium border-l-4 border-primary-700" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleTabChange("coordinator")}
                      >
                        <div className="flex items-center">
                          <ManageAccounts className={`mr-3 h-5 w-5 ${activeTab === "coordinator" ? "text-primary-700" : "text-gray-400"}`} />
                          <span>{t('roles.coordinator')}</span>
                        </div>
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`w-full p-4 text-left transition-all duration-200 ${
                          activeTab === "donor" 
                            ? "bg-primary-50 text-primary-700 font-medium border-l-4 border-primary-700" 
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                        onClick={() => handleTabChange("donor")}
                      >
                        <div className="flex items-center">
                          <Favorite className={`mr-3 h-5 w-5 ${activeTab === "donor" ? "text-primary-700" : "text-gray-400"}`} />
                          <span>{t('roles.donor')}</span>
                        </div>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-10 lg:col-span-9 lg:mt-0">
                {/* Volunteer dashboard preview */}
                {activeTab === "volunteer" && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                      <h3 className="text-xl leading-6 font-semibold text-white font-heading">
                        {t('dashboard.volunteer.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 font-medium">
                        <div className="text-md font-semibold text-gray-800 flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          {t('dashboard.volunteer.currentTasks')}
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        <li className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-center justify-between">
                            <p className="text-md font-medium text-primary-700 truncate">
                              Доставка продуктових наборів
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {t('tasks.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <CalendarToday className="h-4 w-4 mr-1 text-gray-400" />
                                Термін: 25 жовтня 2023
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Coordinator dashboard preview */}
                {activeTab === "coordinator" && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                      <h3 className="text-xl leading-6 font-semibold text-white font-heading">
                        {t('dashboard.coordinator.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 flex justify-between items-center">
                        <div className="text-md font-semibold text-gray-800 flex items-center">
                          <Work className="h-5 w-5 text-primary-500 mr-2" />
                          {t('dashboard.coordinator.myProjects')}
                        </div>
                        <button className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 transition-all duration-200">
                          <Add className="h-4 w-4 mr-1" />
                          {t('dashboard.coordinator.createProjectButton')}
                        </button>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        <li className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-center justify-between">
                            <p className="text-md font-medium text-primary-700 truncate">
                              Допомога вразливим групам населення
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('projects.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="relative pt-1">
                              <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                                <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"></div>
                              </div>
                              <div className="flex justify-between mt-1">
                                <p className="text-sm text-gray-500 font-medium">
                                  Зібрано: 70 000 грн
                                </p>
                                <p className="text-sm text-gray-500">
                                  Ціль: 100 000 грн
                                </p>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Donor dashboard preview */}
                {activeTab === "donor" && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5">
                      <h3 className="text-xl leading-6 font-semibold text-white font-heading">
                        {t('dashboard.donor.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5">
                        <div className="text-md font-semibold text-gray-800 flex items-center">
                          <LocalAtm className="h-5 w-5 text-yellow-500 mr-2" />
                          {t('dashboard.donor.myDonations')}
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-100">
                        <li className="px-6 py-5 hover:bg-gray-50 transition-colors duration-150">
                          <div className="flex items-center justify-between">
                            <p className="text-md font-medium text-primary-700 truncate">
                              Обладнання для лікарень
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('projects.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row sm:justify-between gap-2">
                            <div className="flex items-center">
                              <Money className="h-4 w-4 mr-1 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                Сума пожертви: <span className="font-semibold text-yellow-600">1000 грн</span>
                              </p>
                            </div>
                            <div className="flex items-center">
                              <CalendarToday className="h-4 w-4 mr-1 text-gray-400" />
                              <p className="text-sm text-gray-500">
                                Дата: 10 вересня 2023
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 text-center">
                  <Link href="/auth">
                    <button className="inline-flex items-center justify-center px-6 py-3 text-white bg-primary-600 hover:bg-primary-700 shadow-md hover:shadow-lg transition-all duration-300 rounded-lg">
                      {t('dashboard.startNow')}
                      <ArrowForward className="ml-2 h-5 w-5" />
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16">
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

      {/* Call to Action Section */}
      <div className="bg-primary-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-heading">
            <span className="block">{t('home.cta.title')}</span>
            <span className="block text-primary-200">{t('home.cta.subtitle')}</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link href="/auth">
                <button className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50">
                  {t('auth.register')}
                </button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link href="/auth">
                <button className="inline-flex items-center justify-center px-5 py-3 text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500 border border-primary-500">
                  {t('auth.login')}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}