
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { corsHeaders } from '../_shared/cors.ts';

const checkTableExistsSQL = await Deno.readTextFile('./sql/check_table_exists.sql');

// Read the SQL migration files
const updateAutomationsTableSQL = await Deno.readTextFile('../_shared/sql/update_automations_table.sql');

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Execute SQL updates
    console.log("Creating get_table_count function...");
    const { error: tableCheckError } = await supabaseClient.rpc('exec_sql', { sql_query: checkTableExistsSQL });
    if (tableCheckError) throw tableCheckError;
    
    console.log("Running automations table updates...");
    const { error: automationsError } = await supabaseClient.rpc('exec_sql', { sql_query: updateAutomationsTableSQL });
    if (automationsError) throw automationsError;
    
    // Check if other migrations need to be run here...
    
    return new Response(
      JSON.stringify({ success: true, message: "Database schema updated successfully" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error updating database schema:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
