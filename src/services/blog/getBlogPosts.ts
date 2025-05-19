import { BlogPost } from '@/types/blog';
import { supabase } from '@/integrations/supabase/client';
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { safeCastArray } from '@/utils/supabaseHelpers';

/**
 * Fetch all blog posts with optional filtering
 */
export const fetchBlogPosts = async (filter?: 'published' | 'draft'): Promise<BlogPost[]> => {
  try {
    let query = `SELECT * FROM blog_posts`;
    
    if (filter === 'published') {
      query += ` WHERE status = 'published'`;
    } else if (filter === 'draft') {
      query += ` WHERE status = 'draft'`;
    }
    
    query += ` ORDER BY created_at DESC`;
    
    const { data, error } = await runQuery<BlogPost>(query);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
};

/**
 * Fetch a single blog post by its ID
 */
export const fetchBlogPostById = async (id: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await runQuery<BlogPost>(
      `SELECT * FROM blog_posts WHERE id = '${id}' LIMIT 1`
    );
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error fetching blog post by ID:", error);
    return null;
  }
};

/**
 * Fetch a single blog post by its slug
 */
export const fetchBlogPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  try {
    const { data, error } = await runQuery<BlogPost>(
      `SELECT * FROM blog_posts WHERE slug = '${escapeSql(slug)}' LIMIT 1`
    );
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    return null;
  }
};

/**
 * Fetch recent blog posts for features or sidebars
 */
export const fetchRecentBlogPosts = async (limit: number = 3): Promise<BlogPost[]> => {
  try {
    const { data, error } = await runQuery<BlogPost>(
      `SELECT * FROM blog_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT ${limit}`
    );
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching recent blog posts:", error);
    return [];
  }
};

/**
 * Fetch blog post translations
 */
export const fetchBlogPostTranslations = async (blogPostId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('blog_translations')
      .select('*')
      .eq('blog_post_id', blogPostId);
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching blog post translations:", error);
    return [];
  }
};

/**
 * Fetch blog posts by tag
 */
export const fetchBlogPostsByTag = async (tag: string): Promise<BlogPost[]> => {
  try {
    // Fetch all blog posts
    const allPosts = await fetchBlogPosts();

    // Filter posts that include the specified tag
    const filteredPosts = allPosts.filter(post => post.tags && post.tags.includes(tag));

    return filteredPosts;
  } catch (error) {
    console.error("Error fetching blog posts by tag:", error);
    return [];
  }
};

/**
 * Fetch similar blog posts based on tags
 */
export const fetchSimilarBlogPosts = async (blogPost: BlogPost, limit: number = 3): Promise<BlogPost[]> => {
  if (!blogPost || !blogPost.tags || blogPost.tags.length === 0) {
    return [];
  }

  try {
    // Fetch all blog posts
    const allPosts = await fetchBlogPosts();

    // Filter posts that have at least one tag in common, excluding the current blog post
    const similarPosts = allPosts.filter(post =>
      post.id !== blogPost.id && post.tags && post.tags.some(tag => blogPost.tags.includes(tag))
    );

    // Sort by the number of common tags
    similarPosts.sort((a, b) => {
      const commonTagsA = a.tags?.filter(tag => blogPost.tags?.includes(tag)).length || 0;
      const commonTagsB = b.tags?.filter(tag => blogPost.tags?.includes(tag)).length || 0;
      return commonTagsB - commonTagsA;
    });

    // Return the top 'limit' posts
    return similarPosts.slice(0, limit);
  } catch (error) {
    console.error("Error fetching similar blog posts:", error);
    return [];
  }
};
