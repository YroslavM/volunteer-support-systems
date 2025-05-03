import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VolunteerActivism, AccountCircle } from "@mui/icons-material";
import { ChevronDown, LayoutDashboard, Menu, LogOut, User } from "lucide-react";

// Header component with mockLogout feature
export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [location, navigate] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  
  // Check if user is logged in from sessionStorage
  useEffect(() => {
    // First check if there's auth data in sessionStorage
    const isLoggedInStorage = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedInStorage) {
      setIsLoggedIn(true);
      setUserRole(sessionStorage.getItem('userRole'));
      setUsername(sessionStorage.getItem('username'));
    } else {
      // Fallback to URL check for dashboard pages
      if (location.includes('/dashboard/volunteer')) {
        setIsLoggedIn(true);
        setUserRole('volunteer');
        setUsername('Волонтер');
      } else if (location.includes('/dashboard/coordinator')) {
        setIsLoggedIn(true);
        setUserRole('coordinator');
        setUsername('Координатор');
      } else if (location.includes('/dashboard/donor')) {
        setIsLoggedIn(true);
        setUserRole('donor');
        setUsername('Донор');
      }
    }
  }, [location]);

  const changeLanguage = (value: string) => {
    i18n.changeLanguage(value);
  };

  const isActive = (path: string) => location === path;
  
  // Handle logout
  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    
    // Reset state
    setIsLoggedIn(false);
    setUserRole(null);
    setUsername(null);
    
    // Redirect to home page
    navigate('/');
  };
  
  // Get dashboard URL based on role
  const getDashboardUrl = () => {
    if (!userRole) return '/';
    
    switch(userRole) {
      case 'volunteer':
        return '/dashboard/volunteer';
      case 'coordinator':
        return '/dashboard/coordinator';
      case 'donor':
        return '/dashboard/donor';
      default:
        return '/';
    }
  };

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
            <nav className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8" aria-label="Main navigation">
              <Link href="/" className={`px-1 py-2 border-b-2 text-sm font-medium inline-flex items-center ${
                isActive("/") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.home')}
              </Link>
              <Link href="/projects" className={`px-1 py-2 border-b-2 text-sm font-medium inline-flex items-center ${
                isActive("/projects") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.projects')}
              </Link>
              <Link href="/about" className={`px-1 py-2 border-b-2 text-sm font-medium inline-flex items-center ${
                isActive("/about") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.about')}
              </Link>
              <Link href="/contacts" className={`px-1 py-2 border-b-2 text-sm font-medium inline-flex items-center ${
                isActive("/contacts") 
                  ? "border-primary text-primary-600" 
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
              }`}>
                {t('nav.contacts')}
              </Link>
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="mr-4 w-20">
              <Select 
                value={i18n.language} 
                onValueChange={changeLanguage}
              >
                <SelectTrigger aria-label="Select language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uk">UA</SelectItem>
                  <SelectItem value="en">EN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-1">
                      <AccountCircle className="h-5 w-5" />
                      <span>{username || userRole}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{t('account.welcome')}, {username}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={getDashboardUrl()}>
                      <DropdownMenuItem>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>{t('account.dashboard')}</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/profile">
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>{t('account.profile')}</span>
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4 text-destructive" />
                      <span className="text-destructive">{t('account.logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
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
            )}
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
            <div className="flex flex-col gap-4 px-4">
              <div className="w-full max-w-[120px]">
                <Select 
                  value={i18n.language} 
                  onValueChange={changeLanguage}
                >
                  <SelectTrigger aria-label="Select language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uk">UA</SelectItem>
                    <SelectItem value="en">EN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isLoggedIn ? (
                <div className="space-y-2">
                  <div className="flex items-center">
                    <AccountCircle className="h-6 w-6 text-primary-600 mr-2" />
                    <span className="text-base font-medium">{username || userRole}</span>
                  </div>
                  <Link href={getDashboardUrl()}>
                    <div className="flex items-center text-gray-700 py-2">
                      <LayoutDashboard className="h-5 w-5 mr-2" />
                      <span>{t('account.dashboard')}</span>
                    </div>
                  </Link>
                  <Link href="/profile">
                    <div className="flex items-center text-gray-700 py-2">
                      <User className="h-5 w-5 mr-2" />
                      <span>{t('account.profile')}</span>
                    </div>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="w-full justify-start text-red-600 px-0"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    {t('account.logout')}
                  </Button>
                </div>
              ) : (
                <Link href="/auth" className="text-base font-medium text-gray-800 hover:text-primary-600">
                  {t('auth.login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
