import { GoogleGenerativeAI } from '@google/generative-ai'

// 初始化 Gemini API
const apiKey = process.env.GOOGLE_GEMINI_API_KEY

if (!apiKey) {
  console.warn('⚠️ GOOGLE_GEMINI_API_KEY 未设置，AI 搜索功能将使用预设数据')
} else {
  console.log('✅ Gemini API Key 已配置')
}

let genAI: GoogleGenerativeAI | null = null

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey)
}

// 优先使用的模型列表（按优先级排序）
const PREFERRED_MODELS = [
  'gemini-2.5-flash',               // Gemini 2.5 Flash (2025年6月发布，最新稳定版)
  'gemini-1.5-flash-latest',        // Gemini 1.5 Flash (最新稳定版)
  'gemini-1.5-flash',               // Gemini 1.5 Flash (标准版)
  'gemini-1.5-pro-latest',          // Gemini 1.5 Pro (最强性能)
  'gemini-1.5-pro',                 // Gemini 1.5 Pro (标准版)
]

let currentModelIndex = 0

/**
 * 获取 Gemini 模型实例
 * 使用 Gemini 2.0/1.5 Flash - 付费版本，性能最佳
 */
export function getGeminiModel(tryNextModel = false) {
  if (!genAI) {
    return null
  }
  
  // 如果请求尝试下一个模型，则索引递增
  if (tryNextModel && currentModelIndex < PREFERRED_MODELS.length - 1) {
    currentModelIndex++
    console.log(`⚠️ 切换到备用模型: ${PREFERRED_MODELS[currentModelIndex]}`)
  }
  
  const modelName = PREFERRED_MODELS[currentModelIndex]
  
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  })
}

/**
 * 重置模型索引（用于重试）
 */
export function resetModelSelection() {
  currentModelIndex = 0
}

/**
 * 获取当前使用的模型名称
 */
export function getCurrentModelName(): string {
  return PREFERRED_MODELS[currentModelIndex]
}

/**
 * 检查 Gemini 是否可用
 */
export function isGeminiAvailable(): boolean {
  return genAI !== null
}

