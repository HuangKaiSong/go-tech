'use client';

import { Provider, useAtomValue, useStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useRef, useState } from 'react';
import {
  type TenantCacheStatus,
  cancelTenantRequest,
  createTenantCache,
  isTenantCacheFresh,
  isTenantRequestCancellation,
  requestTenants,
  tenantCacheAtom
} from './tenant-cache';

interface RefetchTenantsOptions {
  force?: boolean;
}

type AuthContextType = {
  isLoggedIn: boolean;
  logout: () => void;
  refetchTenants: (token: string, options?: RefetchTenantsOptions) => Promise<Tenant[]>;
  setToken: (token: string | undefined) => void;
  setUser: (user: User | null) => void;
  tenants: Tenant[];
  tenantsError: string | null;
  tenantsStatus: TenantCacheStatus;
  token: string | undefined;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  _tenants: Tenant[];
  _token: string | undefined;
  children: React.ReactNode;
  initialUser: User | null;
}

function getUserIdentity(user: User | null) {
  if (!user) return null;
  if (user.userId !== undefined && user.userId !== null) return `user:${user.userId}`;
  if (user.sub) return `sub:${user.sub}`;

  return null;
}

const AuthProviderInner = ({ _tenants, _token, children, initialUser }: AuthProviderProps) => {
  const router = useRouter();
  const store = useStore();
  const initialOwnerId = getUserIdentity(initialUser);
  const initialTenantCache = createTenantCache(initialOwnerId, _tenants, _tenants.length > 0);

  useHydrateAtoms([[tenantCacheAtom, initialTenantCache]]);

  const tenantCache = useAtomValue(tenantCacheAtom);
  const [userState, setUserState] = useState<User | null>(initialUser);
  const [tokenState, setTokenState] = useState<string | undefined>(_token);
  const userRef = useRef<User | null>(initialUser);

  const resetTenants = (ownerId: string | null = null) => {
    store.set(tenantCacheAtom, createTenantCache(ownerId));
  };

  const setUser = (nextUser: User | null) => {
    const previousOwnerId = getUserIdentity(userRef.current);
    const nextOwnerId = getUserIdentity(nextUser);

    userRef.current = nextUser;
    setUserState(nextUser);

    if (previousOwnerId !== nextOwnerId) {
      cancelTenantRequest(previousOwnerId);
      resetTenants(nextOwnerId);
    }
  };

  const setToken = (nextToken: string | undefined) => {
    setTokenState(nextToken);
    if (!nextToken) {
      cancelTenantRequest(getUserIdentity(userRef.current));
      resetTenants();
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setToken(undefined);
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refetchTenants = async (voucher: string, options: RefetchTenantsOptions = {}) => {
    const ownerId = getUserIdentity(userRef.current);
    if (!ownerId) {
      const message = 'Cannot fetch tenants without an authenticated user';
      store.set(tenantCacheAtom, {
        ...createTenantCache(null),
        error: message,
        status: 'error'
      });
      return [];
    }

    const currentCache = store.get(tenantCacheAtom);
    if (!options.force && isTenantCacheFresh(currentCache, ownerId)) {
      return currentCache.data;
    }

    store.set(tenantCacheAtom, {
      data: currentCache.ownerId === ownerId ? currentCache.data : [],
      error: null,
      fetchedAt: currentCache.ownerId === ownerId ? currentCache.fetchedAt : null,
      ownerId,
      status: 'loading'
    });

    try {
      const data = await requestTenants(voucher, ownerId);
      const latestCache = store.get(tenantCacheAtom);

      if (latestCache.ownerId === ownerId) {
        store.set(tenantCacheAtom, {
          data,
          error: null,
          fetchedAt: Date.now(),
          ownerId,
          status: 'success'
        });
      }

      return data;
    } catch (error) {
      const latestCache = store.get(tenantCacheAtom);
      if (isTenantRequestCancellation(error)) {
        return latestCache.ownerId === ownerId ? latestCache.data : [];
      }

      if (latestCache.ownerId === ownerId) {
        store.set(tenantCacheAtom, {
          ...latestCache,
          error: error instanceof Error ? error.message : 'Failed to fetch tenants',
          status: 'error'
        });
        console.error('Error fetching tenants:', error);
      }

      return latestCache.ownerId === ownerId ? latestCache.data : [];
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: userState,
        setUser,
        isLoggedIn: Boolean(userState),
        logout,
        token: tokenState,
        setToken,
        tenants: tenantCache.data,
        tenantsError: tenantCache.error,
        tenantsStatus: tenantCache.status,
        refetchTenants
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = (props: AuthProviderProps) => (
  <Provider>
    <AuthProviderInner {...props} />
  </Provider>
);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
