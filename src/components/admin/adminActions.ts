
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
  try {
    return await execSql<T>(supabase, query);
  } catch (err) {
    console.error("Error executing SQL query:", err);
    
    // Check if the error is about missing exec_sql function
    if (err.message && err.message.includes("Could not find the function public.exec_sql")) {
      // Show a helpful toast with instructions
      toast.error(
        "Database function 'exec_sql' is missing. Please run the SQL in the Supabase SQL editor to create this function.",
        {
          duration: 8000,
          action: {
            label: "View SQL",
            onClick: () => {
              // Output SQL to console and show alert
              console.info(`
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql_query;
  GET DIAGNOSTICS result = ROW_COUNT;
  RETURN jsonb_build_object('affected_rows', result);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
              alert("The SQL has been output to the console. Please copy it and run it in the Supabase SQL editor.");
            }
          }
        }
      );
    } else {
      toast.error("Error executing SQL query: " + (err.message || "Unknown error"));
    }
    
    return { data: null, error: err };
  }
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
