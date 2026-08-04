import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { isLoggedIn } from "@/lib/auth";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClockIn from "./pages/ClockIn";
import Applications from "./pages/Applications";
import Salary from "./pages/Salary";
import KPI from "./pages/KPI";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Training from "./pages/Training";
import Contacts from "./pages/Contacts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** 登录守卫：未登录跳转登录页（"/"） */
function RequireAuth({ children }: { children: JSX.Element }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/clock" element={<RequireAuth><ClockIn /></RequireAuth>} />
          <Route path="/applications" element={<RequireAuth><Applications /></RequireAuth>} />
          <Route path="/salary" element={<RequireAuth><Salary /></RequireAuth>} />
          <Route path="/kpi" element={<RequireAuth><KPI /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/training" element={<RequireAuth><Training /></RequireAuth>} />
          <Route path="/contacts" element={<RequireAuth><Contacts /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
