
import { BlogPost, NewBlogPost } from '@/types/blog';
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { toast } from 'sonner';
import { saveBlogPost, updateBlogPost } from './crudOperations';

// Create a new blog post
export const createBlog = async (newBlog: NewBlogPost): Promise<BlogPost | null> => {
  try {
    const blogId = await saveBlogPost(newBlog as BlogPost);
    
    if (!blogId) {
      return null;
    }

    // After saving, fetch the newly created blog post
    const sql = `
      SELECT * FROM blog_posts 
      WHERE id = '${escapeSql(blogId)}'
      LIMIT 1
    `;
    
    const { data, error } = await runQuery<BlogPost>(sql);
    
    if (error || !data || data.length === 0) {
      console.error('Error fetching new blog post:', error);
      return null;
    }
    
    return data[0];
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    toast.error(error.message || 'Failed to create blog post');
    return null;
  }
};

// Update an existing blog post
export const updateBlog = async (blog: BlogPost): Promise<boolean> => {
  try {
    const success = await updateBlogPost(blog);
    return success;
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    toast.error(error.message || 'Failed to update blog post');
    return false;
  }
};
