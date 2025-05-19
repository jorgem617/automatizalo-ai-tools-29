
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { execSql } from "@/utils/supabaseHelpers";

export const updateDatabaseSchema = async () => {
  try {
    toast.info("Updating database schema...");
    
    const { data, error } = await supabase.functions.invoke('update-db-schema', {
      method: 'POST',
    });
    
    if (error) {
      console.error("Error updating database schema:", error);
      toast.error("Failed to update database schema");
      return false;
    }
    
    console.log("Database schema update result:", data);
    toast.success("Database schema updated successfully");
    return true;
  } catch (err) {
    console.error("Error calling update-db-schema function:", err);
    toast.error("Failed to update database schema");
    return false;
  }
};

// Helper function to run a raw SQL query for tables not in TypeScript types
export const runQuery = async <T = any>(query: string): Promise<{ data: T[] | null; error: any }> => {
  return execSql<T>(supabase, query);
};

// Helper function for webhook validation
export const validateWebhookUrl = (url: string): boolean => {
  if (!url) return true; // Empty is valid (optional)
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
};

// Helper function to safely escape SQL strings
export const escapeSql = (str: string): string => {
  if (!str) return '';
  return str.replace(/'/g, "''");
};
