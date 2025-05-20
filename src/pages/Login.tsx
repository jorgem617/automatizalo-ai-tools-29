
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/context/ThemeContext";
import { AlertCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

const Login = () => {
  const [email, setEmail] = useState("contact@automatizalo.co");
  const [password, setPassword] = useState("Automatizalo2025@");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const {
    signIn,
    isAuthenticated,
    user
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    theme
  } = useTheme();
  const isMobile = useIsMobile();

  // Check for redirect parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Already authenticated, redirecting");
      if (redirectTo) {
        navigate(redirectTo);
      } else {
        navigate("/admin");
      }
    }
  }, [isAuthenticated, user, navigate, redirectTo]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // Limpiar el estado de autenticación antes de intentar iniciar sesión
      cleanupAuthState();
      
      // Intentar cerrar sesión global
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar incluso si falla
        console.log("Error al cerrar sesión global:", err);
      }
      
      console.log("Intentando iniciar sesión con email/password:", email);
      
      // Si es el admin principal, intentar usar inicio de sesión directo
      if (email === "contact@automatizalo.co") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (signInError) {
          console.error("Error de inicio de sesión directo:", signInError);
          
          // Si es la primera vez, intentar registrar al usuario
          if (signInError.message.includes("Invalid login credentials")) {
            console.log("Intentando registrar el usuario admin...");
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: email,
              password: password,
              options: {
                data: { role: 'admin' }
              }
            });
            
            if (signUpError) {
              throw signUpError;
            }
            
            if (signUpData?.user) {
              // Crear entrada en la tabla users
              const { error: userInsertError } = await supabase
                .from('users')
                .upsert({
                  id: signUpData.user.id,
                  email: email,
                  role: 'admin',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                
              if (userInsertError) {
                console.error("Error al crear usuario admin en tabla:", userInsertError);
              }
              
              // Intentar iniciar sesión de nuevo
              const { error: reLoginError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
              });
              
              if (reLoginError) {
                throw reLoginError;
              }
              
              toast.success("Cuenta de administrador creada e iniciada sesión con éxito");
              
              // Redirigir al dashboard
              if (redirectTo) {
                navigate(redirectTo);
              } else {
                navigate("/admin");
              }
              return;
            }
          } else {
            throw signInError;
          }
        } else if (data?.user) {
          console.log("Inicio de sesión exitoso para admin");
          toast.success("Inicio de sesión exitoso!");
          
          // Redirigir a la página solicitada o al dashboard de administración
          if (redirectTo) {
            navigate(redirectTo);
          } else {
            navigate("/admin");
          }
          return;
        }
      }
      
      // Para usuarios normales, usar el contexto de autenticación
      const { error: loginError } = await signIn(email, password);
      
      if (loginError) {
        setError(loginError.message || "Credenciales de inicio de sesión inválidas. Por favor, inténtalo de nuevo.");
      } else {
        console.log("Inicio de sesión exitoso");
        toast.success("Inicio de sesión exitoso!");

        // Redirigir a la página solicitada o al dashboard de administración
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate("/admin");
        }
      }
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      setError("Ocurrió un error inesperado. Por favor, inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return <main className="flex-grow pt-16 md:pt-32 pb-16">
      <div className="container max-w-md mx-auto px-4">
        <div className={`p-5 md:p-8 rounded-xl shadow-md border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h1 className={`text-xl md:text-2xl font-bold text-center mb-6 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>Admin Login</h1>
          
          {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={theme === 'dark' ? 'text-gray-200' : ''}>Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className={theme === 'dark' ? 'text-gray-200' : ''}>Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className={theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''} />
            </div>
            
            <Button type="submit" className={`w-full ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-automatizalo-blue hover:bg-automatizalo-blue/90'}`} disabled={isLoading} size={isMobile ? "sm" : "default"}>
              {isLoading ? "Iniciando sesión..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </main>;
};
export default Login;
