import { supabase } from './client'

/**
 * 实时搜索比赛模板（用于自动补全）
 */
export async function searchTournamentSuggestions(query: string, limit: number = 10) {
  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    const normalized = query.toLowerCase().trim()

    // 搜索公开的模板
    const { data, error } = await supabase
      .from('tournament_templates')
      .select('id, name, info, buy_in, level_duration, usage_count')
      .or(`normalized_name.ilike.%${normalized}%,name.ilike.%${normalized}%`)
      .eq('is_public', true)
      .order('usage_count', { ascending: false })
      .limit(limit)

    if (error) {
      // 静默处理数据库错误（如表不存在、权限问题等）
      // 应用会回退到本地建议
      return []
    }

    return data || []
  } catch (error) {
    // 静默处理错误，回退到本地建议
    return []
  }
}

/**
 * 常见比赛关键词和别名
 */
export const COMMON_TOURNAMENTS = [
  {
    name: 'WSOP Main Event',
    aliases: ['wsop main', 'world series main', 'wsop主赛'],
    category: '国际赛事'
  },
  {
    name: 'WSOP Event (标准赛事)',
    aliases: ['wsop event', 'wsop #'],
    category: 'WSOP 赛事'
  },
  {
    name: 'WSOP FREEZEOUT',
    aliases: ['wsop freezeout', 'wsop freeze out', 'freeze'],
    category: 'WSOP 赛事'
  },
  {
    name: 'WSOP TURBO',
    aliases: ['wsop turbo', 'wsop 快速'],
    category: 'WSOP 赛事'
  },
  {
    name: 'WPT Main Event',
    aliases: ['wpt main', 'world poker tour', 'wpt主赛'],
    category: '国际赛事'
  },
  {
    name: 'EPT Main Event',
    aliases: ['ept main', 'european poker tour', 'ept主赛'],
    category: '欧洲赛事'
  },
  {
    name: 'APPT Main Event',
    aliases: ['appt main', 'asia pacific poker tour', 'appt主赛'],
    category: '亚洲赛事'
  },
  {
    name: 'PokerStars Sunday Million',
    aliases: ['pokerstars sunday', 'sunday million', 'ps sunday'],
    category: '在线平台'
  },
  {
    name: 'GGPoker High Roller',
    aliases: ['ggpoker high', 'gg high roller', 'gg豪客赛'],
    category: '在线平台'
  },
  {
    name: '澳门红龙杯',
    aliases: ['红龙', 'red dragon', 'macau'],
    category: '中文赛事'
  },
  {
    name: '三亚扑克锦标赛',
    aliases: ['三亚', 'sanya'],
    category: '中文赛事'
  }
]

/**
 * 根据关键词获取本地建议（支持智能匹配和评分排序）
 */
export function getLocalSuggestions(query: string): typeof COMMON_TOURNAMENTS {
  if (!query || query.trim().length < 2) {
    return []
  }

  const normalized = query.toLowerCase().trim()

  // 为每个比赛计算匹配分数
  const scoredTournaments = COMMON_TOURNAMENTS.map(tournament => {
    let score = 0
    const tournamentName = tournament.name.toLowerCase()
    
    // 1. 精确匹配（最高分）
    if (tournamentName === normalized) {
      score = 1000
    } else if (tournament.aliases.some(alias => alias.toLowerCase() === normalized)) {
      score = 900
    }
    // 2. 查询词包含完整别名（说明别名是查询的一部分，高优先级）
    else {
      const matchingAliases = tournament.aliases.filter(alias => {
        const aliasLower = alias.toLowerCase()
        return normalized.includes(aliasLower)
      })
      
      if (matchingAliases.length > 0) {
        // 使用最长的匹配别名来计算分数
        const longestAlias = matchingAliases.reduce((a, b) => 
          a.length > b.length ? a : b
        )
        // 匹配的别名越长，说明越精确
        score = 600 + longestAlias.length * 10
      }
      // 3. 完整包含查询词（名称包含查询）
      else if (tournamentName.includes(normalized)) {
        score = 500
      }
      // 4. 别名包含查询词（别名包含查询，但查询不包含别名）
      else if (tournament.aliases.some(alias => alias.toLowerCase().includes(normalized))) {
        const aliasScores = tournament.aliases
          .filter(alias => alias.toLowerCase().includes(normalized))
          .map(alias => {
            // 查询词在别名中占比越大，分数越高
            return 300 * (normalized.length / alias.length)
          })
        score = Math.max(...aliasScores)
      }
      // 5. 部分单词匹配（最低优先级）
      else {
        const queryWords = normalized.split(/\s+/)
        const nameWords = tournamentName.split(/\s+/)
        const matchedWords = queryWords.filter(qw => 
          nameWords.some(nw => nw.includes(qw) || qw.includes(nw))
        )
        if (matchedWords.length > 0) {
          score = (matchedWords.length / queryWords.length) * 100
        }
      }
    }

    return { tournament, score }
  })

  // 过滤掉分数为0的，并按分数降序排序
  return scoredTournaments
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.tournament)
}
