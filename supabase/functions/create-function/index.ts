
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.23.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { function_definition } = await req.json();
    
    if (!function_definition) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing function_definition parameter" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    
    // Execute the function definition
    const { data, error } = await supabaseClient.from('_functions_log').insert([
      { 
        operation: 'create_function',
        sql_executed: function_definition,
        executed_by: 'system'
      }
    ]);
    
    if (error) {
      console.error("Failed to log function creation:", error);
    }
    
    // Try to execute the function definition directly
    try {
      const result = await supabaseClient.rpc('exec_raw_sql', { 
        sql: function_definition 
      });
      
      return new Response(
        JSON.stringify({ success: true, message: "Function created successfully" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (sqlError) {
      console.error("Error executing function definition:", sqlError);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create function", 
          details: sqlError.message || String(sqlError)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error("Error creating function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message || String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
