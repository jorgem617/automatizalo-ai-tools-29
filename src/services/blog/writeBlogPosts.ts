
import { BlogPost, NewBlogPost } from '@/types/blog';
import { runQuery, escapeSql } from '@/components/admin/adminActions';
import { toast } from 'sonner';
import { saveBlogPost, updateBlogPost } from './crudOperations';
import { extractBlogPostFromResponse } from './transformers';

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

// Function to send post to n8n webhook
export const sendPostToN8N = async (
  prompt: string,
  category: string,
  webhookUrl: string
): Promise<any> => {
  try {
    if (!webhookUrl || !prompt) {
      console.error('Missing webhook URL or prompt');
      return { error: 'Missing webhook URL or prompt' };
    }

    console.log('Sending request to webhook:', webhookUrl);
    console.log('Prompt:', prompt);
    console.log('Category:', category);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        category,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.text();
    console.log('Received webhook response:', responseData);
    
    return { data: responseData, error: null };
  } catch (error: any) {
    console.error('Error sending post to webhook:', error);
    toast.error('Failed to generate content from webhook');
    return { data: null, error: error.message };
  }
};

// Process and save webhook response
export const processAndSaveWebhookResponse = async (
  responseText: string, 
  category: string
): Promise<BlogPost | null> => {
  try {
    // Extract blog data from response
    const extractedData = extractBlogPostFromResponse(responseText);
    
    if (!extractedData) {
      console.error('Could not extract blog data from response');
      return null;
    }
    
    // Prepare the blog post data
    const currentDate = new Date().toISOString();
    const newPost: NewBlogPost = {
      title: extractedData.title || 'Generated Post',
      slug: extractedData.slug || `generated-post-${Date.now()}`,
      excerpt: extractedData.excerpt || '',
      content: extractedData.content || responseText,
      category: category,
      tags: extractedData.tags || [category],
      author: 'AI Assistant',
      author_name: 'AI Assistant',
      date: currentDate,
      readTime: '3 min',
      image: extractedData.image || '',
      feature_image: extractedData.image || '',
      status: 'draft',
      url: '',
    };
    
    console.log('Saving new blog post:', newPost);
    
    // Create the blog post
    const savedPost = await createBlog(newPost);
    
    return savedPost;
  } catch (error: any) {
    console.error('Error processing webhook response:', error);
    toast.error('Failed to process webhook response');
    return null;
  }
};
