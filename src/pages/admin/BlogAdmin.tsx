
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BlogAdminHeader from "@/components/admin/blog/BlogAdminHeader";
import MobilePostCard from "@/components/admin/blog/MobilePostCard";
import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { useBlogPosts } from "@/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { DatabaseIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BlogAdmin = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { posts, loading, error, handleDelete, handleToggleStatus } = useBlogPosts();

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleEdit = (id: string) => {
    navigate(`/admin/blog/edit/${id}`);
  };

  const handleCreate = () => {
    navigate("/admin/blog/new");
  };
  
  const handleCreateAutomatic = () => {
    navigate("/admin/automatic-blog");
  };
  
  const navigateToWebhookSettings = () => {
    navigate("/admin/webhooks");
  };

  const navigateToNotifications = () => {
    navigate("/admin/notifications");
  };
  
  const setupExecSqlFunction = async () => {
    try {
      toast.info("Setting up database function...");
      
      // Create the function through the edge function
      const { data, error } = await supabase.functions.invoke('create-function', {
        body: {
          function_definition: `
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
          `
        }
      });
      
      if (error) {
        console.error("Error setting up database function:", error);
        toast.error("Failed to set up database function. Please run the SQL manually.");
        return;
      }
      
      toast.success("Database function set up successfully");
      window.location.reload(); // Reload to apply changes
    } catch (err) {
      console.error("Error invoking function:", err);
      toast.error("Failed to set up database function");
    }
  };

  // Check for the specific exec_sql error
  if (error && error.includes("Could not find the function public.exec_sql")) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-amber-800 mb-2">Database Function Missing</h2>
          <p className="text-amber-700 mb-4">
            The required database function <code className="bg-amber-100 px-1 rounded">exec_sql</code> is missing.
            This function is needed to manage blog posts.
          </p>
          <Button 
            variant="outline" 
            className="bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200 hover:text-amber-900 flex items-center gap-2"
            onClick={setupExecSqlFunction}
          >
            <DatabaseIcon className="w-4 h-4" />
            Setup Database Function
          </Button>
          <p className="text-amber-600 text-sm mt-4">
            Alternatively, you can run the SQL manually in the Supabase SQL Editor.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <>
      <BlogAdminHeader
        onCreatePost={handleCreate}
        onCreateAutomatic={handleCreateAutomatic}
        onWebhookSettings={navigateToWebhookSettings}
        onNotifications={navigateToNotifications}
        isMobile={isMobile}
      />
      
      {isMobile ? (
        <div>
          {posts.length > 0 ? (
            posts.map((post) => (
              <MobilePostCard
                key={post.id}
                post={post}
                onToggleStatus={handleToggleStatus}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No posts found. Create your first blog post.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <BlogPostsTable
              posts={posts}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BlogAdmin;
