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
      projects: {
        Row: {
          category: Database["public"]["Enums"]["project_category"]
          created_at: string
          description: string
          github_url: string | null
          id: string
          image_url: string
          live_url: string
          order: number
          status: Database["public"]["Enums"]["project_status"]
          technologies: string[]
          title: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["project_category"]
          created_at?: string
          description: string
          github_url?: string | null
          id?: string
          image_url: string
          live_url: string
          order?: number
          status?: Database["public"]["Enums"]["project_status"]
          technologies?: string[]
          title: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["project_category"]
          created_at?: string
          description?: string
          github_url?: string | null
          id?: string
          image_url?: string
          live_url?: string
          order?: number
          status?: Database["public"]["Enums"]["project_status"]
          technologies?: string[]
          title?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          color: string | null
          created_at: string
          icon: string | null
          id: number
          items: string[] | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          items?: string[] | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: number
          items?: string[] | null
        }
        Relationships: []
      }
      user: {
        Row: {
          about: string[] | null
          email: string | null
          github: string | null
          id: number
          image_url: string | null
          linkedin: string | null
        }
        Insert: {
          about?: string[] | null
          email?: string | null
          github?: string | null
          id?: number
          image_url?: string | null
          linkedin?: string | null
        }
        Update: {
          about?: string[] | null
          email?: string | null
          github?: string | null
          id?: number
          image_url?: string | null
          linkedin?: string | null
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
      project_category: "frontend" | "fullstack"
      project_status: "completed" | "in-progress" | "featured"
      project_type: "web" | "mobile"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
