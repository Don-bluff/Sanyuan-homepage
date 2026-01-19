import { TournamentTemplate, BlindLevel } from '@/types/tournament-template'

const STORAGE_KEY = 'tournament_templates'

/**
 * 获取所有比赛模板
 */
export function getAllTemplates(): TournamentTemplate[] {
  if (typeof window === 'undefined') return []
  
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

/**
 * 根据名称搜索比赛模板（模糊匹配）
 */
export function searchTemplateByName(name: string): TournamentTemplate | null {
  const templates = getAllTemplates()
  const normalizedSearch = name.toLowerCase().trim()
  
  // 精确匹配
  let found = templates.find(t => t.name.toLowerCase() === normalizedSearch)
  if (found) return found
  
  // 模糊匹配
  found = templates.find(t => 
    t.name.toLowerCase().includes(normalizedSearch) ||
    normalizedSearch.includes(t.name.toLowerCase())
  )
  
  return found || null
}

/**
 * 根据ID获取比赛模板
 */
export function getTemplateById(id: string): TournamentTemplate | null {
  const templates = getAllTemplates()
  return templates.find(t => t.id === id) || null
}

/**
 * 创建比赛模板
 */
export function createTemplate(template: Omit<TournamentTemplate, 'id' | 'created_at'>): TournamentTemplate {
  const templates = getAllTemplates()
  
  const newTemplate: TournamentTemplate = {
    ...template,
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  }
  
  templates.push(newTemplate)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  
  return newTemplate
}

/**
 * 更新比赛模板
 */
export function updateTemplate(id: string, updates: Partial<TournamentTemplate>): TournamentTemplate | null {
  const templates = getAllTemplates()
  const index = templates.findIndex(t => t.id === id)
  
  if (index === -1) return null
  
  templates[index] = { ...templates[index], ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  
  return templates[index]
}

/**
 * 删除比赛模板
 */
export function deleteTemplate(id: string): boolean {
  const templates = getAllTemplates()
  const filtered = templates.filter(t => t.id !== id)
  
  if (filtered.length === templates.length) return false
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return true
}

/**
 * 生成标准盲注结构
 */
export function generateStandardBlindStructure(
  startingSB: number,
  startingBB: number,
  startingAnte: number,
  levels: number = 20
): BlindLevel[] {
  const structure: BlindLevel[] = []
  
  let sb = startingSB
  let bb = startingBB
  let ante = startingAnte
  
  for (let i = 1; i <= levels; i++) {
    structure.push({
      level: i,
      small_blind: Math.round(sb),
      big_blind: Math.round(bb),
      ante: Math.round(ante)
    })
    
    // 每级增加约25-50%
    if (i % 3 === 0) {
      sb *= 1.5
      bb *= 1.5
      ante *= 1.5
    } else {
      sb *= 1.25
      bb *= 1.25
      ante *= 1.25
    }
  }
  
  return structure
}

