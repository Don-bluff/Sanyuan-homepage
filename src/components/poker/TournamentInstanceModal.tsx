'use client'

import { useState, useEffect } from 'react'
import { TournamentTemplate } from '@/types/tournament-template'

interface TournamentInstanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: {
    template_id: string
    template_name: string
    buy_in_level: number
    buy_in_stack: number
    level_duration: number
    minutes_into_level: number
    late_reg_time_left?: number
    late_reg_closed: boolean
  }) => void
}

export function TournamentInstanceModal({ isOpen, onClose, onSave }: TournamentInstanceModalProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [template, setTemplate] = useState<TournamentTemplate | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState('')
  
  // 买入时的信息
  const [buyInLevel, setBuyInLevel] = useState(1)
  const [buyInStack, setBuyInStack] = useState(0)
  const [levelDuration, setLevelDuration] = useState(15) // 升盲时间（分钟）
  const [minutesIntoLevel, setMinutesIntoLevel] = useState(0) // 买入时该级别已进行时间
  const [lateRegClosed, setLateRegClosed] = useState(false)
  const [lateRegTimeLeft, setLateRegTimeLeft] = useState('')

  // AI搜索比赛模板
  const handleSearchTemplate = async () => {
    if (!tournamentName.trim()) {
      alert('请先输入比赛名称')
      return
    }

    setIsSearching(true)
    setSearchResult('')
    setTemplate(null)

    try {
      const response = await fetch('/api/search-tournament-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentName }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setTemplate(result.data)
        setBuyInStack(result.data.starting_stack || 0)
        setLevelDuration(result.data.level_duration || 15) // 自动填充升盲时间
        setSearchResult(`✅ ${result.message} (来源: ${result.source})`)
      } else {
        setSearchResult(`ℹ️ ${result.message}`)
      }
    } catch (error) {
      console.error('搜索失败:', error)
      setSearchResult('❌ 搜索失败，请稍后重试')
    } finally {
      setIsSearching(false)
    }
  }

  const handleSave = () => {
    if (!template) {
      alert('请先搜索比赛')
      return
    }

    if (buyInLevel < 1) {
      alert('请输入有效的买入级别')
      return
    }

    if (buyInStack <= 0) {
      alert('请输入买入筹码数量')
      return
    }

    // 解析晚注册时间
    let lateRegMinutes: number | undefined
    if (!lateRegClosed && lateRegTimeLeft.trim()) {
      const parsed = parseInt(lateRegTimeLeft)
      if (!isNaN(parsed) && parsed > 0) {
        lateRegMinutes = parsed
      }
    }

    onSave({
      template_id: template.id,
      template_name: template.name,
      buy_in_level: buyInLevel,
      buy_in_stack: buyInStack,
      level_duration: levelDuration,
      minutes_into_level: minutesIntoLevel,
      late_reg_time_left: lateRegMinutes,
      late_reg_closed: lateRegClosed
    })

    // 重置表单
    setTournamentName('')
    setTemplate(null)
    setBuyInLevel(1)
    setBuyInStack(0)
    setLevelDuration(15)
    setMinutesIntoLevel(0)
    setLateRegClosed(false)
    setLateRegTimeLeft('')
    setSearchResult('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">参与比赛</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* 比赛名称 + AI搜索 */}
          <div>
            <label className="block text-sm font-medium mb-2">比赛名称 *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tournamentName}
                onChange={(e) => {
                  setTournamentName(e.target.value)
                  setSearchResult('')
                }}
                className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                placeholder="例如：WSOP Main Event"
              />
              <button
                type="button"
                onClick={handleSearchTemplate}
                disabled={isSearching || !tournamentName.trim()}
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
                    搜索模板
                  </>
                )}
              </button>
            </div>
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
              💡 首次搜索会创建模板并保存，后续可直接使用
            </div>
          </div>

          {/* 如果找到模板，显示模板信息 */}
          {template && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                  <div>升盲时间: <span className="font-semibold">{template.level_duration}分钟</span></div>
                  <div>起始筹码: <span className="font-semibold">{template.starting_stack?.toLocaleString()}</span></div>
                  {template.late_reg_end_level && (
                    <div className="col-span-2">晚注册截止: <span className="font-semibold">Level {template.late_reg_end_level}</span></div>
                  )}
                  {template.info && (
                    <div className="col-span-2 text-xs text-gray-600 mt-1">{template.info}</div>
                  )}
                </div>
              </div>

              {/* 买入时的信息 */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">买入时的信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">买入时的盲注级别 *</label>
                    <input
                      type="number"
                      value={buyInLevel}
                      onChange={(e) => setBuyInLevel(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="例如：3"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      💡 当前处于第几级盲注
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">买入筹码数量 *</label>
                    <input
                      type="number"
                      value={buyInStack}
                      onChange={(e) => setBuyInStack(Number(e.target.value))}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="例如：20000"
                    />
                  </div>
                </div>

                {/* 升盲时间信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">升盲时间（分钟/级）*</label>
                    <input
                      type="number"
                      value={levelDuration}
                      onChange={(e) => setLevelDuration(Number(e.target.value))}
                      min="1"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="例如：15"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      💡 每级盲注持续时间
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      当前级别已进行时间（分钟）*
                    </label>
                    <input
                      type="number"
                      value={minutesIntoLevel}
                      onChange={(e) => setMinutesIntoLevel(Number(e.target.value))}
                      min="0"
                      max={levelDuration - 1}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="例如：8"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      💡 该级别还剩 {levelDuration - minutesIntoLevel} 分钟升盲
                    </div>
                  </div>
                </div>

                {/* 晚注册信息 */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lateRegClosed}
                      onChange={(e) => setLateRegClosed(e.target.checked)}
                      className="w-5 h-5 text-black rounded focus:ring-2 focus:ring-black"
                    />
                    <span className="text-sm font-medium">晚注册已截止</span>
                  </label>
                </div>

                {!lateRegClosed && (
                  <div>
                    <label className="block text-sm font-medium mb-2">截止买入还剩时间（分钟）</label>
                    <input
                      type="number"
                      value={lateRegTimeLeft}
                      onChange={(e) => setLateRegTimeLeft(e.target.value)}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black"
                      placeholder="例如：120（2小时）"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      💡 填写后可实时倒计时显示晚注册剩余时间
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
            disabled={!template}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            参与比赛
          </button>
        </div>
      </div>
    </div>
  )
}
