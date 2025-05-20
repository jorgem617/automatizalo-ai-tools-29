
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import BlogAdminHeader from "@/components/admin/blog/BlogAdminHeader";
import MobilePostCard from "@/components/admin/blog/MobilePostCard";
import BlogPostsTable from "@/components/admin/blog/BlogPostsTable";
import { useBlogPosts } from "@/hooks/useBlogPosts";

const BlogAdmin = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { posts, loading, handleDelete, handleToggleStatus } = useBlogPosts();

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
