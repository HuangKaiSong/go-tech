import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { GlobalProvider } from "./store/global";
import { lazy, Suspense } from "react";

const queryClient = new QueryClient();

const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage"));
const CustomersPage = lazy(() => import("./pages/CustomersPage"));
const CustomerDetailPage = lazy(() => import("./pages/CustomerDetailPage"));
const SystemUsersPage = lazy(() => import("./pages/SystemUsersPage"));
const SystemUserDetailPage = lazy(() => import("./pages/SystemUserDetailPage"));
const PromotionsPage = lazy(() => import("./pages/PromotionsPage"));
const PromoCodesPage = lazy(() => import("./pages/PromoCodesPage"));
const CouponsPage = lazy(() => import("./pages/CouponsPage"));
const PackagesPage = lazy(() => import("./pages/PackagesPage"));
const PackageEditPage = lazy(() => import("./pages/PackageEditPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const RolesPage = lazy(() => import("./pages/RolesPage"));
const SettingsUsersPage = lazy(() => import("./pages/SettingsUsersPage"));
const ContentPage = lazy(() => import("./pages/ContentPage"));
const ContentAddPage = lazy(() => import("./pages/ContentAddPage"));
const ContentEditPage = lazy(() => import("./pages/ContentEditPage"));
const SiteSettingPage = lazy(() => import("./pages/SiteSettingPage"));

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
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Navigate to="/orders" replace />} />
              <Route path="/login" element={<Login />} />
              <Route element={<AdminLayout />}>
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/orders/:id" element={<OrderDetailPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/customers/:id" element={<CustomerDetailPage />} />
                <Route path="/system-users" element={<SystemUsersPage />} />
                <Route path="/system-users/:id" element={<SystemUserDetailPage />} />
                <Route path="/promotions" element={<PromotionsPage />} />
                <Route path="/promo-codes" element={<PromoCodesPage />} />
                <Route path="/coupons" element={<CouponsPage />} />
                <Route path="/packages" element={<PackagesPage />} />
                <Route path="/packages/:id/edit" element={<PackageEditPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/settings/roles" element={<RolesPage />} />
                <Route path="/settings/users" element={<SettingsUsersPage />} />
                <Route path="/settings/content" element={<ContentPage />} />
                <Route path="/settings/content/add" element={<ContentAddPage />} />
                <Route path="/settings/content/:id/edit" element={<ContentEditPage />} />
                <Route path="/settings/site/h5" element={<SiteSettingPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </GlobalProvider>
  </QueryClientProvider>
);

export default App;
