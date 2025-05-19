
/**
 * Safely cast data from Supabase to a specific type, handling potential errors
 * @param data The data returned from Supabase
 * @returns The data cast to the specified type or null if there's an error
 */
export function safeCast<T>(data: any): T | null {
  if (!data || (typeof data === 'object' && 'error' in data)) {
    return null;
  }
  return data as T;
}

/**
 * Helper to safely cast an array of data from Supabase
 * @param dataArray Array of data from Supabase
 * @returns Array of safely cast items
 */
export function safeCastArray<T>(dataArray: any[]): T[] {
  if (!Array.isArray(dataArray)) {
    return [];
  }
  
  return dataArray.map(item => {
    return safeCast<T>(item);
  }).filter((item): item is T => item !== null);
}

/**
 * Type guard to check if an object is a Supabase error response
 */
export function isSupabaseError(obj: any): boolean {
  return obj && typeof obj === 'object' && obj.error === true;
}

/**
 * Cast Supabase response to proper types, handling error objects
 * Useful for nested relationships that might be error objects
 */
export function castRelation<T>(relation: any, fallbackValue: T): T {
  if (isSupabaseError(relation)) {
    return fallbackValue;
  }
  return relation as T;
}

/**
 * Execute SQL query safely using the runQuery helper
 * This is a workaround for tables not in the TypeScript schema
 */
export function execSql<T = any>(supabase: any, query: string): Promise<{ data: T[] | null; error: any }> {
  try {
    return supabase.rpc('exec_sql', { sql_query: query });
  } catch (err) {
    return Promise.resolve({ data: null, error: err });
  }
}

/**
 * Type helper to add role field to User objects
 * @param user User object from database
 * @returns User with role field
 */
export function ensureUserRole(user: any): any {
  if (!user) return null;
  
  // If it already has role, return as is
  if ('role' in user && user.role) {
    return user;
  }
  
  // Add default role of 'client'
  return {
    ...user,
    role: 'client'
  };
}
