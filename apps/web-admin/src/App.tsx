import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, TooltipProvider } from "@go-tech-frontend/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalProvider } from "./store/global";
import { Suspense } from "react";
import { RouterProvider } from 'react-router-dom'
import { router } from "./router";

const queryClient = new QueryClient();
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Suspense fallback={<LoadingSpinner />}>
          <RouterProvider router={router} />
        </Suspense>
      </TooltipProvider>
    </GlobalProvider>
  </QueryClientProvider>
);

export default App;
