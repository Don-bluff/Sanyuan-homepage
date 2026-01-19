// 德州扑克相关类型定义

export type GameType = '6max' | '9max' | 'custom'
export type BlindMode = 'chips' | 'bb'
export type PokerSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type PokerRank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'
export type PokerPosition = 'UTG' | 'UTG+1' | 'UTG+2' | 'MP' | 'MP+1' | 'CO' | 'BTN' | 'SB' | 'BB'

export interface PokerCard {
  rank: PokerRank
  suit: PokerSuit
}

export interface Player {
  id: string
  name?: string
  position: PokerPosition
  stack: number
}

export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'bet' | 'allin'
export type Street = 'preflop' | 'flop' | 'turn' | 'river'

// 单个决策
export interface ActionDecision {
  action: ActionType
  amount?: number
}

export interface Action {
  id: string
  street: Street
  position: PokerPosition
  stack: number
  action: ActionType
  amount?: number
  is_hero: boolean
  hero_cards?: PokerCard[]  // 改为数组，支持0-2张牌
  description?: string
  decisions?: ActionDecision[]  // 多轮决策
}

export interface StreetCards {
  flop?: [PokerCard?, PokerCard?, PokerCard?]
  turn?: PokerCard
  river?: PokerCard
}

export interface Tournament {
  id: string
  created_at: string
  user_id?: string
  name: string
  game_type: GameType
  max_players: number
  blind_mode: BlindMode
  small_blind: number
  big_blind: number
  ante?: number
  status: 'active' | 'finished'
  hand_count?: number
  buy_in?: number  // 买入金额
  starting_stack?: number  // 起始筹码
  starting_bb?: number  // 起始BB数（筹码/大盲）
  buy_in_level?: number  // 买入时的盲注级别
  level_duration?: number  // 升盲时间（分钟/级）
  minutes_into_level?: number  // 买入时该级别已进行时间（分钟）
  late_reg_minutes_left?: number  // 截止买入还剩时间（分钟）
  cash_out?: number  // Cash out金额
  total_entries?: number  // 总买入人数
  finish_position?: number  // 实际名次
  hand_ids?: string[]  // 关联的手牌ID
}

export interface HandRecord {
  id: string
  created_at: string
  updated_at: string
  user_id: string
  
  // 比赛信息
  tournament_name: string
  game_type: GameType
  max_players: number
  
  // 盲注信息
  blind_mode: BlindMode
  small_blind: number
  big_blind: number
  ante?: number
  
  // Hero信息
  hero_cards: [PokerCard, PokerCard]
  hero_stack: number
  hero_position: PokerPosition
  
  // 玩家信息
  total_players: number
  players: Player[]
  
  // 后续扩展字段
  actions?: any[]
  pot?: number
  board_cards?: PokerCard[]
  result?: 'win' | 'lose' | 'split'
  net_result?: number
}

// Supabase数据库表结构
export interface Database {
  public: {
    Tables: {
      hand_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          tournament_name: string
          game_type: GameType
          max_players: number
          blind_mode: BlindMode
          small_blind: number
          big_blind: number
          ante: number | null
          hero_cards: string // JSON string
          hero_stack: number
          hero_position: PokerPosition
          total_players: number
          players: string // JSON string
          actions: string | null
          pot: number | null
          board_cards: string | null
          result: string | null
          net_result: number | null
        }
        Insert: {
          id?: string
          user_id: string
          tournament_name: string
          game_type: GameType
          max_players: number
          blind_mode: BlindMode
          small_blind: number
          big_blind: number
          ante?: number | null
          hero_cards: string
          hero_stack: number
          hero_position: PokerPosition
          total_players: number
          players: string
          actions?: string | null
          pot?: number | null
          board_cards?: string | null
          result?: string | null
          net_result?: number | null
        }
        Update: {
          tournament_name?: string
          game_type?: GameType
          max_players?: number
          blind_mode?: BlindMode
          small_blind?: number
          big_blind?: number
          ante?: number | null
          hero_cards?: string
          hero_stack?: number
          hero_position?: PokerPosition
          total_players?: number
          players?: string
          actions?: string | null
          pot?: number | null
          board_cards?: string | null
          result?: string | null
          net_result?: number | null
        }
      }
    }
  }
}



