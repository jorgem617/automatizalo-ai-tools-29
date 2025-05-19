
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { castRelation, ensureUserRole } from '@/utils/supabaseHelpers';
import { User } from '@/types/user';
import { execSql } from '@/utils/supabaseHelpers';
import { runQuery } from '@/components/admin/adminActions';

interface AdminVerificationResult {
  isAdmin: boolean;
  isVerifying: boolean;
  errorMessage: string | null;
}

/**
 * Hook to verify if the current user has admin privileges
 * Used in admin-only pages to prevent unauthorized access
 */
export const useAdminVerification = (): AdminVerificationResult => {
  const { user, isAuthenticated } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isAuthenticated) {
      setIsVerifying(false);
      setIsAdmin(false);
      setErrorMessage('User not authenticated');
      return;
    }

    const checkAdminStatus = async () => {
      setIsVerifying(true);
      setErrorMessage(null);

      try {
        // Special case for the main admin email
        if (user.email === 'contact@automatizalo.co') {
          setIsAdmin(true);
          setIsVerifying(false);
          return;
        }

        // Check if the user has the admin role in the database
        const query = `SELECT id, email, role FROM users WHERE id = '${user.id}'`;
        const { data, error } = await runQuery<User>(query);

        if (error || !data || data.length === 0) {
          console.error('Error checking admin status:', error);
          setErrorMessage('Failed to verify admin permissions');
          setIsAdmin(false);
          return;
        }

        // Process the user data to ensure role is available
        const processedUser = ensureUserRole(data[0]);
        const userRole = processedUser ? processedUser.role || 'client' : 'client';
        
        if (userRole === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setErrorMessage('User does not have admin permissions');
        }
      } catch (error: any) {
        console.error('Admin verification error:', error);
        setIsAdmin(false);
        setErrorMessage(error.message || 'Failed to verify admin permissions');
      } finally {
        setIsVerifying(false);
      }
    };

    checkAdminStatus();
  }, [user, isAuthenticated]);

  return { isAdmin, isVerifying, errorMessage };
};
