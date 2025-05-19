
import { checkTableExists, ensurePageContentTable, ensureTestimonialsTable } from '@/utils/sqlUtils';
import { toast } from 'sonner';

export const initDatabaseTables = async (): Promise<void> => {
  try {
    console.log("Initializing database tables...");

    // Ensure page_content table exists
    const pageContentTableCreated = await ensurePageContentTable();
    if (pageContentTableCreated) {
      console.log("Page content table initialized successfully");
    }
    
    // Ensure testimonials tables exist
    const testimonialsTablesCreated = await ensureTestimonialsTable();
    if (testimonialsTablesCreated) {
      console.log("Testimonials tables initialized successfully");
    }

    // If you're adding more tables, add them here
    
  } catch (error) {
    console.error("Error initializing database tables:", error);
    toast.error("Failed to initialize database tables");
  }
};

export default initDatabaseTables;
