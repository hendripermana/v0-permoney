import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface AuthUser {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  socialLogin: (provider: 'google' | 'github' | 'apple') => Promise<boolean>;
  logout: () => void;
  verifyToken: () => Promise<boolean>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        const isValid = await verifyToken(storedToken);
        if (isValid) {
          setToken(storedToken);
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } else {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const verifyToken = async (tokenToVerify?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${tokenToVerify || token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          setUser(data.data.user);
          localStorage.setItem('user', JSON.stringify(data.data.user));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully.',
        });

        setLocation('/dashboard');
        return true;
      } else {
        toast({
          title: 'Login failed',
          description: data.message || 'Invalid credentials. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login error',
        description: 'An error occurred during login. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast({
          title: 'Account created!',
          description: 'Your account has been created successfully.',
        });

        setLocation('/dashboard');
        return true;
      } else {
        toast({
          title: 'Registration failed',
          description: data.message || 'Registration failed. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration error',
        description: 'An error occurred during registration. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const socialLogin = async (
    provider: 'google' | 'github' | 'apple'
  ): Promise<boolean> => {
    try {
      // In a real implementation, you would handle OAuth flow here
      // For now, we'll simulate the social login process

      // Simulate getting user profile from OAuth provider
      const mockProfile = {
        id: `mock_${provider}_id_${Date.now()}`,
        email: `user_${Date.now()}@example.com`,
        name: `User ${provider}`,
        picture: `https://via.placeholder.com/150?text=${provider}`,
      };

      const response = await fetch(`/api/auth/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: 'mock_access_token',
          profile: mockProfile,
        }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('authToken', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login successful!`,
          description: 'You have been logged in successfully.',
        });

        setLocation('/dashboard');
        return true;
      } else {
        toast({
          title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed`,
          description: data.message || 'Social login failed. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} login error`,
        description: 'An error occurred during social login. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to invalidate token on server
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      setUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully.',
      });

      setLocation('/auth/login');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    socialLogin,
    logout,
    verifyToken: () => verifyToken(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
