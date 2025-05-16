
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ClientLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

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
      console.log("Already authenticated in client login, redirecting");
      if (redirectTo) {
        navigate(redirectTo);
      } else if (user.email === 'contact@automatizalo.co') {
        navigate('/admin');
      } else {
        navigate('/client-portal');
      }
    }
  }, [isAuthenticated, user, navigate, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      console.log('Login successful, checking user role');

      // Special case for the main admin account
      if (email === 'contact@automatizalo.co') {
        console.log('Main admin account detected, redirecting to admin');

        // Ensure the user has admin role in the database
        const {
          data: userData,
          error: fetchError
        } = await supabase.from('users').select('role').eq('id', data.user.id).single();
        console.log('User data for admin:', userData);
        if (fetchError) {
          console.error('Error fetching user role:', fetchError);
        }

        // If user doesn't exist or doesn't have admin role, update it
        if (!userData || !userData.role || userData.role !== 'admin') {
          console.log('Setting admin role for main account');
          const {
            error: updateError
          } = await supabase.from('users').upsert({
            id: data.user.id,
            email: email,
            role: 'admin'
          });
          if (updateError) {
            console.error('Error updating admin role:', updateError);
          } else {
            console.log('Successfully updated to admin role');
          }
        }

        // If there's a redirect URL, use it; otherwise go to admin
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/admin');
        }
        toast.success('Successfully logged in as administrator');
        return;
      }

      // For regular users, check role in database
      const {
        data: userData,
        error: userError
      } = await supabase.from('users').select('role').eq('id', data.user.id).single();
      if (userError) {
        console.error('Error fetching user role:', userError);

        // Try to create a user entry if it doesn't exist
        const {
          error: createError
        } = await supabase.from('users').upsert({
          id: data.user.id,
          email: email,
          role: 'client' // Default to client role
        });
        if (createError) {
          console.error('Error creating user record:', createError);
        }
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/client-portal');
        }
        toast.success('Successfully logged in');
        return;
      }
      console.log('User data:', userData);

      // Redirect based on role
      if (userData && userData.role === 'admin') {
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/admin');
        }
        toast.success('Successfully logged in as administrator');
      } else {
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/client-portal');
        }
        toast.success('Successfully logged in');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return <Card className="max-w-md mx-auto mt-[100px]">
      <CardHeader>
        <CardTitle>Client Login</CardTitle>
        <CardDescription>
          Login to access your client portal. Contact an administrator if you need an account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>;
};

export default ClientLogin;
