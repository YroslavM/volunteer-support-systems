import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User as SelectUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  role: string;
  firstName?: string;
  lastName?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [sessionUser, setSessionUser] = useState<SelectUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load user data from sessionStorage on mount
  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      const userRole = sessionStorage.getItem('userRole');
      const username = sessionStorage.getItem('username');
      const userId = sessionStorage.getItem('userId');
      
      if (userRole && username && userId) {
        // Create a mock user object from session data
        const mockUser: SelectUser = {
          id: parseInt(userId),
          username: username,
          email: `${username}@example.com`, // Mock email
          role: userRole as any,
          password: '', // Not needed for client
          isVerified: true,
          verificationToken: null,
          createdAt: new Date(),
          firstName: username,
          lastName: '',
        };
        
        setSessionUser(mockUser);
      }
    }
    
    setIsInitialized(true);
  }, []);
  
  // Only for API authentication (currently not used in our mock setup)
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: false, // Disable actual API calls for now
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Вхід успішний",
        description: `Вітаємо, ${user.firstName || user.username}!`,
      });
      
      // Redirect to the appropriate dashboard based on user role
      if (user.role === 'volunteer') {
        window.location.href = '/dashboard/volunteer';
      } else if (user.role === 'coordinator') {
        window.location.href = '/dashboard/coordinator';
      } else if (user.role === 'donor') {
        window.location.href = '/dashboard/donor';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка входу",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Реєстрація успішна",
        description: "Вітаємо в нашій спільноті!",
      });
      
      // Redirect to the appropriate dashboard based on user role
      if (user.role === 'volunteer') {
        window.location.href = '/dashboard/volunteer';
      } else if (user.role === 'coordinator') {
        window.location.href = '/dashboard/coordinator';
      } else if (user.role === 'donor') {
        window.location.href = '/dashboard/donor';
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка реєстрації",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Вихід успішний",
        description: "До побачення!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Помилка виходу",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    // Show logout loader
    const loaderElement = document.createElement('div');
    loaderElement.id = 'logout-loader';
    loaderElement.style.position = 'fixed';
    loaderElement.style.top = '0';
    loaderElement.style.left = '0';
    loaderElement.style.width = '100%';
    loaderElement.style.height = '100%';
    loaderElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    loaderElement.style.display = 'flex';
    loaderElement.style.justifyContent = 'center';
    loaderElement.style.alignItems = 'center';
    loaderElement.style.zIndex = '9999';
    
    const spinnerElement = document.createElement('div');
    spinnerElement.style.width = '50px';
    spinnerElement.style.height = '50px';
    spinnerElement.style.border = '5px solid #f3f3f3';
    spinnerElement.style.borderTop = '5px solid var(--primary-600)';
    spinnerElement.style.borderRadius = '50%';
    spinnerElement.style.animation = 'spin 1s linear infinite';
    
    const style = document.createElement('style');
    style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    
    document.head.appendChild(style);
    loaderElement.appendChild(spinnerElement);
    document.body.appendChild(loaderElement);
    
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    
    // Reset state
    setSessionUser(null);
    
    // Add a slight delay before redirect to show the loader
    setTimeout(() => {
      // Redirect to home page
      window.location.href = '/';
    }, 800);
  };
  
  // Custom mutations for session-based auth
  const sessionLoginMutation = {
    mutate: (credentials: LoginData) => {
      console.log('Login mutation called', credentials);
      
      // Simulate network delay
      setTimeout(() => {
        // Store auth info in sessionStorage
        const userRole = credentials.email.includes('volunteer') 
          ? 'volunteer' 
          : credentials.email.includes('coordinator') 
            ? 'coordinator' 
            : 'donor';
            
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('username', credentials.email.split('@')[0]);
        sessionStorage.setItem('userId', '1'); // Mock user ID
        
        // Create mock user
        const mockUser: SelectUser = {
          id: 1,
          username: credentials.email.split('@')[0],
          email: credentials.email,
          role: userRole as any,
          password: '',
          isVerified: true,
          verificationToken: null,
          createdAt: new Date(),
          firstName: credentials.email.split('@')[0],
          lastName: '',
        };
        
        setSessionUser(mockUser);
        
        // Toast notification
        toast({
          title: "Вхід успішний",
          description: `Вітаємо, ${mockUser.firstName || mockUser.username}!`,
        });
        
        // Redirect to the appropriate dashboard
        window.location.href = `/dashboard/${userRole}`;
      }, 1000);
    },
    isPending: !isInitialized,
  };
  
  const sessionRegisterMutation = {
    mutate: (data: RegisterData) => {
      console.log('Register mutation called', data);
      
      // Simulate network delay
      setTimeout(() => {
        // Store auth info in sessionStorage
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', data.role);
        sessionStorage.setItem('username', data.username || data.email.split('@')[0]);
        sessionStorage.setItem('userId', '1'); // Mock user ID
        
        // Create mock user
        const mockUser: SelectUser = {
          id: 1,
          username: data.username || data.email.split('@')[0],
          email: data.email,
          role: data.role as any,
          password: '',
          isVerified: true,
          verificationToken: null,
          createdAt: new Date(),
          firstName: data.firstName || data.username || data.email.split('@')[0],
          lastName: data.lastName || '',
        };
        
        setSessionUser(mockUser);
        
        // Toast notification
        toast({
          title: "Реєстрація успішна",
          description: "Вітаємо в нашій спільноті!",
        });
        
        // Redirect to the appropriate dashboard based on user role
        window.location.href = `/dashboard/${data.role}`;
      }, 1000);
    },
    isPending: !isInitialized,
  };
  
  const sessionLogoutMutation = {
    mutate: () => {
      handleLogout();
    },
    isPending: false,
  };
  
  return (
    <AuthContext.Provider
      value={{
        user: sessionUser,
        isLoading: !isInitialized,
        error: null,
        loginMutation: sessionLoginMutation as any,
        logoutMutation: sessionLogoutMutation as any,
        registerMutation: sessionRegisterMutation as any,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}