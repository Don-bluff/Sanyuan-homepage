'use client'

import { useState, useEffect } from 'react'
import { HandRecord, Player, PokerCard, GameType, BlindMode, PokerPosition, Action, ActionType, Street } from '@/types/poker'
import { SimpleCardSelector } from './SimpleCardSelector'
import { Button } from '@/components/ui/Button'

interface HandRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (record: Partial<HandRecord>) => void
  isInline?: boolean
  tournament?: {
    name: string
    game_type: GameType
    max_players: number
    blind_mode: BlindMode
    small_blind: number
    big_blind: number
    ante?: number
  } | null
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: '6max', label: '6-Max' },
  { value: '9max', label: '9-Max' },
  { value: 'custom', label: '自定义' }
]

const positions: PokerPosition[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB']

export function HandRecordModal({ isOpen, onClose, onSave, isInline = false, tournament = null }: HandRecordModalProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(50)
  const [bigBlind, setBigBlind] = useState(100)
  const [ante, setAnte] = useState(100)
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [startingPlayers, setStartingPlayers] = useState(0)
  const [moneyBubble, setMoneyBubble] = useState(0)

  // 当tournament prop改变时，更新表单
  useEffect(() => {
    if (tournament) {
      setTournamentName(tournament.name)
      setGameType(tournament.game_type)
      setMaxPlayers(tournament.max_players)
      setBlindMode(tournament.blind_mode)
      setSmallBlind(tournament.small_blind)
      setBigBlind(tournament.big_blind)
      setAnte(tournament.ante || 0)
    }
  }, [tournament])
  
  // 当起始人数改变时，如果当前人数为0，自动设置为起始人数
  useEffect(() => {
    if (startingPlayers > 0 && currentPlayers === 0) {
      setCurrentPlayers(startingPlayers)
    }
  }, [startingPlayers, currentPlayers])

  // 处理盲注模式切换
  const handleBlindModeChange = (mode: BlindMode) => {
    setBlindMode(mode)
    if (mode === 'bb') {
      // BB模式默认值：小盲0.5BB，大盲1BB，前注1BB
      setSmallBlind(0.5)
      setBigBlind(1)
      setAnte(1)
    } else {
      // 具体数字模式默认值
      setSmallBlind(50)
      setBigBlind(100)
      setAnte(100)
    }
  }
  const [cardSelectorOpen, setCardSelectorOpen] = useState(false)
  const [actions, setActions] = useState<Action[]>([])
  const [unlockedStreets, setUnlockedStreets] = useState<Street[]>(['preflop'])
  const [currentEditingActionId, setCurrentEditingActionId] = useState<string | null>(null)
  const [boardCards, setBoardCards] = useState<{
    flop: [PokerCard | null, PokerCard | null, PokerCard | null],
    turn: PokerCard | null,
    river: PokerCard | null
  }>({
    flop: [null, null, null],
    turn: null,
    river: null
  })
  const [editingBoardCard, setEditingBoardCard] = useState<{ street: 'flop' | 'turn' | 'river', index?: number } | null>(null)
  
  const handleGameTypeChange = (type: GameType) => {
    setGameType(type)
    if (type === '6max') setMaxPlayers(6)
    else if (type === '9max') setMaxPlayers(9)
  }

  const handleAddAction = (street: Street) => {
    const newAction: Action = {
      id: Date.now().toString(),
      street: street,
      position: 'UTG',
      stack: 100,
      action: 'fold',
      amount: 0,
      is_hero: false,
      hero_cards: undefined
    }
    setActions([...actions, newAction])
  }

  const openCardSelector = (actionId: string) => {
    console.log('Opening card selector for action:', actionId)
    setCurrentEditingActionId(actionId)
    setCardSelectorOpen(true)
  }

  const openBoardCardSelector = (street: 'flop' | 'turn' | 'river', index?: number) => {
    console.log('Opening board card selector:', street, index)
    setEditingBoardCard({ street, index })
    setCardSelectorOpen(true)
  }

  const handleNextStreet = () => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentIndex = unlockedStreets.length - 1
    const nextStreet = streetOrder[currentIndex + 1]
    if (nextStreet) {
      setUnlockedStreets([...unlockedStreets, nextStreet])
    }
  }

  const handleUpdateAction = (id: string, updates: Partial<Action>) => {
    console.log('handleUpdateAction called:', id, updates)
    const newActions = actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    )
    console.log('New actions:', newActions)
    setActions(newActions)
  }

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter(action => action.id !== id))
  }

  const handleCardSelect = (card: PokerCard) => {
    console.log('Card selected:', card)
    
    // 处理公共牌选择
    if (editingBoardCard) {
      if (editingBoardCard.street === 'flop' && editingBoardCard.index !== undefined) {
        const newFlop = [...boardCards.flop] as [PokerCard | null, PokerCard | null, PokerCard | null]
        newFlop[editingBoardCard.index] = card
        setBoardCards({ ...boardCards, flop: newFlop })
      } else if (editingBoardCard.street === 'turn') {
        setBoardCards({ ...boardCards, turn: card })
      } else if (editingBoardCard.street === 'river') {
        setBoardCards({ ...boardCards, river: card })
      }
      setCardSelectorOpen(false)
      setEditingBoardCard(null)
      return
    }
    
    // 处理Hero手牌选择
    if (!currentEditingActionId) return
    
    const action = actions.find(a => a.id === currentEditingActionId)
    if (!action) return
    
    const currentCards: PokerCard[] = action.hero_cards ? [...action.hero_cards] : []
    const cardIndex = currentCards.findIndex(c => c.rank === card.rank && c.suit === card.suit)
    
    if (cardIndex !== -1) {
      currentCards.splice(cardIndex, 1)
    } else if (currentCards.length < 2) {
      currentCards.push(card)
    }
    
    console.log('Updating action with hero_cards:', currentCards)
    
    handleUpdateAction(currentEditingActionId, { 
      hero_cards: currentCards.length > 0 ? currentCards : undefined
    })
  }

  const handleSave = () => {
    if (!tournamentName) {
      alert('请填写比赛名称')
      return
    }

    // 从actions中提取hero信息
    const heroAction = actions.find(a => a.is_hero && a.hero_cards && a.hero_cards.length === 2)
    
    if (!heroAction || !heroAction.hero_cards || heroAction.hero_cards.length !== 2) {
      alert('请在行动线中标记HERO并选择2张手牌')
      return
    }

    const record: Partial<HandRecord> = {
      tournament_name: tournamentName,
      game_type: gameType,
      max_players: maxPlayers,
      blind_mode: blindMode,
      small_blind: smallBlind,
      big_blind: bigBlind,
      ante: ante || undefined,
      hero_cards: [heroAction.hero_cards[0], heroAction.hero_cards[1]] as [PokerCard, PokerCard],
      hero_stack: heroAction.stack,
      hero_position: heroAction.position,
      total_players: new Set(actions.map(a => a.position)).size,
      players: [],
      actions: actions
    }

    onSave(record)
    onClose()
  }

  const getStackUnit = () => blindMode === 'chips' ? 'Chips' : 'BB'

  if (!isOpen && !isInline) return null

  const content = (
    <>
      <div className={isInline ? "" : "bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto"}>
        <div className="p-2 md:p-6">
          {!isInline && (
            <div className="flex justify-between items-center mb-4 md:mb-6">
              <h2 className="text-lg md:text-2xl font-bold text-gray-800 font-orbitron">记录手牌</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          )}

          <div className="space-y-3 md:space-y-6">
              {/* 比赛信息 */}
              <div className={`rounded-xl p-2.5 md:p-4 ${tournament ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
                <h3 className="font-bold text-base md:text-lg mb-3 md:mb-4 font-rajdhani flex items-center gap-2">
                  比赛信息
                  {tournament && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full font-normal">
                      已关联比赛
                    </span>
                  )}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">比赛名称</label>
                    <input
                      type="text"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入比赛名称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">游戏类型</label>
                    <div className="flex gap-1.5 md:gap-2">
                      {gameTypes.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => handleGameTypeChange(value)}
                          className={`px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                            gameType === value
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                        className="mt-1 md:mt-2 w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="自定义人数"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 盲注设置和比赛进程 */}
              <div className={`rounded-xl p-2.5 md:p-4 ${tournament ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  {/* 盲注设置 */}
                  <div>
                    <div className="flex items-center justify-between mb-3 md:mb-4">
                      <h3 className="font-bold text-base md:text-lg font-rajdhani">盲注设置</h3>
                      {tournament && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                          可升盲
                        </span>
                      )}
                    </div>
                    
                    <div className="mb-3 md:mb-4">
                      <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">盲注模式</label>
                      <div className="flex gap-1.5 md:gap-2">
                        <button
                          onClick={() => handleBlindModeChange('chips')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                            blindMode === 'chips'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          具体数字
                        </button>
                        <button
                          onClick={() => handleBlindModeChange('bb')}
                          className={`flex-1 px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                            blindMode === 'bb'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          BB模式
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                          小盲 {blindMode === 'bb' && '(BB)'}
                        </label>
                        <input
                          type="number"
                          value={smallBlind}
                          onChange={(e) => setSmallBlind(Number(e.target.value))}
                          step={blindMode === 'bb' ? '0.1' : '1'}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                          大盲 {blindMode === 'bb' && '(BB)'}
                        </label>
                        <input
                          type="number"
                          value={bigBlind}
                          onChange={(e) => setBigBlind(Number(e.target.value))}
                          step={blindMode === 'bb' ? '0.1' : '1'}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                          前注 {blindMode === 'bb' && '(BB)'}
                        </label>
                        <input
                          type="number"
                          value={ante}
                          onChange={(e) => setAnte(Number(e.target.value))}
                          step={blindMode === 'bb' ? '0.1' : '1'}
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 比赛进程 */}
                  <div>
                    <div className="mb-3 md:mb-4">
                      <h3 className="font-bold text-base md:text-lg font-rajdhani">比赛进程</h3>
                    </div>
                    
                    <div className="space-y-3 md:space-y-4">
                      {/* 人数 */}
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                          人数（当前/总买入）
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={currentPlayers || ''}
                            onChange={(e) => setCurrentPlayers(Number(e.target.value))}
                            min="0"
                            placeholder="当前"
                            className="w-24 md:flex-1 px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500 font-bold">/</span>
                          <input
                            type="number"
                            value={startingPlayers || ''}
                            onChange={(e) => setStartingPlayers(Number(e.target.value))}
                            min="0"
                            placeholder="总买入"
                            className="w-24 md:flex-1 px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* 钱圈 */}
                      <div>
                        <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                          钱圈（ITM位置）
                        </label>
                        <input
                          type="number"
                          value={moneyBubble || ''}
                          onChange={(e) => setMoneyBubble(Number(e.target.value))}
                          min="0"
                          placeholder="进入钱圈的名次"
                          className="w-full px-2 md:px-3 py-1.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        {moneyBubble > 0 && currentPlayers > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {currentPlayers <= moneyBubble 
                              ? `✅ 已进入钱圈` 
                              : `还差 ${currentPlayers - moneyBubble} 人进入钱圈`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 行动线 */}
              <div className="bg-blue-50 rounded-xl p-2.5 md:p-4 border-2 border-blue-100">
                <h3 className="font-bold text-base md:text-xl mb-3 md:mb-4 font-rajdhani flex items-center gap-2">
                  🎬 行动线
                </h3>
                
                <div className="space-y-3 md:space-y-4">
                  {/* 翻牌前 */}
                  {unlockedStreets.includes('preflop') && (
                    <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-blue-200">
                      <div className="mb-4">
                        <h4 className="font-bold text-base md:text-xl text-blue-700 mb-3">♠️ 翻牌前 (Preflop)</h4>
                      </div>
                      
                      <div className="space-y-3 md:space-y-4">
                        {actions.filter(a => a.street === 'preflop').map((action) => (
                          <div key={action.id} className={`p-2.5 md:p-4 rounded-xl border-2 ${action.is_hero ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                            <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-2 md:gap-3">
                              {/* 移动端：垂直排列，桌面端：水平排列 */}
                              <div className="w-full md:w-auto flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
                                {/* Hero Checkbox 和手牌 */}
                                <div className="flex items-center gap-2">
                                  <div className="flex flex-col items-center gap-1">
                                    <label className="text-[10px] text-gray-600 font-medium">HERO</label>
                                    <input
                                      type="checkbox"
                                      checked={action.is_hero}
                                      onChange={(e) => {
                                        console.log('Checkbox changed:', e.target.checked)
                                        handleUpdateAction(action.id, { is_hero: e.target.checked })
                                      }}
                                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    />
                                  </div>
                                  
                                  {/* Hero手牌 */}
                                  {action.is_hero && (
                                    <div className="flex gap-1">
                                      <div 
                                        onClick={() => {
                                          console.log('Opening card selector, current hero_cards:', action.hero_cards)
                                          openCardSelector(action.id)
                                        }}
                                        className="flex gap-1 cursor-pointer"
                                      >
                                        {[0, 1].map((cardIndex) => {
                                          const card = action.hero_cards?.[cardIndex]
                                          const getSuitSymbol = (suit: string) => {
                                            switch(suit) {
                                              case 'hearts': return '♥️'
                                              case 'diamonds': return '♦️'
                                              case 'clubs': return '♣️'
                                              case 'spades': return '♠️'
                                              default: return ''
                                            }
                                          }
                                          
                                          const getSuitColor = (suit: string) => {
                                            return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
                                          }
                                          
                                          return (
                                            <div
                                              key={cardIndex}
                                              className={`w-9 h-12 md:w-11 md:h-15 border-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                                                card 
                                                  ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                                                  : 'bg-gray-100 border-dashed border-gray-400 hover:border-purple-400 hover:bg-purple-50'
                                              }`}
                                            >
                                              {card ? (
                                                <>
                                                  <span className={`text-xs md:text-sm font-bold ${getSuitColor(card.suit)}`}>
                                                    {card.rank}
                                                  </span>
                                                  <span className={`text-sm md:text-base ${getSuitColor(card.suit)}`}>
                                                    {getSuitSymbol(card.suit)}
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="text-xs text-gray-400">?</span>
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 位置和后手 */}
                                <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                  <div className="flex-1 md:flex-initial md:w-20">
                                    <select
                                      value={action.position}
                                      onChange={(e) => handleUpdateAction(action.id, { position: e.target.value as PokerPosition })}
                                      className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                    >
                                      {positions.map(pos => (
                                        <option key={pos} value={pos}>{pos}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                                    <input
                                      type="number"
                                      value={action.stack}
                                      onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                                      className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">
                                      {blindMode === 'chips' ? '' : 'BB'}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* 行动和数量 */}
                                <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                  <div className="flex-1 md:flex-initial md:w-24">
                                    <select
                                      value={action.action}
                                      onChange={(e) => handleUpdateAction(action.id, { action: e.target.value as ActionType })}
                                      className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                    >
                                      <option value="fold">Fold</option>
                                      <option value="check">Check</option>
                                      <option value="call">Call</option>
                                      <option value="bet">Bet</option>
                                      <option value="raise">Raise</option>
                                      <option value="allin">All-in</option>
                                    </select>
                                  </div>
                                  
                                  {/* 数量输入 */}
                                  {(action.action === 'bet' || action.action === 'raise' || action.action === 'allin') && (
                                    <div className="flex items-center gap-1">
                                      <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                      <input
                                        type="number"
                                        value={action.amount || 0}
                                        onChange={(e) => handleUpdateAction(action.id, { amount: Number(e.target.value) })}
                                        className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500 font-medium">
                                        {blindMode === 'chips' ? '' : 'BB'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* 删除按钮 */}
                                <div className="w-full md:w-auto md:ml-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAction(action.id)}
                                    className="w-full md:w-auto px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium whitespace-nowrap"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {actions.filter(a => a.street === 'preflop').length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无行动，点击下方"+ 添加行动"开始记录
                          </div>
                        )}
                        
                        {/* 添加行动按钮 */}
                        <div className="pt-2">
                          <Button onClick={() => handleAddAction('preflop')} variant="primary" className="w-full">
                            + 添加行动
                          </Button>
                        </div>
                      </div>
                      
                      {!unlockedStreets.includes('flop') && (
                        <div className="mt-4 flex justify-center">
                          <Button onClick={handleNextStreet} variant="primary">
                            进入翻牌圈 →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 翻牌圈 */}
                  {unlockedStreets.includes('flop') && (
                    <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-green-200">
                      <div className="mb-4">
                        <h4 className="font-bold text-base md:text-xl text-green-700 mb-3">🎲 翻牌圈 (Flop)</h4>
                      </div>
                      
                      {/* 翻牌 */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">翻牌：</span>
                        {[0, 1, 2].map((index) => (
                          <button
                              key={index}
                            type="button"
                            onClick={() => openBoardCardSelector('flop', index)}
                            className="w-16 h-20 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center cursor-pointer"
                          >
                            {boardCards.flop[index] ? (
                              <span className={`font-bold text-xl ${
                                boardCards.flop[index]!.suit === 'hearts' || boardCards.flop[index]!.suit === 'diamonds'
                                  ? 'text-red-500'
                                  : 'text-gray-800'
                              }`}>
                                {boardCards.flop[index]!.rank}
                                {boardCards.flop[index]!.suit === 'hearts' && '♥️'}
                                {boardCards.flop[index]!.suit === 'diamonds' && '♦️'}
                                {boardCards.flop[index]!.suit === 'clubs' && '♣️'}
                                {boardCards.flop[index]!.suit === 'spades' && '♠️'}
                            </span>
                            ) : (
                              <span className="text-gray-400 text-xs">点击选择</span>
                            )}
                          </button>
                        ))}
                      </div>
                      
                      <div className="space-y-3 md:space-y-4">
                        {actions.filter(a => a.street === 'flop').map((action) => (
                          <div key={action.id} className={`p-2.5 md:p-4 rounded-xl border-2 ${action.is_hero ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                            <div className="w-full flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
                              {/* 第一行 */}
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <label className="text-[10px] text-gray-600 font-medium">HERO</label>
                                  <input
                                    type="checkbox"
                                    checked={action.is_hero}
                                    onChange={(e) => handleUpdateAction(action.id, { is_hero: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                                
                                {/* Hero手牌 */}
                                {action.is_hero && (
                                  <div className="flex gap-1">
                                    <div 
                                      onClick={() => openCardSelector(action.id)}
                                      className="flex gap-1 cursor-pointer"
                                    >
                                      {[0, 1].map((cardIndex) => {
                                        const card = action.hero_cards?.[cardIndex]
                                        const getSuitSymbol = (suit: string) => {
                                          switch(suit) {
                                            case 'hearts': return '♥️'
                                            case 'diamonds': return '♦️'
                                            case 'clubs': return '♣️'
                                            case 'spades': return '♠️'
                                            default: return ''
                                          }
                                        }
                                        
                                        const getSuitColor = (suit: string) => {
                                          return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
                                        }
                                        
                                        return (
                                          <div
                                            key={cardIndex}
                                            className={`w-9 h-12 md:w-11 md:h-15 border-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                                              card 
                                                ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                                                : 'bg-gray-100 border-dashed border-gray-400 hover:border-purple-400 hover:bg-purple-50'
                                            }`}
                                          >
                                            {card ? (
                                              <>
                                                <span className={`text-xs md:text-sm font-bold ${getSuitColor(card.suit)}`}>
                                                  {card.rank}
                                                </span>
                                                <span className={`text-sm md:text-base ${getSuitColor(card.suit)}`}>
                                                  {getSuitSymbol(card.suit)}
                                                </span>
                                              </>
                                            ) : (
                                              <span className="text-xs text-gray-400">?</span>
                                            )}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* 第二行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-20">
                                  <select
                                    value={action.position}
                                    onChange={(e) => handleUpdateAction(action.id, { position: e.target.value as PokerPosition })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    {positions.map(pos => (
                                      <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                                  <input
                                    type="number"
                                    value={action.stack}
                                    onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                                    className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {blindMode === 'chips' ? '' : 'BB'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* 第三行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-24">
                                  <select
                                    value={action.action}
                                    onChange={(e) => handleUpdateAction(action.id, { action: e.target.value as ActionType })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    <option value="fold">Fold</option>
                                    <option value="check">Check</option>
                                    <option value="call">Call</option>
                                    <option value="bet">Bet</option>
                                    <option value="raise">Raise</option>
                                    <option value="allin">All-in</option>
                                  </select>
                                </div>
                                
                                {/* 数量输入 */}
                                {(action.action === 'bet' || action.action === 'raise' || action.action === 'allin') && (
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                    <input
                                      type="number"
                                      value={action.amount ?? ''}
                                      onChange={(e) => handleUpdateAction(action.id, { amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                                      className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">
                                      {blindMode === 'chips' ? '' : 'BB'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 删除按钮 */}
                              <div className="w-full md:w-auto md:ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAction(action.id)}
                                  className="w-full md:w-auto px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium whitespace-nowrap"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {actions.filter(a => a.street === 'flop').length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无行动，点击下方"+ 添加行动"开始记录
                          </div>
                        )}
                        
                        {/* 添加行动按钮 */}
                        <div className="pt-2">
                          <Button onClick={() => handleAddAction('flop')} variant="primary" className="w-full">
                            + 添加行动
                          </Button>
                        </div>
                      </div>
                      
                      {!unlockedStreets.includes('turn') && (
                        <div className="mt-4 flex justify-center">
                          <Button onClick={handleNextStreet} variant="primary">
                            进入转牌圈 →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 转牌圈 */}
                  {unlockedStreets.includes('turn') && (
                    <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-orange-200">
                      <div className="mb-4">
                        <h4 className="font-bold text-base md:text-xl text-orange-700 mb-3">🎰 转牌圈 (Turn)</h4>
                      </div>
                      
                      {/* 转牌 */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">转牌：</span>
                        <button
                          type="button"
                          onClick={() => openBoardCardSelector('turn')}
                          className="w-16 h-20 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center cursor-pointer"
                        >
                          {boardCards.turn ? (
                            <span className={`font-bold text-xl ${
                              boardCards.turn.suit === 'hearts' || boardCards.turn.suit === 'diamonds'
                                ? 'text-red-500'
                                : 'text-gray-800'
                            }`}>
                              {boardCards.turn.rank}
                              {boardCards.turn.suit === 'hearts' && '♥️'}
                              {boardCards.turn.suit === 'diamonds' && '♦️'}
                              {boardCards.turn.suit === 'clubs' && '♣️'}
                              {boardCards.turn.suit === 'spades' && '♠️'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">点击选择</span>
                      )}
                    </button>
                  </div>
                  
                      <div className="space-y-3 md:space-y-4">
                        {actions.filter(a => a.street === 'turn').map((action) => (
                          <div key={action.id} className={`p-2.5 md:p-4 rounded-xl border-2 ${action.is_hero ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                            <div className="w-full flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
                              {/* 第一行 */}
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <label className="text-[10px] text-gray-600 font-medium">HERO</label>
                                  <input
                                    type="checkbox"
                                    checked={action.is_hero}
                                    onChange={(e) => handleUpdateAction(action.id, { is_hero: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                              
                              {/* Hero手牌 */}
                              {action.is_hero && (
                                <div className="flex gap-1">
                                  <div 
                                    onClick={() => openCardSelector(action.id)}
                                    className="flex gap-1 cursor-pointer"
                                  >
                                    {[0, 1].map((cardIndex) => {
                                      const card = action.hero_cards?.[cardIndex]
                                      const getSuitSymbol = (suit: string) => {
                                        switch(suit) {
                                          case 'hearts': return '♥️'
                                          case 'diamonds': return '♦️'
                                          case 'clubs': return '♣️'
                                          case 'spades': return '♠️'
                                          default: return ''
                                        }
                                      }
                                      
                                      const getSuitColor = (suit: string) => {
                                        return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
                                      }
                                      
                                      return (
                                        <div
                                          key={cardIndex}
                                          className={`w-9 h-12 md:w-11 md:h-15 border-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                                            card 
                                              ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                                              : 'bg-gray-100 border-dashed border-gray-400 hover:border-purple-400 hover:bg-purple-50'
                                          }`}
                                        >
                                          {card ? (
                                            <>
                                              <span className={`text-xs md:text-sm font-bold ${getSuitColor(card.suit)}`}>
                                                {card.rank}
                                              </span>
                                              <span className={`text-sm md:text-base ${getSuitColor(card.suit)}`}>
                                                {getSuitSymbol(card.suit)}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-xs text-gray-400">?</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                              </div>
                              
                              {/* 第二行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-20">
                                  <select
                                    value={action.position}
                                    onChange={(e) => handleUpdateAction(action.id, { position: e.target.value as PokerPosition })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    {positions.map(pos => (
                                      <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                                  <input
                                    type="number"
                                    value={action.stack}
                                    onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                                    className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {blindMode === 'chips' ? '' : 'BB'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* 第三行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-24">
                                  <select
                                    value={action.action}
                                    onChange={(e) => handleUpdateAction(action.id, { action: e.target.value as ActionType })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    <option value="fold">Fold</option>
                                    <option value="check">Check</option>
                                    <option value="call">Call</option>
                                    <option value="bet">Bet</option>
                                    <option value="raise">Raise</option>
                                    <option value="allin">All-in</option>
                                  </select>
                                </div>
                                
                                {/* 数量输入 */}
                                {(action.action === 'bet' || action.action === 'raise' || action.action === 'allin') && (
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                    <input
                                      type="number"
                                      value={action.amount ?? ''}
                                      onChange={(e) => handleUpdateAction(action.id, { amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                                      className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">
                                      {blindMode === 'chips' ? '' : 'BB'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 删除按钮 */}
                              <div className="w-full md:w-auto md:ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAction(action.id)}
                                  className="w-full md:w-auto px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium whitespace-nowrap"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {actions.filter(a => a.street === 'turn').length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无行动，点击下方"+ 添加行动"开始记录
                          </div>
                        )}
                        
                        {/* 添加行动按钮 */}
                        <div className="pt-2">
                          <Button onClick={() => handleAddAction('turn')} variant="primary" className="w-full">
                            + 添加行动
                          </Button>
                        </div>
                      </div>

                      {!unlockedStreets.includes('river') && (
                        <div className="mt-4 flex justify-center">
                          <Button onClick={handleNextStreet} variant="primary">
                            进入河牌圈 →
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 河牌圈 */}
                  {unlockedStreets.includes('river') && (
                    <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-red-200">
                      <div className="mb-4">
                        <h4 className="font-bold text-base md:text-xl text-red-700 mb-3">🎯 河牌圈 (River)</h4>
                      </div>
                
                      {/* 河牌 */}
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">河牌：</span>
                        <button
                          type="button"
                          onClick={() => openBoardCardSelector('river')}
                          className="w-16 h-20 border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all flex items-center justify-center cursor-pointer"
                        >
                          {boardCards.river ? (
                            <span className={`font-bold text-xl ${
                              boardCards.river.suit === 'hearts' || boardCards.river.suit === 'diamonds'
                                ? 'text-red-500'
                                : 'text-gray-800'
                            }`}>
                              {boardCards.river.rank}
                              {boardCards.river.suit === 'hearts' && '♥️'}
                              {boardCards.river.suit === 'diamonds' && '♦️'}
                              {boardCards.river.suit === 'clubs' && '♣️'}
                              {boardCards.river.suit === 'spades' && '♠️'}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">点击选择</span>
                          )}
                        </button>
                      </div>
                      
                      <div className="space-y-3 md:space-y-4">
                        {actions.filter(a => a.street === 'river').map((action) => (
                          <div key={action.id} className={`p-2.5 md:p-4 rounded-xl border-2 ${action.is_hero ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-300'}`}>
                            <div className="w-full flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
                              {/* 第一行 */}
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-center gap-1">
                                  <label className="text-[10px] text-gray-600 font-medium">HERO</label>
                                  <input
                                    type="checkbox"
                                    checked={action.is_hero}
                                    onChange={(e) => handleUpdateAction(action.id, { is_hero: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                              
                              {/* Hero手牌 */}
                              {action.is_hero && (
                                <div className="flex gap-1">
                                  <div 
                                    onClick={() => openCardSelector(action.id)}
                                    className="flex gap-1 cursor-pointer"
                                  >
                                    {[0, 1].map((cardIndex) => {
                                      const card = action.hero_cards?.[cardIndex]
                                      const getSuitSymbol = (suit: string) => {
                                        switch(suit) {
                                          case 'hearts': return '♥️'
                                          case 'diamonds': return '♦️'
                                          case 'clubs': return '♣️'
                                          case 'spades': return '♠️'
                                          default: return ''
                                        }
                                      }
                                      
                                      const getSuitColor = (suit: string) => {
                                        return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-gray-800'
                                      }
                                      
                                      return (
                                        <div
                                          key={cardIndex}
                                          className={`w-9 h-12 md:w-11 md:h-15 border-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                                            card 
                                              ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                                              : 'bg-gray-100 border-dashed border-gray-400 hover:border-purple-400 hover:bg-purple-50'
                                          }`}
                                        >
                                          {card ? (
                                            <>
                                              <span className={`text-xs md:text-sm font-bold ${getSuitColor(card.suit)}`}>
                                                {card.rank}
                                              </span>
                                              <span className={`text-sm md:text-base ${getSuitColor(card.suit)}`}>
                                                {getSuitSymbol(card.suit)}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="text-xs text-gray-400">?</span>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                              
                              {/* 第二行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-20">
                                  <select
                                    value={action.position}
                                    onChange={(e) => handleUpdateAction(action.id, { position: e.target.value as PokerPosition })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    {positions.map(pos => (
                                      <option key={pos} value={pos}>{pos}</option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                                  <input
                                    type="number"
                                    value={action.stack}
                                    onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                                    className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500 font-medium">
                                    {blindMode === 'chips' ? '' : 'BB'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* 第三行 */}
                              <div className="flex items-center gap-2 flex-1 md:flex-initial">
                                <div className="flex-1 md:flex-initial md:w-24">
                                  <select
                                    value={action.action}
                                    onChange={(e) => handleUpdateAction(action.id, { action: e.target.value as ActionType })}
                                    className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                  >
                                    <option value="fold">Fold</option>
                                    <option value="check">Check</option>
                                    <option value="call">Call</option>
                                    <option value="bet">Bet</option>
                                    <option value="raise">Raise</option>
                                    <option value="allin">All-in</option>
                                  </select>
                                </div>
                                
                                {/* 数量输入 */}
                                {(action.action === 'bet' || action.action === 'raise' || action.action === 'allin') && (
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                    <input
                                      type="number"
                                      value={action.amount ?? ''}
                                      onChange={(e) => handleUpdateAction(action.id, { amount: e.target.value === '' ? undefined : Number(e.target.value) })}
                                      className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">
                                      {blindMode === 'chips' ? '' : 'BB'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 删除按钮 */}
                              <div className="w-full md:w-auto md:ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAction(action.id)}
                                  className="w-full md:w-auto px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-colors font-medium whitespace-nowrap"
                                >
                                  删除
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                  
                        {actions.filter(a => a.street === 'river').length === 0 && (
                          <div className="text-center py-8 text-gray-400 text-sm">
                            暂无行动，点击下方"+ 添加行动"开始记录
                          </div>
                        )}
                        
                        {/* 添加行动按钮 */}
                        <div className="pt-2">
                          <Button onClick={() => handleAddAction('river')} variant="primary" className="w-full">
                            + 添加行动
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Footer */}
          {!isInline && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button onClick={onClose} variant="ghost">
                取消
              </Button>
              <Button onClick={handleSave} variant="primary">
                保存手牌
              </Button>
            </div>
          )}

          {isInline && (
            <div className="flex justify-center gap-3 mt-8">
              <Button onClick={handleSave} variant="primary" className="px-8">
                保存手牌记录
              </Button>
            </div>
          )}
        </div>
      </div>

      {cardSelectorOpen && (
        <SimpleCardSelector
          onClose={() => {
            setCardSelectorOpen(false)
            setCurrentEditingActionId(null)
            setEditingBoardCard(null)
          }}
        onSelectCard={handleCardSelect}
          selectedCards={(() => {
            if (editingBoardCard) return []
            if (!currentEditingActionId) return []
            const action = actions.find(a => a.id === currentEditingActionId)
            return action?.hero_cards ? [...action.hero_cards] : []
          })()}
          usedCards={(() => {
            const used: PokerCard[] = []
            
            // 收集所有Hero手牌
            actions.forEach(action => {
              if (action.hero_cards) {
                used.push(...action.hero_cards)
              }
            })
            
            // 收集翻牌
            boardCards.flop.forEach(card => {
              if (card) used.push(card)
            })
            
            // 收集转牌
            if (boardCards.turn) used.push(boardCards.turn)
            
            // 收集河牌
            if (boardCards.river) used.push(boardCards.river)
            
            // 如果正在编辑某个Hero的手牌，排除该Hero的牌（允许重新选择）
            if (currentEditingActionId) {
              const editingAction = actions.find(a => a.id === currentEditingActionId)
              if (editingAction?.hero_cards) {
                return used.filter(card => 
                  !editingAction.hero_cards!.some(hc => hc.rank === card.rank && hc.suit === card.suit)
                )
              }
            }
            
            // 如果正在编辑公共牌，排除该位置的牌（允许重新选择）
            if (editingBoardCard) {
              if (editingBoardCard.street === 'flop' && editingBoardCard.index !== undefined) {
                const editingCard = boardCards.flop[editingBoardCard.index]
                if (editingCard) {
                  return used.filter(card => 
                    !(card.rank === editingCard.rank && card.suit === editingCard.suit)
                  )
                }
              } else if (editingBoardCard.street === 'turn' && boardCards.turn) {
                return used.filter(card => 
                  !(card.rank === boardCards.turn!.rank && card.suit === boardCards.turn!.suit)
                )
              } else if (editingBoardCard.street === 'river' && boardCards.river) {
                return used.filter(card => 
                  !(card.rank === boardCards.river!.rank && card.suit === boardCards.river!.suit)
                )
              }
            }
            
            return used
          })()}
        />
      )}
    </>
  )

  if (isInline) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-2 md:p-4">
      {content}
    </div>
  )
}
