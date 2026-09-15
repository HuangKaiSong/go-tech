import { toast } from '@go-tech-frontend/ui';
import { type LoaderFunctionArgs, createBrowserRouter, replace } from 'react-router-dom';
import { getStoredToken, isTokenExpired } from '@/hooks/use-auth';
import { createRoutes } from './routes';

export function authLoader({ request }: Pick<LoaderFunctionArgs, 'request'>): Response | null {
  const token = getStoredToken();
  if (token && !isTokenExpired(token)) return null;

  toast.error(token ? '登录凭证已过期, 请重新登录' : '请先登录');

  const url = new URL(request.url);
  const from = `${url.pathname}${url.search}${url.hash}`;
  return replace(`/login?from=${encodeURIComponent(from)}`);
}

export const router = createBrowserRouter(createRoutes(authLoader));
