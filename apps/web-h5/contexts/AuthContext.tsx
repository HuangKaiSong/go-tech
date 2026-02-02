"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoggedIn: boolean;
  logout: () => void;
  token: string | undefined;
  setToken: (token: string | undefined) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({
  children,
  initialUser,
  _token
}: {
  children: React.ReactNode;
  initialUser: User | null;
  _token: string | undefined;
}) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(initialUser);
  const [token, setToken] = useState<string | undefined>(_token);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.replace('/')
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoggedIn: !!user,
        logout,
        token,
        setToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
