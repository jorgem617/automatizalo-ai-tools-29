
export interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  featured: boolean;
  status: 'draft' | 'published';
  translations: TranslationFormData;
}

export interface TranslationFormData {
  fr: {
    title: string;
    excerpt: string;
    content: string;
  };
  es: {
    title: string;
    excerpt: string;
    content: string;
  };
}
