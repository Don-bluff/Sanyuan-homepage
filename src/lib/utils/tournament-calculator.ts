import { TournamentTemplate, BlindLevel, TournamentInstance } from '@/types/tournament-template'

/**
 * 计算当前盲注级别
 */
export function calculateCurrentBlindLevel(
  template: TournamentTemplate,
  instance: TournamentInstance
): {
  currentLevel: number
  currentBlinds: BlindLevel | null
  minutesIntoLevel: number
  minutesUntilNextLevel: number
  isLateRegClosed: boolean
  minutesUntilLateRegClose?: number
} {
  const buyInTime = new Date(instance.buy_in_time).getTime()
  const now = Date.now()
  const minutesElapsed = Math.floor((now - buyInTime) / (1000 * 60))
  
  // 从买入级别开始计算，并考虑买入时该级别已经进行的时间
  const levelDuration = instance.level_duration
  const totalMinutes = minutesElapsed + instance.minutes_into_level
  
  // 计算经过了多少级别
  const levelsElapsed = Math.floor(totalMinutes / levelDuration)
  let currentLevel = instance.buy_in_level + levelsElapsed
  
  // 当前级别已经进行了多少分钟
  const minutesIntoLevel = totalMinutes % levelDuration
  const minutesUntilNextLevel = levelDuration - minutesIntoLevel
  
  // 获取当前盲注信息
  const currentBlinds = template.blind_structure.find(b => b.level === currentLevel) || null
  
  // 检查晚注册是否截止
  let isLateRegClosed = instance.late_reg_closed
  let minutesUntilLateRegClose: number | undefined
  
  if (!isLateRegClosed && instance.late_reg_time_left) {
    minutesUntilLateRegClose = instance.late_reg_time_left - minutesElapsed
    if (minutesUntilLateRegClose <= 0) {
      isLateRegClosed = true
      minutesUntilLateRegClose = undefined
    }
  }
  
  return {
    currentLevel,
    currentBlinds,
    minutesIntoLevel,
    minutesUntilNextLevel,
    isLateRegClosed,
    minutesUntilLateRegClose
  }
}

/**
 * 格式化时间（分钟 → 小时:分钟）
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 0) return '已结束'
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  
  if (hours > 0) {
    return `${hours}小时${mins}分钟`
  }
  return `${mins}分钟`
}

/**
 * 格式化倒计时
 */
export function formatCountdown(minutes: number): string {
  if (minutes < 0) return '已结束'
  if (minutes === 0) return '即将结束'
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = Math.floor((minutes * 60) % 60)
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * 获取盲注级别显示文本
 */
export function getBlindLevelText(blinds: BlindLevel | null): string {
  if (!blinds) return '未知'
  
  if (blinds.ante > 0) {
    return `${blinds.small_blind}/${blinds.big_blind}/${blinds.ante}`
  }
  return `${blinds.small_blind}/${blinds.big_blind}`
}

