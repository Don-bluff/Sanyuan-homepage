'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { HandRecordModal } from '@/components/poker/HandRecordModal'
import { TournamentModal } from '@/components/poker/TournamentModal'
import { FinishTournamentModal } from '@/components/poker/FinishTournamentModal'
import { PokerCard } from '@/components/poker/PokerCard'
import { PreflopTraining } from '@/components/poker/PreflopTraining'
import { createHandRecord } from '@/lib/api/hands'
import { HandRecord, Tournament } from '@/types/poker'
import { getActiveTournaments, getFinishedTournaments, createTournament, finishTournament, incrementHandCount } from '@/lib/api/tournaments'

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
    id: 'home',
    name: '首页',
    icon: '🏠',
    emoji: '🎯'
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
  const [activeTab, setActiveTab] = useState<'home' | 'record' | 'my' | 'tournaments' | 'preflopTraining' | null>('home')
  const [showQuickMenu, setShowQuickMenu] = useState(false)
  const [showTournamentModal, setShowTournamentModal] = useState(false)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [showPreflopTraining, setShowPreflopTraining] = useState(false)
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([])
  const [finishedTournaments, setFinishedTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [finishingTournament, setFinishingTournament] = useState<Tournament | null>(null)
  const [expandedHandIds, setExpandedHandIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const handsPerPage = 10
  
  // 登录相关状态
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [userDisplayName, setUserDisplayName] = useState('')
  
  // 切换展开/折叠
  const toggleExpand = (handId: string) => {
    setExpandedHandIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(handId)) {
        newSet.delete(handId)
      } else {
        newSet.add(handId)
      }
      return newSet
    })
  }
  
  // 登录处理
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginEmail && loginPassword) {
      // 后续会接入Supabase认证
      setIsLoggedIn(true)
      setUserDisplayName(loginEmail.split('@')[0])
      alert('登录成功！')
    } else {
      alert('请输入邮箱和密码')
    }
  }
  
  // 登出处理
  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoginEmail('')
    setLoginPassword('')
    setUserDisplayName('')
    alert('已退出登录')
  }
  
  // 示例手牌数据
  const sampleHands = [
    {
      id: 'demo-1',
      heroCards: [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'spades' }
      ],
      heroPosition: 'BTN',
      heroStack: 45,
      tournament: 'WSOP Main Event',
      gameType: '6-Max',
      blinds: '50/100/100',
      currentPlayers: 45,
      startingPlayers: 180,
      moneyBubble: 27,
      tags: ['SRP', 'BTN vs BB', 'IP', '3-Bet Pot'],
      date: '2024-12-12',
      time: '15:30'
    },
    {
      id: 'demo-2',
      heroCards: [
        { rank: 'Q', suit: 'spades' },
        { rank: 'Q', suit: 'clubs' }
      ],
      heroPosition: 'CO',
      heroStack: 82,
      tournament: 'PokerStars Sunday Million',
      gameType: '9-Max',
      blinds: '100/200/200',
      currentPlayers: 18,
      startingPlayers: 150,
      moneyBubble: 21,
      tags: ['4-Bet Pot', 'CO vs BTN', 'OOP', 'High Stakes'],
      date: '2024-12-11',
      time: '20:45'
    }
  ]

  // 加载比赛数据
  useEffect(() => {
    const active = getActiveTournaments()
    const finished = getFinishedTournaments()
    setActiveTournaments(active)
    setFinishedTournaments(finished)
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
      setActiveTab('my')
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

  const handleFinishTournament = (data: {
    total_entries: number
    finish_position: number
    cash_out: number
  }) => {
    if (!finishingTournament) return
    
    finishTournament(finishingTournament.id, data)
    
    // 刷新列表
    const active = getActiveTournaments()
    const finished = getFinishedTournaments()
    setActiveTournaments(active)
    setFinishedTournaments(finished)
    
    if (selectedTournament?.id === finishingTournament.id) {
      setSelectedTournament(null)
    }
    
    setFinishingTournament(null)
    alert('比赛已结束！')
  }
  
  const handleOpenFinishModal = (tournament: Tournament) => {
    setFinishingTournament(tournament)
    setShowFinishModal(true)
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
      <div className="flex-1 px-1 md:px-8 py-2 md:py-6 pb-24 md:pb-12">
        <div className="relative max-w-6xl mx-auto">
          {/* 桌面端选项卡 */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {/* 所有选项卡 */}
              {pokerFeatures.map((feature, index) => (
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
            </div>
          </div>

          {/* 移动端底部导航栏 */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="bg-white border-t border-gray-200 shadow-2xl">
              <div className="flex items-center justify-around py-2 px-4">
                {/* 所有选项卡 */}
                {pokerFeatures.map((feature) => (
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


          {/* 内容显示区域 */}
          {activeTab && (
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-gray-200 p-1 md:p-8 animate-fade-in">
              <div className="max-w-4xl mx-auto">
                
                {activeTab === 'home' && (
                  <div className="text-center py-8 md:py-12">
                    {/* 登录区域 */}
                    <div className="max-w-md mx-auto mb-6 md:mb-10 px-2">
                      {!isLoggedIn ? (
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl shadow-lg border-2 border-gray-200 p-4 md:p-8">
                          <div className="mb-4 md:mb-6">
                            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">
                              登录账号
                            </h3>
                            <p className="text-xs md:text-sm text-gray-600">
                              登录后解锁更多功能
                            </p>
                          </div>
                          
                          <form onSubmit={handleLogin} className="space-y-3 md:space-y-4">
                            <div className="text-left">
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                邮箱
                              </label>
                              <input
                                type="email"
                                value={loginEmail}
                                onChange={(e) => setLoginEmail(e.target.value)}
                                placeholder="请输入邮箱"
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                              />
                            </div>
                            
                            <div className="text-left">
                              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
                                密码
                              </label>
                              <input
                                type="password"
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder="请输入密码"
                                className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                required
                              />
                            </div>
                            
                            <button
                              type="submit"
                              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2.5 md:py-4 rounded-lg transition-all duration-300 hover:shadow-lg text-sm md:text-base"
                            >
                              登录
                            </button>
                          </form>
                          
                          <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-500">
                            暂无账号？<button className="text-blue-600 hover:text-blue-700 font-medium">注册</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl md:rounded-2xl shadow-lg border-2 border-green-200 p-4 md:p-8">
                          <div className="mb-3 md:mb-4">
                            <h3 className="text-lg md:text-2xl font-bold text-gray-800 mb-1 md:mb-2">
                              欢迎回来！
                            </h3>
                            <p className="text-sm md:text-base text-gray-700 font-medium">
                              {userDisplayName || loginEmail}
                            </p>
                          </div>
                          
                          <button
                            onClick={handleLogout}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-medium px-5 md:px-6 py-2 md:py-3 rounded-lg transition-colors text-sm md:text-base"
                          >
                            退出登录
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* 功能卡片 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      <button
                        onClick={() => setShowTrainingModal(true)}
                        className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-200 rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="text-5xl md:text-6xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">🎯</div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800">开始训练</h3>
                      </button>
                      
                      <button
                        onClick={() => alert('关于我们页面即将上线！')}
                        className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 border-2 border-purple-200 rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="text-5xl md:text-6xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">ℹ️</div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800">关于我们</h3>
                      </button>
                      
                      <button
                        onClick={() => alert('了解更多页面即将上线！')}
                        className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-2 border-orange-200 rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="text-5xl md:text-6xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">📖</div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-800">了解更多</h3>
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'record' && (
                  <div>
                    <h2 className="hidden md:flex text-2xl font-bold font-rajdhani text-gray-800 mb-6 items-center gap-3">
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
                    <h2 className="text-xl md:text-2xl font-bold font-rajdhani text-gray-800 mb-4 md:mb-6 flex items-center gap-3">
                      <span className="text-2xl md:text-3xl">🃏</span>
                      我的手牌
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-normal">
                        {sampleHands.length} 条记录
                      </span>
                    </h2>
                    
                    {/* 手牌列表 */}
                    <div className="space-y-3 md:space-y-4">
                      {sampleHands
                        .slice((currentPage - 1) * handsPerPage, currentPage * handsPerPage)
                        .map((hand) => {
                          const isExpanded = expandedHandIds.has(hand.id)
                          return (
                            <div 
                              key={hand.id} 
                              className="bg-white rounded-xl md:rounded-2xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                            >
                              {/* 折叠状态 - 基本信息 */}
                              <div 
                                className="p-2 md:p-4 bg-gradient-to-r from-blue-50 to-purple-50 cursor-pointer"
                                onClick={() => toggleExpand(hand.id)}
                              >
                                {/* 第一行：比赛名称和展开按钮 */}
                                <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
                                  <h3 className="font-bold text-sm md:text-lg text-gray-800 font-rajdhani flex-1 min-w-0 truncate">
                                    {hand.tournament}
                                  </h3>
                                  <button 
                                    className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-all duration-300 transform"
                                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                  >
                                    <span className="text-sm md:text-lg">▼</span>
                                  </button>
                                </div>
                                
                                {/* 第二行：游戏类型、盲注、时间 */}
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
                                  <span className="text-[10px] md:text-xs text-gray-700 bg-white px-2 py-0.5 md:py-1 rounded-full font-medium border border-gray-200">
                                    {hand.gameType}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-gray-700 bg-white px-2 py-0.5 md:py-1 rounded-full font-medium border border-gray-200">
                                    {hand.blinds}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-gray-500 bg-white/70 px-2 py-0.5 md:py-1 rounded-md border border-gray-200">
                                    {hand.date} {hand.time}
                                  </span>
                                </div>
                                
                                {/* 第三行：比赛人数和钱圈 */}
                                <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
                                  <div className="bg-white/70 px-2 md:px-3 py-1 md:py-1.5 rounded-md border border-gray-200">
                                    <div className="text-[8px] md:text-[10px] text-gray-600">比赛人数</div>
                                    <div className="font-bold text-[10px] md:text-xs text-gray-800">
                                      {hand.currentPlayers} / {hand.startingPlayers}
                                    </div>
                                  </div>
                                  <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md border ${
                                    hand.currentPlayers <= hand.moneyBubble
                                      ? 'bg-green-50 border-green-200'
                                      : 'bg-orange-50 border-orange-200'
                                  }`}>
                                    <div className="text-[8px] md:text-[10px] text-gray-600">钱圈</div>
                                    <div className="font-bold text-[10px] md:text-xs text-gray-800">
                                      {hand.moneyBubble}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* 第四行：标签 */}
                                <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                                  {hand.tags.map((tag: string, idx: number) => {
                                    const colors = [
                                      'bg-blue-100 text-blue-700 border-blue-200',
                                      'bg-purple-100 text-purple-700 border-purple-200',
                                      'bg-green-100 text-green-700 border-green-200',
                                      'bg-orange-100 text-orange-700 border-orange-200',
                                      'bg-red-100 text-red-700 border-red-200',
                                      'bg-pink-100 text-pink-700 border-pink-200'
                                    ]
                                    return (
                                      <span key={idx} className={`${colors[idx % colors.length]} px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium whitespace-nowrap border`}>
                                        {tag}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                              
                              {/* 展开状态 - 行动线详情 */}
                              {isExpanded && (
                                <div className="border-t border-gray-200 bg-gray-50 p-2 md:p-4 space-y-2 md:space-y-3 animate-fade-in">
                                  {/* 翻牌前 */}
                                  <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border border-blue-200">
                                    <h4 className="font-bold text-xs md:text-sm text-blue-700 mb-2">♠️ 翻牌前 (Preflop)</h4>
                                    <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center">UTG</span>
                                        <span className="text-red-600 font-medium">Fold</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center">CO</span>
                                        <span className="text-orange-600 font-medium">Raise</span>
                                        <span className="text-gray-600">3BB</span>
                                      </div>
                                      {/* HERO行动 */}
                                      <div className="flex items-start gap-1.5 md:gap-2 bg-yellow-50 p-1.5 md:p-2 rounded-md border border-yellow-300">
                                        <div className="flex flex-col gap-1 flex-1">
                                          <div className="flex items-center gap-1.5 md:gap-2">
                                            <span className="bg-yellow-300 px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center text-gray-800">
                                              {hand.heroPosition}
                                            </span>
                                            <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                                            <span className="text-green-600 font-medium">Call</span>
                                            <span className="text-gray-600">3BB</span>
                                          </div>
                                          {/* Hero手牌 */}
                                          <div className="flex items-center gap-1.5 md:gap-2">
                                            <span className="text-[9px] md:text-[10px] text-gray-600">手牌:</span>
                                            <div className="flex gap-0.5 md:gap-1">
                                              {hand.heroCards.map((card: any, idx: number) => (
                                                <PokerCard key={idx} rank={card.rank} suit={card.suit} size="small" />
                                              ))}
                                            </div>
                                            <span className="text-[9px] md:text-[10px] text-gray-500">筹码: {hand.heroStack}BB</span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center">BB</span>
                                        <span className="text-green-600 font-medium">Call</span>
                                        <span className="text-gray-600">3BB</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 翻牌圈 */}
                                  <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border border-green-200">
                                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                                      <h4 className="font-bold text-xs md:text-sm text-green-700 whitespace-nowrap">🎲 翻牌圈 (Flop)</h4>
                                      <div className="flex gap-0.5 md:gap-1">
                                        <div className="w-6 h-8 md:w-8 md:h-11 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                          <span className="text-red-500 text-[9px] md:text-[10px] font-bold">Q</span>
                                          <span className="text-red-500 text-[10px] md:text-xs">♥️</span>
                                        </div>
                                        <div className="w-6 h-8 md:w-8 md:h-11 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                          <span className="text-red-500 text-[9px] md:text-[10px] font-bold">J</span>
                                          <span className="text-red-500 text-[10px] md:text-xs">♦️</span>
                                        </div>
                                        <div className="w-6 h-8 md:w-8 md:h-11 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                          <span className="text-gray-800 text-[9px] md:text-[10px] font-bold">10</span>
                                          <span className="text-gray-800 text-[10px] md:text-xs">♠️</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center">BB</span>
                                        <span className="text-blue-600 font-medium">Check</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-50 p-1.5 md:p-2 rounded-md border border-yellow-300">
                                        <span className="bg-yellow-300 px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center text-gray-800">{hand.heroPosition}</span>
                                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                                        <span className="text-orange-600 font-medium">Bet</span>
                                        <span className="text-gray-600">5BB</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 md:gap-2">
                                        <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center">BB</span>
                                        <span className="text-red-600 font-medium">Fold</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 转牌圈 */}
                                  <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border border-orange-200">
                                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                                      <h4 className="font-bold text-xs md:text-sm text-orange-700 whitespace-nowrap">🎰 转牌圈 (Turn)</h4>
                                      <div className="w-6 h-8 md:w-8 md:h-11 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-red-500 text-[9px] md:text-[10px] font-bold">9</span>
                                        <span className="text-red-500 text-[10px] md:text-xs">♥️</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
                                      <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-50 p-1.5 md:p-2 rounded-md border border-yellow-300">
                                        <span className="bg-yellow-300 px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center text-gray-800">{hand.heroPosition}</span>
                                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                                        <span className="text-green-600 font-medium">Check</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 河牌圈 */}
                                  <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border border-red-200">
                                    <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
                                      <h4 className="font-bold text-xs md:text-sm text-red-700 whitespace-nowrap">🎯 河牌圈 (River)</h4>
                                      <div className="w-6 h-8 md:w-8 md:h-11 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                        <span className="text-gray-800 text-[9px] md:text-[10px] font-bold">2</span>
                                        <span className="text-gray-800 text-[10px] md:text-xs">♣️</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
                                      <div className="flex items-center gap-1.5 md:gap-2 bg-yellow-50 p-1.5 md:p-2 rounded-md border border-yellow-300">
                                        <span className="bg-yellow-300 px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center text-gray-800">{hand.heroPosition}</span>
                                        <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                                        <span className="text-green-600 font-medium">Check</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 结果 */}
                                  <div className="bg-green-50 rounded-md p-2 border border-green-300">
                                    <div className="flex items-center justify-between text-xs md:text-sm">
                                      <span className="font-medium text-gray-700">结果</span>
                                      <span className="text-green-600 font-bold">+15 BB</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                    
                    {/* 分页 */}
                    {sampleHands.length > handsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            currentPage === 1
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          上一页
                        </button>
                        
                        <div className="flex items-center gap-1 md:gap-2">
                          {Array.from({ length: Math.ceil(sampleHands.length / handsPerPage) }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs md:text-sm font-medium transition-all ${
                                currentPage === page
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(sampleHands.length / handsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(sampleHands.length / handsPerPage)}
                          className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                            currentPage === Math.ceil(sampleHands.length / handsPerPage)
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          下一页
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'tournaments' && (
                  <div className="space-y-4 md:space-y-6">
                    {/* 统计面板 */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-blue-200 shadow-lg">
                      <h2 className="text-xl md:text-2xl font-bold font-rajdhani text-gray-800 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                        <span className="text-2xl md:text-3xl">📊</span>
                        比赛统计
                      </h2>
                      <div className="grid grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
                          <div className="text-xs md:text-sm text-gray-600 mb-1">总比赛场数</div>
                          <div className="text-2xl md:text-3xl font-bold text-blue-600">
                            {activeTournaments.length + finishedTournaments.length}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
                          <div className="text-xs md:text-sm text-gray-600 mb-1">总买入</div>
                          <div className="text-2xl md:text-3xl font-bold text-orange-600">
                            {[...activeTournaments, ...finishedTournaments]
                              .reduce((sum, t) => sum + (t.buy_in || 0), 0)
                              .toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm">
                          <div className="text-xs md:text-sm text-gray-600 mb-1">总Cash Out</div>
                          <div className="text-2xl md:text-3xl font-bold text-green-600">
                            {finishedTournaments
                              .reduce((sum, t) => sum + (t.cash_out || 0), 0)
                              .toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 进行中的比赛 */}
                    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
                        <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                          <span className="text-xl md:text-2xl">🎮</span>
                          进行中
                        </h3>
                        <button
                          onClick={() => setShowTournamentModal(true)}
                          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                          <span className="text-lg md:text-xl">➕</span>
                          添加比赛
                        </button>
                      </div>

                      {activeTournaments.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">暂无进行中的比赛</p>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {activeTournaments.map((tournament) => (
                            <div
                              key={tournament.id}
                              className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 md:p-4 border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md"
                            >
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-1">
                                  <h4 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">
                                    {tournament.name}
                                  </h4>
                                  <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600">
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      {tournament.game_type === '6max' ? '6-Max' : tournament.game_type === '9max' ? '9-Max' : '自定义'}
                                    </span>
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      {tournament.blind_mode === 'chips' 
                                        ? `${tournament.small_blind}/${tournament.big_blind}${tournament.ante ? `/${tournament.ante}` : ''}`
                                        : `${tournament.small_blind}bb/${tournament.big_blind}bb${tournament.ante ? `/${tournament.ante}bb` : ''}`
                                      }
                                    </span>
                                    {tournament.buy_in && (
                                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                        买入: {tournament.buy_in}
                                      </span>
                                    )}
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      手牌数: {tournament.hand_count || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                  <button
                                    onClick={() => {
                                      setSelectedTournament(tournament)
                                      setActiveTab('record')
                                    }}
                                    className="flex-1 sm:flex-initial bg-green-500 hover:bg-green-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                                  >
                                    关联手牌
                                  </button>
                                  <button
                                    onClick={() => handleOpenFinishModal(tournament)}
                                    className="flex-1 sm:flex-initial bg-red-500 hover:bg-red-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"
                                  >
                                    结束比赛
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 历史战绩 */}
                    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-200">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4 md:mb-6">
                        <span className="text-xl md:text-2xl">📜</span>
                        历史战绩
                      </h3>

                      {finishedTournaments.length === 0 ? (
                        <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">暂无历史战绩</p>
                      ) : (
                        <div className="space-y-3 md:space-y-4">
                          {finishedTournaments.map((tournament) => (
                            <div
                              key={tournament.id}
                              className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-3 md:p-4 border-2 border-purple-200 hover:border-purple-300 transition-all duration-300 hover:shadow-md"
                            >
                              <div className="flex flex-col">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 md:mb-3">
                                  <h4 className="text-base md:text-lg font-bold text-gray-800">
                                    {tournament.name}
                                  </h4>
                                  <div className="text-xs md:text-sm text-gray-500">
                                    {new Date(tournament.created_at).toLocaleDateString('zh-CN')}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                                  <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                    {tournament.game_type === '6max' ? '6-Max' : tournament.game_type === '9max' ? '9-Max' : '自定义'}
                                  </span>
                                  {tournament.buy_in && (
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      买入: {tournament.buy_in}
                                    </span>
                                  )}
                                  {tournament.total_entries && (
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      参赛人数: {tournament.total_entries}
                                    </span>
                                  )}
                                  {tournament.finish_position && (
                                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border border-gray-200">
                                      名次: {tournament.finish_position}
                                    </span>
                                  )}
                                  {tournament.cash_out !== undefined && (
                                    <span className={`bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border ${
                                      tournament.cash_out > 0 ? 'border-green-300 text-green-700' : 'border-gray-200'
                                    }`}>
                                      奖金: {tournament.cash_out}
                                    </span>
                                  )}
                                </div>
                                {tournament.buy_in !== undefined && tournament.cash_out !== undefined && (
                                  <div className={`text-xs md:text-sm font-semibold ${
                                    tournament.cash_out - tournament.buy_in > 0 
                                      ? 'text-green-600' 
                                      : tournament.cash_out - tournament.buy_in < 0 
                                      ? 'text-red-600' 
                                      : 'text-gray-600'
                                  }`}>
                                    盈亏: {tournament.cash_out - tournament.buy_in > 0 ? '+' : ''}{tournament.cash_out - tournament.buy_in}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
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

      {/* FinishTournamentModal */}
      {finishingTournament && (
        <FinishTournamentModal
          isOpen={showFinishModal}
          onClose={() => {
            setShowFinishModal(false)
            setFinishingTournament(null)
          }}
          onFinish={handleFinishTournament}
          tournamentName={finishingTournament.name}
        />
      )}

      {/* 训练选择模态框 */}
      {showTrainingModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowTrainingModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-rajdhani text-gray-800 flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                选择训练模式
              </h2>
              <button
                onClick={() => setShowTrainingModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
              >
                ×
              </button>
            </div>

            {/* 训练选项卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* 翻前训练 */}
              <button
                onClick={() => {
                  setShowTrainingModal(false)
                  setShowPreflopTraining(true)
                }}
                className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-6xl md:text-7xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    🃏
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                    翻前训练
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    练习翻前决策，掌握起手牌范围和位置策略
                  </p>
                </div>
              </button>

              {/* 模拟实战 */}
              <button
                onClick={() => {
                  setShowTrainingModal(false)
                  alert('模拟实战功能即将上线！')
                }}
                className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-green-300 rounded-xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-left"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="text-6xl md:text-7xl mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                    🎲
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                    模拟实战
                  </h3>
                  <p className="text-sm md:text-base text-gray-600">
                    完整模拟真实牌局，从翻前到河牌全流程训练
                  </p>
                </div>
              </button>
            </div>

            {/* 提示信息 */}
            <div className="mt-6 md:mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs md:text-sm text-gray-600 text-center">
                💡 提示：选择适合你的训练模式，持续练习提升牌技
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 翻前训练模态框 */}
      {showPreflopTraining && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto"
          onClick={() => setShowPreflopTraining(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <PreflopTraining onClose={() => setShowPreflopTraining(false)} />
          </div>
        </div>
      )}

    </>
  )
}
