import { JotaiProvider } from '@go-tech/core-state';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/hooks/use-theme';
import Applications from './pages/Applications';
import ClockIn from './pages/ClockIn';
import Contacts from './pages/Contacts';
import Dashboard from './pages/Dashboard';
import KPI from './pages/KPI';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Salary from './pages/Salary';
import {
  TrainingCategoryPage,
  TrainingDetailPage,
  TrainingLayout,
  TrainingLearningPage,
  TrainingListPage
} from './pages/training';

const queryClient = new QueryClient();

const App = () => (
  <JotaiProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clock" element={<ClockIn />} />
              <Route path="/applications" element={<Applications />} />
              <Route path="/salary" element={<Salary />} />
              <Route path="/kpi" element={<KPI />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/training" element={<TrainingLayout />}>
                <Route index element={<TrainingListPage />} />
                <Route path=":categoryId" element={<TrainingCategoryPage />} />
                <Route path=":categoryId/:courseId" element={<TrainingDetailPage />} />
                <Route path=":categoryId/:courseId/:moduleIndex" element={<TrainingLearningPage />} />
              </Route>
              <Route path="/contacts" element={<Contacts />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </JotaiProvider>
);

export default App;
