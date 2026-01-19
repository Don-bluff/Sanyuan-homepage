'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { TournamentModal } from '@/components/poker/TournamentModal'
import { FinishTournamentModal } from '@/components/poker/FinishTournamentModal'
import { AboutUsModal } from '@/components/poker/AboutUsModal'
import { LearnMoreModal } from '@/components/poker/LearnMoreModal'
import { PreflopTraining } from '@/components/poker/PreflopTraining'
import { HomeTab } from '@/components/tabs/HomeTab'
import { RecordHandTab } from '@/components/tabs/RecordHandTab'
import { MyHandsTab } from '@/components/tabs/MyHandsTab'
import { TournamentsTab } from '@/components/tabs/TournamentsTab'
import { createHandRecord } from '@/lib/api/hands'
import { HandRecord, Tournament } from '@/types/poker'
import { getActiveTournaments, getFinishedTournaments, createTournament, finishTournament, incrementHandCount } from '@/lib/api/tournaments'
import { signIn, signUp, signOut, resetPassword, getCurrentUser, onAuthStateChange, AuthUser } from '@/lib/supabase/auth'

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
  const [showAboutUsModal, setShowAboutUsModal] = useState(false)
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false)
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([])
  const [finishedTournaments, setFinishedTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [finishingTournament, setFinishingTournament] = useState<Tournament | null>(null)
  const [expandedHandIds, setExpandedHandIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const handsPerPage = 10
  
  // 登录相关状态
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
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
  
  // 初始化时检查用户登录状态
  useEffect(() => {
    getCurrentUser().then(user => {
      setCurrentUser(user)
    })

    // 监听认证状态变化
    const { data: { subscription } } = onAuthStateChange((user) => {
      setCurrentUser(user)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail || !loginPassword) {
      alert('请输入邮箱和密码')
      return
    }

    setIsLoggingIn(true)

    try {
      await signIn(loginEmail, loginPassword)
      // 成功后会通过 onAuthStateChange 自动更新状态
      alert('登录成功！')
      setLoginPassword('') // 清空密码
    } catch (error: any) {
      console.error('登录失败:', error)
      alert(`登录失败: ${error.message || '未知错误'}`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 注册处理
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail || !loginPassword) {
      alert('请输入邮箱和密码')
      return
    }

    if (loginPassword.length < 6) {
      alert('密码至少需要6位')
      return
    }

    setIsLoggingIn(true)

    try {
      await signUp(loginEmail, loginPassword)
      alert('注册成功！请查收验证邮件以激活账号。')
      setLoginPassword('') // 清空密码
    } catch (error: any) {
      console.error('注册失败:', error)
      alert(`注册失败: ${error.message || '未知错误'}`)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 重置密码处理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!loginEmail) {
      alert('请输入邮箱地址')
      return
    }

    setIsLoggingIn(true)

    try {
      await resetPassword(loginEmail)
      alert('重置密码邮件已发送！请查收邮箱。')
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      alert(`发送失败: ${error.message || '未知错误'}`)
    } finally {
      setIsLoggingIn(false)
    }
  }
  
  // 登出处理
  const handleLogout = async () => {
    try {
      await signOut()
      // 成功后会通过 onAuthStateChange 自动更新状态
      setLoginEmail('')
      setLoginPassword('')
      alert('已退出登录')
    } catch (error: any) {
      console.error('登出失败:', error)
      alert(`登出失败: ${error.message || '未知错误'}`)
    }
  }
  
  // 示例手牌数据
  const sampleHands = [
    {
      id: 'demo-1',
      heroCards: [
        { rank: 'A', suit: 'hearts' as const },
        { rank: 'K', suit: 'spades' as const }
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
        { rank: 'Q', suit: 'spades' as const },
        { rank: 'Q', suit: 'clubs' as const }
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
      <main className="relative min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 极简背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
      </div>

      {/* HEADER - LOGO和标题紧贴居中 */}
      <header className="relative z-10 px-4 md:px-8 py-6 md:py-8 border-b border-gray-200/50 backdrop-blur-sm bg-white/80">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 md:gap-4">
          {/* LOGO */}
          <div className="logo-container">
            <div className="relative logo-wrapper group">
              <Image
                src="/LOGO/LOGO.png"
                alt="Don't Bluff Me Logo"
                width={70}
                height={70}
                className="cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
                onClick={() => window.open('https://donbluff.com', '_blank')}
                priority
              />
            </div>
          </div>
          
          {/* 主标题 */}
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-orbitron text-black cursor-pointer transition-all duration-300 hover:opacity-70 tracking-tight whitespace-nowrap"
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
                  className={`group relative bg-white rounded-2xl transition-all duration-300 cursor-pointer border overflow-hidden ${
                    activeTab === feature.id 
                      ? 'border-black shadow-lg' 
                      : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                  }`}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    height: '100px'
                  }}
                >
                  {/* 选中状态的顶部装饰 */}
                  <div className={`absolute top-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                    activeTab === feature.id 
                      ? 'bg-black' 
                      : 'bg-gray-300'
                  }`}></div>
                  
                  {/* 卡片内容 - 水平布局 */}
                  <div className="p-5 flex items-center space-x-4 h-full">
                    {/* 图标区域 */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        activeTab === feature.id 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'
                      }`}>
                        <span className="text-xl">
                          {feature.icon}
                        </span>
                      </div>
                    </div>
                    
                    {/* 文字内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold transition-colors ${
                        activeTab === feature.id 
                          ? 'text-black' 
                          : 'text-gray-700 group-hover:text-black'
                      }`}>
                        {feature.name}
                      </h3>
                    </div>
                    
                    {/* 选中指示器 */}
                    {activeTab === feature.id && (
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 移动端底部导航栏 */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="bg-white/95 backdrop-blur-lg border-t border-gray-200">
              <div className="flex items-center justify-around py-2 px-2">
                {/* 所有选项卡 */}
                {pokerFeatures.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(activeTab === feature.id ? null : feature.id)}
                    className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                      activeTab === feature.id 
                        ? 'bg-black text-white' 
                        : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{feature.icon}</span>
                    <span className="text-xs font-medium">{feature.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>


          {/* 内容显示区域 */}
          {activeTab && activeTab !== 'preflopTraining' && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 p-1 md:p-8 animate-fade-in">
              <div className="max-w-4xl mx-auto">
                
                {activeTab === 'home' && (
                  <HomeTab
                    isLoggedIn={!!currentUser}
                    loginEmail={loginEmail}
                    loginPassword={loginPassword}
                    userDisplayName={currentUser?.displayName || currentUser?.email || ''}
                    isLoggingIn={isLoggingIn}
                    onLoginEmailChange={setLoginEmail}
                    onLoginPasswordChange={setLoginPassword}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onResetPassword={handleResetPassword}
                    onLogout={handleLogout}
                    onStartTraining={() => setShowTrainingModal(true)}
                    onAboutUs={() => setShowAboutUsModal(true)}
                    onLearnMore={() => setShowLearnMoreModal(true)}
                  />
                )}
                
                {activeTab === 'record' && (
                  <RecordHandTab
                    selectedTournament={selectedTournament}
                    onSaveHand={handleSaveHand}
                  />
                )}
                
                {activeTab === 'my' && (
                  <MyHandsTab
                    hands={sampleHands}
                    expandedHandIds={expandedHandIds}
                    currentPage={currentPage}
                    handsPerPage={handsPerPage}
                    onToggleExpand={toggleExpand}
                    onPageChange={setCurrentPage}
                  />
                )}
                
                {activeTab === 'tournaments' && (
                  <TournamentsTab
                    activeTournaments={activeTournaments}
                    finishedTournaments={finishedTournaments}
                    onAddTournament={() => setShowTournamentModal(true)}
                    onLinkHand={(tournament) => {
                      setSelectedTournament(tournament)
                      setActiveTab('record')
                    }}
                    onFinishTournament={handleOpenFinishModal}
                  />
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

      {/* AboutUsModal */}
      <AboutUsModal
        isOpen={showAboutUsModal}
        onClose={() => setShowAboutUsModal(false)}
      />

      {/* LearnMoreModal */}
      <LearnMoreModal
        isOpen={showLearnMoreModal}
        onClose={() => setShowLearnMoreModal(false)}
      />

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
