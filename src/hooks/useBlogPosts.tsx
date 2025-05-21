
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { BlogPost } from "@/types/blog";
import { fetchBlogPosts, deleteBlogPost, updateBlogPostStatus } from "@/services/blogService";
import { useSocialMediaShare } from "@/hooks/useSocialMediaShare";
import { handleSupabaseError, retryOperation } from "@/integrations/supabase/client";

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { shareToSocialMedia } = useSocialMediaShare();
  const [hasNetworkError, setHasNetworkError] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        console.log("Fetching blog posts...");
        setError(null);
        setLoading(true);
        setHasNetworkError(false);
        
        // Use the enhanced retry mechanism with more resilience
        const fetchedPosts = await retryOperation(
          async () => await fetchBlogPosts(),
          5,  // Increased retry attempts
          2000 // Longer initial delay
        );
        
        setPosts(fetchedPosts);
        console.log(`Successfully fetched ${fetchedPosts.length} blog posts`);
        
        // Successfully fetched, so save to localStorage as backup
        try {
          localStorage.setItem('cached_blog_posts', JSON.stringify(fetchedPosts));
        } catch (cacheError) {
          console.error("Error caching blog posts:", cacheError);
        }
        
      } catch (error: any) {
        console.error("Error fetching blog posts:", error);
        const errorMessage = handleSupabaseError(error, "Failed to load blog posts");
        setError(errorMessage);
        
        // Check specifically for exec_sql missing error
        if (error?.message?.includes('Could not find the function public.exec_sql')) {
          setError("Could not find the function public.exec_sql(query_text) in the schema cache");
        } else if (error?.message?.includes('network') || 
            error?.code === 'NETWORK_ERROR' || 
            error?.message?.includes('fetch') ||
            error?.code === '42501') {
          setHasNetworkError(true);
        }
        
        toast.error("Failed to load blog posts. Using cached data if available.");
        
        // Try to use cached data if available
        try {
          const cachedPosts = localStorage.getItem('cached_blog_posts');
          if (cachedPosts) {
            const parsedPosts = JSON.parse(cachedPosts);
            setPosts(parsedPosts);
            toast.info("Showing cached blog posts from your last visit");
          } else {
            toast.info("No cached posts available. Some features may be limited.");
          }
        } catch (cacheError) {
          console.error("Error loading cached posts:", cacheError);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
    
    const handlePostUpdate = () => {
      fetchPosts();
    };
    
    window.addEventListener('blogPostUpdated', handlePostUpdate);
    window.addEventListener('blogPostDeleted', handlePostUpdate);
    
    // Add a network reconnection handler
    const handleOnline = () => {
      if (hasNetworkError) {
        console.log("Network reconnected, refreshing blog posts...");
        fetchPosts();
      }
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('networkReconnected', handleOnline);
    
    return () => {
      window.removeEventListener('blogPostUpdated', handlePostUpdate);
      window.removeEventListener('blogPostDeleted', handlePostUpdate);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('networkReconnected', handleOnline);
    };
  }, [hasNetworkError]);

  useEffect(() => {
    if (posts.length > 0) {
      try {
        localStorage.setItem('cached_blog_posts', JSON.stringify(posts));
      } catch (error) {
        console.error("Error caching blog posts:", error);
      }
    }
  }, [posts]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await deleteBlogPost(id);
        setPosts(posts.filter(post => post.id !== id));
        toast.success("Post deleted successfully");
      } catch (error) {
        console.error("Error deleting post:", error);
        toast.error(handleSupabaseError(error, "Failed to delete post"));
      }
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'draft' ? 'published' : 'draft';
      
      await updateBlogPostStatus(post.id, newStatus);
      
      setPosts(posts.map(p => {
        if (p.id === post.id) {
          return { ...p, status: newStatus };
        }
        return p;
      }));

      if (newStatus === 'published') {
        try {
          await shareToSocialMedia(post);
        } catch (socialError) {
          console.error("Error sharing to social media:", socialError);
          // Continue with the status update even if social media sharing fails
        }
      }
      
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error("Error updating post status:", error);
      toast.error(handleSupabaseError(error, "Failed to update post status"));
    }
  };

  return {
    posts,
    loading,
    error,
    handleDelete,
    handleToggleStatus,
  };
};
