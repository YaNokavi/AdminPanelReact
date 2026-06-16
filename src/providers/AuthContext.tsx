import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin } from "../api/auth";
import { ApiError } from "../api/client";

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "cunaedu_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: sessionStorage.getItem(SESSION_KEY) === "true",
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (username: string, password: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await apiLogin(username, password);
      if (res.success) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setState({ isAuthenticated: true, isLoading: false, error: null });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          error: res.message,
        });
      }
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Ошибка соединения с сервером";
      setState({ isAuthenticated: false, isLoading: false, error: message });
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("cunaedu_token");
    sessionStorage.removeItem("cunaedu_auth");
    sessionStorage.removeItem(SESSION_KEY);
    setState({ isAuthenticated: false, isLoading: false, error: null });
  }, []);

  // Сброс ошибки при повторном вводе
  useEffect(() => {}, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
