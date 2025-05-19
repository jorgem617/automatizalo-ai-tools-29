
import { runQuery } from "@/components/admin/adminActions";

/**
 * Helper function to check if a table exists in the database
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  const sql = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name = '${tableName}'
    ) as exists
  `;
  
  try {
    const { data, error } = await runQuery<{ exists: boolean }>(sql);
    
    if (error || !data || data.length === 0) {
      return false;
    }
    
    return data[0].exists;
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error);
    return false;
  }
};

/**
 * Create page_content table if it doesn't exist yet
 */
export const ensurePageContentTable = async (): Promise<boolean> => {
  const tableExists = await checkTableExists('page_content');
  
  if (tableExists) {
    return true;
  }
  
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public.page_content (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      page TEXT NOT NULL,
      section_name TEXT NOT NULL,
      content TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE(page, section_name, language)
    );

    ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all access for authenticated users" 
    ON public.page_content 
    AS PERMISSIVE 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
  `;
  
  try {
    const { error } = await runQuery(createTableSql);
    return !error;
  } catch (error) {
    console.error('Error creating page_content table:', error);
    return false;
  }
};

/**
 * Create testimonials table if it doesn't exist yet
 */
export const ensureTestimonialsTable = async (): Promise<boolean> => {
  const tableExists = await checkTableExists('testimonials');
  
  if (tableExists) {
    return true;
  }
  
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public.testimonials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      company TEXT,
      text TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
    );

    ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all access for authenticated users" 
    ON public.testimonials 
    AS PERMISSIVE 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
    
    CREATE TABLE IF NOT EXISTS public.testimonials_translations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      testimonial_id UUID NOT NULL REFERENCES public.testimonials(id) ON DELETE CASCADE,
      language TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
      UNIQUE(testimonial_id, language)
    );
    
    ALTER TABLE public.testimonials_translations ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Enable all access for authenticated users" 
    ON public.testimonials_translations 
    AS PERMISSIVE 
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
  `;
  
  try {
    const { error } = await runQuery(createTableSql);
    return !error;
  } catch (error) {
    console.error('Error creating testimonials tables:', error);
    return false;
  }
};
