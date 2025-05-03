import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { VolunteerActivism, Language, Menu } from "@mui/icons-material";

// Basic header component without auth for debugging
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [location] = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === "uk" ? "en" : "uk";
    i18n.changeLanguage(newLang);
  };

  const isActive = (path: string) => location === path;

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <VolunteerActivism className="text-primary mr-2" />
              <Link href="/">
                <span className="font-heading font-bold text-xl text-primary-800 cursor-pointer">
                  {t('app.name')}
                </span>
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Main navigation">
              <Link href="/" className={`px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.home')}
              </Link>
              <Link href="/projects" className={`px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/projects") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.projects')}
              </Link>
              <Link href="/about" className={`px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/about") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.about')}
              </Link>
              <Link href="/contacts" className={`px-1 pt-1 border-b-2 text-sm font-medium ${
                isActive("/contacts") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.contacts')}
              </Link>
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleLanguage} 
              className="mr-4"
              aria-label="Change language"
            >
              <Language className="text-gray-400 hover:text-gray-500" />
            </Button>
            
            <div className="flex space-x-2">
              <Link href="/auth">
                <Button variant="outline">
                  {t('auth.login')}
                </Button>
              </Link>
              <Link href="/auth">
                <Button>
                  {t('auth.register')}
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/") 
                ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700" 
                : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}>
              {t('nav.home')}
            </Link>
            <Link href="/projects" className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/projects") 
                ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700" 
                : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}>
              {t('nav.projects')}
            </Link>
            <Link href="/about" className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/about") 
                ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700" 
                : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}>
              {t('nav.about')}
            </Link>
            <Link href="/contacts" className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive("/contacts") 
                ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700" 
                : "border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}>
              {t('nav.contacts')}
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="ml-3">
              <Link href="/auth" className="text-base font-medium text-gray-800 hover:text-primary-600">
                {t('auth.login')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
