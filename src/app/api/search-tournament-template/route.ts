import { NextResponse } from 'next/server'
import { searchTournamentTemplateWithGemini } from '@/lib/gemini/tournament-template-search'
import { isGeminiAvailable } from '@/lib/gemini/client'
import { searchTemplateByName, createTemplate } from '@/lib/api/tournament-templates'
import { BlindLevel } from '@/types/tournament-template'

// 预设的知名比赛模板
const PRESET_TEMPLATES: Record<string, {
  name: string
  level_duration: number
  late_reg_end_level?: number
  buy_in?: number
  starting_stack?: number
  blind_structure: BlindLevel[]
  info: string
}> = {
  'wsop': {
    name: 'WSOP Main Event',
    level_duration: 120,
    late_reg_end_level: 8,
    buy_in: 10000,
    starting_stack: 60000,
    blind_structure: [
      { level: 1, small_blind: 100, big_blind: 200, ante: 200 },
      { level: 2, small_blind: 200, big_blind: 300, ante: 300 },
      { level: 3, small_blind: 200, big_blind: 400, ante: 400 },
      { level: 4, small_blind: 300, big_blind: 600, ante: 600 },
      { level: 5, small_blind: 400, big_blind: 800, ante: 800 },
      { level: 6, small_blind: 500, big_blind: 1000, ante: 1000 },
      { level: 7, small_blind: 600, big_blind: 1200, ante: 1200 },
      { level: 8, small_blind: 800, big_blind: 1600, ante: 1600 },
      { level: 9, small_blind: 1000, big_blind: 2000, ante: 2000 },
      { level: 10, small_blind: 1500, big_blind: 2500, ante: 2500 },
    ],
    info: 'WSOP主赛事，2小时盲注级别，8级结束晚注册'
  },
  'pokerstars': {
    name: 'PokerStars Sunday Million',
    level_duration: 15,
    late_reg_end_level: 12,
    buy_in: 215,
    starting_stack: 10000,
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
      { level: 10, small_blind: 100, big_blind: 200, ante: 200 },
      { level: 11, small_blind: 125, big_blind: 250, ante: 250 },
      { level: 12, small_blind: 150, big_blind: 300, ante: 300 },
    ],
    info: 'PokerStars Sunday Million，15分钟盲注级别'
  }
}

export async function POST(request: Request) {
  try {
    const { tournamentName } = await request.json()

    if (!tournamentName) {
      return NextResponse.json(
        { error: '请提供比赛名称' },
        { status: 400 }
      )
    }

    // 1. 首先检查本地数据库是否已有该模板
    const existingTemplate = searchTemplateByName(tournamentName)
    if (existingTemplate) {
      return NextResponse.json({
        success: true,
        data: existingTemplate,
        source: '本地数据库',
        message: `已找到 ${existingTemplate.name} 的模板`
      })
    }

    // 2. 尝试使用 Gemini AI 搜索
    if (isGeminiAvailable()) {
      try {
        const geminiResult = await searchTournamentTemplateWithGemini(tournamentName)
        
        if (geminiResult.success && geminiResult.data) {
          // 保存到本地数据库
          const savedTemplate = createTemplate({
            ...geminiResult.data,
            source: 'ai'
          })
          
          return NextResponse.json({
            success: true,
            data: savedTemplate,
            source: 'Gemini AI（已保存）',
            message: geminiResult.message
          })
        }
      } catch (geminiError) {
        console.error('Gemini 搜索异常:', geminiError)
      }
    }

    // 3. 回退：使用预设模板
    const normalizedName = tournamentName.toLowerCase()
    for (const [key, preset] of Object.entries(PRESET_TEMPLATES)) {
      if (normalizedName.includes(key)) {
        // 保存到本地数据库
        const savedTemplate = createTemplate({
          ...preset,
          source: 'preset'
        })
        
        return NextResponse.json({
          success: true,
          data: savedTemplate,
          source: '预设模板（已保存）',
          message: `已找到 ${preset.name} 的预设模板`
        })
      }
    }

    // 4. 未找到
    return NextResponse.json({
      success: false,
      message: '未找到该比赛的模板。您可以手动创建，或尝试更具体的比赛名称。'
    })

  } catch (error) {
    console.error('搜索比赛模板失败:', error)
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    )
  }
}

