
import { handleSupabaseError, retryOperation } from "@/integrations/supabase/client";
import { runQuery, escapeSql } from "@/components/admin/adminActions";
import { translateBlogContent } from "./translationService";
import { toast } from "sonner";

// Define proper types for testimonials and translations
export interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  text: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TestimonialTranslation {
  id: string;
  testimonial_id: string;
  language: string;
  text: string;
  created_at?: string;
  updated_at?: string;
}

// Local cache for testimonials
let testimonialsCache: Testimonial[] = [];
let testimonialsCacheTimestamp = 0;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all testimonials
 */
export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    // Use cache if available and not expired
    if (testimonialsCache.length > 0 && (Date.now() - testimonialsCacheTimestamp) < CACHE_EXPIRY) {
      console.log("Using cached testimonials");
      return testimonialsCache;
    }
    
    console.log("Fetching testimonials from Supabase...");
    
    const sql = `
      SELECT * FROM testimonials
      ORDER BY created_at DESC
    `;
    
    const { data, error } = await runQuery<Testimonial>(sql);
    
    if (error) {
      console.error('Error fetching testimonials:', error);
      if (testimonialsCache.length > 0) {
        toast.error(handleSupabaseError(error, "Failed to refresh testimonials. Using cached data."));
        return testimonialsCache;
      }
      toast.error(handleSupabaseError(error, "Failed to load testimonials"));
      return [];
    }
    
    // Update cache
    testimonialsCache = data || [];
    testimonialsCacheTimestamp = Date.now();
    
    console.log(`Successfully fetched ${data?.length || 0} testimonials`);
    return data || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    
    if (testimonialsCache.length > 0) {
      toast.error(handleSupabaseError(error, "Error refreshing testimonials. Using cached data."));
      return testimonialsCache;
    }
    
    toast.error(handleSupabaseError(error, "Failed to load testimonials"));
    return [];
  }
};

/**
 * Fetch testimonial translations
 */
export const fetchTestimonialTranslations = async (): Promise<TestimonialTranslation[]> => {
  try {
    console.log("Fetching testimonial translations from Supabase...");
    
    const sql = `
      SELECT * FROM testimonials_translations
    `;
    
    const { data, error } = await runQuery<TestimonialTranslation>(sql);
    
    if (error) {
      console.error('Error fetching testimonial translations:', error);
      toast.error(handleSupabaseError(error, "Failed to load testimonial translations"));
      return [];
    }
    
    console.log(`Successfully fetched ${data?.length || 0} testimonial translations`);
    return data || [];
  } catch (error) {
    console.error('Error fetching testimonial translations:', error);
    toast.error(handleSupabaseError(error, "Failed to load testimonial translations"));
    return [];
  }
};

/**
 * Create a new testimonial with auto-translation
 */
export const createTestimonial = async (testimonial: { name: string; company: string | null; text: string; }) => {
  try {
    console.log("Creating new testimonial:", testimonial);
    
    // First, create the testimonial in English
    const sql = `
      INSERT INTO testimonials (name, company, text, language)
      VALUES (
        '${escapeSql(testimonial.name)}',
        ${testimonial.company ? `'${escapeSql(testimonial.company)}'` : 'NULL'},
        '${escapeSql(testimonial.text)}',
        'en'
      )
      RETURNING *
    `;
    
    const { data, error } = await runQuery<Testimonial>(sql);
    
    if (error) {
      console.error('Error creating testimonial:', error);
      toast.error(handleSupabaseError(error, "Failed to create testimonial"));
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("Failed to retrieve created testimonial");
    }
    
    console.log("Testimonial created successfully:", data[0]);
    
    // Clear cache to ensure fresh data on next fetch
    testimonialsCache = [];
    
    // Auto-translate the testimonial to other languages
    if (data && data.length > 0) {
      autoTranslateTestimonial(data[0].id, testimonial.text, testimonial.name);
    }
    
    return data[0];
  } catch (error) {
    console.error('Error creating testimonial:', error);
    toast.error(handleSupabaseError(error, "Failed to create testimonial"));
    throw error;
  }
};

/**
 * Update an existing testimonial with auto-translation
 */
export const updateTestimonial = async (id: string, updates: Partial<{ name: string; company: string | null; text: string; }>) => {
  try {
    const updateFields = Object.entries(updates)
      .map(([key, value]) => {
        if (value === null) {
          return `${key} = NULL`;
        } else if (typeof value === 'string') {
          return `${key} = '${escapeSql(value)}'`;
        }
        return `${key} = ${value}`;
      })
      .join(', ');
      
    const sql = `
      UPDATE testimonials
      SET ${updateFields}, updated_at = now()
      WHERE id = '${escapeSql(id)}'
      AND language = 'en'
      RETURNING *
    `;
    
    const { data, error } = await runQuery<Testimonial>(sql);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("Failed to update testimonial or testimonial not found");
    }
    
    // If text was updated, auto-translate to other languages
    if (updates.text) {
      autoTranslateTestimonial(id, updates.text, updates.name || '');
    }
    
    return data[0];
  } catch (error) {
    console.error('Error updating testimonial:', error);
    throw error;
  }
};

/**
 * Update a testimonial translation directly
 */
export const updateTestimonialTranslation = async (
  testimonialId: string,
  language: string, 
  updatedText: string
) => {
  try {
    const sql = `
      UPDATE testimonials_translations
      SET 
        text = '${escapeSql(updatedText)}',
        updated_at = now()
      WHERE testimonial_id = '${escapeSql(testimonialId)}'
      AND language = '${escapeSql(language)}'
      RETURNING *
    `;
    
    const { data, error } = await runQuery<TestimonialTranslation>(sql);
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error("Failed to update translation or translation not found");
    }
    
    toast.success(`${language === 'fr' ? 'French' : 'Spanish'} translation updated successfully`);
    return data[0];
  } catch (error) {
    console.error(`Error updating ${language} translation:`, error);
    toast.error(`Failed to update translation: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

/**
 * Delete a testimonial and its translations
 */
export const deleteTestimonial = async (id: string) => {
  try {
    // First delete translations
    const deleteTransSql = `
      DELETE FROM testimonials_translations
      WHERE testimonial_id = '${escapeSql(id)}'
    `;
      
    const { error: translationError } = await runQuery(deleteTransSql);
      
    if (translationError) {
      console.error('Error deleting testimonial translations:', translationError);
      // Continue with deleting the main testimonial even if translations deletion fails
    }
    
    // Then delete the main testimonial
    const deleteSql = `
      DELETE FROM testimonials
      WHERE id = '${escapeSql(id)}'
    `;
    
    const { error } = await runQuery(deleteSql);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    throw error;
  }
};

/**
 * Helper function to auto-translate testimonials
 */
const autoTranslateTestimonial = async (id: string, text: string, name: string) => {
  try {
    const languages = ['fr', 'es'];
    
    for (const lang of languages) {
      try {
        console.log(`Translating testimonial ${id} to ${lang}...`);
        // Create dummy content for translation API
        const dummyTitle = `Testimonial by ${name}`;
        const dummyExcerpt = "Testimonial excerpt";
        
        const translated = await translateBlogContent(
          text,
          dummyTitle,
          dummyExcerpt,
          lang as 'fr' | 'es'
        );
        
        // Update or create the translated testimonial
        const upsertSql = `
          INSERT INTO testimonials_translations (testimonial_id, language, text, updated_at)
          VALUES (
            '${escapeSql(id)}',
            '${escapeSql(lang)}',
            '${escapeSql(translated.content)}',
            now()
          )
          ON CONFLICT (testimonial_id, language)
          DO UPDATE SET
            text = '${escapeSql(translated.content)}',
            updated_at = now()
        `;
          
        const { error } = await runQuery(upsertSql);
          
        if (error) {
          console.error(`Error storing ${lang} translation:`, error);
          continue;
        }
        
        console.log(`Testimonial translated to ${lang} successfully`);
      } catch (error) {
        console.error(`Error translating testimonial to ${lang}:`, error);
      }
    }
  } catch (error) {
    console.error('Error in autoTranslateTestimonial:', error);
  }
};

/**
 * Clear the testimonials cache
 */
export const clearTestimonialsCache = (): void => {
  testimonialsCache = [];
  testimonialsCacheTimestamp = 0;
  console.log("Testimonials cache cleared");
};
