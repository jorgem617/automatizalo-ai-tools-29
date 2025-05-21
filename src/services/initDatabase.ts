
import { checkTableExists, ensurePageContentTable, ensureTestimonialsTable } from '@/utils/sqlUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the exec_sql function exists in the database
 */
export const ensureExecSqlFunction = async (): Promise<boolean> => {
  try {
    console.log("Checking if exec_sql function exists...");
    
    // Try to call the function to see if it exists
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: "SELECT 1 as test"
    });
    
    if (error) {
      console.log("exec_sql function not found, creating it...");
      
      // Function doesn't exist, create it
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-function', {
        body: {
          function_definition: `
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
          $$ LANGUAGE plpgsql SECURITY DEFINER;
        `
        }
      });
      
      if (createError) {
        console.error("Failed to create exec_sql function through RPC:", createError);
        toast.error("Failed to create database function. Please run the SQL manually in the Supabase SQL editor.");
        return false;
      }
      
      toast.success("Created exec_sql function");
      return true;
    }
    
    console.log("exec_sql function already exists");
    return true;
  } catch (error) {
    console.error("Error checking/creating exec_sql function:", error);
    
    // Show a helpful toast with instructions
    toast.error(
      "Database function 'exec_sql' is missing. Please run the SQL in the Supabase SQL editor to create this function.",
      {
        duration: 8000,
        action: {
          label: "View SQL",
          onClick: () => {
            // Create a modal or show the SQL in the console for the user to copy
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
    
    return false;
  }
};

export const initDatabaseTables = async (): Promise<void> => {
  try {
    console.log("Initializing database tables...");

    // First ensure the exec_sql function exists
    const execSqlExists = await ensureExecSqlFunction();
    if (!execSqlExists) {
      console.error("Cannot continue database initialization without exec_sql function");
      return;
    }
    
    // Ensure page_content table exists
    const pageContentTableCreated = await ensurePageContentTable();
    if (pageContentTableCreated) {
      console.log("Page content table initialized successfully");
    }
    
    // Ensure testimonials tables exist
    const testimonialsTablesCreated = await ensureTestimonialsTable();
    if (testimonialsTablesCreated) {
      console.log("Testimonials tables initialized successfully");
    }

    // If you're adding more tables, add them here
    
  } catch (error) {
    console.error("Error initializing database tables:", error);
    toast.error("Failed to initialize database tables");
  }
};

export default initDatabaseTables;
