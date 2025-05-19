import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { useToast } from "@/hooks/use-toast";

type ProtectedRouteProps = {
  component: React.ComponentType;
  roles?: string[];
};

export function ProtectedRoute({
  component: Component,
  roles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (roles && !roles.includes(user.role)) {
    const { toast } = useToast();
    toast({
      title: "Немає доступу",
      description: "У вас немає необхідних прав для доступу до цієї сторінки",
      variant: "destructive",
    });
    return <Redirect to="/" />;
  }

  return <Component />;
}
