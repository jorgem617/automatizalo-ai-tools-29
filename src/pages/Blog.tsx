import { useState, useEffect, Suspense } from "react";
import { fetchBlogPosts } from "@/services/blogService";
import { BlogPost } from "@/types/blog";
import BlogHero from "@/components/blog/BlogHero";
import FeaturedPosts from "@/components/blog/FeaturedPosts";
import CategoryFilter from "@/components/blog/CategoryFilter";
import BlogList from "@/components/blog/BlogList";
import NewsletterSignup from "@/components/blog/NewsletterSignup";
import { useTheme } from "@/context/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const Blog = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const { theme } = useTheme();

  // Categories
  const categories = ["All", "AI", "Automation", "Technology"];

  // Fetch blog posts using React Query with better error handling and retry logic
  const { 
    data: blogPosts = [] as BlogPost[], 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: async () => {
      const posts = await fetchBlogPosts('published');
      return posts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes before refetching
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    retry: 2,
  });

  useEffect(() => {
    if (blogPosts && blogPosts.length > 0) {
      if (activeCategory === "All") {
        setFilteredPosts(blogPosts);
      } else {
        setFilteredPosts(blogPosts.filter(post => post.category === activeCategory));
      }
    } else {
      setFilteredPosts([]);
    }
  }, [activeCategory, blogPosts]);

  // Handle rendering based on loading state
  if (isError) {
    return (
      <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Unable to load blog posts</h2>
            <p className="mb-4">We're experiencing technical difficulties. Please try again later.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Blog hero is always shown while loading */}
          <BlogHero />
          
          {/* For other sections, render loading skeletons or actual content */}
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              <FeaturedPosts posts={blogPosts} />
              <CategoryFilter 
                categories={categories} 
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
              <BlogList posts={filteredPosts} />
              <NewsletterSignup />
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Separate loading state component
const LoadingState = () => (
  <>
    <div className="my-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
    <div className="my-8">
      <Skeleton className="h-10 w-96 mb-6" />
      <div className="flex gap-4 mb-12">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        ))}
      </div>
    </div>
  </>
);

export default Blog;
