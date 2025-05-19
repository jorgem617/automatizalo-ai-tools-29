
export * from './blog/getBlogPosts';
export * from './blog/writeBlogPosts';
export * from './blog/transformers';
export * from './blog/crudOperations';
export * from './blog/translationService';

// Re-export specific functions with aliases for backward compatibility
import { saveBlogPost, updateBlogPost, updateBlogPostStatus, deleteBlogPost } from './blog/crudOperations';
import { getTranslations } from './blog/translationService';

export { saveBlogPost as createBlogPost };
export { updateBlogPost };
export { updateBlogPostStatus };
export { deleteBlogPost };
export { getTranslations as getBlogTranslations };
