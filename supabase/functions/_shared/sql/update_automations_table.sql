
-- Ensure the automations table has the necessary columns
ALTER TABLE IF EXISTS public.automations 
  ADD COLUMN IF NOT EXISTS has_webhook BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_custom_prompt BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_form_integration BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_table_integration BOOLEAN DEFAULT false;

-- Create exec_sql function if it doesn't exist already
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
