import { NextResponse } from 'next/server'
import { searchTournamentWithGemini } from '@/lib/gemini/tournament-search'
import { isGeminiAvailable } from '@/lib/gemini/client'

export async function POST(request: Request) {
  try {
    const { tournamentName } = await request.json()

    if (!tournamentName) {
      return NextResponse.json(
        { error: '请提供比赛名称' },
        { status: 400 }
      )
    }

    // 优先使用 Gemini AI 搜索
    if (isGeminiAvailable()) {
      try {
        const geminiResult = await searchTournamentWithGemini(tournamentName)
        
        if (geminiResult.success && geminiResult.data) {
          return NextResponse.json({
            success: true,
            data: geminiResult.data,
            source: 'Gemini AI',
            message: geminiResult.data.info || geminiResult.message
          })
        }
        
        // Gemini 搜索失败，回退到预设数据
        console.log('Gemini 搜索失败，使用预设数据:', geminiResult.message)
      } catch (geminiError) {
        console.error('Gemini 搜索异常:', geminiError)
        // 继续执行，使用预设数据
      }
    }

    // 回退方案：使用预设的盲注结构数据库
    const blindStructures: Record<string, {
      small_blind: number
      big_blind: number
      ante: number
      buy_in?: number
      buy_in_level?: number
      level_duration?: number
      time_left_in_level?: number
      late_reg_minutes_left?: number
      blind_structure?: Array<{
        level: number
        small_blind: number
        big_blind: number
        ante: number
      }>
      info?: string
    }> = {
      'wsop': {
        small_blind: 100,
        big_blind: 200,
        ante: 200,
        buy_in: 10000,
        buy_in_level: 3,
        level_duration: 60,
        time_left_in_level: 35,
        late_reg_minutes_left: 360,
        blind_structure: [
          { level: 1, small_blind: 100, big_blind: 100, ante: 0 },
          { level: 2, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 3, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 4, small_blind: 200, big_blind: 300, ante: 300 },
          { level: 5, small_blind: 200, big_blind: 400, ante: 400 },
          { level: 6, small_blind: 300, big_blind: 500, ante: 500 },
          { level: 7, small_blind: 300, big_blind: 600, ante: 600 },
          { level: 8, small_blind: 400, big_blind: 800, ante: 800 },
          { level: 9, small_blind: 500, big_blind: 1000, ante: 1000 },
          { level: 10, small_blind: 600, big_blind: 1200, ante: 1200 }
        ],
        info: 'WSOP Main Event - 深筹码结构，每级60分钟，300BB起始'
      },
      'wsop freezeout': {
        small_blind: 100,
        big_blind: 200,
        ante: 200,
        buy_in: 1500,
        buy_in_level: 3,
        level_duration: 40,
        time_left_in_level: 25,
        blind_structure: [
          { level: 1, small_blind: 100, big_blind: 100, ante: 0 },
          { level: 2, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 3, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 4, small_blind: 200, big_blind: 300, ante: 300 },
          { level: 5, small_blind: 200, big_blind: 400, ante: 400 },
          { level: 6, small_blind: 300, big_blind: 500, ante: 500 },
          { level: 7, small_blind: 300, big_blind: 600, ante: 600 },
          { level: 8, small_blind: 400, big_blind: 800, ante: 800 },
          { level: 9, small_blind: 500, big_blind: 1000, ante: 1000 },
          { level: 10, small_blind: 600, big_blind: 1200, ante: 1200 }
        ],
        info: 'WSOP 标准 FREEZE OUT - 40分钟/级，200BB起始，无重买'
      },
      'wsop event': {
        small_blind: 100,
        big_blind: 200,
        ante: 200,
        buy_in: 1500,
        buy_in_level: 3,
        level_duration: 40,
        time_left_in_level: 25,
        blind_structure: [
          { level: 1, small_blind: 100, big_blind: 100, ante: 0 },
          { level: 2, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 3, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 4, small_blind: 200, big_blind: 300, ante: 300 },
          { level: 5, small_blind: 200, big_blind: 400, ante: 400 },
          { level: 6, small_blind: 300, big_blind: 500, ante: 500 },
          { level: 7, small_blind: 300, big_blind: 600, ante: 600 },
          { level: 8, small_blind: 400, big_blind: 800, ante: 800 },
          { level: 9, small_blind: 500, big_blind: 1000, ante: 1000 },
          { level: 10, small_blind: 600, big_blind: 1200, ante: 1200 }
        ],
        info: 'WSOP 赛事 - 40分钟/级，200BB起始，标准结构'
      },
      'wpt': {
        small_blind: 50,
        big_blind: 100,
        ante: 100,
        buy_in: 3500,
        buy_in_level: 2,
        level_duration: 60,
        time_left_in_level: 40,
        late_reg_minutes_left: 240,
        info: 'WPT 主赛事 - 标准结构，每级60分钟，300BB起始'
      },
      'ept': {
        small_blind: 50,
        big_blind: 100,
        ante: 100,
        buy_in: 5300,
        buy_in_level: 2,
        level_duration: 60,
        time_left_in_level: 45,
        late_reg_minutes_left: 300,
        info: 'EPT 主赛事 - 标准结构，每级60分钟，300BB起始'
      },
      'pokerstars': {
        small_blind: 10,
        big_blind: 20,
        ante: 20,
        buy_in: 215,
        buy_in_level: 5,
        level_duration: 10,
        time_left_in_level: 6,
        late_reg_minutes_left: 180,
        blind_structure: [
          { level: 1, small_blind: 10, big_blind: 20, ante: 20 },
          { level: 2, small_blind: 15, big_blind: 30, ante: 30 },
          { level: 3, small_blind: 20, big_blind: 40, ante: 40 },
          { level: 4, small_blind: 25, big_blind: 50, ante: 50 },
          { level: 5, small_blind: 30, big_blind: 60, ante: 60 },
          { level: 6, small_blind: 40, big_blind: 80, ante: 80 },
          { level: 7, small_blind: 50, big_blind: 100, ante: 100 },
          { level: 8, small_blind: 60, big_blind: 120, ante: 120 },
          { level: 9, small_blind: 80, big_blind: 160, ante: 160 },
          { level: 10, small_blind: 100, big_blind: 200, ante: 200 }
        ],
        info: 'PokerStars Sunday Million - 快速结构，每级10分钟，500BB起始'
      },
      'ggpoker': {
        small_blind: 25,
        big_blind: 50,
        ante: 50,
        buy_in: 100,
        buy_in_level: 3,
        level_duration: 12,
        time_left_in_level: 8,
        late_reg_minutes_left: 120,
        blind_structure: [
          { level: 1, small_blind: 25, big_blind: 50, ante: 50 },
          { level: 2, small_blind: 30, big_blind: 60, ante: 60 },
          { level: 3, small_blind: 40, big_blind: 80, ante: 80 },
          { level: 4, small_blind: 50, big_blind: 100, ante: 100 },
          { level: 5, small_blind: 60, big_blind: 120, ante: 120 },
          { level: 6, small_blind: 80, big_blind: 160, ante: 160 },
          { level: 7, small_blind: 100, big_blind: 200, ante: 200 },
          { level: 8, small_blind: 125, big_blind: 250, ante: 250 },
          { level: 9, small_blind: 150, big_blind: 300, ante: 300 },
          { level: 10, small_blind: 200, big_blind: 400, ante: 400 }
        ],
        info: 'GGPoker 标准赛事 - 每级12分钟，200BB起始'
      },
      'appt': {
        small_blind: 50,
        big_blind: 100,
        ante: 100,
        buy_in: 2200,
        buy_in_level: 2,
        level_duration: 40,
        time_left_in_level: 25,
        late_reg_minutes_left: 240,
        info: 'APPT 标准赛事 - 每级40分钟，300BB起始'
      },
      'wcoop': {
        small_blind: 50,
        big_blind: 100,
        ante: 100,
        buy_in: 1050,
        buy_in_level: 4,
        level_duration: 15,
        time_left_in_level: 9,
        late_reg_minutes_left: 180,
        info: 'WCOOP 标准赛事 - 每级15分钟，100BB起始'
      },
      'scoop': {
        small_blind: 25,
        big_blind: 50,
        ante: 50,
        buy_in: 530,
        buy_in_level: 3,
        level_duration: 15,
        time_left_in_level: 8,
        late_reg_minutes_left: 150,
        info: 'SCOOP 标准赛事 - 每级15分钟，200BB起始'
      }
    }

    // 搜索匹配的比赛
    const normalizedName = tournamentName.toLowerCase()
    let matchedStructure = null
    let matchedKey = ''

    for (const [key, structure] of Object.entries(blindStructures)) {
      if (normalizedName.includes(key)) {
        matchedStructure = structure
        matchedKey = key.toUpperCase()
        break
      }
    }

    if (matchedStructure) {
      return NextResponse.json({
        success: true,
        data: matchedStructure,
        source: `预设数据 - ${matchedKey} 赛事`,
        message: matchedStructure.info
      })
    }

    // 如果没有匹配，返回提示
    const fallbackMessage = isGeminiAvailable() 
      ? '未找到该比赛的盲注结构，请手动输入或尝试其他关键词'
      : '未找到该比赛的盲注结构。提示：配置 Gemini API 可获得更智能的搜索结果（支持更多比赛和自然语言搜索）'
    
    return NextResponse.json({
      success: false,
      message: fallbackMessage
    })

  } catch (error) {
    console.error('搜索比赛失败:', error)
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    )
  }
}

