import { Toaster as Sonner, TooltipProvider } from '@go-tech-frontend/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { router } from './router';
import { GlobalProvider } from './store/global';

import locale from 'antd/locale/zh_HK';
import dayjs from 'dayjs';
// oxlint-disable-next-line import/no-unassigned-import
import 'dayjs/locale/zh-hk';

dayjs.locale('zh-hk');

const queryClient = new QueryClient();
const antdTheme = {
  token: {
    // Match the --primary token in index.css.
    colorPrimary: 'hsl(18, 90%, 55%)'
  }
};
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
  </div>
);

const App = () => (
  <ConfigProvider theme={antdTheme} locale={locale}>
    <QueryClientProvider client={queryClient}>
      <GlobalProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<LoadingSpinner />}>
            <RouterProvider future={{ v7_startTransition: true }} router={router} />
          </Suspense>
        </TooltipProvider>
      </GlobalProvider>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
