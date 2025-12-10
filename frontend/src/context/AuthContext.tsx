import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, setApiKey as setApiKeyOnClient, setAuthToken } from '@/api/client';
import { AuthResponse, UserProfile } from '@/types';

type User = UserProfile;

type AuthContextValue = {
  user: User | null;
  token?: string;
  apiKey?: string;
  login: (email: string, password: string, apiKey?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'nc_user';
const STORAGE_TOKEN = 'nc_token';
const STORAGE_API_KEY = 'nc_api_key';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | undefined>();
  const [apiKey, setApiKey] = useState<string | undefined>();

  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const storedToken = localStorage.getItem(STORAGE_TOKEN) || undefined;
    const storedApiKey = localStorage.getItem(STORAGE_API_KEY) || undefined;
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as User;
      setUser(parsed);
    }
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
    }
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setApiKeyOnClient(storedApiKey);
    }
  }, []);

  const login = async (email: string, password: string, providedApiKey?: string) => {
    const response: AuthResponse = await loginUser({ email, password });
    setUser(response.user);
    setToken(response.token);
    setAuthToken(response.token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response.user));
    localStorage.setItem(STORAGE_TOKEN, response.token);

    if (providedApiKey) {
      setApiKey(providedApiKey);
      setApiKeyOnClient(providedApiKey);
      localStorage.setItem(STORAGE_API_KEY, providedApiKey);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(undefined);
    setApiKey(undefined);
    setApiKeyOnClient(undefined);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_API_KEY);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      apiKey,
      login,
      logout,
    }),
    [user, token, apiKey],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
