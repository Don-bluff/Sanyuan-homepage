import { supabase } from './client'
import { TournamentTemplate, BlindLevel, TournamentTemplateWithBlinds } from './database.types'

/**
 * 保存或更新比赛模板到数据库
 */
export async function saveTournamentTemplate(data: {
  name: string
  game_type: string
  buy_in?: number
  level_duration: number
  blind_levels: Array<{
    level_number: number
    small_blind: number
    big_blind: number
    ante: number
  }>
  info?: string
  source?: 'user' | 'gemini_ai' | 'preset'
}) {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      return { success: false, error: '用户未登录' }
    }

    const normalized_name = data.name.toLowerCase().trim()

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('tournament_templates')
      .select('id')
      .eq('normalized_name', normalized_name)
      .eq('created_by', user.id)
      .single()

    let templateId: string

    if (existing) {
      // 更新现有模板
      const { data: updated, error } = await supabase
        .from('tournament_templates')
        .update({
          name: data.name,
          game_type: data.game_type,
          buy_in: data.buy_in,
          level_duration: data.level_duration,
          info: data.info,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      templateId = existing.id

      // 删除旧的盲注级别
      await supabase
        .from('blind_levels')
        .delete()
        .eq('tournament_template_id', templateId)
    } else {
      // 创建新模板
      const { data: created, error } = await supabase
        .from('tournament_templates')
        .insert({
          name: data.name,
          normalized_name,
          game_type: data.game_type,
          buy_in: data.buy_in,
          level_duration: data.level_duration,
          info: data.info,
          source: data.source || 'user',
          created_by: user.id,
          is_public: false
        })
        .select()
        .single()

      if (error) throw error
      templateId = created.id
    }

    // 插入盲注级别
    if (data.blind_levels && data.blind_levels.length > 0) {
      const blindLevelsToInsert = data.blind_levels.map(level => ({
        tournament_template_id: templateId,
        level_number: level.level_number,
        small_blind: level.small_blind,
        big_blind: level.big_blind,
        ante: level.ante
      }))

      const { error: blindError } = await supabase
        .from('blind_levels')
        .insert(blindLevelsToInsert)

      if (blindError) throw blindError
    }

    return { success: true, templateId }
  } catch (error: any) {
    console.error('保存比赛模板失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 搜索比赛模板（从数据库）
 */
export async function searchTournamentTemplates(query: string): Promise<TournamentTemplateWithBlinds[]> {
  try {
    const normalized = query.toLowerCase().trim()

    const { data, error } = await supabase
      .from('tournament_templates')
      .select(`
        *,
        blind_levels (
          id,
          level_number,
          small_blind,
          big_blind,
          ante,
          duration_minutes
        )
      `)
      .or(`normalized_name.ilike.%${normalized}%,name.ilike.%${normalized}%`)
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(10)

    if (error) throw error

    return (data as any[]).map(template => ({
      ...template,
      blind_levels: (template.blind_levels || []).sort((a: any, b: any) => 
        a.level_number - b.level_number
      )
    }))
  } catch (error) {
    console.error('搜索比赛模板失败:', error)
    return []
  }
}

/**
 * 获取用户的比赛模板列表
 */
export async function getUserTournamentTemplates(): Promise<TournamentTemplateWithBlinds[]> {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []

    const { data, error } = await supabase
      .from('tournament_templates')
      .select(`
        *,
        blind_levels (
          id,
          level_number,
          small_blind,
          big_blind,
          ante,
          duration_minutes
        )
      `)
      .or(`created_by.eq.${user.id},is_public.eq.true`)
      .order('usage_count', { ascending: false })

    if (error) throw error

    return (data as any[]).map(template => ({
      ...template,
      blind_levels: (template.blind_levels || []).sort((a: any, b: any) => 
        a.level_number - b.level_number
      )
    }))
  } catch (error) {
    console.error('获取模板列表失败:', error)
    return []
  }
}

/**
 * 根据模板 ID 和级别号获取盲注信息
 */
export async function getBlindLevelByNumber(
  templateId: string,
  levelNumber: number
): Promise<BlindLevel | null> {
  try {
    const { data, error } = await supabase
      .from('blind_levels')
      .select('*')
      .eq('tournament_template_id', templateId)
      .eq('level_number', levelNumber)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('获取盲注级别失败:', error)
    return null
  }
}

/**
 * 获取模板的所有盲注级别
 */
export async function getBlindLevels(templateId: string): Promise<BlindLevel[]> {
  try {
    const { data, error } = await supabase
      .from('blind_levels')
      .select('*')
      .eq('tournament_template_id', templateId)
      .order('level_number', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('获取盲注级别列表失败:', error)
    return []
  }
}

/**
 * 增加模板使用次数
 */
export async function incrementTemplateUsage(templateId: string) {
  try {
    const { error } = await supabase.rpc('increment_template_usage', {
      p_template_id: templateId
    })

    if (error) throw error
  } catch (error) {
    console.error('更新使用次数失败:', error)
  }
}

/**
 * 创建用户比赛实例
 */
export async function createUserTournament(data: {
  tournament_template_id?: string
  name: string
  game_type: string
  max_players: number
  buy_in_level: number
  current_small_blind: number
  current_big_blind: number
  current_ante: number
  level_duration: number
  time_left_in_level?: number
  buy_in_amount?: number
}) {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) {
      throw new Error('用户未登录')
    }

    const { data: tournament, error } = await supabase
      .from('user_tournaments')
      .insert({
        user_id: user.id,
        tournament_template_id: data.tournament_template_id,
        name: data.name,
        game_type: data.game_type,
        max_players: data.max_players,
        buy_in_level: data.buy_in_level,
        current_small_blind: data.current_small_blind,
        current_big_blind: data.current_big_blind,
        current_ante: data.current_ante,
        level_duration: data.level_duration,
        time_left_in_level: data.time_left_in_level,
        buy_in_amount: data.buy_in_amount,
        status: 'active'
      })
      .select()
      .single()

    if (error) throw error

    // 增加模板使用次数
    if (data.tournament_template_id) {
      await incrementTemplateUsage(data.tournament_template_id)
    }

    return { success: true, tournament }
  } catch (error: any) {
    console.error('创建比赛实例失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 获取用户的比赛列表
 */
export async function getUserTournaments(status?: 'active' | 'finished') {
  try {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return []

    let query = supabase
      .from('user_tournaments')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('获取比赛列表失败:', error)
    return []
  }
}

/**
 * 完成比赛
 */
export async function finishTournament(
  tournamentId: string,
  data: {
    total_entries: number
    finish_position: number
    cash_out_amount?: number
  }
) {
  try {
    const { error } = await supabase
      .from('user_tournaments')
      .update({
        status: 'finished',
        total_entries: data.total_entries,
        finish_position: data.finish_position,
        cash_out_amount: data.cash_out_amount,
        finished_at: new Date().toISOString()
      })
      .eq('id', tournamentId)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('完成比赛失败:', error)
    return { success: false, error: error.message }
  }
}
