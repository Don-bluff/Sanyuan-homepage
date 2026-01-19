// Supabase 数据库类型定义

export interface TournamentTemplate {
  id: string
  name: string
  normalized_name: string
  game_type: 'sixmax' | 'ninemax' | 'custom'
  buy_in?: number
  level_duration: number
  info?: string
  source: 'user' | 'gemini_ai' | 'preset'
  created_by?: string
  created_at: string
  updated_at: string
  usage_count: number
  is_public: boolean
}

export interface BlindLevel {
  id: string
  tournament_template_id: string
  level_number: number
  small_blind: number
  big_blind: number
  ante: number
  duration_minutes?: number
}

export interface TournamentTemplateWithBlinds extends TournamentTemplate {
  blind_levels: BlindLevel[]
}

export interface UserTournament {
  id: string
  user_id: string
  tournament_template_id?: string
  name: string
  game_type: 'sixmax' | 'ninemax' | 'custom'
  max_players: number
  
  // 买入时的盲注信息
  buy_in_level: number
  current_small_blind: number
  current_big_blind: number
  current_ante: number
  level_duration: number
  time_left_in_level?: number
  
  // 财务信息
  buy_in_amount?: number
  cash_out_amount?: number
  
  // 比赛进度
  status: 'active' | 'finished'
  total_entries?: number
  finish_position?: number
  
  // 时间戳
  started_at: string
  finished_at?: string
  created_at: string
  updated_at: string
}

export interface HandRecord {
  id: string
  user_id: string
  user_tournament_id?: string
  tournament_name?: string
  game_type?: string
  small_blind?: number
  big_blind?: number
  ante?: number
  hero_position?: string
  hero_cards?: any
  preflop_actions?: any
  flop_actions?: any
  flop_cards?: any
  turn_actions?: any
  turn_card?: any
  river_actions?: any
  river_card?: any
  notes?: string
  tags?: string[]
  created_at: string
  updated_at: string
}
