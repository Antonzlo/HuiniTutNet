"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "@/lib/api";
import type { User } from "@/lib/types";

const USER_KEY = "hiuni:user";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  login: (token: string, user: User) => void;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: User | null) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      writeCachedUser(null);
      return;
    }
    try {
      const me = await api<User>("/api/auth/me");
      setUser(me);
      writeCachedUser(me);
    } catch {
      setToken(null);
      setUser(null);
      writeCachedUser(null);
    }
  }, []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
      void refreshUser();
      return;
    }

    void refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback((token: string, u: User) => {
    setToken(token);
    setUser(u);
    writeCachedUser(u);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    writeCachedUser(null);
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
