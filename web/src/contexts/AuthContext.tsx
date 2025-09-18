import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi, User, ApiError } from '@/lib/api';

type UserRole = 'farmer' | 'distributor' | 'consumer' | 'admin' | null;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ message: string }>;
  verifyEmail: (token: string) => Promise<{ message: string }>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const hasSid = () => /(?:^|; )sid=/.test(document.cookie || '');

  // Load user from token on initial load
  const loadUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      // If we get a 401, the token is invalid or expired
      if ((error as ApiError).statusCode === 401) {
        // Only try to refresh if a sid cookie exists
        if (hasSid()) {
          try {
            await refreshToken();
            const userData = await authApi.getMe();
            setUser(userData);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            setUser(null);
          }
        } else {
          // No session yet; keep user null silently
          setUser(null);
        }
      } else {
        console.error('Failed to load user:', error);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for existing session on initial load
  useEffect(() => {
    loadUser();

    // Set up token refresh interval (every 15 minutes)
    const refreshInterval = setInterval(() => {
      if (user) {
        refreshToken().catch(console.error);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [user, loadUser]);

  // Redirect to intended page after login
  useEffect(() => {
    if (user && location.state?.from) {
      navigate(location.state.from);
    }
  }, [user, location.state, navigate]);

  const refreshToken = async () => {
    if (isRefreshing) return;
    if (!hasSid()) {
      // No session cookie; nothing to refresh
      return;
    }
    
    setIsRefreshing(true);
    try {
      await authApi.refreshToken();
      // Token is stored in httpOnly cookie, no need to handle it here
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setUser(null);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user: userData } = await authApi.login(email, password);
      setUser(userData);
      
      // Redirect to home (or intended URL if provided)
      const from = location.state?.from?.pathname || `/`;
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as ApiError;
      setError(error.error || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user: userData } = await authApi.register({
        ...data,
        role: data.role as 'farmer' | 'distributor' | 'consumer'
      });
      
      setUser(userData);
      
      // Redirect to home as requested (no email verification)
      navigate(`/`, { replace: true });
    } catch (err) {
      const error = err as ApiError;
      setError(error.error || 'Registration failed');
      // If email already exists, guide user to login
      if (error.statusCode === 409) {
        navigate('/login', { state: { email: data.email } });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      return await authApi.requestPasswordReset(email);
    } catch (error) {
      const err = error as ApiError;
      setError(err.error || 'Failed to request password reset');
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      return await authApi.resetPassword(token, password);
    } catch (error) {
      const err = error as ApiError;
      setError(err.error || 'Failed to reset password');
      throw error;
    }
  };

  const verifyEmail = async (_token: string) => {
    // No-op: email verification disabled
    if (user) setUser({ ...user, emailVerified: true });
    return { message: 'Email verification disabled in demo' } as any;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || isRefreshing,
        error,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        verifyEmail,
        refreshToken,
        isAuthenticated: !!user,
        isEmailVerified: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
