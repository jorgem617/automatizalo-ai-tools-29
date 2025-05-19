
import { BlogPost } from '@/types/blog';

/**
 * Transform database post to BlogPost type
 */
export const transformDatabasePost = (post: any): BlogPost => {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    image: post.image || post.feature_image || '',
    feature_image: post.feature_image || post.image || '',
    category: post.category,
    tags: post.tags || [],
    date: post.date,
    readTime: post.read_time || '5 min',
    author: post.author || post.author_name || '',
    author_name: post.author_name || post.author || '',
    featured: post.featured || false,
    url: post.url || "",
    status: post.status || 'published',
  };
};

/**
 * Extract the blog post data from a webhook response
 */
export const extractBlogPostFromResponse = (responseText: string): Partial<BlogPost> | null => {
  try {
    console.log("Extracting blog post data from response text:", responseText);
    
    // Try to parse if it's direct JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log("Response is valid JSON:", jsonData);
      
      if (Array.isArray(jsonData) && jsonData.length > 0) {
        console.log("Response is an array, using first item");
        const data = jsonData[0];
        
        // Process content formatting if available
        if (data.content) {
          data.content = formatContentFromWebhook(data.content);
        }
        
        return data;
      }
      
      // Process content formatting for single object
      if (jsonData.content) {
        jsonData.content = formatContentFromWebhook(jsonData.content);
      }
      
      return jsonData;
    } catch (jsonError) {
      console.log("Response is not valid JSON, trying to extract JSON from text");
    }
    
    // If not direct JSON, try to find JSON blocks in the text
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        const extractedJson = JSON.parse(jsonMatch[1]);
        console.log("Extracted JSON from markdown code block:", extractedJson);
        
        // Process content formatting if available
        if (extractedJson.content) {
          extractedJson.content = formatContentFromWebhook(extractedJson.content);
        }
        
        return extractedJson;
      } catch (extractError) {
        console.error("Failed to parse JSON from markdown code block:", extractError);
      }
    }
    
    // Try to find image information in the response
    const imageMatch = responseText.match(/image(?:_url|Url)?\s*:\s*["']?(https?:\/\/[^"'\s]+)["']?/i);
    const imageUrl = imageMatch ? imageMatch[1] : null;
    console.log("Found image URL in text:", imageUrl);
    
    // If we found an image but couldn't parse JSON, create a basic object with the image
    if (imageUrl) {
      return {
        image: imageUrl
      };
    }
    
    console.log("Could not extract any usable data from the response");
    return null;
  } catch (error) {
    console.error("Error extracting blog post data:", error);
    return null;
  }
};

/**
 * Format content from webhook to preserve markdown-like formatting
 */
export const formatContentFromWebhook = (content: string): string => {
  if (!content) return '';
  
  let formattedContent = content;
  
  // Preserve heading formatting
  formattedContent = formattedContent.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  formattedContent = formattedContent.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  formattedContent = formattedContent.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  formattedContent = formattedContent.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
  formattedContent = formattedContent.replace(/^##### (.*?)$/gm, '<h5>$1</h5>');
  
  // Preserve bold and italic formatting
  formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formattedContent = formattedContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Preserve paragraph breaks (double newlines)
  formattedContent = formattedContent.replace(/\n\n/g, '</p><p>');
  
  // Preserve list formatting
  formattedContent = formattedContent.replace(/^- (.*?)$/gm, '<ul><li>$1</li></ul>');
  formattedContent = formattedContent.replace(/^(\d+)\. (.*?)$/gm, '<ol><li>$2</li></ol>');
  
  // Ensure content is properly wrapped
  if (!formattedContent.startsWith('<')) {
    formattedContent = '<p>' + formattedContent;
  }
  
  if (!formattedContent.endsWith('>')) {
    formattedContent = formattedContent + '</p>';
  }
  
  // Fix consecutive lists (remove extra tags)
  formattedContent = formattedContent.replace(/<\/ul><ul>/g, '');
  formattedContent = formattedContent.replace(/<\/ol><ol>/g, '');
  
  console.log("Formatted content:", formattedContent.substring(0, 100) + '...');
  return formattedContent;
};

/**
 * Extract image URL from various object formats
 */
export const extractImageUrl = (data: any): string | null => {
  if (!data) return null;
  
  // Direct image fields
  if (data.image_url) return data.image_url;
  if (data.imageUrl) return data.imageUrl;
  if (data.image) return data.image;
  
  // Nested image fields
  if (data.data && Array.isArray(data.data) && data.data.length > 0) {
    const firstItem = data.data[0];
    if (firstItem.url) return firstItem.url;
    if (firstItem.image_url) return firstItem.image_url;
    if (firstItem.imageUrl) return firstItem.imageUrl;
    if (firstItem.image) return firstItem.image;
  }
  
  return null;
};
