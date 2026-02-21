import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { sendEmailOtp, verify2fa } from "../api/users";

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  mustChangePassword?: boolean;
  mustChangeEmail?: boolean;
  twoFactor?: {
    emailOtpEnabled: boolean;
    totpEnabled: boolean;
  };
}

export type LoginStage =
  | "idle"
  | "TWO_FACTOR_REQUIRED"
  | "FIRST_LOGIN_REQUIRED";

export interface TwoFactorChallenge {
  challengeId: string;
  methods: ("emailOtp" | "totp")[];
}

export type LoginResult =
  | { stage: "idle" }
  | { stage: "FIRST_LOGIN_REQUIRED" }
  | { stage: "TWO_FACTOR_REQUIRED"; challengeId: string; methods: ("emailOtp" | "totp")[] };

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginStage: LoginStage;
  twoFactorChallenge: TwoFactorChallenge | null;
  login: (usernameOrEmail: string, password: string) => Promise<LoginResult>;
  sendOtp: (challengeId: string) => Promise<void>;
  verifyTwoFactor: (
    challengeId: string,
    method: "emailOtp" | "totp",
    code: string
  ) => Promise<void>;
  cancelChallenge: () => void;
  logout: () => void;
  setTokenAndUser: (token: string, user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("auth_token")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loginStage, setLoginStage] = useState<LoginStage>("idle");
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null);

  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return true;
      } else {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
        return false;
      }
    } catch {
      localStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await fetchCurrentUser(token);
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token, fetchCurrentUser]);

  const setTokenAndUser = useCallback((newToken: string, newUser: User) => {
    localStorage.setItem("auth_token", newToken);
    setToken(newToken);
    setUser(newUser);
    setLoginStage("idle");
    setTwoFactorChallenge(null);
  }, []);

  const login = async (
    usernameOrEmail: string,
    password: string
  ): Promise<LoginResult> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    if (data.status === "TWO_FACTOR_REQUIRED") {
      setLoginStage("TWO_FACTOR_REQUIRED");
      setTwoFactorChallenge({
        challengeId: data.challengeId,
        methods: data.methods,
      });
      // Return challenge data directly — caller must not read stale context state
      return { stage: "TWO_FACTOR_REQUIRED", challengeId: data.challengeId, methods: data.methods };
    }

    if (data.status === "FIRST_LOGIN_REQUIRED") {
      localStorage.setItem("auth_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);
      setLoginStage("FIRST_LOGIN_REQUIRED");
      return { stage: "FIRST_LOGIN_REQUIRED" };
    }

    // SUCCESS
    localStorage.setItem("auth_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    setLoginStage("idle");
    return { stage: "idle" };
  };

  const sendOtp = async (challengeId: string): Promise<void> => {
    await sendEmailOtp(challengeId);
  };

  const verifyTwoFactor = async (
    challengeId: string,
    method: "emailOtp" | "totp",
    code: string
  ): Promise<void> => {
    const data = await verify2fa({ challengeId, method, code });
    localStorage.setItem("auth_token", data.access_token);
    setToken(data.access_token);
    setUser(data.user as User);
    setLoginStage("idle");
    setTwoFactorChallenge(null);
  };

  const cancelChallenge = () => {
    setLoginStage("idle");
    setTwoFactorChallenge(null);
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setLoginStage("idle");
    setTwoFactorChallenge(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        loginStage,
        twoFactorChallenge,
        login,
        sendOtp,
        verifyTwoFactor,
        cancelChallenge,
        logout,
        setTokenAndUser,
      }}
    >
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
