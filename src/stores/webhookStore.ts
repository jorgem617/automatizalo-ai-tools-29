
import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { runQuery, escapeSql } from "@/components/admin/adminActions";

export type WebhookMode = "test" | "production";
export type RequestMethod = "POST" | "GET";

interface WebhookState {
  // Blog post creation webhook
  blogCreationUrl: {
    test: string;
    production: string;
    mode: WebhookMode;
    method: RequestMethod;
  };
  // Blog status change webhook (social media)
  blogSocialShareUrl: {
    test: string;
    production: string;
    mode: WebhookMode;
    method: RequestMethod;
  };
  // Website domain for correct link generation
  websiteDomain: string;
  // Flag to track if store has been initialized
  isInitialized: boolean;
  // Config ID from database
  configId: string | null;
  
  // Actions
  updateBlogCreationUrl: (params: { 
    test?: string; 
    production?: string;
    mode?: WebhookMode;
    method?: RequestMethod;
  }) => Promise<void>;
  updateBlogSocialShareUrl: (params: { 
    test?: string; 
    production?: string;
    mode?: WebhookMode;
    method?: RequestMethod;
  }) => Promise<void>;
  updateWebsiteDomain: (domain: string) => Promise<void>;
  
  // Helper to get active URLs
  getActiveBlogCreationUrl: () => string;
  getActiveBlogSocialShareUrl: () => string;
  
  // Helper to get active request methods
  getActiveBlogCreationMethod: () => RequestMethod;
  getActiveBlogSocialShareMethod: () => RequestMethod;
  
  // Helper to get website domain
  getWebsiteDomain: () => string;
  
  // Helper to check if webhooks are configured
  isBlogSocialShareConfigured: () => boolean;
  isBlogCreationConfigured: () => boolean;

  // Initialize store from Supabase
  initializeFromSupabase: () => Promise<void>;
}

export const useWebhookStore = create<WebhookState>()((set, get) => ({
  blogCreationUrl: {
    test: "",
    production: "",
    mode: "production",
    method: "POST"
  },
  blogSocialShareUrl: {
    test: "",
    production: "",
    mode: "test",
    method: "GET"
  },
  websiteDomain: "",
  isInitialized: false,
  configId: null,
  
  initializeFromSupabase: async () => {
    try {
      // Skip if already initialized
      if (get().isInitialized && get().configId) {
        console.log('Webhook store already initialized');
        return;
      }
      
      console.log('Initializing webhook store from Supabase');
      
      const sql = `
        SELECT * FROM webhook_configs
        LIMIT 1
      `;
      
      const { data, error } = await runQuery(sql);

      if (error) {
        console.error('Error fetching webhook configs:', error);
        
        // If no configs exist, create a default one
        if (error.code === 'PGRST116' || data?.length === 0) {
          console.log('No webhook configs found, creating default');
          
          const insertSql = `
            INSERT INTO webhook_configs (
              name,
              type,
              test_url,
              production_url,
              current_mode,
              method
            )
            VALUES (
              'Blog Creation Webhook',
              'blog_creation',
              'https://webhook.site/your-test-webhook',
              'https://webhook.site/your-production-webhook',
              'production',
              'POST'
            )
            RETURNING *
          `;
          
          const { data: newConfig, error: insertError } = await runQuery(insertSql);
          
          if (insertError) {
            console.error('Error creating default webhook config:', insertError);
            return;
          }
          
          if (newConfig && newConfig.length > 0) {
            console.log('Created default webhook config:', newConfig[0]);
            set({
              blogCreationUrl: {
                test: newConfig[0].test_url,
                production: newConfig[0].production_url,
                mode: newConfig[0].current_mode,
                method: newConfig[0].method
              },
              blogSocialShareUrl: {
                test: '',
                production: '',
                mode: 'test',
                method: 'GET'
              },
              websiteDomain: 'https://automatizalo.co',
              isInitialized: true,
              configId: newConfig[0].id
            });
            
            // Create social share webhook too
            const socialShareSql = `
              INSERT INTO webhook_configs (
                name,
                type,
                test_url,
                production_url,
                current_mode,
                method
              )
              VALUES (
                'Blog Social Share Webhook',
                'blog_social',
                'https://webhook.site/your-test-social-webhook',
                'https://webhook.site/your-production-social-webhook',
                'test',
                'GET'
              )
            `;
            
            await runQuery(socialShareSql);
          }
        }
        return;
      }

      if (data && data.length > 0) {
        // Get both blog creation and social webhooks
        const blogCreationWebhook = data.find((webhook: any) => webhook.type === 'blog_creation') || data[0];
        
        const socialShareSql = `
          SELECT * FROM webhook_configs
          WHERE type = 'blog_social'
          LIMIT 1
        `;
        
        const { data: socialData } = await runQuery(socialShareSql);
        const blogSocialWebhook = socialData && socialData.length > 0 ? socialData[0] : null;
        
        console.log('Webhook configs loaded:', { blogCreationWebhook, blogSocialWebhook });
        
        set({
          blogCreationUrl: {
            test: blogCreationWebhook.test_url || '',
            production: blogCreationWebhook.production_url || '',
            mode: blogCreationWebhook.current_mode || 'production',
            method: blogCreationWebhook.method || 'POST'
          },
          blogSocialShareUrl: {
            test: blogSocialWebhook?.test_url || '',
            production: blogSocialWebhook?.production_url || '',
            mode: blogSocialWebhook?.current_mode || 'test',
            method: blogSocialWebhook?.method || 'GET'
          },
          websiteDomain: 'https://automatizalo.co',
          isInitialized: true,
          configId: blogCreationWebhook.id
        });
      }
    } catch (error) {
      console.error('Error initializing webhook store:', error);
    }
  },
  
  updateBlogCreationUrl: async (params) => {
    console.log("Updating blog creation URL with params:", params);
    
    const currentState = get();
    const updatedBlogCreationUrl = {
      ...currentState.blogCreationUrl,
      ...(params.test !== undefined ? { test: params.test } : {}),
      ...(params.production !== undefined ? { production: params.production } : {}),
      ...(params.mode !== undefined ? { mode: params.mode } : {}),
      ...(params.method !== undefined ? { method: params.method } : {})
    };

    // Update local state
    set({ blogCreationUrl: updatedBlogCreationUrl });

    // Make sure we have a config ID before updating Supabase
    if (!currentState.configId) {
      console.error('No config ID available, cannot update Supabase');
      await get().initializeFromSupabase();
    }
    
    try {
      // Update Supabase using the correct field names
      const updateSql = `
        UPDATE webhook_configs
        SET 
          test_url = '${escapeSql(updatedBlogCreationUrl.test)}',
          production_url = '${escapeSql(updatedBlogCreationUrl.production)}',
          current_mode = '${escapeSql(updatedBlogCreationUrl.mode)}',
          method = '${escapeSql(updatedBlogCreationUrl.method)}'
        WHERE id = '${escapeSql(get().configId || '')}' AND type = 'blog_creation'
      `;
      
      const { error } = await runQuery(updateSql);

      if (error) {
        console.error('Error updating blog creation URL:', error);
        toast.error('Failed to save webhook settings to database');
      }
    } catch (error) {
      console.error('Unexpected error updating blog creation URL:', error);
      toast.error('Unexpected error saving settings');
    }
  },
    
  updateBlogSocialShareUrl: async (params) => {
    console.log("Updating blog social share URL with params:", params);
    
    const currentState = get();
    const updatedBlogSocialShareUrl = {
      ...currentState.blogSocialShareUrl,
      ...(params.test !== undefined ? { test: params.test } : {}),
      ...(params.production !== undefined ? { production: params.production } : {}),
      ...(params.mode !== undefined ? { mode: params.mode } : {}),
      ...(params.method !== undefined ? { method: params.method } : {})
    };

    // Update local state
    set({ blogSocialShareUrl: updatedBlogSocialShareUrl });

    // Make sure we have a config ID before updating Supabase
    if (!currentState.configId) {
      console.error('No config ID available, cannot update Supabase');
      await get().initializeFromSupabase();
    }
    
    try {
      // Update Supabase using the correct field names
      const updateSql = `
        UPDATE webhook_configs
        SET 
          test_url = '${escapeSql(updatedBlogSocialShareUrl.test)}',
          production_url = '${escapeSql(updatedBlogSocialShareUrl.production)}',
          current_mode = '${escapeSql(updatedBlogSocialShareUrl.mode)}',
          method = '${escapeSql(updatedBlogSocialShareUrl.method)}'
        WHERE id = '${escapeSql(get().configId || '')}' AND type = 'blog_social'
      `;
      
      const { error } = await runQuery(updateSql);

      if (error) {
        console.error('Error updating blog social share URL:', error);
        toast.error('Failed to save webhook settings to database');
      }
    } catch (error) {
      console.error('Unexpected error updating blog social URL:', error);
      toast.error('Unexpected error saving settings');
    }
  },
  
  updateWebsiteDomain: async (domain) => {
    console.log("Updating website domain to:", domain);
    
    // Update local state
    set({ websiteDomain: domain });

    // Make sure we have a config ID before updating Supabase
    const currentState = get();
    if (!currentState.configId) {
      console.error('No config ID available, cannot update Supabase');
      await get().initializeFromSupabase();
    }
    
    try {
      // Create a special metadata entry for the website domain
      const checkSql = `
        SELECT * FROM webhook_configs 
        WHERE type = 'website_domain'
        LIMIT 1
      `;
      
      const { data, error: checkError } = await runQuery(checkSql);
      
      if (checkError) {
        console.error('Error checking for domain config:', checkError);
      }
      
      if (data && data.length > 0) {
        // Update existing domain entry
        const updateSql = `
          UPDATE webhook_configs
          SET 
            production_url = '${escapeSql(domain)}'
          WHERE type = 'website_domain'
        `;
        
        const { error } = await runQuery(updateSql);
        if (error) {
          console.error('Error updating website domain:', error);
          toast.error('Failed to save domain setting to database');
        }
      } else {
        // Create new domain entry
        const insertSql = `
          INSERT INTO webhook_configs (
            name,
            type,
            production_url
          )
          VALUES (
            'Website Domain',
            'website_domain',
            '${escapeSql(domain)}'
          )
        `;
        
        const { error } = await runQuery(insertSql);
        if (error) {
          console.error('Error creating website domain entry:', error);
          toast.error('Failed to save domain setting to database');
        }
      }
    } catch (error) {
      console.error('Unexpected error updating website domain:', error);
      toast.error('Unexpected error saving domain');
    }
  },
  
  getActiveBlogCreationUrl: () => {
    const { blogCreationUrl } = get();
    return blogCreationUrl.mode === "production" 
      ? blogCreationUrl.production 
      : blogCreationUrl.test;
  },
  
  getActiveBlogSocialShareUrl: () => {
    const { blogSocialShareUrl } = get();
    return blogSocialShareUrl.mode === "production" 
      ? blogSocialShareUrl.production 
      : blogSocialShareUrl.test;
  },
  
  getActiveBlogCreationMethod: () => {
    const { blogCreationUrl } = get();
    return blogCreationUrl.method;
  },
  
  getActiveBlogSocialShareMethod: () => {
    const { blogSocialShareUrl } = get();
    return blogSocialShareUrl.method;
  },
  
  getWebsiteDomain: () => {
    const { websiteDomain } = get();
    return websiteDomain;
  },
  
  isBlogSocialShareConfigured: () => {
    const { blogSocialShareUrl } = get();
    const activeUrl = blogSocialShareUrl.mode === "production" 
      ? blogSocialShareUrl.production 
      : blogSocialShareUrl.test;
    return !!activeUrl && activeUrl.trim() !== '';
  },
  
  isBlogCreationConfigured: () => {
    const { blogCreationUrl } = get();
    const activeUrl = blogCreationUrl.mode === "production" 
      ? blogCreationUrl.production 
      : blogCreationUrl.test;
    return !!activeUrl && activeUrl.trim() !== '';
  }
}));
