import { type ReactElement, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoading from '@/components/PageLoading';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/hooks/use-theme';
import { isLoggedIn } from '@/lib/auth';

// 首页（登录后落地页）、登录页与 404 页保持静态导入，其余页面按需动态导入
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

const Applications = lazy(() => import('./pages/Applications'));
const ClockIn = lazy(() => import('./pages/ClockIn'));
const Contacts = lazy(() => import('./pages/Contacts'));
const KPI = lazy(() => import('./pages/KPI'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Salary = lazy(() => import('./pages/Salary'));
const Training = lazy(() => import('./pages/Training'));

const queryClient = new QueryClient();

/** 登录守卫：未登录跳转登录页（"/"） */
function RequireAuth({ children }: { children: ReactElement }) {
  return isLoggedIn() ? children : <Navigate to="/" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<PageLoading />}>
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
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
