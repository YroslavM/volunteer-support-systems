import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectDetails from "@/pages/project-details";
import VolunteerDashboard from "@/pages/volunteer-dashboard";
import CoordinatorDashboard from "@/pages/coordinator-dashboard";
import DonorDashboard from "@/pages/donor-dashboard";
import ProfilePage from "@/pages/profile-page";
import CreateProject from "@/pages/create-project";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectDetails} />
      
      <ProtectedRoute path="/dashboard/volunteer" component={VolunteerDashboard} roles={["volunteer"]} />
      <ProtectedRoute path="/dashboard/coordinator" component={CoordinatorDashboard} roles={["coordinator"]} />
      <ProtectedRoute path="/dashboard/donor" component={DonorDashboard} roles={["donor"]} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/create-project" component={CreateProject} roles={["coordinator"]} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
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
  );
}

export default App;
