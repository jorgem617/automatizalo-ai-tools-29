
// Re-export services from their respective files
export * from './testimonialService';
export * from './contactService';

// Add utility functions for general Supabase operations
import { supabase, retryOperation, handleSupabaseError } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Check if Supabase connection is working
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log("Checking Supabase connection...");
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Supabase connection check failed:", error);
      return false;
    }
    
    console.log("Supabase connection check successful");
    return true;
  } catch (error) {
    console.error("Error checking Supabase connection:", error);
    return false;
  }
};

/**
 * Setup offline caching for a table
 */
export const setupOfflineCache = <T>(
  tableName: string,
  fetchFunction: () => Promise<T[]>,
  cacheKey = tableName
): void => {
  // Initial fetch and cache
  fetchFunction()
    .then(data => {
      try {
        localStorage.setItem(`cached_${cacheKey}`, JSON.stringify(data));
        console.log(`Cached ${data.length} items from ${tableName}`);
      } catch (error) {
        console.error(`Error caching ${tableName}:`, error);
      }
    })
    .catch(error => {
      console.error(`Error fetching ${tableName} for cache:`, error);
    });
    
  // Set up event listeners for online/offline status
  window.addEventListener('online', async () => {
    console.log(`Network back online, refreshing ${tableName} data`);
    try {
      const data = await fetchFunction();
      try {
        localStorage.setItem(`cached_${cacheKey}`, JSON.stringify(data));
        toast.success(`${tableName} data refreshed successfully`);
      } catch (storageError) {
        console.error(`Error updating cache for ${tableName}:`, storageError);
      }
    } catch (error) {
      console.error(`Error refreshing ${tableName} after coming online:`, error);
    }
  });
  
  // Also listen for our custom networkReconnected event
  window.addEventListener('networkReconnected', async () => {
    console.log(`Network reconnected event, refreshing ${tableName} data`);
    try {
      const data = await fetchFunction();
      try {
        localStorage.setItem(`cached_${cacheKey}`, JSON.stringify(data));
      } catch (storageError) {
        console.error(`Error updating cache for ${tableName}:`, storageError);
      }
    } catch (error) {
      console.error(`Error refreshing ${tableName} after reconnection event:`, error);
    }
  });
};

/**
 * Get cached data for a table
 */
export const getCachedData = <T>(cacheKey: string, defaultValue: T[] = []): T[] => {
  try {
    const cachedData = localStorage.getItem(`cached_${cacheKey}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error(`Error reading cached data for ${cacheKey}:`, error);
  }
  return defaultValue;
};

/**
 * Clear all cached data
 */
export const clearAllCaches = (): void => {
  const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cached_'));
  cacheKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error clearing cache for ${key}:`, error);
    }
  });
  console.log(`Cleared ${cacheKeys.length} cache entries`);
  toast.success("All cached data cleared");
};

/**
 * Attempt to sync all offline changes
 */
export const syncOfflineChanges = async (): Promise<boolean> => {
  // This is a placeholder for a more sophisticated offline sync mechanism
  // In a real app, you would implement a queue system for offline changes
  
  // Dispatch reconnection event to trigger refreshes
  window.dispatchEvent(new CustomEvent('networkReconnected'));
  
  return true;
};

/**
 * Check if the database schema has the necessary tables
 */
export const checkDatabaseSchema = async (): Promise<boolean> => {
  try {
    console.log("Checking database schema...");
    // Check for critical tables using system catalog queries via exec_sql RPC
    const criticalTables = [
      'automations', 
      'client_automations', 
      'client_integration_settings',
      'users'
    ];
    
    let hasAllTables = true;
    const sqlQuery = `
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.tables 
              WHERE table_schema = 'public' AND table_name = t.table_name) as exists_flag
      FROM unnest(ARRAY['${criticalTables.join("','")}']) as t(table_name)
    `;
    
    const { data, error } = await runQuery(sqlQuery);
    
    if (error) {
      console.error("Schema check query failed:", error);
      return false;
    }
    
    if (data) {
      const tableData = data as Array<{ table_name: string, exists_flag: number }>;
      tableData.forEach((row) => {
        const exists = row.exists_flag > 0;
        console.log(`Table ${row.table_name} exists: ${exists}`);
        if (!exists) {
          hasAllTables = false;
        }
      });
    }
    
    return hasAllTables;
  } catch (error) {
    console.error("Error checking database schema:", error);
    return false;
  }
};
