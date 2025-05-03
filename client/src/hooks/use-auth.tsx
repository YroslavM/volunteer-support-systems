import { createContext, ReactNode, useContext } from "react";
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
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
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
        window.location.href = '/volunteer-dashboard';
      } else if (user.role === 'coordinator') {
        window.location.href = '/coordinator-dashboard';
      } else if (user.role === 'donor') {
        window.location.href = '/donor-dashboard';
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
        window.location.href = '/volunteer-dashboard';
      } else if (user.role === 'coordinator') {
        window.location.href = '/coordinator-dashboard';
      } else if (user.role === 'donor') {
        window.location.href = '/donor-dashboard';
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

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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
