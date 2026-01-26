export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)";
  };
  public: {
    Tables: {
      cart: {
        Row: {
          product_id: string;
          quantity: number;
          user_id: string;
        };
        Insert: {
          product_id: string;
          quantity?: number;
          user_id: string;
        };
        Update: {
          product_id?: string;
          quantity?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          id: number;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      order_products: {
        Row: {
          created_at: string;
          discount: number;
          discount_type: Database["public"]["Enums"]["discount_type_enum"];
          id: number;
          order_id: number;
          price_before_discount: number;
          product_id: string;
          quantity: number;
          wholesale_price: number;
        };
        Insert: {
          created_at?: string;
          discount: number;
          discount_type: Database["public"]["Enums"]["discount_type_enum"];
          id?: number;
          order_id: number;
          price_before_discount: number;
          product_id: string;
          quantity: number;
          wholesale_price?: number;
        };
        Update: {
          created_at?: string;
          discount?: number;
          discount_type?: Database["public"]["Enums"]["discount_type_enum"];
          id?: number;
          order_id?: number;
          price_before_discount?: number;
          product_id?: string;
          quantity?: number;
          wholesale_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          additional_info: string;
          address: string;
          cancel_reason: string;
          city: string;
          created_at: string;
          first_name: string;
          id: number;
          last_name: string;
          payment_method: Database["public"]["Enums"]["payment_method_enum"];
          phone_number: string;
          region: string;
          status: Database["public"]["Enums"]["status_type_enum"];
          total_price: number;
          user_id: string | null;
          wholesale_price: number;
        };
        Insert: {
          additional_info?: string;
          address?: string;
          cancel_reason?: string;
          city?: string;
          created_at?: string;
          first_name?: string;
          id?: number;
          last_name?: string;
          payment_method?: Database["public"]["Enums"]["payment_method_enum"];
          phone_number?: string;
          region?: string;
          status?: Database["public"]["Enums"]["status_type_enum"];
          total_price: number;
          user_id?: string | null;
          wholesale_price: number;
        };
        Update: {
          additional_info?: string;
          address?: string;
          cancel_reason?: string;
          city?: string;
          created_at?: string;
          first_name?: string;
          id?: number;
          last_name?: string;
          payment_method?: Database["public"]["Enums"]["payment_method_enum"];
          phone_number?: string;
          region?: string;
          status?: Database["public"]["Enums"]["status_type_enum"];
          total_price?: number;
          user_id?: string | null;
          wholesale_price?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          category_id: number;
          created_at: string;
          description: string;
          discount: number;
          discount_type: Database["public"]["Enums"]["discount_type_enum"];
          extra_images_urls: string[] | null;
          id: string;
          image_url: string | null;
          price: number;
          slug: string | null;
          stock: number;
          subtitle: string;
          title: string;
          wholesale_price: number;
        };
        Insert: {
          category_id: number;
          created_at?: string;
          description?: string;
          discount: number;
          discount_type?: Database["public"]["Enums"]["discount_type_enum"];
          extra_images_urls?: string[] | null;
          id?: string;
          image_url?: string | null;
          price: number;
          slug?: string | null;
          stock: number;
          subtitle?: string;
          title?: string;
          wholesale_price: number;
        };
        Update: {
          category_id?: number;
          created_at?: string;
          description?: string;
          discount?: number;
          discount_type?: Database["public"]["Enums"]["discount_type_enum"];
          extra_images_urls?: string[] | null;
          id?: string;
          image_url?: string | null;
          price?: number;
          slug?: string | null;
          stock?: number;
          subtitle?: string;
          title?: string;
          wholesale_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          default_language: Database["public"]["Enums"]["languages_enum"];
          email: string;
          is_admin: boolean;
          user_id: string;
        };
        Insert: {
          default_language?: Database["public"]["Enums"]["languages_enum"];
          email: string;
          is_admin?: boolean;
          user_id: string;
        };
        Update: {
          default_language?: Database["public"]["Enums"]["languages_enum"];
          email?: string;
          is_admin?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      wishlist: {
        Row: {
          created_at: string;
          product_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          product_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          product_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      discount_type_enum: "percentage" | "fixed";
      languages_enum: "en" | "fr" | "ar";
      payment_method_enum: "cash" | "online";
      status_type_enum: "pending" | "cancelled" | "fulfilled" | "approved";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      discount_type_enum: ["percentage", "fixed"],
      languages_enum: ["en", "fr", "ar"],
      payment_method_enum: ["cash", "online"],
      status_type_enum: ["pending", "cancelled", "fulfilled", "approved"],
    },
  },
} as const;
