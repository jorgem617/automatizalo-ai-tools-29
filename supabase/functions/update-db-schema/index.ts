
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
    
    // Check if support_tickets and related tables exist and create them if they don't
    const checkSupportTablesSQL = `
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') as support_tickets_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_responses') as ticket_responses_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_translations') as blog_translations_exists
    `;
    
    const { data: tablesCheck, error: tablesCheckError } = await supabaseClient.rpc('exec_sql', { sql_query: checkSupportTablesSQL });
    if (tablesCheckError) throw tablesCheckError;
    
    // Check if other migrations need to be run here...
    
    return new Response(
      JSON.stringify({ success: true, message: "Database schema updated successfully", tablesCheck }),
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
