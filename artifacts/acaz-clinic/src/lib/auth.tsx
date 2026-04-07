import React, { createContext, useContext, useState } from "react";
import { useGetMe, setAuthTokenGetter } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const storedToken = localStorage.getItem("acaz_token");
if (storedToken) {
  setAuthTokenGetter(() => storedToken);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(storedToken);

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    },
  });

  const login = (newToken: string) => {
    localStorage.setItem("acaz_token", newToken);
    setAuthTokenGetter(() => newToken);
    setToken(newToken);
    refetch();
  };

  const logout = () => {
    localStorage.removeItem("acaz_token");
    setAuthTokenGetter(null);
    setToken(null);
  };

  const isLoading = isUserLoading && !!token;

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
