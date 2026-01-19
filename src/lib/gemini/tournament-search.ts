import { getGeminiModel, isGeminiAvailable, getCurrentModelName } from './client'

export interface TournamentBlindStructure {
  small_blind: number
  big_blind: number
  ante: number
  buy_in?: number
  buy_in_level?: number  // 买入时的盲注级别
  level_duration?: number  // 升盲时间（分钟/级）
  time_left_in_level?: number  // 还剩多久升盲（分钟）
  late_reg_minutes_left?: number  // 截止买入还剩时间（分钟）
  blind_structure?: Array<{  // 完整盲注结构
    level: number
    small_blind: number
    big_blind: number
    ante: number
  }>
  info?: string
}

/**
 * 使用 Gemini AI 搜索比赛盲注结构
 */
export async function searchTournamentWithGemini(
  tournamentName: string
): Promise<{ success: boolean; data?: TournamentBlindStructure; message: string }> {
  
  if (!isGeminiAvailable()) {
    return {
      success: false,
      message: 'Gemini API 未配置，请检查环境变量'
    }
  }

  const model = getGeminiModel()
  if (!model) {
    return {
      success: false,
      message: 'Gemini 模型初始化失败'
    }
  }

  // 构建提示词
  const prompt = `
你是一位专业的德州扑克锦标赛数据专家，精通全球各大扑克赛事的盲注结构、比赛类型和规则。你具备分析具体赛事编号、比赛格式的能力。

【任务】
深度分析以下比赛名称/描述，识别赛事系列、编号、类型、买入级别，并提供准确的盲注结构信息。

【比赛名称/描述】
${tournamentName}

【分析维度】
1. **赛事系列识别**：WSOP、WPT、EPT、APPT、PokerStars、GGPoker 等
2. **赛事编号提取**：如 "Event #35"、"No. 42"、"第18场"
3. **比赛类型判断**：
   - FREEZE OUT（无重买）：标准深筹码结构，慢速升盲
   - REBUY（可重买）：中等筹码，中速升盲
   - TURBO（快速赛）：浅筹码，快速升盲（5-8分钟/级）
   - HYPER TURBO：极浅筹码，极快升盲（3-5分钟/级）
   - DEEP STACK：深筹码结构（200-500BB起始）
   - KNOCKOUT/BOUNTY：赏金赛
   - SATELLITE：卫星赛
4. **买入级别推测**：低（$100-500）、中（$500-2000）、高（$2000-10000）、超高（$10000+）

【智能推理规则】

**WSOP 赛事结构：**
- Main Event ($10,000): 60分钟/级，300BB起始，深筹码 FREEZE OUT
- 中等买入 ($1,000-$5,000): 40-60分钟/级，200-300BB起始
- 低买入 ($500-$1,000): 30-40分钟/级，100-200BB起始
- TURBO/快速赛: 20分钟/级，100BB起始
- 编号越小通常为低买入，编号越大为高买入或特殊赛制

**比赛类型对应结构：**
- FREEZE OUT (无重买)：
  * 起始筹码：200-500BB
  * 升盲时间：40-120分钟/级
  * 前注：从 Level 3-5 开始
  * 晚注册：通常截止于 Level 8-12
  
- REBUY (可重买)：
  * 起始筹码：100-200BB
  * 升盲时间：20-40分钟/级
  * 前注：从 Level 2 开始
  * 晚注册：通常截止于 Level 6-9

- TURBO (快速)：
  * 起始筹码：50-100BB
  * 升盲时间：5-15分钟/级
  * 前注：从 Level 1 开始
  * 晚注册：通常截止于 Level 6-8

**盲注级别增长规律：**
- 标准增长：25/50 → 50/100 → 75/150 → 100/200 → 150/300
- 慢速增长：50/100 → 75/150 → 100/200 → 150/300 → 200/400
- 快速增长：50/100 → 100/200 → 200/400 → 300/600 → 500/1000

【必须返回的 JSON 字段】

返回格式示例：
{
  "small_blind": 数字,
  "big_blind": 数字,
  "ante": 数字,
  "buy_in": 数字（可选）,
  "buy_in_level": 数字（建议玩家当前买入的级别）,
  "level_duration": 数字（分钟）,
  "time_left_in_level": 数字（分钟，可选）,
  "late_reg_minutes_left": 数字（分钟，可选）,
  "blind_structure": [
    {
      "level": 1,
      "small_blind": 数字,
      "big_blind": 数字,
      "ante": 数字
    }
    // 至少提供 10-15 级盲注结构
  ],
  "info": "中文字符串：赛事系列 + 类型 + 结构特点"
}

【重要】blind_structure 字段：
- 必须包含至少 10-15 级的完整盲注结构
- 每级必须包含 level、small_blind、big_blind、ante 四个字段
- 确保盲注增长合理且符合该赛事类型的规律

【输出要求】
1. **只返回纯 JSON 对象，不要任何其他内容**
2. **不要使用 markdown 代码块（不要 \`\`\`json 或 \`\`\`）**
3. **不要添加任何解释文字、注释或说明**
4. 所有数字字段必须是纯数字类型，不要包含单位或货币符号
5. info 字段必须用中文，简洁专业
6. **直接以 { 开始，以 } 结束**

【示例 1：WSOP 标准 FREEZE OUT】
输入：WSOP Event #35: $1,500 No-Limit Hold'em FREEZEOUT
输出：
{
  "small_blind": 100,
  "big_blind": 200,
  "ante": 200,
  "buy_in": 1500,
  "buy_in_level": 3,
  "level_duration": 40,
  "time_left_in_level": 25,
  "blind_structure": [
    {"level": 1, "small_blind": 100, "big_blind": 100, "ante": 0},
    {"level": 2, "small_blind": 100, "big_blind": 200, "ante": 200},
    {"level": 3, "small_blind": 100, "big_blind": 200, "ante": 200},
    {"level": 4, "small_blind": 200, "big_blind": 300, "ante": 300},
    {"level": 5, "small_blind": 200, "big_blind": 400, "ante": 400},
    {"level": 6, "small_blind": 300, "big_blind": 500, "ante": 500},
    {"level": 7, "small_blind": 300, "big_blind": 600, "ante": 600},
    {"level": 8, "small_blind": 400, "big_blind": 800, "ante": 800},
    {"level": 9, "small_blind": 500, "big_blind": 1000, "ante": 1000},
    {"level": 10, "small_blind": 600, "big_blind": 1200, "ante": 1200}
  ],
  "info": "WSOP Event #35 - $1500 无重买 FREEZE OUT，40分钟/级，200BB起始，深筹码结构"
}

【示例 2：TURBO 快速赛】
输入：GGPoker Turbo Series #8
输出：
{
  "small_blind": 50,
  "big_blind": 100,
  "ante": 100,
  "buy_in": 100,
  "buy_in_level": 5,
  "level_duration": 8,
  "time_left_in_level": 5,
  "blind_structure": [
    {"level": 1, "small_blind": 25, "big_blind": 50, "ante": 50},
    {"level": 2, "small_blind": 50, "big_blind": 100, "ante": 100},
    {"level": 3, "small_blind": 75, "big_blind": 150, "ante": 150},
    {"level": 4, "small_blind": 100, "big_blind": 200, "ante": 200},
    {"level": 5, "small_blind": 150, "big_blind": 300, "ante": 300},
    {"level": 6, "small_blind": 200, "big_blind": 400, "ante": 400},
    {"level": 7, "small_blind": 300, "big_blind": 600, "ante": 600},
    {"level": 8, "small_blind": 400, "big_blind": 800, "ante": 800},
    {"level": 9, "small_blind": 600, "big_blind": 1200, "ante": 1200},
    {"level": 10, "small_blind": 800, "big_blind": 1600, "ante": 1600}
  ],
  "info": "GGPoker Turbo 系列 - 快速结构，8分钟/级，100BB起始"
}

【常见赛事参考库】
- WSOP Main Event: $10,000, 60分钟/级, FREEZE OUT, 300BB起始
- WSOP 中等买入 ($1,000-$5,000): 40-60分钟/级, FREEZE OUT/REBUY
- WSOP 低买入 ($500-$1,500): 30-40分钟/级
- WPT 主赛: $3,500-$10,000, 60分钟/级, FREEZE OUT, 300BB起始
- EPT 主赛: €5,300, 60分钟/级, FREEZE OUT, 300BB起始
- PokerStars Sunday Million: $215, 10分钟/级, TURBO, 500BB起始
- GGPoker 系列: $50-$500, 12分钟/级, 标准/TURBO
- 澳门赛事: 30-60分钟/级, 深筹码结构

现在请深度分析比赛"${tournamentName}"并返回完整的 JSON 数据。

**重要提醒：**
- 只输出 JSON 对象本身
- 不要输出任何解释、说明或其他文字
- 不要使用代码块标记
- 直接输出 {"small_blind": ..., "big_blind": ..., ...}
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    console.log('✅ Gemini API 调用成功，响应长度:', text.length, '字符')
    console.log('📝 响应预览 (前200字符):', text.substring(0, 200))

    // 多种策略尝试提取 JSON
    let jsonText = ''
    let extractionMethod = ''
    
    // 策略 1: 尝试提取 markdown 代码块中的 JSON
    const markdownMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (markdownMatch) {
      jsonText = markdownMatch[1]
      extractionMethod = 'markdown代码块'
    }
    
    // 策略 2: 尝试直接提取 JSON 对象（最外层的大括号）
    if (!jsonText) {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
        extractionMethod = '直接提取'
      }
    }
    
    // 策略 3: 尝试查找包含 "small_blind" 的 JSON 对象
    if (!jsonText) {
      const smartMatch = text.match(/\{[^}]*"small_blind"[\s\S]*?\}/)
      if (smartMatch) {
        // 找到起始位置，然后匹配完整的对象
        const startIndex = text.indexOf(smartMatch[0])
        let braceCount = 0
        let endIndex = startIndex
        
        for (let i = startIndex; i < text.length; i++) {
          if (text[i] === '{') braceCount++
          if (text[i] === '}') braceCount--
          if (braceCount === 0) {
            endIndex = i + 1
            break
          }
        }
        
        jsonText = text.substring(startIndex, endIndex)
        extractionMethod = '智能查找'
      }
    }
    
    if (extractionMethod) {
      console.log(`✅ JSON提取成功 (方法: ${extractionMethod})`)
    }

    if (!jsonText) {
      console.error('AI 原始响应:', text)
      return {
        success: false,
        message: '无法从 AI 响应中提取 JSON 数据'
      }
    }

    const data = JSON.parse(jsonText) as TournamentBlindStructure

    // 验证必需字段
    if (
      typeof data.small_blind !== 'number' ||
      typeof data.big_blind !== 'number'
    ) {
      return {
        success: false,
        message: 'AI 返回的数据格式不正确'
      }
    }

    return {
      success: true,
      data: {
        small_blind: data.small_blind,
        big_blind: data.big_blind,
        ante: data.ante || 0,
        buy_in: data.buy_in,
        buy_in_level: data.buy_in_level,
        level_duration: data.level_duration,
        time_left_in_level: data.time_left_in_level,
        late_reg_minutes_left: data.late_reg_minutes_left,
        blind_structure: data.blind_structure,
        info: data.info || '由 AI 提供的比赛信息'
      },
      message: data.info || '✅ AI 成功识别比赛信息'
    }
  } catch (error: any) {
    console.error('Gemini API 调用失败:', error)
    
    // 如果是 404 错误（模型不存在），尝试使用备用模型
    if (error.status === 404) {
      console.log('⚠️ 当前模型不可用，尝试使用备用模型...')
      
      try {
        const fallbackModel = getGeminiModel(true)
        if (fallbackModel) {
          console.log(`✅ 使用备用模型: ${getCurrentModelName()}`)
          
          const retryResult = await fallbackModel.generateContent(prompt)
          const retryResponse = await retryResult.response
          const retryText = retryResponse.text()
          
          // 使用相同的多策略提取逻辑
          let retryJsonText = ''
          
          const markdownMatch = retryText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
          if (markdownMatch) {
            retryJsonText = markdownMatch[1]
          }
          
          if (!retryJsonText) {
            const jsonMatch = retryText.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              retryJsonText = jsonMatch[0]
            }
          }
          
          if (retryJsonText) {
            const data = JSON.parse(retryJsonText) as TournamentBlindStructure
            return {
              success: true,
              data: {
                small_blind: data.small_blind,
                big_blind: data.big_blind,
                ante: data.ante || 0,
                buy_in: data.buy_in,
                buy_in_level: data.buy_in_level,
                level_duration: data.level_duration,
                time_left_in_level: data.time_left_in_level,
                late_reg_minutes_left: data.late_reg_minutes_left,
                blind_structure: data.blind_structure,
                info: data.info || '由 AI 提供的比赛信息'
              },
              message: data.info || '✅ AI 成功识别比赛信息'
            }
          }
        }
      } catch (retryError) {
        console.error('备用模型也失败:', retryError)
      }
    }
    
    return {
      success: false,
      message: `AI 搜索失败: ${error.message || '未知错误'}`
    }
  }
}
