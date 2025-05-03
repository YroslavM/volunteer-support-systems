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
} from "@mui/icons-material";
import { SelectProject } from "@shared/schema";

export default function HomePage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<SelectProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"volunteer" | "coordinator" | "donor">("volunteer");

  useEffect(() => {
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
  }, []);

  const handleTabChange = (tab: "volunteer" | "coordinator" | "donor") => {
    setActiveTab(tab);
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-800 to-primary-600 min-h-[80vh] flex items-center">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            className="w-full h-full object-cover opacity-25" 
            src="https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Volunteers helping" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-primary-600/70" aria-hidden="true"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-6 sm:py-32 sm:px-8 lg:px-12 z-10">
          <div className="max-w-3xl backdrop-blur-sm bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl font-heading bg-gradient-to-r from-yellow-200 via-yellow-100 to-white text-transparent bg-clip-text drop-shadow">
              {t('home.hero.title')}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-secondary-500 to-yellow-300 my-8 rounded-full"></div>
            <p className="text-xl text-yellow-50 font-medium leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-6">
              <Link href="/auth">
                <Button className="w-full sm:w-auto inline-flex items-center justify-center text-white bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 shadow-lg hover:shadow-xl transition-all duration-300 font-medium px-8 py-4 text-lg rounded-xl">
                  <span>{t('home.hero.joinButton')}</span>
                  <ArrowForward className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button className="w-full sm:w-auto inline-flex items-center justify-center text-black border-black border-2 hover:bg-black hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl font-medium px-8 py-4 text-lg rounded-xl">
                  <span>{t('home.hero.viewProjects')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-16">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full mb-3">
              {t('home.mission.title')}
            </span>
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-900">
              {t('home.mission.subtitle')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary-500 to-secondary-500 mx-auto my-6 rounded-full"></div>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t('home.mission.description')}
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
              <div className="relative bg-white p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 border border-gray-100">
                <dt>
                  <div className="absolute flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white -top-8 shadow-lg">
                    <VolunteerActivism className="h-8 w-8" />
                  </div>
                  <p className="mt-6 text-xl leading-6 font-bold text-gray-900 font-heading">
                    {t('home.roles.volunteer.title')}
                  </p>
                </dt>
                <dd className="mt-4 text-base text-gray-500">
                  {t('home.roles.volunteer.description')}
                </dd>
                <div className="mt-6">
                  <Link href="/auth">
                    <Button variant="outline" className="text-primary-600 border-primary-600 hover:bg-primary-50">
                      {t('common.learnMore')}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative bg-white p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 border border-gray-100">
                <dt>
                  <div className="absolute flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-secondary-400 to-secondary-600 text-white -top-8 shadow-lg">
                    <ManageAccounts className="h-8 w-8" />
                  </div>
                  <p className="mt-6 text-xl leading-6 font-bold text-gray-900 font-heading">
                    {t('home.roles.coordinator.title')}
                  </p>
                </dt>
                <dd className="mt-4 text-base text-gray-500">
                  {t('home.roles.coordinator.description')}
                </dd>
                <div className="mt-6">
                  <Link href="/auth">
                    <Button variant="outline" className="text-secondary-600 border-secondary-600 hover:bg-secondary-50">
                      {t('common.learnMore')}
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="relative bg-white p-6 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105 border border-gray-100">
                <dt>
                  <div className="absolute flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white -top-8 shadow-lg">
                    <Favorite className="h-8 w-8" />
                  </div>
                  <p className="mt-6 text-xl leading-6 font-bold text-gray-900 font-heading">
                    {t('home.roles.donor.title')}
                  </p>
                </dt>
                <dd className="mt-4 text-base text-gray-500">
                  {t('home.roles.donor.description')}
                </dd>
                <div className="mt-6">
                  <Link href="/auth">
                    <Button variant="outline" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50">
                      {t('common.learnMore')}
                    </Button>
                  </Link>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Active Projects Section */}
      <div className="bg-gray-50 py-24 relative" id="active-projects">
        {/* Decorative elements */}
        <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-b from-white to-transparent"></div>
        <div className="absolute left-0 top-1/4 w-32 h-32 bg-gradient-to-br from-primary-200 to-primary-300 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-48 h-48 bg-gradient-to-tr from-secondary-200 to-secondary-300 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-16">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-secondary-100 text-secondary-800 rounded-full mb-3">
              {t('home.projects.title')}
            </span>
            <h2 className="text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading bg-clip-text text-transparent bg-gradient-to-r from-secondary-700 to-secondary-900">
              {t('home.projects.subtitle')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-secondary-500 to-primary-500 mx-auto my-6 rounded-full"></div>
          </div>

          <div className="mt-10 grid gap-8 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
            {projectsLoading ? (
              // Loading skeleton for projects
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col rounded-2xl shadow-lg overflow-hidden bg-white animate-pulse">
                  <div className="flex-shrink-0 h-56 bg-gray-300"></div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-4">
                      <div className="h-2 bg-gray-300 rounded-full"></div>
                      <div className="flex justify-between mt-2">
                        <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : !projects || projects.length === 0 ? (
              <div className="col-span-3 text-center py-16">
                <div className="flex flex-col items-center justify-center">
                  <HourglassEmpty className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-xl text-gray-500 font-medium">{t('common.noProjects')}</p>
                  <p className="mt-2 text-gray-400">{t('common.checkBackLater')}</p>
                </div>
              </div>
            ) : (
              projects.slice(0, 3).map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))
            )}
          </div>

          <div className="mt-16 text-center">
            <Link href="/projects">
              <Button className="inline-flex items-center justify-center px-8 py-4 text-white bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700 shadow-md hover:shadow-xl transition-all duration-300 rounded-xl text-lg font-medium">
                {t('home.projects.seeAll')}
                <ArrowForward className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {t('home.dashboard.title')}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading">
              {t('home.dashboard.subtitle')}
            </p>
          </div>

          <div className="mt-10">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-3">
                <ul className="space-y-2">
                  <li>
                    <button 
                      className={`w-full p-3 text-left ${
                        activeTab === "volunteer" 
                          ? "bg-primary-50 text-primary-700 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("volunteer")}
                    >
                      {t('roles.volunteer')}
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`w-full p-3 text-left ${
                        activeTab === "coordinator" 
                          ? "bg-primary-50 text-primary-700 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("coordinator")}
                    >
                      {t('roles.coordinator')}
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`w-full p-3 text-left ${
                        activeTab === "donor" 
                          ? "bg-primary-50 text-primary-700 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("donor")}
                    >
                      {t('roles.donor')}
                    </button>
                  </li>
                </ul>
              </div>
              
              <div className="mt-10 lg:col-span-9 lg:mt-0">
                {/* Volunteer dashboard preview */}
                {activeTab === "volunteer" && (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.volunteer.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-5 sm:px-6">
                        <div className="text-sm font-medium text-gray-500">
                          {t('dashboard.volunteer.currentTasks')}
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Доставка продуктових наборів
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {t('tasks.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
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
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.coordinator.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-5 sm:px-6 flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-500">
                          {t('dashboard.coordinator.myProjects')}
                        </div>
                        <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700">
                          {t('dashboard.coordinator.createProjectButton')}
                        </button>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Допомога вразливим групам населення
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('projects.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                              Збір коштів: 70 000 / 100 000 грн
                            </p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Donor dashboard preview */}
                {activeTab === "donor" && (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.donor.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-5 sm:px-6">
                        <div className="text-sm font-medium text-gray-500">
                          {t('dashboard.donor.myDonations')}
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Обладнання для лікарень
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {t('projects.status.in_progress')}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex items-center">
                              <p className="flex items-center text-sm text-gray-500">
                                <Favorite className="text-secondary-500 text-sm mr-1" />
                                Ваш внесок: 2000 грн
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
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
                <Button className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50">
                  {t('auth.register')}
                </Button>
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link href="/auth">
                <Button variant="outline" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-500">
                  {t('auth.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}