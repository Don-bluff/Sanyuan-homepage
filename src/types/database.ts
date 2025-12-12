// Supabase数据库类型定义

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          username: string | null
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          title: string
          content: string
          author_id: string
          published: boolean
        }
        Insert: {
          title: string
          content: string
          author_id: string
          published?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          published?: boolean
        }
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
  }
}

// 便捷类型别名
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type InsertProfile = Database['public']['Tables']['profiles']['Insert']
export type UpdateProfile = Database['public']['Tables']['profiles']['Update']
export type InsertPost = Database['public']['Tables']['posts']['Insert']
export type UpdatePost = Database['public']['Tables']['posts']['Update']





