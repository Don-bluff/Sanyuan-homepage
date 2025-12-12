import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase环境变量未配置，使用模拟客户端')
    return null as any // 返回模拟客户端
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}




