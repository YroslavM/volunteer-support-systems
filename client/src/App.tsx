import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetails from "@/pages/project-details";
import ProjectSliderPage from "@/pages/project-slider-page";
import VolunteerDashboard from "@/pages/volunteer-dashboard";
import CoordinatorDashboard from "@/pages/coordinator-dashboard";
import DonorDashboard from "@/pages/donor-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import ProfilePage from "@/pages/profile-page";
import CreateProject from "@/pages/create-project";
import AboutPage from "@/pages/about-page";
import ContactsPage from "@/pages/contacts-page";
import PrivacyPage from "@/pages/privacy-page";
import TermsPage from "@/pages/terms-page";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  // Temporarily disabling protected routes for debugging
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectDetails} />
      <Route path="/projects/:id/slider" component={ProjectSliderPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contacts" component={ContactsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      
      {/* Temporarily convert to regular routes for debugging */}
      <Route path="/dashboard/volunteer" component={VolunteerDashboard} />
      <Route path="/dashboard/coordinator" component={CoordinatorDashboard} />
      <Route path="/dashboard/donor" component={DonorDashboard} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/create-project" component={CreateProject} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
