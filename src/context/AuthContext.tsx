
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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

// Función para limpiar el estado de autenticación
const cleanupAuthState = () => {
  // Eliminar tokens de autenticación estándar
  localStorage.removeItem('supabase.auth.token');
  
  // Eliminar todas las claves de autenticación de Supabase de localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Eliminar de sessionStorage si se usa
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Primero configurar el listener de estado de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    // Luego verificar la sesión existente
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };
    
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Limpiar el estado de autenticación antes de intentar iniciar sesión
      cleanupAuthState();
      
      // Intentar cerrar sesión global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar incluso si falla
      }
      
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Usar setTimeout para evitar bloqueos potenciales
      setTimeout(() => {
        // Verificar si el usuario existe en la tabla users
        supabase
          .from('users')
          .select('*')
          .eq('id', data.user?.id)
          .maybeSingle()
          .then(({ data: userData, error: userError }) => {
            if (userError || !userData) {
              // Crear el usuario si no existe
              supabase
                .from('users')
                .upsert({
                  id: data.user?.id,
                  email: data.user?.email,
                  role: email === 'contact@automatizalo.co' ? 'admin' : 'client',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .then(({ error: insertError }) => {
                  if (insertError) {
                    console.error('Error al crear usuario:', insertError);
                  }
                });
            }
          });
      }, 0);

      return { data };
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Limpiar el estado de autenticación
      cleanupAuthState();
      
      // Intentar cerrar sesión global
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        throw error;
      }
      
      // Forzar una recarga de página para un estado limpio
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión: ' + error.message);
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
