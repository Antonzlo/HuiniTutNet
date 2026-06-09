"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback((token: string, u: User) => {
    setToken(token);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        refreshUser,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
