
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AuthContextProps {
  user: any | null;
  signIn: (email: string, password: string) => Promise<{error?: any}>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<{error?: any}>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  signIn: async () => ({}),
  signOut: async () => {},
  loading: false,
  isAuthenticated: false,
  logout: async () => {},
  login: async () => ({})
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setLoading(false);
    }

    session();

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    })
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate('/client-portal');
      return { data };
    } catch (error: any) {
      console.error('Error signing in:', error);
      alert(error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add login as an alias for signIn for consistency with existing code
  const login = signIn;

  // Add logout as an alias for signOut for consistency with existing code
  const logout = signOut;

  const isAuthenticated = !!user;

  const value: AuthContextProps = { 
    user, 
    signIn, 
    signOut, 
    loading,
    isAuthenticated,
    logout,
    login
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
