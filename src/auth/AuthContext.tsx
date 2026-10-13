import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ApiError, getCurrentUser, type User } from '../api/auth.js';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  authenticate: (accessToken: string) => Promise<void>;
  updateUser: (user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const tokenStorageKey = 'skillforge.accessToken';
const userStorageKey = 'skillforge.user';

function readStoredUser(): User | null {
  try {
    const value = localStorage.getItem(userStorageKey);
    if (!value) return null;
    const parsed = JSON.parse(value) as Partial<User>;
    if (typeof parsed.id !== 'number' || typeof parsed.name !== 'string' || typeof parsed.email !== 'string') return null;
    if (parsed.role !== 'USER' && parsed.role !== 'ADMIN') return null;
    if (parsed.status !== 'ACTIVE' && parsed.status !== 'BLOCKED') return null;
    return parsed as User;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  const persistentToken = localStorage.getItem(tokenStorageKey);
  if (persistentToken) return persistentToken;
  const legacyToken = sessionStorage.getItem(tokenStorageKey);
  if (!legacyToken) return null;
  localStorage.setItem(tokenStorageKey, legacyToken);
  sessionStorage.removeItem(tokenStorageKey);
  return legacyToken;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState(readStoredToken);
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let isCurrent = true;
    setIsLoading(true);
    getCurrentUser(accessToken)
      .then((currentUser) => {
        if (!isCurrent) return;
        localStorage.setItem(userStorageKey, JSON.stringify(currentUser));
        setUser(currentUser);
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          localStorage.removeItem(tokenStorageKey);
          localStorage.removeItem(userStorageKey);
          sessionStorage.removeItem(tokenStorageKey);
          setAccessToken(null);
          setUser(null);
        } else {
          const savedUser = readStoredUser();
          if (savedUser) setUser(savedUser);
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => { isCurrent = false; };
  }, [accessToken]);

  async function authenticate(token: string) {
    const currentUser = await getCurrentUser(token);
    localStorage.setItem(tokenStorageKey, token);
    localStorage.setItem(userStorageKey, JSON.stringify(currentUser));
    sessionStorage.removeItem(tokenStorageKey);
    setUser(currentUser);
    setAccessToken(token);
    setIsLoading(false);
  }

  function updateUser(currentUser: User) {
    setUser(currentUser);
  }

  function signOut() {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
    sessionStorage.removeItem(tokenStorageKey);
    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, accessToken, isLoading, authenticate, updateUser, signOut }),
    [user, accessToken, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
