
import { BlogTranslation, NewBlogTranslation } from '@/types/blog';
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { toast } from 'sonner';

/**
 * Save a new blog translation
 */
export const saveTranslation = async (translation: NewBlogTranslation): Promise<boolean> => {
  try {
    const sql = `
      INSERT INTO blog_translations (
        blog_post_id,
        language,
        title,
        excerpt,
        content
      ) VALUES (
        '${escapeSql(translation.blog_post_id)}',
        '${escapeSql(translation.language)}',
        '${escapeSql(translation.title)}',
        '${escapeSql(translation.excerpt)}',
        '${escapeSql(translation.content)}'
      )
      ON CONFLICT (blog_post_id, language)
      DO UPDATE SET
        title = EXCLUDED.title,
        excerpt = EXCLUDED.excerpt,
        content = EXCLUDED.content
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) {
      console.error('Error saving translation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save translation:', error);
    return false;
  }
};

/**
 * Get translations for a specific blog post
 */
export const getTranslations = async (blogPostId: string): Promise<BlogTranslation[]> => {
  try {
    const sql = `SELECT * FROM blog_translations WHERE blog_post_id = '${escapeSql(blogPostId)}'`;
    
    const { data, error } = await runQuery<BlogTranslation>(sql);
    
    if (error) {
      console.error('Error getting translations:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Failed to get translations:', error);
    return [];
  }
};

/**
 * Delete a specific translation by blog post ID and language
 */
export const deleteTranslation = async (blogPostId: string, language: string): Promise<boolean> => {
  try {
    const sql = `
      DELETE FROM blog_translations 
      WHERE blog_post_id = '${escapeSql(blogPostId)}' 
      AND language = '${escapeSql(language)}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) {
      console.error('Error deleting translation:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete translation:', error);
    return false;
  }
};

/**
 * Delete all translations for a blog post
 */
export const deleteAllTranslations = async (blogPostId: string): Promise<boolean> => {
  try {
    const sql = `DELETE FROM blog_translations WHERE blog_post_id = '${escapeSql(blogPostId)}'`;
    
    const { error } = await runQuery(sql);
    
    if (error) {
      console.error('Error deleting all translations:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to delete all translations:', error);
    return false;
  }
};
