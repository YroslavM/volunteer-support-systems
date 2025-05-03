import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { ProjectCard } from "@/components/project-card";
import { Button } from "@/components/ui/button";
// Temporarily remove auth for debugging
// import { useAuth } from "@/hooks/use-auth";
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
  // const { user } = useAuth();
  const user = null; // Temporarily use null for user while debugging
  const [activeTab, setActiveTab] = useState<"volunteer" | "coordinator" | "donor">("volunteer");
  
  // Simplified implementation to avoid backend calls during debugging
  const projects: SelectProject[] = [];
  const projectsLoading = true;

  // Control dashboard tabs demonstration
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
            <Link href={user ? `/dashboard/${user.role}` : "/auth"}>
              <Button className="inline-flex items-center justify-center text-white bg-secondary-500 hover:bg-secondary-600 transition-colors duration-200">
                {t('home.hero.joinButton')}
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="outline" className="inline-flex items-center justify-center text-white bg-primary-600 bg-opacity-60 hover:bg-opacity-70 transition-colors duration-200">
                {t('home.hero.viewProjects')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-12">
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
                    <VolunteerActivism />
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
                    <ManageAccounts />
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
                    <Favorite />
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
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 font-heading">
              {t('home.projects.title')}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('home.projects.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid gap-5 max-w-lg mx-auto lg:grid-cols-3 lg:max-w-none">
            {projectsLoading ? (
              // Loading skeleton for projects
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white animate-pulse">
                  <div className="flex-shrink-0 h-48 bg-gray-300"></div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
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
                    <div className="mt-6 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                        <div className="ml-2">
                          <div className="h-3 bg-gray-300 rounded w-20"></div>
                          <div className="h-2 bg-gray-300 rounded w-16 mt-1"></div>
                        </div>
                      </div>
                      <div className="h-8 w-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : !projects || projects.length === 0 ? (
              <div className="col-span-3 text-center py-10">
                <p className="text-gray-500">{t('common.loading')}</p>
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

          <div className="mt-10 text-center">
            <Link href="/projects">
              <Button variant="outline" className="inline-flex items-center px-4 py-2 text-primary-700 bg-primary-100 hover:bg-primary-200">
                {t('home.projects.seeAll')}
                <ArrowForward className="ml-1 text-sm" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Preview Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 font-heading">
              {t('home.dashboard.title')}
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              {t('home.dashboard.subtitle')}
            </p>
          </div>

          <div className="mt-12">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              <div>
                <ul className="flex flex-col space-y-1 border-l-4 border-r-0 border-primary-600 lg:border-l-0 lg:border-r-4">
                  <li>
                    <button 
                      className={`px-4 py-3 w-full text-left ${
                        activeTab === "volunteer" 
                          ? "text-primary-700 bg-primary-50 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("volunteer")}
                    >
                      {t('roles.volunteer')}
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`px-4 py-3 w-full text-left ${
                        activeTab === "coordinator" 
                          ? "text-primary-700 bg-primary-50 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("coordinator")}
                    >
                      {t('roles.coordinator')}
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`px-4 py-3 w-full text-left ${
                        activeTab === "donor" 
                          ? "text-primary-700 bg-primary-50 font-medium" 
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => handleTabChange("donor")}
                    >
                      {t('roles.donor')}
                    </button>
                  </li>
                </ul>
              </div>
              
              <div className="mt-10 lg:col-span-2 lg:mt-0">
                {/* Volunteer dashboard preview */}
                {activeTab === "volunteer" && (
                  <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 animate-in fade-in">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.volunteer.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.volunteer.currentTasks')}</span>
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
                                <span className="text-gray-400 text-sm mr-1">{/* Calendar icon */}</span>
                                Термін: 25 жовтня 2023
                              </p>
                            </div>
                          </div>
                        </li>
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Допомога в організації заходу
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Готово до звіту
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <span className="text-gray-400 text-sm mr-1">{/* Calendar icon */}</span>
                                Термін: 20 жовтня 2023
                              </p>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.volunteer.availableProjects')}</span>
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Підтримка переселенців
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <button className="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700 hover:bg-primary-200">
                                {t('dashboard.volunteer.applyButton')}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Потрібні волонтери для допомоги з розселенням.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Coordinator dashboard preview */}
                {activeTab === "coordinator" && (
                  <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 animate-in fade-in">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.coordinator.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.coordinator.myProjects')}</span>
                        </div>
                        <button className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                          <span className="text-sm mr-1">+</span>
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
                            <div className="flex space-x-2">
                              <button className="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700 hover:bg-primary-200">
                                {t('dashboard.coordinator.volunteersButton')}
                              </button>
                              <button className="px-2 py-1 text-xs font-medium rounded bg-primary-100 text-primary-700 hover:bg-primary-200">
                                {t('dashboard.coordinator.tasksButton')}
                              </button>
                            </div>
                          </div>
                        </li>
                      </ul>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.coordinator.volunteerApplications')}</span>
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <AccountCircle className="text-gray-400 mr-2" />
                              <p className="text-sm font-medium text-gray-800">
                                Андрій Мельник
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              <button className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700 hover:bg-green-200">
                                {t('dashboard.coordinator.approveButton')}
                              </button>
                              <button className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200">
                                {t('dashboard.coordinator.rejectButton')}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Проєкт: Допомога вразливим групам населення
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Donor dashboard preview */}
                {activeTab === "donor" && (
                  <div className="bg-white rounded-lg shadow overflow-hidden transition-all duration-300 animate-in fade-in">
                    <div className="bg-primary-700 px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-white font-heading">
                        {t('dashboard.donor.title')}
                      </h3>
                    </div>
                    <div className="border-t border-gray-200">
                      <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.donor.myDonations')}</span>
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
                            <button className="mt-2 sm:mt-0 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded bg-primary-100 text-primary-700 hover:bg-primary-200">
                              {t('dashboard.donor.projectDetails')}
                            </button>
                          </div>
                        </li>
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Підтримка переселенців
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
                                Ваш внесок: 1500 грн
                              </p>
                            </div>
                            <button className="mt-2 sm:mt-0 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded bg-primary-100 text-primary-700 hover:bg-primary-200">
                              {t('dashboard.donor.projectDetails')}
                            </button>
                          </div>
                        </li>
                      </ul>
                      <div className="bg-gray-50 px-4 py-3 sm:px-6">
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">{t('dashboard.donor.recommendedProjects')}</span>
                        </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        <li className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-primary-600 truncate">
                              Допомога вразливим групам населення
                            </p>
                            <div className="ml-2 flex-shrink-0 flex">
                              <button className="px-2 py-1 text-xs font-medium rounded bg-secondary-500 text-white hover:bg-secondary-600">
                                {t('dashboard.donor.donateButton')}
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            Збір: 70 000 / 100 000 грн
                          </p>
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
