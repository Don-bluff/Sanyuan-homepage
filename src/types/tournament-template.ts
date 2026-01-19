/**
 * 比赛模板 - 存储比赛的盲注结构（可复用）
 */
export interface TournamentTemplate {
  id: string
  name: string  // 比赛名称，如：WSOP Main Event
  created_at: string
  
  // 盲注结构
  blind_structure: BlindLevel[]  // 完整的盲注结构
  level_duration: number  // 升盲时间（分钟）
  
  // 晚注册信息
  late_reg_end_level?: number  // 晚注册截止级别（如：Level 8）
  
  // 其他信息
  buy_in?: number  // 标准买入金额
  starting_stack?: number  // 标准起始筹码
  info?: string  // 比赛说明
  
  // 来源
  source: 'ai' | 'manual' | 'preset'  // ai搜索、手动创建、预设
}

/**
 * 单个盲注级别
 */
export interface BlindLevel {
  level: number  // 级别，如：1, 2, 3
  small_blind: number
  big_blind: number
  ante: number
  duration?: number  // 该级别持续时间（分钟），如果不同于默认
}

/**
 * 比赛实例 - 用户参与的具体比赛
 */
export interface TournamentInstance {
  id: string
  created_at: string
  user_id?: string
  
  // 关联模板
  template_id: string  // 关联的比赛模板
  template_name: string  // 比赛名称（冗余字段，方便显示）
  
  // 买入时的快照信息
  buy_in_time: string  // 买入时间（ISO格式）
  buy_in_level: number  // 买入时的盲注级别
  buy_in_stack: number  // 买入时的筹码
  level_duration: number  // 升盲时间（分钟/级）
  minutes_into_level: number  // 买入时该级别已进行的时间（分钟）
  
  // 晚注册信息
  late_reg_closed: boolean  // 是否已截止买入
  late_reg_time_left?: number  // 买入时还剩多少分钟截止（用于倒计时）
  late_reg_closed_at?: string  // 截止买入的时间
  
  // 比赛状态
  status: 'active' | 'finished'
  
  // 结算信息
  finish_position?: number
  cash_out?: number
  total_entries?: number
  
  // 关联的手牌
  hand_ids?: string[]
}

