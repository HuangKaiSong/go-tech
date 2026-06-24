import { Navigate, type RouteObject } from 'react-router-dom';
import { lazyPage } from './lazy';

import AdminLayout from '@/components/layout/AdminLayout';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

const OrdersPage = lazyPage(() => import('@/pages/OrdersPage'));
const OrderDetailPage = lazyPage(() => import('@/pages/OrderDetailPage'));
const CustomersPage = lazyPage(() => import('@/pages/CustomersPage'));
const CustomerDetailPage = lazyPage(() => import('@/pages/CustomerDetailPage'));
const SystemUsersPage = lazyPage(() => import('@/pages/SystemUsersPage'));
const SystemUserDetailPage = lazyPage(() => import('@/pages/SystemUserDetailPage'));
const PromoCodeDetailPage = lazyPage(() => import('@/pages/PromoCodeDetailPage'));
const PromotionsPage = lazyPage(() => import('@/pages/PromotionsPage'));
const PromoCodesPage = lazyPage(() => import('@/pages/PromoCodesPage'));
const CouponsPage = lazyPage(() => import('@/pages/CouponsPage'));
const PackagesPage = lazyPage(() => import('@/pages/PackagesPage'));
const PackageEditPage = lazyPage(() => import('@/pages/PackageEditPage'));
const SettingsPage = lazyPage(() => import('@/pages/SettingsPage'));
const RolesPage = lazyPage(() => import('@/pages/RolesPage'));
const SettingsUsersPage = lazyPage(() => import('@/pages/SettingsUsersPage'));
const ContentPage = lazyPage(() => import('@/pages/ContentPage'));
const ContentAddPage = lazyPage(() => import('@/pages/ContentAddPage'));
const ContentEditPage = lazyPage(() => import('@/pages/ContentEditPage'));
const SiteSettingPage = lazyPage(() => import('@/pages/SiteSettingPage'));
const MessageBoard = lazyPage(() => import('@/pages/MessageBoard'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/orders" replace />
  },
  {
    element: <AdminLayout />,
    children: [
      {
        path: '/orders',
        element: <OrdersPage />
      },
      {
        path: '/orders/:id',
        element: <OrderDetailPage />
      },
      {
        path: '/customers',
        element: <CustomersPage />
      },
      {
        path: '/customers/:id',
        element: <CustomerDetailPage />
      },
      {
        path: '/system-users',
        element: <SystemUsersPage />
      },
      {
        path: '/system-users/:id',
        element: <SystemUserDetailPage />
      },
      {
        path: '/promotions',
        element: <PromotionsPage />
      },
      {
        path: '/promo-codes/:id',
        element: <PromoCodeDetailPage />
      },
      {
        path: '/promo-codes',
        element: <PromoCodesPage />
      },
      {
        path: '/coupons',
        element: <CouponsPage />
      },
      {
        path: '/packages',
        element: <PackagesPage />
      },
      {
        path: '/packages/:id/edit',
        element: <PackageEditPage />
      },
      {
        path: '/packages/new',
        element: <PackageEditPage />
      },
      {
        path: '/settings',
        element: <SettingsPage />
      },
      {
        path: '/settings/roles',
        element: <RolesPage />
      },
      {
        path: '/settings/users',
        element: <SettingsUsersPage />
      },
      {
        path: '/settings/content',
        element: <ContentPage />
      },
      {
        path: '/settings/content/add',
        element: <ContentAddPage />
      },
      {
        path: '/settings/content/:id/edit',
        element: <ContentEditPage />
      },
      {
        path: '/settings/site/h5',
        element: <SiteSettingPage />
      },
      {
        path: '/message-board',
        element: <MessageBoard />
      }
    ]
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '*',
    element: <NotFound />
  }
];
