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
  const [currentHandIndex, setCurrentHandIndex] = useState(0)
  const [likedHands, setLikedHands] = useState<Set<string>>(new Set())
  const [savedHands, setSavedHands] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right' | null>(null)
  const [comments, setComments] = useState([
    {
      id: '1',
      author: 'PokerPro88',
      content: '这手牌打得很漂亮！翻牌圈的check-raise时机抓得很准。',
      timestamp: '2小时前',
      avatar: '🎮'
    },
    {
      id: '2',
      author: 'CardShark',
      content: '我觉得turn应该bet小一点，这样可以保护range。',
      timestamp: '1小时前',
      avatar: '🦈'
    },
    {
      id: '3',
      author: 'AllInAndy',
      content: '对手持有A♠️ A♣️真是太不幸了，Set Over Set没办法',
      timestamp: '30分钟前',
      avatar: '🃏'
    }
  ])
  const [newComment, setNewComment] = useState('')
  
  // 切换点赞
  const toggleLike = (handId: string) => {
    setLikedHands(prev => {
      const newSet = new Set(prev)
      if (newSet.has(handId)) {
        newSet.delete(handId)
      } else {
        newSet.add(handId)
      }
      return newSet
    })
  }
  
  // 切换收藏
  const toggleSave = (handId: string) => {
    setSavedHands(prev => {
      const newSet = new Set(prev)
      if (newSet.has(handId)) {
        newSet.delete(handId)
      } else {
        newSet.add(handId)
      }
      return newSet
    })
  }
  
  // 添加评论
  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = {
      id: Date.now().toString(),
      author: '我',
      content: newComment,
      timestamp: '刚刚',
      avatar: '👤'
    }

    setComments([...comments, comment])
    setNewComment('')
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
  
  // 切换手牌的函数，带滑动动画
  const handleNextHand = () => {
    setSlideDirection('left')
    setTimeout(() => {
      setCurrentHandIndex((prev) => (prev + 1) % sampleHands.length)
      setSlideDirection(null)
    }, 300)
  }
  
  const handlePrevHand = () => {
    setSlideDirection('right')
    setTimeout(() => {
      setCurrentHandIndex((prev) => (prev - 1 + sampleHands.length) % sampleHands.length)
      setSlideDirection(null)
    }, 300)
  }

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

  // 触摸滑动切换卡片（移动端）
  useEffect(() => {
    if (activeTab !== 'browse') return

    let touchStartX = 0
    let touchEndX = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      touchEndX = e.touches[0].clientX
    }
    
    const handleTouchEnd = () => {
      const swipeDistance = touchStartX - touchEndX
      const minSwipeDistance = 50 // 最小滑动距离
      
      if (Math.abs(swipeDistance) > minSwipeDistance) {
        if (swipeDistance > 0) {
          // 向左滑，下一张
          handleNextHand()
        } else {
          // 向右滑，上一张
          handlePrevHand()
        }
      }
    }

    const browseArea = document.getElementById('browse-area')
    if (browseArea) {
      browseArea.addEventListener('touchstart', handleTouchStart, { passive: true })
      browseArea.addEventListener('touchmove', handleTouchMove, { passive: true })
      browseArea.addEventListener('touchend', handleTouchEnd, { passive: true })
      
      return () => {
        browseArea.removeEventListener('touchstart', handleTouchStart)
        browseArea.removeEventListener('touchmove', handleTouchMove)
        browseArea.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [activeTab, sampleHands.length])

  const currentHand = sampleHands[currentHandIndex]

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
              <div className="flex items-center justify-center relative z-[100]">
                <button
                  onClick={() => setShowQuickMenu(!showQuickMenu)}
                  className="quick-menu-button group relative w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center"
                >
                  <span className={`text-white text-3xl font-bold group-hover:scale-110 transition-transform duration-300 ${showQuickMenu ? 'rotate-45' : ''}`}>+</span>
                  <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* 快速菜单 */}
                {showQuickMenu && (
                  <div 
                    className="quick-menu absolute top-full mt-4 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-2 min-w-64 max-w-xs animate-fade-in max-h-[80vh] overflow-y-auto"
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
                <div className="relative z-[100]">
                  <button
                    onClick={() => setShowQuickMenu(!showQuickMenu)}
                    className="quick-menu-button relative w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 active:scale-95 transition-all duration-300"
                  >
                    <span className={`text-white text-2xl font-bold transition-transform duration-300 ${showQuickMenu ? 'rotate-45' : ''}`}>+</span>
                  </button>

                  {/* 移动端快速菜单 */}
                  {showQuickMenu && (
                    <div 
                      className="quick-menu absolute bottom-full mb-4 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border-2 border-blue-100 p-2 min-w-64 max-w-xs animate-fade-in max-h-[60vh] overflow-y-auto"
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

          {/* 手牌记录 - 只在游览手牌时显示 */}
          {activeTab === 'browse' && currentHand && (
            <div id="browse-area" className="relative max-w-6xl mx-auto">
              {/* 滑动提示 - 仅移动端显示 */}
              <div className="md:hidden text-center mb-3 flex items-center justify-center gap-2 text-gray-500 text-sm">
                <span className="animate-swipe-hint">👆</span>
                <span>滑动来切换手牌</span>
              </div>
              
              <div className="flex items-center justify-center px-4 md:px-0">
                {/* 左侧箭头按钮 */}
                <button
                  onClick={handlePrevHand}
                  className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 bg-white/90 md:bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-gray-200 hover:border-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group z-10 mr-2 md:mr-4"
                  aria-label="上一张"
                >
                  <span className="text-lg md:text-2xl text-gray-600 group-hover:text-blue-600 transition-colors">←</span>
                </button>
                
                {/* 当前手牌卡片 */}
                <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden max-w-4xl w-full ${
                  slideDirection === 'left' ? 'animate-slide-out-left' : 
                  slideDirection === 'right' ? 'animate-slide-out-right' : 
                  'animate-slide-in-left'
                }`}>
                  {/* Header部分 - 优化的比赛信息 */}
                  <div className="p-4 md:p-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 border-blue-100">
                    {/* 比赛名称和基本信息 */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-gray-800 font-rajdhani text-base md:text-xl">
                            {currentHand.tournament}
                          </h3>
                          <span className="text-xs md:text-sm text-gray-700 bg-white/70 px-2.5 py-1 rounded-full font-medium border border-gray-200">
                            {currentHand.gameType}
                          </span>
                          <span className="text-xs md:text-sm text-gray-700 bg-white/70 px-2.5 py-1 rounded-full font-medium border border-gray-200">
                            {currentHand.blinds}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-white/70 px-3 py-1.5 rounded-lg border border-gray-200 whitespace-nowrap flex-shrink-0">
                        {currentHand.date} {currentHand.time}
                      </div>
                    </div>
                    
                    {/* 比赛进程信息 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/70 px-2 md:px-3 py-2 rounded-lg border border-gray-200">
                        <div className="text-[10px] md:text-xs text-gray-600 mb-0.5">比赛人数</div>
                        <div className="font-bold text-xs md:text-base text-gray-800">
                          {currentHand.currentPlayers} / {currentHand.startingPlayers}
                        </div>
                      </div>
                      <div className={`px-2 md:px-3 py-2 rounded-lg border ${
                        currentHand.currentPlayers <= currentHand.moneyBubble
                          ? 'bg-green-50 border-green-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <div className="text-[10px] md:text-xs text-gray-600 mb-0.5">钱圈</div>
                        <div className="font-bold text-xs md:text-base text-gray-800">
                          {currentHand.currentPlayers <= currentHand.moneyBubble ? (
                            <span className="text-green-700">{currentHand.moneyBubble}</span>
                          ) : (
                            <span className="text-orange-700">{currentHand.currentPlayers - currentHand.moneyBubble}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 标签组 */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      {currentHand.tags.map((tag: string, idx: number) => {
                        const colors = [
                          'bg-blue-100 text-blue-700 border-blue-200',
                          'bg-purple-100 text-purple-700 border-purple-200',
                          'bg-green-100 text-green-700 border-green-200',
                          'bg-orange-100 text-orange-700 border-orange-200',
                          'bg-red-100 text-red-700 border-red-200',
                          'bg-pink-100 text-pink-700 border-pink-200'
                        ]
                        return (
                          <span key={idx} className={`${colors[idx % colors.length]} px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap border`}>
                            {tag}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                {/* 行动线详情 - 始终展开 */}
                <div className="border-t border-gray-200 bg-gray-50 p-4 md:p-5 space-y-4">
                    {/* 翻牌前 */}
                    <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-blue-200">
                      <h4 className="font-bold text-sm md:text-base text-blue-700 mb-3">♠️ 翻牌前 (Preflop)</h4>
                      <div className="space-y-2 text-xs md:text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded font-medium min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm">UTG</span>
                          <span className="text-red-600 font-medium">Fold</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded font-medium min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm">CO</span>
                          <span className="text-orange-600 font-medium">Raise</span>
                          <span className="text-gray-600">3BB</span>
                        </div>
                        {/* HERO行动 - 特殊显示 */}
                        <div className="flex items-start gap-2 bg-yellow-50 p-2 rounded-lg border-2 border-yellow-300">
                          <div className="flex flex-col gap-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-yellow-300 px-2 py-0.5 rounded font-bold min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm text-gray-800">
                                {currentHand.heroPosition}
                              </span>
                              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">HERO</span>
                              <span className="text-green-600 font-medium">Call</span>
                              <span className="text-gray-600">3BB</span>
                            </div>
                            {/* Hero手牌显示 */}
                              <div className="flex items-center gap-2 ml-1">
                              <span className="text-xs text-gray-600">手牌:</span>
                              <div className="flex gap-1">
                                {currentHand.heroCards.map((card: any, idx: number) => {
                                  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
                                  const suitSymbol = card.suit === 'hearts' ? '♥️' : card.suit === 'diamonds' ? '♦️' : card.suit === 'clubs' ? '♣️' : '♠️'
                                  return (
                                    <div key={idx} className="w-7 h-10 md:w-9 md:h-12 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5">
                                      <span className={`font-bold text-[10px] md:text-xs ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                        {card.rank}
                                      </span>
                                      <span className={`text-xs md:text-sm ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                        {suitSymbol}
                                      </span>
                                    </div>
                                  )
                                })}
                              </div>
                              <span className="text-xs text-gray-500">筹码: {currentHand.heroStack}BB</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded font-medium min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm">BB</span>
                          <span className="text-green-600 font-medium">Call</span>
                          <span className="text-gray-600">3BB</span>
                        </div>
                      </div>
                    </div>

                    {/* 翻牌圈 */}
                    <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-green-200">
                      <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
                        <h4 className="font-bold text-sm md:text-base text-green-700 whitespace-nowrap">🎲 翻牌圈 (Flop)</h4>
                        <div className="flex gap-1 md:gap-1.5">
                          <div className="w-8 h-11 md:w-10 md:h-14 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5 md:gap-1">
                            <span className="text-red-500 text-xs md:text-sm font-bold">Q</span>
                            <span className="text-red-500 text-sm md:text-base">♥️</span>
                          </div>
                          <div className="w-8 h-11 md:w-10 md:h-14 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5 md:gap-1">
                            <span className="text-red-500 text-xs md:text-sm font-bold">J</span>
                            <span className="text-red-500 text-sm md:text-base">♦️</span>
                          </div>
                          <div className="w-8 h-11 md:w-10 md:h-14 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5 md:gap-1">
                            <span className="text-gray-800 text-xs md:text-sm font-bold">10</span>
                            <span className="text-gray-800 text-sm md:text-base">♠️</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs md:text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded font-medium min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm">BB</span>
                          <span className="text-blue-600 font-medium">Check</span>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border-2 border-yellow-300">
                          <span className="bg-yellow-300 px-2 py-0.5 rounded font-bold min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm text-gray-800">{currentHand.heroPosition}</span>
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">HERO</span>
                          <span className="text-orange-600 font-medium">Bet</span>
                          <span className="text-gray-600">5BB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-200 px-2 py-0.5 rounded font-medium min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm">BB</span>
                          <span className="text-red-600 font-medium">Fold</span>
                        </div>
                      </div>
                    </div>

                    {/* 转牌圈 */}
                    <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-orange-200">
                      <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
                        <h4 className="font-bold text-sm md:text-base text-orange-700 whitespace-nowrap">🎰 转牌圈 (Turn)</h4>
                        <div className="w-8 h-11 md:w-10 md:h-14 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5 md:gap-1">
                          <span className="text-red-500 text-xs md:text-sm font-bold">9</span>
                          <span className="text-red-500 text-sm md:text-base">♥️</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs md:text-sm text-gray-700">
                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border-2 border-yellow-300">
                          <span className="bg-yellow-300 px-2 py-0.5 rounded font-bold min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm text-gray-800">{currentHand.heroPosition}</span>
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">HERO</span>
                          <span className="text-green-600 font-medium">Check</span>
                        </div>
                      </div>
                    </div>

                    {/* 河牌圈 */}
                    <div className="bg-white rounded-lg p-3 md:p-4 border-2 border-red-200">
                      <div className="flex items-center gap-2 md:gap-3 mb-3 flex-wrap">
                        <h4 className="font-bold text-sm md:text-base text-red-700 whitespace-nowrap">🎯 河牌圈 (River)</h4>
                        <div className="w-8 h-11 md:w-10 md:h-14 bg-white border-2 border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0.5 md:gap-1">
                          <span className="text-gray-800 text-xs md:text-sm font-bold">2</span>
                          <span className="text-gray-800 text-sm md:text-base">♣️</span>
                        </div>
                      </div>
                      <div className="space-y-2 text-xs md:text-sm text-gray-700">
                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border-2 border-yellow-300">
                          <span className="bg-yellow-300 px-2 py-0.5 rounded font-bold min-w-[40px] md:min-w-[50px] text-center text-xs md:text-sm text-gray-800">{currentHand.heroPosition}</span>
                          <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">HERO</span>
                          <span className="text-green-600 font-medium">Check</span>
                        </div>
                      </div>
                    </div>

                  {/* 结果 */}
                  <div className="bg-green-50 rounded-lg p-3 border border-green-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">结果</span>
                      <span className="text-green-600 font-bold">+15 BB</span>
                    </div>
                  </div>

                  {/* 社交互动按钮 */}
                  <div className="flex items-center justify-around pt-2 border-t border-gray-300">
                    <button 
                      onClick={() => toggleLike(currentHand.id)}
                      className="flex flex-col items-center gap-1 p-3 hover:bg-white rounded-lg transition-all group"
                    >
                      <span className={`text-2xl group-hover:scale-110 transition-transform ${
                        likedHands.has(currentHand.id) ? '' : ''
                      }`}>
                        {likedHands.has(currentHand.id) ? '❤️' : '🤍'}
                      </span>
                      <span className={`text-xs transition-colors ${
                        likedHands.has(currentHand.id) ? 'text-red-600 font-medium' : 'text-gray-600 group-hover:text-red-600'
                      }`}>
                        {likedHands.has(currentHand.id) ? '已点赞' : '点赞'}
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => setShowComments(!showComments)}
                      className="flex flex-col items-center gap-1 p-3 hover:bg-white rounded-lg transition-colors group"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
                      <span className={`text-xs transition-colors ${
                        showComments ? 'text-green-600 font-medium' : 'text-gray-600 group-hover:text-green-600'
                      }`}>
                        {showComments ? '收起' : '评论'}
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => toggleSave(currentHand.id)}
                      className="flex flex-col items-center gap-1 p-3 hover:bg-white rounded-lg transition-all group"
                    >
                      <span className={`text-2xl group-hover:scale-110 transition-transform ${
                        savedHands.has(currentHand.id) ? '' : ''
                      }`}>
                        {savedHands.has(currentHand.id) ? '⭐' : '☆'}
                      </span>
                      <span className={`text-xs transition-colors ${
                        savedHands.has(currentHand.id) ? 'text-yellow-600 font-medium' : 'text-gray-600 group-hover:text-yellow-600'
                      }`}>
                        {savedHands.has(currentHand.id) ? '已收藏' : '收藏'}
                      </span>
                    </button>
                    
                    <button className="flex flex-col items-center gap-1 p-3 hover:bg-white rounded-lg transition-colors group">
                      <span className="text-2xl group-hover:scale-110 transition-transform">📤</span>
                      <span className="text-xs text-gray-600 group-hover:text-purple-600">转发</span>
                    </button>
                  </div>
                </div>
                
                {/* 评论区 - 展开时显示 */}
                {showComments && (
                  <div className="border-t border-gray-200 bg-gray-50 animate-slide-up">
                    {/* 评论列表 */}
                    <div className="p-4 md:p-5 space-y-4 max-h-96 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">评论 ({comments.length})</h4>
                      </div>
                      
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 animate-fade-in">
                          {/* Avatar */}
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-base md:text-xl shadow-md">
                            {comment.avatar}
                          </div>
                          
                          {/* Comment Content */}
                          <div className="flex-1 min-w-0 bg-white rounded-lg p-3 shadow-sm">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-xs md:text-sm text-gray-800">
                                {comment.author}
                              </span>
                              <span className="text-xs text-gray-400">
                                {comment.timestamp}
                              </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-700 leading-relaxed break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 输入框 */}
                    <div className="border-t border-gray-300 bg-white p-3 md:p-4">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && newComment.trim()) {
                              handleAddComment()
                            }
                          }}
                          placeholder="写下你的评论..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className={`px-4 md:px-6 py-2 rounded-lg font-medium text-sm transition-all flex-shrink-0 ${
                            newComment.trim()
                              ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          发送
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        按 Enter 快速发送
                      </div>
                    </div>
                  </div>
                )}
              </div>
                
                {/* 右侧箭头按钮 */}
                <button
                  onClick={handleNextHand}
                  className="flex-shrink-0 w-10 h-10 md:w-14 md:h-14 bg-white/90 md:bg-white hover:bg-blue-50 active:bg-blue-100 border-2 border-gray-200 hover:border-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group z-10 ml-2 md:ml-4"
                  aria-label="下一张"
                >
                  <span className="text-lg md:text-2xl text-gray-600 group-hover:text-blue-600 transition-colors">→</span>
                </button>
              </div>
              
              {/* 移动端页码指示器 */}
              <div className="md:hidden mt-4 text-center">
                <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
                  <div className="flex gap-1.5">
                    {sampleHands.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          idx === currentHandIndex 
                            ? 'w-6 bg-blue-500' 
                            : 'w-2 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 ml-1">
                    {currentHandIndex + 1}/{sampleHands.length}
                  </span>
                </div>
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
                  <div className="space-y-6">
                    {/* 我的点赞 */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-red-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">❤️</span>
                            <span>我的点赞</span>
                          </h3>
                          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                            {likedHands.size} 个手牌
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        {likedHands.size === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <span className="text-5xl mb-3 block">🤍</span>
                            <p className="text-sm">还没有点赞的手牌</p>
                            <p className="text-xs mt-1">去游览手牌给喜欢的内容点赞吧！</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from(likedHands).map((handId) => {
                              const hand = sampleHands.find(h => h.id === handId)
                              if (!hand) return null
                              return (
                                <div key={handId} className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100 hover:shadow-md transition-all cursor-pointer">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex gap-1">
                                      {hand.heroCards.map((card, idx) => {
                                        const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
                                        const suitSymbol = card.suit === 'hearts' ? '♥️' : card.suit === 'diamonds' ? '♦️' : card.suit === 'clubs' ? '♣️' : '♠️'
                                        return (
                                          <div key={idx} className="w-8 h-12 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                            <span className={`text-xs font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                              {card.rank}
                                            </span>
                                            <span className={`text-sm leading-none ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                              {suitSymbol}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm text-gray-800 truncate">{hand.tournament}</div>
                                      <div className="text-xs text-gray-500">{hand.date}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {hand.tags.slice(0, 2).map((tag, idx) => (
                                      <span key={idx} className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 我的收藏 */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-yellow-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">⭐</span>
                            <span>我的收藏</span>
                          </h3>
                          <span className="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                            {savedHands.size} 个手牌
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        {savedHands.size === 0 ? (
                          <div className="text-center py-12 text-gray-400">
                            <span className="text-5xl mb-3 block">☆</span>
                            <p className="text-sm">还没有收藏的手牌</p>
                            <p className="text-xs mt-1">收藏精彩的手牌，方便日后学习！</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from(savedHands).map((handId) => {
                              const hand = sampleHands.find(h => h.id === handId)
                              if (!hand) return null
                              return (
                                <div key={handId} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100 hover:shadow-md transition-all cursor-pointer">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="flex gap-1">
                                      {hand.heroCards.map((card, idx) => {
                                        const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
                                        const suitSymbol = card.suit === 'hearts' ? '♥️' : card.suit === 'diamonds' ? '♦️' : card.suit === 'clubs' ? '♣️' : '♠️'
                                        return (
                                          <div key={idx} className="w-8 h-12 bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center">
                                            <span className={`text-xs font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                              {card.rank}
                                            </span>
                                            <span className={`text-sm leading-none ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
                                              {suitSymbol}
                                            </span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm text-gray-800 truncate">{hand.tournament}</div>
                                      <div className="text-xs text-gray-500">{hand.date}</div>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {hand.tags.slice(0, 2).map((tag, idx) => (
                                      <span key={idx} className="text-xs bg-white/70 text-gray-600 px-2 py-0.5 rounded-full">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 消息中心 */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-blue-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-2xl">🔔</span>
                            <span>消息中心</span>
                          </h3>
                          <span className="text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full font-medium">
                            3 条未读
                          </span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {/* 示例消息 */}
                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-xl">
                              💬
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">PokerPro88</span>
                                <span className="text-xs text-gray-400">2小时前</span>
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              </div>
                              <p className="text-sm text-gray-600">评论了你的手牌：这手牌打得很漂亮！</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-pink-500 flex items-center justify-center flex-shrink-0 text-xl">
                              ❤️
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">CardShark</span>
                                <span className="text-xs text-gray-400">5小时前</span>
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              </div>
                              <p className="text-sm text-gray-600">点赞了你的手牌</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center flex-shrink-0 text-xl">
                              🏆
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">系统通知</span>
                                <span className="text-xs text-gray-400">1天前</span>
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              </div>
                              <p className="text-sm text-gray-600">你的手牌获得了本周最佳分析奖！</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50/50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center flex-shrink-0 text-xl">
                              👤
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">AllInAndy</span>
                                <span className="text-xs text-gray-400">2天前</span>
                              </div>
                              <p className="text-sm text-gray-600">关注了你</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-gray-50/50">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-xl">
                              ⭐
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-800">PokerMaster</span>
                                <span className="text-xs text-gray-400">3天前</span>
                              </div>
                              <p className="text-sm text-gray-600">收藏了你的手牌</p>
                            </div>
                          </div>
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
