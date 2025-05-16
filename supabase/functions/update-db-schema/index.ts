
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { corsHeaders } from '../_shared/cors.ts';

const checkTableExistsSQL = await Deno.readTextFile('./sql/check_table_exists.sql');

// Read the SQL migration files
const updateAutomationsTableSQL = await Deno.readTextFile('../_shared/sql/update_automations_table.sql');
const updateUsersTableSQL = await Deno.readTextFile('../_shared/sql/update_users_table.sql');

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
    
    console.log("Running users table updates...");
    const { error: usersError } = await supabaseClient.rpc('exec_sql', { sql_query: updateUsersTableSQL });
    if (usersError) throw usersError;
    
    // Check if support_tickets and related tables exist and create them if they don't
    const checkTablesSQL = `
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_tickets') as support_tickets_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ticket_responses') as ticket_responses_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_translations') as blog_translations_exists,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'newsletter_subscriptions') as newsletter_subscriptions_exists
    `;
    
    const { data: tablesCheck, error: tablesCheckError } = await supabaseClient.rpc('exec_sql', { sql_query: checkTablesSQL });
    if (tablesCheckError) throw tablesCheckError;
    
    // Create newsletter_subscriptions table if it doesn't exist
    if (!tablesCheck.newsletter_subscriptions_exists) {
      console.log("Creating newsletter_subscriptions table...");
      const createNewsletterTableSQL = `
        CREATE TABLE public.newsletter_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          is_active BOOLEAN DEFAULT true
        );
      `;
      const { error: createNewsletterError } = await supabaseClient.rpc('exec_sql', { sql_query: createNewsletterTableSQL });
      if (createNewsletterError) throw createNewsletterError;
    }
    
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
