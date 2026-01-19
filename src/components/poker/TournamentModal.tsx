'use client'

import { useState, useEffect, useRef } from 'react'
import { Tournament, GameType, BlindMode } from '@/types/poker'
import { 
  saveTournamentTemplate, 
  getUserTournamentTemplates,
  getBlindLevelByNumber 
} from '@/lib/supabase/tournaments'
import { TournamentTemplateWithBlinds } from '@/lib/supabase/database.types'
import { searchTournamentSuggestions, getLocalSuggestions } from '@/lib/supabase/search'

interface TournamentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tournament: Omit<Tournament, 'id' | 'created_at' | 'status' | 'hand_count'>) => void
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: '6max', label: '6-Max' },
  { value: '9max', label: '9-Max' },
  { value: 'custom', label: '自定义' }
]

interface BlindStructure {
  small_blind: number
  big_blind: number
  ante?: number
  buy_in?: number
  starting_stack?: number
  late_reg_time_left?: string
}

export function TournamentModal({ isOpen, onClose, onSave }: TournamentModalProps) {
  const [name, setName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(50)
  const [bigBlind, setBigBlind] = useState(100)
  const [ante, setAnte] = useState(100)
  const [buyIn, setBuyIn] = useState<number>(0)
  const [buyInLevel, setBuyInLevel] = useState<number>(1)
  const [levelDuration, setLevelDuration] = useState<number>(15)
  const [timeLeftInLevel, setTimeLeftInLevel] = useState<number>(15)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<string>('')
  
  // 模板相关
  const [templates, setTemplates] = useState<TournamentTemplateWithBlinds[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [blindStructure, setBlindStructure] = useState<Array<{
    level_number: number
    small_blind: number
    big_blind: number
    ante: number
  }>>([])

  // 搜索建议相关
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // 加载模板列表
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      // 清理 debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const loadTemplates = async () => {
    const templatesList = await getUserTournamentTemplates()
    setTemplates(templatesList)
  }

  // 实时搜索建议
  const handleNameChange = async (value: string) => {
    setName(value)
    setSearchResult('')
    setSelectedSuggestionIndex(-1)

    // 清除之前的 debounce 计时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Debounce 300ms
    debounceTimerRef.current = setTimeout(async () => {
      // 获取本地建议
      const localSuggestions = getLocalSuggestions(value)
      
      // 获取数据库建议
      const dbSuggestions = await searchTournamentSuggestions(value, 5)
      
      // 合并建议（本地优先，去重）
      const allSuggestions = [
        ...localSuggestions.map(s => ({ 
          ...s, 
          source: 'local' as const,
          id: s.name 
        })),
        ...dbSuggestions.map(s => ({ 
          ...s, 
          source: 'database' as const 
        }))
      ]

      // 去重
      const uniqueSuggestions = allSuggestions.filter((item, index, self) =>
        index === self.findIndex(t => t.name === item.name)
      )

      setSuggestions(uniqueSuggestions.slice(0, 8))
      setShowSuggestions(uniqueSuggestions.length > 0)
    }, 300)
  }

  // 选择建议
  const handleSelectSuggestion = (suggestion: any) => {
    setName(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
    
    // 如果是数据库中的模板，自动加载
    if (suggestion.source === 'database' && suggestion.id) {
      handleSelectTemplate(suggestion.id)
    } else {
      // 否则触发 AI 搜索
      setSearchResult('💡 已选择：' + suggestion.name + '，可点击 AI 搜索获取详细信息')
    }
  }

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedSuggestionIndex >= 0) {
          handleSelectSuggestion(suggestions[selectedSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedSuggestionIndex(-1)
        break
    }
  }

  // 选择模板时自动填充信息
  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // 填充基本信息
    setName(template.name)
    setGameType(template.game_type as GameType)
    setLevelDuration(template.level_duration)
    if (template.buy_in) {
      setBuyIn(template.buy_in)
    }

    // 保存盲注结构
    if (template.blind_levels && template.blind_levels.length > 0) {
      setBlindStructure(template.blind_levels.map(bl => ({
        level_number: bl.level_number,
        small_blind: bl.small_blind,
        big_blind: bl.big_blind,
        ante: bl.ante
      })))

      // 根据当前买入级别设置盲注
      const currentLevel = template.blind_levels.find(bl => bl.level_number === buyInLevel)
      if (currentLevel) {
        setSmallBlind(currentLevel.small_blind)
        setBigBlind(currentLevel.big_blind)
        setAnte(currentLevel.ante)
      } else {
        // 如果找不到，使用第一级
        const firstLevel = template.blind_levels[0]
        setSmallBlind(firstLevel.small_blind)
        setBigBlind(firstLevel.big_blind)
        setAnte(firstLevel.ante)
      }
    }

    setSearchResult(`✅ 已加载模板：${template.name}`)
  }

  // 当买入级别变化时，自动更新盲注
  const handleBuyInLevelChange = async (newLevel: number) => {
    setBuyInLevel(newLevel)

    // 如果有盲注结构，自动更新
    if (blindStructure.length > 0) {
      const levelData = blindStructure.find(bl => bl.level_number === newLevel)
      if (levelData) {
        setSmallBlind(levelData.small_blind)
        setBigBlind(levelData.big_blind)
        setAnte(levelData.ante)
        setSearchResult(`✅ 已切换到 Level ${newLevel}：${levelData.small_blind}/${levelData.big_blind}/${levelData.ante}`)
      } else {
        setSearchResult(`ℹ️ 未找到 Level ${newLevel} 的盲注信息`)
      }
    } else if (selectedTemplateId) {
      // 如果选择了模板但盲注结构未加载，从数据库获取
      const levelData = await getBlindLevelByNumber(selectedTemplateId, newLevel)
      if (levelData) {
        setSmallBlind(levelData.small_blind)
        setBigBlind(levelData.big_blind)
        setAnte(levelData.ante)
        setSearchResult(`✅ 已切换到 Level ${newLevel}：${levelData.small_blind}/${levelData.big_blind}/${levelData.ante}`)
      }
    }
  }

  // AI搜索盲注结构
  const handleSearchBlindStructure = async () => {
    if (!name.trim()) {
      alert('请先输入比赛名称')
      return
    }

    setIsSearching(true)
    setSearchResult('')

    try {
      const response = await fetch('/api/search-tournament', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tournamentName: name }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        // 自动填充所有信息
        setSmallBlind(result.data.small_blind)
        setBigBlind(result.data.big_blind)
        setAnte(result.data.ante || 0)
        
        // 买入金额
        if (result.data.buy_in) {
          setBuyIn(result.data.buy_in)
        }
        
        // 买入时的盲注级别
        if (result.data.buy_in_level) {
          setBuyInLevel(result.data.buy_in_level)
        }
        
        // 升盲时间
        if (result.data.level_duration) {
          setLevelDuration(result.data.level_duration)
        }
        
        // 还剩多久升盲
        if (result.data.time_left_in_level) {
          setTimeLeftInLevel(result.data.time_left_in_level)
        } else if (result.data.level_duration) {
          // 如果没有提供还剩时间，默认设置为级别时长的一半
          setTimeLeftInLevel(Math.floor(result.data.level_duration / 2))
        }
        
        // 如果 AI 返回了盲注结构，保存到数据库
        if (result.data.blind_structure && Array.isArray(result.data.blind_structure)) {
          const blindLevels = result.data.blind_structure.map((level: any, index: number) => ({
            level_number: level.level || index + 1,
            small_blind: level.small_blind,
            big_blind: level.big_blind,
            ante: level.ante || 0
          }))
          
          setBlindStructure(blindLevels)
          
          // 尝试保存到数据库（需要用户登录）
          const saveResult = await saveTournamentTemplate({
            name: name.trim(),
            game_type: gameType,
            buy_in: result.data.buy_in,
            level_duration: result.data.level_duration || levelDuration,
            blind_levels: blindLevels,
            info: result.data.info,
            source: 'gemini_ai'
          })
          
          if (saveResult.success) {
            setSearchResult(`✅ ${result.message || result.source} - 已保存到模板库`)
            // 重新加载模板列表
            await loadTemplates()
            // 自动选择刚保存的模板
            if (saveResult.templateId) {
              setSelectedTemplateId(saveResult.templateId)
            }
          } else if (saveResult.error?.includes('用户未登录')) {
            // 用户未登录时，仍然使用数据但不保存
            setSearchResult(`✅ ${result.message || result.source} - 数据已加载（登录后可保存到模板库）`)
          } else {
            setSearchResult(`✅ ${result.message || result.source}`)
          }
        } else {
          setSearchResult(`✅ ${result.message || result.source}`)
        }
      } else {
        setSearchResult(`ℹ️ ${result.message || '未找到比赛信息'}`)
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResult('❌ 搜索失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }

  const handleBlindModeChange = (mode: BlindMode) => {
    setBlindMode(mode)
    if (mode === 'bb') {
      setSmallBlind(0.5)
      setBigBlind(1)
      setAnte(1)
    } else {
      setSmallBlind(50)
      setBigBlind(100)
      setAnte(100)
    }
  }

  const handleGameTypeChange = (type: GameType) => {
    setGameType(type)
    if (type === '6max') setMaxPlayers(6)
    else if (type === '9max') setMaxPlayers(9)
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入比赛名称')
      return
    }

    // 计算当前级别已进行时间（从还剩时间推算）
    const minutesIntoLevel = levelDuration - timeLeftInLevel

    onSave({
      name: name.trim(),
      game_type: gameType,
      max_players: maxPlayers,
      blind_mode: blindMode,
      small_blind: smallBlind,
      big_blind: bigBlind,
      ante: ante || undefined,
      buy_in: buyIn || undefined,
      buy_in_level: buyInLevel,
      level_duration: levelDuration,
      minutes_into_level: minutesIntoLevel
    })

    // 重置表单
    setName('')
    setGameType('6max')
    setMaxPlayers(6)
    setBlindMode('chips')
    setSmallBlind(50)
    setBigBlind(100)
    setAnte(100)
    setBuyIn(0)
    setBuyInLevel(1)
    setLevelDuration(15)
    setTimeLeftInLevel(15)
    setSearchResult('')
    setSelectedTemplateId('')
    setBlindStructure([])
    setSuggestions([])
    setShowSuggestions(false)
    setSelectedSuggestionIndex(-1)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-orbitron">新增比赛</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* 选择现有模板 */}
          {templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">📚 从模板库选择</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white"
              >
                <option value="">-- 或手动输入新比赛 --</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.blind_levels?.length || 0} 级盲注)
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs text-gray-500">
                💡 选择已保存的比赛模板，自动填充所有信息
              </div>
            </div>
          )}

          {/* 比赛名称 + AI搜索 + 智能建议 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              比赛名称 * 
              <span className="ml-2 text-xs text-gray-500 font-normal">
                💡 输入时会显示建议选项
              </span>
            </label>
            <div className="flex gap-2 relative">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="输入比赛名称，如：WSOP Event #35 FREEZEOUT"
                  autoComplete="off"
                />
                
                {/* 搜索建议下拉列表 */}
                {showSuggestions && suggestions.length > 0 && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id || suggestion.name}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                          index === selectedSuggestionIndex
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {suggestion.name}
                            </div>
                            {suggestion.info && (
                              <div className="text-xs text-gray-500 mt-1">
                                {suggestion.info}
                              </div>
                            )}
                            {suggestion.category && (
                              <div className="text-xs text-gray-400 mt-1">
                                📁 {suggestion.category}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            {suggestion.source === 'database' && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                ✓ 已保存
                              </span>
                            )}
                            {suggestion.source === 'local' && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                💡 常用
                              </span>
                            )}
                            {suggestion.usage_count > 0 && (
                              <span className="text-gray-400">
                                🔥 {suggestion.usage_count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t border-gray-200">
                      💡 使用 ↑↓ 键选择，Enter 确认，ESC 关闭
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="button"
                onClick={handleSearchBlindStructure}
                disabled={isSearching || !name.trim()}
                className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap text-sm font-medium"
              >
                {isSearching ? (
                  <>
                    <span className="inline-block animate-spin">🔄</span>
                    搜索中...
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    AI搜索
                  </>
                )}
              </button>
            </div>
            {/* 搜索结果提示 */}
            {searchResult && (
              <div className={`mt-2 p-2 rounded-lg text-sm ${
                searchResult.startsWith('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : searchResult.startsWith('❌')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {searchResult}
              </div>
            )}
            <div className="mt-1 text-xs text-gray-500">
              💡 输入比赛名称会显示智能建议，点击建议可快速填充；或使用 AI 搜索获取完整盲注结构
            </div>
          </div>

          {/* 游戏类型 */}
          <div>
            <label className="block text-sm font-medium mb-2">游戏类型</label>
            <div className="flex gap-2">
              {gameTypes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleGameTypeChange(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                    gameType === value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {gameType === 'custom' && (
              <input
                type="number"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                min="2"
                max="10"
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="自定义人数"
              />
            )}
          </div>

          {/* 盲注模式 */}
          <div>
            <label className="block text-sm font-medium mb-2">盲注模式</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleBlindModeChange('chips')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                  blindMode === 'chips'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                具体数字
              </button>
              <button
                onClick={() => handleBlindModeChange('bb')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors border-2 ${
                  blindMode === 'bb'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                BB模式 (0.5/1/1)
              </button>
            </div>
          </div>

          {/* 盲注设置 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                小盲 {blindMode === 'bb' && '(BB)'}
              </label>
              <input
                type="number"
                value={smallBlind}
                onChange={(e) => setSmallBlind(Number(e.target.value))}
                step={blindMode === 'bb' ? '0.1' : '1'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                大盲 {blindMode === 'bb' && '(BB)'}
              </label>
              <input
                type="number"
                value={bigBlind}
                onChange={(e) => setBigBlind(Number(e.target.value))}
                step={blindMode === 'bb' ? '0.1' : '1'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                前注 {blindMode === 'bb' && '(BB)'}
              </label>
              <input
                type="number"
                value={ante}
                onChange={(e) => setAnte(Number(e.target.value))}
                step={blindMode === 'bb' ? '0.1' : '1'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              />
            </div>
          </div>

          {/* 买入信息 */}
          {/* 买入金额 */}
          <div>
            <label className="block text-sm font-medium mb-2">买入金额 (可选)</label>
            <input
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(Number(e.target.value))}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="例如：1000"
            />
          </div>

          {/* 买入时的盲注级别 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              买入时的盲注级别 (可选)
              {blindStructure.length > 0 && (
                <span className="ml-2 text-xs text-blue-600 font-normal">
                  🔄 切换级别会自动更新盲注
                </span>
              )}
            </label>
            <input
              type="number"
              value={buyInLevel}
              onChange={(e) => handleBuyInLevelChange(Number(e.target.value))}
              min="1"
              max={blindStructure.length > 0 ? blindStructure.length : 50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
              placeholder="例如：3（表示 Level 3）"
            />
            <div className="mt-1 text-xs text-gray-500">
              💡 当前处于第几级盲注{blindStructure.length > 0 && `（共 ${blindStructure.length} 级）`}
            </div>
          </div>

          {/* 升盲时间和剩余时间 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">升盲时间（分钟/级）</label>
              <input
                type="number"
                value={levelDuration}
                onChange={(e) => {
                  const newDuration = Number(e.target.value)
                  setLevelDuration(newDuration)
                  // 自动调整剩余时间，确保不超过总时长
                  if (timeLeftInLevel > newDuration) {
                    setTimeLeftInLevel(newDuration)
                  }
                }}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="例如：15"
              />
              <div className="mt-1 text-xs text-gray-500">
                💡 每级盲注持续时间
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">还剩多久升盲（分钟）</label>
              <input
                type="number"
                value={timeLeftInLevel}
                onChange={(e) => setTimeLeftInLevel(Math.min(Number(e.target.value), levelDuration))}
                min="0"
                max={levelDuration}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="例如：7"
              />
              <div className="mt-1 text-xs text-gray-500">
                💡 当前级别已进行 {levelDuration - timeLeftInLevel} 分钟
              </div>
            </div>
          </div>

        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border-2 border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            创建比赛
          </button>
        </div>
      </div>
    </div>
  )
}

