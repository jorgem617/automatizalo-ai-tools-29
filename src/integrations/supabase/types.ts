export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      automations: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          has_custom_prompt: boolean | null
          has_form_integration: boolean | null
          has_table_integration: boolean | null
          has_webhook: boolean | null
          id: string
          image_url: string | null
          installation_price: number | null
          monthly_price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          has_custom_prompt?: boolean | null
          has_form_integration?: boolean | null
          has_table_integration?: boolean | null
          has_webhook?: boolean | null
          id?: string
          image_url?: string | null
          installation_price?: number | null
          monthly_price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          has_custom_prompt?: boolean | null
          has_form_integration?: boolean | null
          has_table_integration?: boolean | null
          has_webhook?: boolean | null
          id?: string
          image_url?: string | null
          installation_price?: number | null
          monthly_price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_translations: {
        Row: {
          blog_post_id: string
          content: string
          excerpt: string | null
          language: string
          title: string
        }
        Insert: {
          blog_post_id: string
          content: string
          excerpt?: string | null
          language: string
          title: string
        }
        Update: {
          blog_post_id?: string
          content?: string
          excerpt?: string | null
          language?: string
          title?: string
        }
        Relationships: []
      }
      client_automations: {
        Row: {
          automation_id: string
          client_id: string
          created_at: string | null
          id: string
          next_billing_date: string
          purchase_date: string
          setup_status: string
          status: string
          updated_at: string | null
        }
        Insert: {
          automation_id: string
          client_id: string
          created_at?: string | null
          id?: string
          next_billing_date?: string
          purchase_date?: string
          setup_status?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          automation_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          next_billing_date?: string
          purchase_date?: string
          setup_status?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_integration_settings: {
        Row: {
          client_automation_id: string
          created_at: string | null
          id: string
          integration_code: string | null
          integration_type: string
          last_updated_by: string | null
          production_url: string | null
          prompt_text: string | null
          status: string
          test_url: string | null
          updated_at: string | null
        }
        Insert: {
          client_automation_id: string
          created_at?: string | null
          id?: string
          integration_code?: string | null
          integration_type: string
          last_updated_by?: string | null
          production_url?: string | null
          prompt_text?: string | null
          status?: string
          test_url?: string | null
          updated_at?: string | null
        }
        Update: {
          client_automation_id?: string
          created_at?: string | null
          id?: string
          integration_code?: string | null
          integration_type?: string
          last_updated_by?: string | null
          production_url?: string | null
          prompt_text?: string | null
          status?: string
          test_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_integration_settings_client_automation_id_fkey"
            columns: ["client_automation_id"]
            isOneToOne: false
            referencedRelation: "client_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_info: {
        Row: {
          address: string
          created_at: string | null
          email: string
          id: string
          phone: string
          updated_at: string | null
          website: string
        }
        Insert: {
          address: string
          created_at?: string | null
          email: string
          id?: string
          phone: string
          updated_at?: string | null
          website: string
        }
        Update: {
          address?: string
          created_at?: string | null
          email?: string
          id?: string
          phone?: string
          updated_at?: string | null
          website?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          page: string
          section_name: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string
          page: string
          section_name: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          page?: string
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          automation_id: string
          client_id: string
          created_at: string | null
          description: string
          id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          automation_id: string
          client_id: string
          created_at?: string | null
          description: string
          id?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          automation_id?: string
          client_id?: string
          created_at?: string | null
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          company: string | null
          created_at: string
          id: string
          language: string
          name: string
          text: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          language?: string
          name: string
          text: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          language?: string
          name?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      testimonials_translations: {
        Row: {
          created_at: string
          id: string
          language: string
          testimonial_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          testimonial_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          testimonial_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_translations_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_configs: {
        Row: {
          created_at: string
          current_mode: string
          id: string
          method: string
          name: string
          production_url: string | null
          test_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_mode?: string
          id?: string
          method?: string
          name: string
          production_url?: string | null
          test_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_mode?: string
          id?: string
          method?: string
          name?: string
          production_url?: string | null
          test_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
