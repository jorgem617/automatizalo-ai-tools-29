
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { fetchBlogPostById, updateBlogPost, createBlogPost } from "@/services/blogService";
import { BlogPost } from "@/types/blog";
import { BlogFormData } from "@/types/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BlogTranslation } from "@/types/supabase";

interface BlogFormContainerProps {
  children: React.ReactNode;
  formData: BlogFormData;
  setFormData: React.Dispatch<React.SetStateAction<BlogFormData>>;
  translationData: any;
  editingTranslation: boolean;
}

export const BlogFormContainer: React.FC<BlogFormContainerProps> = ({ 
  children, 
  formData, 
  setFormData,
  translationData,
  editingTranslation
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log("Submitting form with data:", formData);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast.error("You must be logged in to create or update posts");
        navigate("/login", { replace: true });
        return;
      }

      const tagsArray = formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag);
      
      const postData: any = {
        title: formData.title,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        author: formData.author,
        date: formData.date,
        readTime: formData.readTime,
        image: formData.image,
        featured: formData.featured,
        slug: formData.slug || formData.title.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
      };

      console.log("Post data prepared for saving:", postData);

      let savedPostId: string;
      
      if (id) {
        console.log("Updating existing post with ID:", id);
        await updateBlogPost(id, postData);
        savedPostId = id;
        toast.success("Post updated successfully");
      } else {
        console.log("Creating new post");
        const newPost = await createBlogPost(postData);
        savedPostId = newPost.id;
        toast.success("Post created successfully");
      }
      
      // Handle translations (using props from parent)
      const currentTranslations = editingTranslation ? translationData : formData.translations;
      if ((currentTranslations.fr.title && currentTranslations.fr.content) || 
          (currentTranslations.es.title && currentTranslations.es.content)) {
        try {
          await saveBlogTranslations(savedPostId, currentTranslations);
        } catch (translationError) {
          console.error("Error saving translations:", translationError);
          toast.error(`Post was saved, but translations failed: ${translationError instanceof Error ? translationError.message : String(translationError)}`);
        }
      }
      
      navigate("/admin/blog");
    } catch (error) {
      console.error("Error saving post:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Detailed error:", error);
      
      toast.error(
        <div>
          <p>Failed to save post: {errorMessage}</p>
          <p className="text-xs mt-1">Please check the console for more details</p>
        </div>
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Import from blogService to avoid circular dependencies
  const saveBlogTranslations = async (blogId: string, translations: any) => {
    try {
      const { data, error } = await supabase
        .from('blog_translations')
        .upsert([
          {
            blog_post_id: blogId,
            language: 'fr',
            title: translations.fr.title,
            excerpt: translations.fr.excerpt || '',
            content: translations.fr.content
          },
          {
            blog_post_id: blogId,
            language: 'es',
            title: translations.es.title,
            excerpt: translations.es.excerpt || '',
            content: translations.es.content
          }
        ] as BlogTranslation[]) as any;

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving blog translations:", error);
      throw error;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {children}
      
      <div className="flex justify-end space-x-4 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/admin/blog")}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="bg-gray-900 hover:bg-gray-800"
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : (id ? "Update Post" : "Create Post")}
        </Button>
      </div>
    </form>
  );
};

export default BlogFormContainer;
