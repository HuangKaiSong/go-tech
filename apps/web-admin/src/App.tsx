import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import CustomersPage from "./pages/CustomersPage";
import CustomerDetailPage from "./pages/CustomerDetailPage";
import SystemUsersPage from "./pages/SystemUsersPage";
import SystemUserDetailPage from "./pages/SystemUserDetailPage";
import PromotionsPage from "./pages/PromotionsPage";
import PromoCodesPage from "./pages/PromoCodesPage";
import CouponsPage from "./pages/CouponsPage";
import PackagesPage from "./pages/PackagesPage";
import PackageEditPage from "./pages/PackageEditPage";
import SettingsPage from "./pages/SettingsPage";
import RolesPage from "./pages/RolesPage";
import SettingsUsersPage from "./pages/SettingsUsersPage";
import ContentPage from "./pages/ContentPage";
import ContentAddPage from "./pages/ContentAddPage";
import ContentEditPage from "./pages/ContentEditPage";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SiteSettingPage from "./pages/SiteSettingPage";
import { GlobalProvider } from "./store/global";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/Login" element={<Login />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </GlobalProvider>
  </QueryClientProvider>
);

export default App;
