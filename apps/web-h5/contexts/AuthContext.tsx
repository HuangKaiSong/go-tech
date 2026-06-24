'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useState } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  logout: () => void;
  refetchTenants: (token: string) => void;
  setToken: (token: string | undefined) => void;
  setUser: (user: User | null) => void;
  tenants: Tenant[];
  token: string | undefined;
  user: User | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  _tenants,
  _token,
  children,
  initialUser
}: {
  _tenants: Tenant[];
  _token: string | undefined;
  children: React.ReactNode;
  initialUser: User | null;
}) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | undefined>(_token);
  const [tenants, setTenants] = useState<Tenant[]>(_tenants);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refetchTenants = async (voucher: string) => {
    try {
      const response = await fetch('/go-tech/platform/packageOrder/myTenants', {
        headers: {
          Authorization: `Bearer ${voucher}`
        }
      });
      const data = await response.json();
      setTenants(data?.data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn: Boolean(user),
        logout,
        token,
        setToken,
        tenants,
        refetchTenants
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
