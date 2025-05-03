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
      <div className="relative bg-primary-700">
        <div className="absolute inset-0">
          <img 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1593113630400-ea4288922497?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" 
            alt="Volunteers helping" 
          />
          <div className="absolute inset-0 bg-primary-700 mix-blend-multiply" aria-hidden="true"></div>
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-heading">
            {t('home.hero.title')}
          </h1>
          <p className="mt-6 text-xl text-gray-100 max-w-3xl">
            {t('home.hero.subtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/auth">
              <Button className="inline-flex items-center justify-center text-white bg-secondary-600 hover:bg-secondary-700">
                {t('home.hero.joinButton')}
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="inline-flex items-center justify-center text-black border-black border-2 hover:bg-black hover:text-white">
                {t('home.hero.viewProjects')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {t('home.mission.title')}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading">
              {t('home.mission.subtitle')}
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              {t('home.mission.description')}
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <VolunteerActivism className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 font-heading">
                    {t('home.roles.volunteer.title')}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {t('home.roles.volunteer.description')}
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <ManageAccounts className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 font-heading">
                    {t('home.roles.coordinator.title')}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {t('home.roles.coordinator.description')}
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <Favorite className="h-6 w-6" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900 font-heading">
                    {t('home.roles.donor.title')}
                  </p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {t('home.roles.donor.description')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Active Projects Section */}
      <div className="bg-gray-50 py-16" id="active-projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">
              {t('home.projects.title')}
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl font-heading">
              {t('home.projects.subtitle')}
            </p>
          </div>

          <div className="mt-10 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
            {projectsLoading ? (
              // Loading skeleton for projects
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white animate-pulse">
                  <div className="flex-shrink-0 h-48 bg-gray-300"></div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                    </div>
                    <div className="mt-4">
                      <div className="h-2 bg-gray-300 rounded-full"></div>
                      <div className="flex justify-between mt-1">
                        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : !projects || projects.length === 0 ? (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">{t('common.noProjects')}</p>
              </div>
            ) : (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                />
              ))
            )}
          </div>

          <div className="mt-12 text-center">
            <Link href="/projects">
              <Button className="inline-flex items-center justify-center px-5 py-3 text-white bg-primary-600 hover:bg-primary-700">
                {t('home.projects.seeAll')}
                <ArrowForward className="ml-2" />
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