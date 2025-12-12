'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { HandRecordModal } from '@/components/poker/HandRecordModal'
import { TournamentModal } from '@/components/poker/TournamentModal'
import { createHandRecord } from '@/lib/api/hands'
import { HandRecord, Tournament } from '@/types/poker'
import { getActiveTournaments, createTournament, finishTournament, incrementHandCount } from '@/lib/api/tournaments'

// 德州扑克下雨emoji
const pokerRainEmojis = ['♠️', '♥️', '♣️', '♦️', '😱', '😭', '😤']

// 预定义的emoji配置以避免hydration不匹配
const predefinedEmojis = [
  { emoji: '♠️', left: 15, delay: 2, duration: 18 },
  { emoji: '♥️', left: 25, delay: 5, duration: 22 },
  { emoji: '♣️', left: 35, delay: 1, duration: 20 },
  { emoji: '♦️', left: 45, delay: 8, duration: 16 },
  { emoji: '😱', left: 55, delay: 3, duration: 24 },
  { emoji: '😭', left: 65, delay: 12, duration: 19 },
  { emoji: '😤', left: 75, delay: 6, duration: 21 },
  { emoji: '♠️', left: 85, delay: 15, duration: 17 },
  { emoji: '♥️', left: 10, delay: 9, duration: 23 },
  { emoji: '♣️', left: 30, delay: 4, duration: 18 },
  { emoji: '♦️', left: 50, delay: 11, duration: 20 },
  { emoji: '😱', left: 70, delay: 7, duration: 22 },
  { emoji: '😭', left: 90, delay: 13, duration: 16 },
  { emoji: '😤', left: 20, delay: 10, duration: 25 },
  { emoji: '♠️', left: 40, delay: 14, duration: 19 }
]

function FloatingEmojiBackground() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 在服务器端不渲染动态内容
  if (!isClient) {
    return (
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="emoji-rain-container" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Emoji下雨效果 - 使用预定义配置 */}
      <div className="emoji-rain-container">
        {predefinedEmojis.map((item, i) => (
          <div
            key={`rain-${i}`}
            className="emoji-raindrop"
            style={{
              left: `${item.left}%`,
              animationDelay: `${item.delay}s`,
              animationDuration: `${item.duration}s`
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>
    </div>
  )
}

const pokerFeatures = [
  {
    id: 'browse',
    name: '游览手牌',
    icon: '👁️',
    emoji: '♠️'
  },
  {
    id: 'record', 
    name: '记录手牌',
    icon: '✏️',
    emoji: '♥️'
  },
  {
    id: 'my',
    name: '我的手牌',
    icon: '🃏',
    emoji: '♣️'
  },
  {
    id: 'tournaments',
    name: '我的比赛',
    icon: '🏆',
    emoji: '♦️'
  }
] as const

export default function Home() {
  const [activeTab, setActiveTab] = useState<'browse' | 'record' | 'my' | 'tournaments' | null>('browse')
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)

  // 加载进行中的比赛
  useEffect(() => {
    const tournaments = getActiveTournaments()
    setActiveTournaments(tournaments)
  }, [])

  // 点击外部关闭快速菜单
  useEffect(() => {
    if (!showQuickMenu) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // 检查点击是否在快速菜单或+按钮内
      if (!target.closest('.quick-menu') && !target.closest('.quick-menu-button')) {
        setShowQuickMenu(false)
      }
    }

    // 延迟添加监听器，避免立即触发
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showQuickMenu])

  const handleSaveHand = async (record: Partial<HandRecord>) => {
    try {
      await createHandRecord(record)
      
      // 如果关联了比赛，增加手牌计数
      if (selectedTournament) {
        incrementHandCount(selectedTournament.id)
        // 刷新比赛列表
        const tournaments = getActiveTournaments()
        setActiveTournaments(tournaments)
      }
      
      alert('手牌记录保存成功！')
      setActiveTab('browse')
    } catch (error) {
      console.error('保存失败:', error)
      alert('保存失败，请检查网络连接')
    }
  }

  const handleCreateTournament = (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'status' | 'hand_count'>) => {
    const newTournament = createTournament(tournamentData)
    setActiveTournaments([...activeTournaments, newTournament])
    setSelectedTournament(newTournament)
    alert('比赛创建成功！')
  }

  const handleFinishTournament = (tournamentId: string) => {
    if (confirm('确定要结束这个比赛吗？')) {
      finishTournament(tournamentId)
      const tournaments = getActiveTournaments()
      setActiveTournaments(tournaments)
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null)
      }
    }
  }

  return (
    <>
      <main className="relative min-h-screen flex flex-col">
      {/* 德州扑克主题飘动emoji背景 */}
      <FloatingEmojiBackground />
      
      {/* 漂浮装饰元素 - 白色背景风格 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gray-200/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-gray-300/20 rounded-full blur-lg animate-bounce" />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gray-200/25 rounded-full blur-md animate-pulse" />
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gray-300/15 rounded-full blur-xl animate-bounce" />
      </div>

      {/* HEADER - LOGO和标题紧贴居中 */}
      <header className="relative z-10 px-4 md:px-8 py-4 md:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-4">
          {/* LOGO */}
          <div className="logo-container">
            <div className="relative logo-wrapper group">
              <Image
                src="/LOGO/LOGO.png"
                alt="Don't Bluff Me Logo"
                width={80}
                height={80}
                className="cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                onClick={() => window.open('https://donbluff.com', '_blank')}
                priority
              />
            </div>
          </div>
          
          {/* 主标题 */}
          <h1 
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black font-orbitron bg-gradient-to-r from-gray-800 via-gray-600 to-gray-900 bg-clip-text text-transparent cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95 hover:from-gray-900 hover:via-black hover:to-gray-700 tracking-wider poker-title whitespace-nowrap"
            onClick={() => window.open('https://donbluff.com', '_blank')}
          >
            Don't Bluff Me
          </h1>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="flex-1 px-8 py-4 md:py-6 pb-24 md:pb-12">
        <div className="relative max-w-6xl mx-auto">
          {/* 桌面端选项卡 */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
              {/* 前两个选项卡 */}
              {pokerFeatures.slice(0, 2).map((feature, index) => (
                <div
                  key={feature.id}
                  onClick={() => setActiveTab(activeTab === feature.id ? null : feature.id)}
                  className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 overflow-hidden ${
                    activeTab === feature.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ 
                    animationDelay: `${index * 150}ms`,
                    height: '100px'
                  }}
                >
                  {/* 选中状态的顶部装饰 */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                    activeTab === feature.id 
                      ? 'bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400' 
                      : 'bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400'
                  }`}></div>
                  
                  {/* 卡片内容 - 水平布局 */}
                  <div className="p-4 flex items-center space-x-3 h-full">
                    {/* 图标区域 */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner transition-all duration-300 group-hover:scale-105 ${
                        activeTab === feature.id 
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:shadow-lg'
                      }`}>
                        <span className="text-xl transform group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </span>
                      </div>
                      {/* 悬浮emoji */}
                      <div className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full shadow-md border flex items-center justify-center transition-all duration-300 ${
                        activeTab === feature.id 
                          ? 'bg-blue-100 border-blue-200 opacity-100 scale-100' 
                          : 'bg-white border-gray-200 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'
                      }`}>
                        <span className="text-xs">
                          {feature.emoji}
                        </span>
                      </div>
                    </div>
                    
                    {/* 文字内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3 className={`text-base font-bold font-rajdhani transition-colors ${
                        activeTab === feature.id 
                          ? 'text-blue-800' 
                          : 'text-gray-800 group-hover:text-black'
                      }`}>
                        {feature.name}
                      </h3>
                    </div>
                    
                    {/* 选中指示器 */}
                    {activeTab === feature.id && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* 悬浮时的背景光效 */}
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                    activeTab === feature.id 
                      ? 'bg-gradient-to-r from-blue-50/50 via-transparent to-blue-100/30 opacity-100' 
                      : 'bg-gradient-to-r from-white/50 via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100'
                  }`}></div>
                </div>
              ))}

              {/* 快速操作按钮 */}
              <div className="flex items-center justify-center relative">
                <button
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className="quick-menu-button group relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center z-10"
                >
                  <span className={`text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 ${showQuickMenu ? 'rotate-45' : ''}`}>+</span>
                  <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* 快速菜单 */}
                {showQuickMenu && (
                  <div 
                    className="quick-menu absolute top-full mt-4 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-2 min-w-64 max-w-xs z-40 animate-fade-in max-h-[80vh] overflow-y-auto"
                  >
                    <div className="space-y-1">
                      {/* 进行中的比赛 */}
                      {activeTournaments.length > 0 && (
                        <>
                          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">进行中的比赛</div>
                          {activeTournaments.map((tournament) => (
                            <div
                              key={tournament.id}
                              className="w-full p-3 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-xl transition-all duration-300 group border border-green-200"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-gray-800 text-sm truncate group-hover:text-green-700 transition-colors">
                                    {tournament.name}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                      {tournament.game_type}
                                    </span>
                                    <span className="text-gray-500">{tournament.hand_count || 0} 手牌</span>
                                  </div>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => {
                                      setSelectedTournament(tournament)
                                      setActiveTab('record')
                                      setShowQuickMenu(false)
                                    }}
                                    className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
                                    title="添加手牌"
                                  >
                                    <span className="text-sm">+</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleFinishTournament(tournament.id)
                                    }}
                                    className="w-7 h-7 bg-gray-400 hover:bg-gray-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                    title="结束比赛"
                                  >
                                    <span className="text-xs">✓</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="border-t border-gray-200 my-2"></div>
                        </>
                      )}

                      {/* 新增比赛 */}
                      <button
                        onClick={() => {
                          setShowTournamentModal(true)
                          setShowQuickMenu(false)
                        }}
                        className="w-full flex items-center space-x-3 p-4 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 rounded-xl transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 group-hover:text-orange-700 transition-colors">新增比赛</div>
                          <div className="text-xs text-gray-500 group-hover:text-orange-600">创建新的比赛记录</div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-orange-500">→</span>
                        </div>
                      </button>
                      
                      {/* 新增手牌 */}
                      <button
                        onClick={() => {
                          setSelectedTournament(null)
                          setActiveTab('record')
                          setShowQuickMenu(false)
                        }}
                        className="w-full flex items-center space-x-3 p-4 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all duration-300 group"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <span className="text-2xl">✏️</span>
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 group-hover:text-blue-700 transition-colors">新增手牌</div>
                          <div className="text-xs text-gray-500 group-hover:text-blue-600">记录新的手牌数据</div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-blue-500">→</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 后两个选项卡 */}
              {pokerFeatures.slice(2).map((feature, index) => (
                <div
                  key={feature.id}
                  onClick={() => setActiveTab(activeTab === feature.id ? null : feature.id)}
                  className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 overflow-hidden ${
                    activeTab === feature.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ 
                    animationDelay: `${(index + 2) * 150}ms`,
                    height: '100px'
                  }}
                >
                  {/* 选中状态的顶部装饰 */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
                    activeTab === feature.id 
                      ? 'bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400' 
                      : 'bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400'
                  }`}></div>
                  
                  {/* 卡片内容 - 水平布局 */}
                  <div className="p-4 flex items-center space-x-3 h-full">
                    {/* 图标区域 */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-inner transition-all duration-300 group-hover:scale-105 ${
                        activeTab === feature.id 
                          ? 'bg-gradient-to-br from-blue-100 to-blue-200 shadow-lg' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:shadow-lg'
                      }`}>
                        <span className="text-xl transform group-hover:scale-110 transition-transform duration-300">
                          {feature.icon}
                        </span>
                      </div>
                      {/* 悬浮emoji */}
                      <div className={`absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full shadow-md border flex items-center justify-center transition-all duration-300 ${
                        activeTab === feature.id 
                          ? 'bg-blue-100 border-blue-200 opacity-100 scale-100' 
                          : 'bg-white border-gray-200 opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'
                      }`}>
                        <span className="text-xs">
                          {feature.emoji}
                        </span>
                      </div>
                    </div>
                    
                    {/* 文字内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3 className={`text-base font-bold font-rajdhani transition-colors ${
                        activeTab === feature.id 
                          ? 'text-blue-800' 
                          : 'text-gray-800 group-hover:text-black'
                      }`}>
                        {feature.name}
                      </h3>
                    </div>
                    
                    {/* 选中指示器 */}
                    {activeTab === feature.id && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* 悬浮时的背景光效 */}
                  <div className={`absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none ${
                    activeTab === feature.id 
                      ? 'bg-gradient-to-r from-blue-50/50 via-transparent to-blue-100/30 opacity-100' 
                      : 'bg-gradient-to-r from-white/50 via-transparent to-gray-50/30 opacity-0 group-hover:opacity-100'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* 移动端底部导航栏 */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="bg-white border-t border-gray-200 shadow-2xl">
              <div className="flex items-center justify-around py-2 px-4">
                {/* 左侧两个选项卡 */}
                {pokerFeatures.slice(0, 2).map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(activeTab === feature.id ? null : feature.id)}
                    className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-300 ${
                      activeTab === feature.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-xs font-medium">{feature.name}</span>
                  </button>
                ))}

                {/* 中间快速操作按钮 */}
                <div className="relative">
                  <button
                    onClick={() => setShowQuickMenu(!showQuickMenu)}
                    className="quick-menu-button relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300"
                  >
                    <span className={`text-white text-2xl font-bold transition-transform duration-300 ${showQuickMenu ? 'rotate-45' : ''}`}>+</span>
                  </button>

                  {/* 移动端快速菜单 */}
                  {showQuickMenu && (
                    <div 
                      className="quick-menu absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-2 min-w-64 max-w-xs z-50 animate-fade-in max-h-[60vh] overflow-y-auto"
                    >
                      <div className="space-y-1">
                        {/* 进行中的比赛 */}
                        {activeTournaments.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">进行中的比赛</div>
                            {activeTournaments.map((tournament) => (
                              <div
                                key={tournament.id}
                                className="w-full p-2.5 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 rounded-xl transition-all duration-300 group border border-green-200"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-gray-800 text-xs truncate group-hover:text-green-700 transition-colors">
                                      {tournament.name}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-600">
                                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">
                                        {tournament.game_type}
                                      </span>
                                      <span className="text-gray-500">{tournament.hand_count || 0} 手牌</span>
                                    </div>
                                  </div>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button
                                      onClick={() => {
                                        setSelectedTournament(tournament)
                                        setActiveTab('record')
                                        setShowQuickMenu(false)
                                      }}
                                      className="w-7 h-7 bg-blue-500 active:bg-blue-600 text-white rounded-lg flex items-center justify-center transition-colors"
                                      title="添加手牌"
                                    >
                                      <span className="text-sm">+</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleFinishTournament(tournament.id)
                                      }}
                                      className="w-7 h-7 bg-gray-400 active:bg-gray-500 text-white rounded-lg flex items-center justify-center transition-colors"
                                      title="结束比赛"
                                    >
                                      <span className="text-xs">✓</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div className="border-t border-gray-200 my-2"></div>
                          </>
                        )}

                        {/* 新增比赛 */}
                        <button
                          onClick={() => {
                            setShowTournamentModal(true)
                            setShowQuickMenu(false)
                          }}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 rounded-xl transition-all duration-300 active:scale-95 group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <span className="text-xl">🏆</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800 text-sm group-hover:text-orange-700 transition-colors">新增比赛</div>
                            <div className="text-xs text-gray-500 group-hover:text-orange-600">创建新的比赛记录</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-orange-500 text-sm">→</span>
                          </div>
                        </button>
                        
                        {/* 新增手牌 */}
                        <button
                          onClick={() => {
                            setSelectedTournament(null)
                            setActiveTab('record')
                            setShowQuickMenu(false)
                          }}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 rounded-xl transition-all duration-300 active:scale-95 group"
                        >
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <span className="text-xl">✏️</span>
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-800 text-sm group-hover:text-blue-700 transition-colors">新增手牌</div>
                            <div className="text-xs text-gray-500 group-hover:text-blue-600">记录新的手牌数据</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-blue-500 text-sm">→</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧两个选项卡 */}
                {pokerFeatures.slice(2).map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(activeTab === feature.id ? null : feature.id)}
                    className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-300 ${
                      activeTab === feature.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{feature.icon}</span>
                    <span className="text-xs font-medium">{feature.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 手牌记录泡泡UI长条 - 只在游览手牌时显示 */}
          {activeTab === 'browse' && (
            <div className="mb-8">
              {/* 示例手牌记录 - 响应式卡片设计 */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-5 mb-4 hover:shadow-xl transition-all duration-300 cursor-pointer group">
                {/* 移动端垂直布局，桌面端水平布局 */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                  {/* 手牌和基本信息 */}
                  <div className="flex items-center space-x-3 md:space-x-6 flex-1 min-w-0">
                    {/* 手牌 */}
                    <div className="flex space-x-1.5 md:space-x-2 bg-gray-50 rounded-lg p-2 md:p-3 flex-shrink-0">
                      <span className="text-red-500 font-bold text-base md:text-lg">A♥️</span>
                      <span className="text-gray-800 font-bold text-base md:text-lg">K♠️</span>
                    </div>
                    
                    {/* 比赛信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 font-rajdhani text-sm md:text-base truncate mb-1.5 md:mb-1">
                        WSOP Main Event
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-3 text-xs md:text-sm text-gray-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">BTN</span>
                        <span className="text-green-600 font-medium whitespace-nowrap">+2,500 chips</span>
                        <span className="text-gray-500 whitespace-nowrap">6-Max</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 时间和展开按钮 */}
                  <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 flex-shrink-0">
                    <div className="text-left md:text-right text-xs text-gray-500 whitespace-nowrap">
                      <div>2024-12-12 15:30</div>
                    </div>
                    <div className="w-8 h-8 md:w-6 md:h-6 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <span className="text-sm md:text-xs group-hover:text-blue-600">▶</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 空状态 */}
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl mb-2 block">🃏</span>
                <p className="text-sm">暂无手牌记录</p>
                <p className="text-xs mt-1">开始记录你的手牌吧！</p>
              </div>
            </div>
          )}

          {/* 内容显示区域 */}
          {activeTab && activeTab !== 'browse' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 animate-fade-in">
              <div className="max-w-4xl mx-auto">
                
                {activeTab === 'record' && (
                  <div>
                    <h2 className="text-2xl font-bold font-rajdhani text-gray-800 mb-6 flex items-center gap-3">
                      <span className="text-3xl">✏️</span>
                      记录手牌
                      {selectedTournament && (
                        <span className="text-sm bg-green-500 text-white px-3 py-1 rounded-full font-normal">
                          关联到：{selectedTournament.name}
                        </span>
                      )}
                    </h2>
                    <HandRecordModal
                      isOpen={true}
                      onClose={() => {}} 
                      onSave={handleSaveHand}
                      isInline={true}
                      tournament={selectedTournament}
                    />
                  </div>
                )}
                
                {activeTab === 'my' && (
                  <div>
                    <h2 className="text-2xl font-bold font-rajdhani text-gray-800 mb-6 flex items-center gap-3">
                      <span className="text-3xl">🃏</span>
                      我的手牌
                    </h2>
                    <div className="space-y-4">
                      <p className="text-gray-600">这里将显示个人手牌收藏和管理功能</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">收藏夹</h4>
                          <p className="text-sm text-gray-600 mb-4">保存重要手牌</p>
                          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors">
                            查看收藏
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">我的发布</h4>
                          <p className="text-sm text-gray-600 mb-4">分享手牌和心得</p>
                          <button className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors">
                            查看发布
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'tournaments' && (
                  <div>
                    <h2 className="text-2xl font-bold font-rajdhani text-gray-800 mb-6 flex items-center gap-3">
                      <span className="text-3xl">🏆</span>
                      我的比赛
                    </h2>
                    <div className="space-y-4">
                      <p className="text-gray-600">这里将显示参加的比赛记录和成绩</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">进行中</h4>
                          <p className="text-sm text-gray-600 mb-4">当前参加的比赛</p>
                          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors">
                            查看详情
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">历史战绩</h4>
                          <p className="text-sm text-gray-600 mb-4">过往比赛成绩</p>
                          <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors">
                            查看战绩
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-3">统计分析</h4>
                          <p className="text-sm text-gray-600 mb-4">比赛数据分析</p>
                          <button className="bg-teal-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-600 transition-colors">
                            查看统计
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </main>

      {/* 版权信息 - 固定在页面底部 */}
      <footer className="absolute bottom-0 left-0 right-0 py-6 text-center">
        <p className="text-gray-500 text-sm font-rajdhani">
          © 2024 DON BLUFF LLC. All rights reserved.
        </p>
      </footer>

      {/* TournamentModal */}
      <TournamentModal
        isOpen={showTournamentModal}
        onClose={() => setShowTournamentModal(false)}
        onSave={handleCreateTournament}
      />
    </>
  )
}
