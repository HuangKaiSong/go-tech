'use client';

import { Provider, useAtomValue, useStore } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { PayTypeEnum } from '@/app/constants/payment';
import {
  type PendingTenantActivation,
  clearPendingTenantActivation,
  createVisibilityAwarePoller,
  getTenantActivationPollingConfig,
  readPendingTenantActivation,
  stashPendingTenantActivation
} from '@/app/lib/order-activation';
import { clientFetch } from '@/lib/client-http/client-fetch';
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
  signal?: AbortSignal;
}

type AuthContextType = {
  isLoggedIn: boolean;
  logout: () => void;
  refetchTenants: (token: string, options?: RefetchTenantsOptions) => Promise<Tenant[]>;
  refetchUser: () => void;
  setToken: (token: string | undefined) => void;
  setUser: (user: User | null) => void;
  startTenantActivationSync: (orderId: number, payType: PayTypeEnum) => void;
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
  const [pendingTenantActivation, setPendingTenantActivation] = useState<PendingTenantActivation | null>(null);
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
      clearPendingTenantActivation();
      setPendingTenantActivation(null);
      resetTenants(nextOwnerId);
    }
  };

  const setToken = (nextToken: string | undefined) => {
    setTokenState(nextToken);
    if (!nextToken) {
      cancelTenantRequest(getUserIdentity(userRef.current));
      clearPendingTenantActivation();
      setPendingTenantActivation(null);
      resetTenants();
    }
  };

  const logout = async () => {
    try {
      await clientFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setToken(undefined);
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refetchUser = async () => {
    try {
      const response = await clientFetch(
        '/go-tech/platform/platformCustomer/getInfo',
        {
          headers: new Headers({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenState}`,
            'User-Type': 'platform_customer'
          })
        },
        { feedback: 'silent' }
      );
      const result = (await response.json()) as User;
      setUser(result);
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
      const data = await requestTenants(voucher, ownerId, options.signal);
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
      if (options.signal?.aborted || isTenantRequestCancellation(error)) {
        if (latestCache.ownerId === ownerId) {
          store.set(tenantCacheAtom, {
            ...latestCache,
            error: null,
            status: latestCache.data.length > 0 ? 'success' : 'idle'
          });
        }
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

  const refetchTenantsRef = useRef(refetchTenants);
  refetchTenantsRef.current = refetchTenants;

  const startTenantActivationSync = (orderId: number, payType: PayTypeEnum) => {
    const ownerId = getUserIdentity(userRef.current);
    if (!ownerId || store.get(tenantCacheAtom).data.length > 0) return;

    const pending = stashPendingTenantActivation({ orderId, ownerId, payType });
    setPendingTenantActivation(pending);
  };

  const currentOwnerId = getUserIdentity(userState);

  useEffect(() => {
    if (!tokenState || !currentOwnerId) return;

    const pending = pendingTenantActivation ?? readPendingTenantActivation();
    if (!pending) return;
    if (pending.ownerId !== currentOwnerId) {
      clearPendingTenantActivation();
      setPendingTenantActivation(null);
      return;
    }
    if (tenantCache.data.length > 0) {
      clearPendingTenantActivation();
      setPendingTenantActivation(null);
      return;
    }

    const { intervalMs, timeoutMs } = getTenantActivationPollingConfig(pending);
    if (timeoutMs <= 0) {
      clearPendingTenantActivation();
      setPendingTenantActivation(null);
      return;
    }

    const poller = createVisibilityAwarePoller({
      intervalMs,
      isVisible: () => document.visibilityState === 'visible',
      onStop: () => {
        if (Date.now() >= pending.expiresAt) {
          clearPendingTenantActivation();
          setPendingTenantActivation(null);
        }
      },
      poll: async signal => {
        const tenants = await refetchTenantsRef.current(tokenState, { force: true, signal });
        if (tenants.length === 0) return true;

        clearPendingTenantActivation();
        setPendingTenantActivation(null);
        return false;
      },
      timeoutMs
    });
    const handleVisibilityChange = () => poller.handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    poller.start();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      poller.stop();
    };
  }, [currentOwnerId, pendingTenantActivation, tenantCache.data.length, tokenState]);

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
        refetchTenants,
        startTenantActivationSync,
        refetchUser
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
