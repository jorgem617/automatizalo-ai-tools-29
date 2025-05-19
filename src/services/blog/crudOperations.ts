import { BlogPost, BlogTranslation } from '@/types/blog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { safeCast, safeCastArray } from '@/utils/supabaseHelpers';

// Helper to convert blog posts from DB to proper types
const formatBlogPost = (post: any): BlogPost => {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    slug: post.slug,
    excerpt: post.excerpt,
    feature_image: post.feature_image,
    tags: post.tags,
    author_name: post.author_name,
    status: post.status || 'draft',
    created_at: post.created_at,
    updated_at: post.updated_at
  };
};

/**
 * Save a new blog post in the database
 */
export const saveBlogPost = async (blogPost: BlogPost): Promise<string | null> => {
  try {
    // Use runQuery helper for tables not in the type system
    const sql = `
      INSERT INTO blog_posts (
        title, 
        content, 
        slug, 
        excerpt, 
        feature_image, 
        tags, 
        author_name,
        status
      ) VALUES (
        '${escapeSql(blogPost.title)}', 
        '${escapeSql(blogPost.content)}', 
        '${escapeSql(blogPost.slug)}', 
        '${escapeSql(blogPost.excerpt || '')}', 
        '${escapeSql(blogPost.feature_image || '')}', 
        '${escapeSql(JSON.stringify(blogPost.tags || []))}', 
        '${escapeSql(blogPost.author_name || '')}',
        '${escapeSql(blogPost.status || 'draft')}'
      )
      RETURNING id
    `;
    
    const { data, error } = await runQuery<{id: string}>(sql);
    
    if (error) throw error;
    
    // Return the new post ID
    return data && data.length > 0 ? data[0].id : null;
  } catch (error: any) {
    console.error('Error saving blog post:', error);
    toast.error('Failed to save blog post');
    return null;
  }
};

/**
 * Update an existing blog post in the database
 */
export const updateBlogPost = async (blogPost: BlogPost): Promise<boolean> => {
  try {
    // Use runQuery helper for tables not in the type system
    const sql = `
      UPDATE blog_posts
      SET 
        title = '${escapeSql(blogPost.title)}', 
        content = '${escapeSql(blogPost.content)}', 
        slug = '${escapeSql(blogPost.slug)}', 
        excerpt = '${escapeSql(blogPost.excerpt || '')}', 
        feature_image = '${escapeSql(blogPost.feature_image || '')}', 
        tags = '${escapeSql(JSON.stringify(blogPost.tags || []))}', 
        author_name = '${escapeSql(blogPost.author_name || '')}',
        status = '${escapeSql(blogPost.status || 'draft')}',
        updated_at = NOW()
      WHERE id = '${blogPost.id}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    toast.error('Failed to update blog post');
    return false;
  }
};

/**
 * Update the status of a blog post (publish/unpublish)
 */
export const updateBlogPostStatus = async (postId: string, status: 'draft' | 'published'): Promise<boolean> => {
  try {
    // Use runQuery helper for tables not in the type system
    const sql = `
      UPDATE blog_posts
      SET 
        status = '${status}',
        updated_at = NOW()
      WHERE id = '${postId}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error('Error updating blog post status:', error);
    toast.error('Failed to update blog post status');
    return false;
  }
};

/**
 * Delete a blog post from the database
 */
export const deleteBlogPost = async (postId: string): Promise<boolean> => {
  try {
    // Use runQuery helper for tables not in the type system
    const sql = `
      DELETE FROM blog_posts
      WHERE id = '${postId}'
    `;
    
    const { error } = await runQuery(sql);
    
    if (error) throw error;
    
    return true;
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    toast.error('Failed to delete blog post');
    return false;
  }
};
