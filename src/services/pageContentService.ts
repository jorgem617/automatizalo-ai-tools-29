
import { runQuery, escapeSql } from "@/components/admin/adminActions";
import { toast } from "sonner";

export const getPageContent = async (page: string, section: string, language: string = 'en'): Promise<string> => {
  try {
    // Try to get content from localStorage first
    const cacheKey = `page_content_${page}_${section}_${language}`;
    const cachedContent = localStorage.getItem(cacheKey);
    
    // Get content from Supabase using the runQuery helper
    const sql = `
      SELECT content
      FROM page_content
      WHERE page = '${escapeSql(page)}'
      AND section_name = '${escapeSql(section)}'
      AND language = '${escapeSql(language)}'
    `;
    
    const { data, error } = await runQuery<{ content: string }>(sql);
      
    if (error) {
      console.error('Error fetching content:', error);
      // Return cached content if available
      if (cachedContent) return cachedContent;
      return `<h2>Content for ${section} on ${page} page</h2>`;
    }
    
    if (data && data.length > 0 && data[0].content) {
      // Update cache
      localStorage.setItem(cacheKey, data[0].content);
      return data[0].content;
    }
    
    // If no content found for requested language, try English
    if (language !== 'en') {
      return getPageContent(page, section, 'en');
    }
    
    const defaultContent = `<h2>Content for ${section} on ${page} page</h2>`;
    return defaultContent;
    
  } catch (error) {
    console.error('Error in getPageContent:', error);
    const defaultContent = `<h2>Content for ${section} on ${page} page</h2>`;
    return defaultContent;
  }
};

export const updatePageContent = async (
  page: string, 
  section: string, 
  content: string, 
  language: string = 'en'
): Promise<void> => {
  try {
    const sql = `
      INSERT INTO page_content (page, section_name, content, language, updated_at)
      VALUES (
        '${escapeSql(page)}',
        '${escapeSql(section)}',
        '${escapeSql(content)}',
        '${escapeSql(language)}',
        now()
      )
      ON CONFLICT (page, section_name, language) 
      DO UPDATE SET 
        content = EXCLUDED.content,
        updated_at = now()
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;

    // Update cache
    const cacheKey = `page_content_${page}_${section}_${language}`;
    localStorage.setItem(cacheKey, content);
    
    toast.success("Content updated successfully");
  } catch (error) {
    console.error('Error updating content:', error);
    toast.error("Failed to update content");
  }
};

// Simple function to clear cache if needed
export const clearContentCache = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('page_content_')) {
      localStorage.removeItem(key);
    }
  });
};
