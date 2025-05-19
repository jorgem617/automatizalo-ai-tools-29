
import { User } from '@/types/user';
import { SupabaseClient } from '@supabase/supabase-js';

// Ensure user has a role property
export const ensureUserRole = (user: any): User => {
  if (!user) return null as any;
  
  return {
    ...user,
    role: user.role || 'client' // Default to 'client' if no role is set
  };
};

// Cast data from supabase to the expected type
export function safeCast<T>(data: any): T {
  return data as T;
}

// Cast array data from supabase to an array of the expected type
export function safeCastArray<T>(data: any[]): T[] {
  return data as T[];
}

// Execute SQL query
export async function execSql<T>(
  supabase: SupabaseClient,
  sqlQuery: string
): Promise<{ data: T[] | null; error: any }> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: sqlQuery
    });
    
    if (error) {
      console.error('SQL Error:', error);
      return { data: null, error };
    }
    
    return { data: data as T[], error: null };
  } catch (error) {
    console.error('Execution Error:', error);
    return { data: null, error };
  }
}

// Helper for handling relationships that might be errored
export function castRelation<T>(relation: any, defaultValue?: T): T | null {
  if (!relation || relation.error === true) {
    return defaultValue || null;
  }
  return relation as T;
}
