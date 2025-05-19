
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { ensureContentBucket } from './blog/ensureBucket';
import { runQuery, escapeSql } from '@/components/admin/adminActions';

// Upload an image for a page section
export const uploadPageSectionImage = async (
  file: File, 
  pageName: string, 
  sectionName: string, 
  imageId: string
): Promise<string | null> => {
  try {
    // Ensure the bucket exists
    await ensureContentBucket();
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `page-images/${pageName}/${sectionName}/${imageId}-${uuidv4()}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('content')
      .getPublicUrl(filePath);
    
    // Update or insert the image record in the database using runQuery
    const sql = `
      INSERT INTO page_images (
        page, section_name, section_id, image_url, updated_at
      ) VALUES (
        '${escapeSql(pageName)}',
        '${escapeSql(sectionName)}',
        '${escapeSql(imageId)}',
        '${escapeSql(publicUrl)}',
        NOW()
      )
      ON CONFLICT (page, section_name, section_id)
      DO UPDATE SET
        image_url = EXCLUDED.image_url,
        updated_at = NOW()
    `;
    
    const { error: dbError } = await runQuery(sql);
    
    if (dbError) {
      console.error('Error saving image data to database:', dbError);
      toast.error('Failed to save image data to database');
      return null;
    }
    
    toast.success('Image uploaded successfully!');
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPageSectionImage:', error);
    toast.error('Failed to upload image');
    return null;
  }
};

// Get an image for a page section
export const getPageSectionImage = async (
  pageName: string,
  sectionName: string,
  imageId: string
): Promise<string | null> => {
  try {
    // Get the image record from the database using runQuery
    const sql = `
      SELECT image_url
      FROM page_images
      WHERE page = '${escapeSql(pageName)}'
      AND section_name = '${escapeSql(sectionName)}'
      AND section_id = '${escapeSql(imageId)}'
      LIMIT 1
    `;
    
    const { data, error } = await runQuery<{ image_url: string }>(sql);
    
    if (error) {
      console.error('Error fetching image:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      return data[0].image_url;
    }
    
    return null;
  } catch (error) {
    console.error('Error in getPageSectionImage:', error);
    return null;
  }
};

// Get all images for a page
export const getPageImages = async (
  pageName: string
): Promise<Record<string, string>> => {
  try {
    // Get all image records for the page from the database using runQuery
    const sql = `
      SELECT section_name, section_id, image_url
      FROM page_images
      WHERE page = '${escapeSql(pageName)}'
    `;
    
    const { data, error } = await runQuery<{ section_name: string, section_id: string, image_url: string }>(sql);
    
    if (error) {
      console.error('Error fetching page images:', error);
      return {};
    }
    
    // Convert the array of records to a dictionary
    const images: Record<string, string> = {};
    if (data) {
      data.forEach((record) => {
        const key = `${record.section_name}-${record.section_id}`;
        images[key] = record.image_url;
      });
    }
    
    return images;
  } catch (error) {
    console.error('Error in getPageImages:', error);
    return {};
  }
};
