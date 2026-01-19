import { getGeminiModel, isGeminiAvailable } from './client'
import { BlindLevel } from '@/types/tournament-template'

export interface TournamentTemplateData {
  name: string
  blind_structure: BlindLevel[]
  level_duration: number  // 升盲时间（分钟）
  late_reg_end_level?: number  // 晚注册截止级别
  buy_in?: number
  starting_stack?: number
  info?: string
}

/**
 * 使用 Gemini AI 搜索比赛完整信息（包含盲注结构）
 */
export async function searchTournamentTemplateWithGemini(
  tournamentName: string
): Promise<{ success: boolean; data?: TournamentTemplateData; message: string }> {
  
  if (!isGeminiAvailable()) {
    return {
      success: false,
      message: 'Gemini API 未配置'
    }
  }

  const model = getGeminiModel()
  if (!model) {
    return {
      success: false,
      message: 'Gemini 模型初始化失败'
    }
  }

  try {
    const prompt = `
你是一个专业的德州扑克比赛专家。请分析以下比赛名称并提供完整的盲注结构信息。

比赛名称：${tournamentName}

请以 JSON 格式返回比赛的完整信息，包含以下字段：

1. name: 比赛的标准名称（字符串）
2. level_duration: 每级盲注持续时间（数字，单位：分钟，通常为10-30分钟）
3. late_reg_end_level: 晚注册截止级别（数字，如果知道的话）
4. buy_in: 买入金额（数字）
5. starting_stack: 起始筹码（数字）
6. blind_structure: 盲注结构数组，至少包含前10-15级，每个级别包含：
   - level: 级别号（数字，从1开始）
   - small_blind: 小盲（数字）
   - big_blind: 大盲（数字）
   - ante: 前注（数字）
7. info: 简短的比赛说明（中文）

如果这是知名比赛（WSOP, WPT, EPT, APPT, PokerStars, GGPoker等），请提供该比赛的标准盲注结构。

只返回 JSON 数据，不要包含其他文字。

示例格式：
{
  "name": "WSOP Main Event",
  "level_duration": 120,
  "late_reg_end_level": 8,
  "buy_in": 10000,
  "starting_stack": 60000,
  "blind_structure": [
    {"level": 1, "small_blind": 100, "big_blind": 200, "ante": 200},
    {"level": 2, "small_blind": 200, "big_blind": 300, "ante": 300},
    {"level": 3, "small_blind": 200, "big_blind": 400, "ante": 400}
  ],
  "info": "WSOP主赛事，2小时盲注级别"
}
`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('无法从响应中提取 JSON 数据')
      }

      const data = JSON.parse(jsonMatch[0]) as TournamentTemplateData

      // 验证必需字段
      if (
        !data.name ||
        !data.blind_structure ||
        !Array.isArray(data.blind_structure) ||
        typeof data.level_duration !== 'number'
      ) {
        throw new Error('JSON 数据格式不正确')
      }

      return {
        success: true,
        data: {
          name: data.name,
          blind_structure: data.blind_structure,
          level_duration: data.level_duration,
          late_reg_end_level: data.late_reg_end_level,
          buy_in: data.buy_in,
          starting_stack: data.starting_stack,
          info: data.info || '由 AI 生成的比赛模板'
        },
        message: `成功获取 ${data.name} 的盲注结构`
      }
    } catch (parseError) {
      console.error('解析 Gemini 响应失败:', parseError)
      console.error('原始响应:', text)
      
      return {
        success: false,
        message: '无法解析 AI 返回的数据'
      }
    }
  } catch (error: any) {
    console.error('Gemini API 调用失败:', error)
    
    return {
      success: false,
      message: `AI 搜索失败: ${error.message || '未知错误'}`
    }
  }
}

