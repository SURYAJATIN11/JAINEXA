// Campus Ledger design: keep the application shell quiet so the timetable matrix remains the hero.
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./pages/AdminLogin";
import CoverLoginPage from "./pages/CoverLoginPage";
import FloorPlanPortal from "./pages/FloorPlanPortal";
import FeedbackPage from "./pages/FeedbackPage";

function RoomwareRoute() {
  if (typeof window !== "undefined" && !window.location.hash) {
    window.location.hash = "roomware";
  }
  return <Home />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      {/* Root '/' is always the Cover Page as the opening page of the website */}
      <Route path="/" component={CoverLoginPage} />
      <Route path="/welcome" component={CoverLoginPage} />
      <Route path="/login" component={CoverLoginPage} />

      {/* Main Timetable Dashboard */}
      <Route path="/timetable" component={Home} />
      <Route path="/dashboard" component={Home} />
      <Route path="/classes" component={Home} />

      {/* Facility & Administrative Portals */}
      <Route path="/roomware" component={RoomwareRoute} />
      <Route path="/room-schedule" component={RoomwareRoute} />
      <Route path="/admin" component={AdminPortal} />
      <Route path="/manage" component={AdminPortal} />
      <Route path="/floor-plan" component={FloorPlanPortal} />
      <Route path="/building-floor-plan" component={FloorPlanPortal} />
      <Route path="/feedback" component={FeedbackPage} />
      <Route path="/feedback-24x7" component={FeedbackPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster position="top-right" richColors />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
