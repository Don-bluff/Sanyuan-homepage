import { createClient } from '@supabase/supabase-js'
import { HandRecord } from '@/types/poker'

// 创建新的手牌记录
export async function createHandRecord(record: Partial<HandRecord>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Supabase未配置，模拟保存:', record)
    return { id: Date.now().toString(), ...record }
  }
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('hand_records')
    .insert({
      ...record,
      hero_cards: JSON.stringify(record.hero_cards),
      players: JSON.stringify(record.players),
      actions: record.actions ? JSON.stringify(record.actions) : null,
      board_cards: record.board_cards ? JSON.stringify(record.board_cards) : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating hand record:', error)
    throw error
  }

  return data
}

// 获取所有手牌记录
export async function getHandRecords() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('Supabase未配置，返回空数据')
    return []
  }

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const { data, error } = await supabase
    .from('hand_records')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching hand records:', error)
    throw error
  }

  // 解析JSON字段
  return data.map((record: any) => ({
    ...record,
    hero_cards: JSON.parse(record.hero_cards),
    players: JSON.parse(record.players),
    actions: record.actions ? JSON.parse(record.actions) : null,
    board_cards: record.board_cards ? JSON.parse(record.board_cards) : null,
  }))
}

// 获取单个手牌记录
export async function getHandRecord(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration not found')
  }
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data, error } = await supabase
    .from('hand_records')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching hand record:', error)
    throw error
  }

  // 解析JSON字段
  return {
    ...data,
    hero_cards: JSON.parse(data.hero_cards),
    players: JSON.parse(data.players),
    actions: data.actions ? JSON.parse(data.actions) : null,
    board_cards: data.board_cards ? JSON.parse(data.board_cards) : null,
  }
}

// 更新手牌记录
export async function updateHandRecord(id: string, updates: Partial<HandRecord>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration not found')
  }
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data, error } = await supabase
    .from('hand_records')
    .update({
      ...updates,
      hero_cards: updates.hero_cards ? JSON.stringify(updates.hero_cards) : undefined,
      players: updates.players ? JSON.stringify(updates.players) : undefined,
      actions: updates.actions ? JSON.stringify(updates.actions) : undefined,
      board_cards: updates.board_cards ? JSON.stringify(updates.board_cards) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating hand record:', error)
    throw error
  }

  return data
}

// 删除手牌记录
export async function deleteHandRecord(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration not found')
  }
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { error } = await supabase
    .from('hand_records')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting hand record:', error)
    throw error
  }

  return true
}
