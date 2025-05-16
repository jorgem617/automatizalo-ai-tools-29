
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

-- Check and create support tickets tables if they don't exist
DO $$
BEGIN
  -- Create support_tickets table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets') THEN
    CREATE TABLE public.support_tickets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID NOT NULL,
      automation_id UUID NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      CONSTRAINT support_tickets_status_check CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
    );
  END IF;

  -- Create ticket_responses table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ticket_responses') THEN
    CREATE TABLE public.ticket_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      ticket_id UUID NOT NULL REFERENCES public.support_tickets(id),
      message TEXT NOT NULL,
      created_by UUID NOT NULL,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
  END IF;
  
  -- Create blog_translations table if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_translations') THEN
    CREATE TABLE public.blog_translations (
      blog_post_id UUID NOT NULL,
      language TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      PRIMARY KEY (blog_post_id, language)
    );
  END IF;
END
$$;
