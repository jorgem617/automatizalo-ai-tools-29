
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  feature_image: string; // Added to match what's used in crudOperations.ts
  author_name: string; // Added to match what's used in crudOperations.ts
  image: string;
  category: string;
  tags: string[];
  date: string;
  readTime: string;
  author: string;
  featured?: boolean;
  url?: string;
  status: 'draft' | 'published';
  translations?: {
    fr?: {
      title?: string;
      excerpt?: string;
      content?: string;
    };
    es?: {
      title?: string;
      excerpt?: string;
      content?: string;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface BlogTranslation {
  id?: string; // Made optional since it's sometimes not available
  blog_post_id: string;
  language: string;
  title: string;
  excerpt: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export type NewBlogPost = Omit<BlogPost, 'id'>;
export type NewBlogTranslation = Omit<BlogTranslation, 'id' | 'created_at' | 'updated_at'>;
