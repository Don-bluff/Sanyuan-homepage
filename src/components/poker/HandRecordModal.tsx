'use client'

import { useState, useEffect } from 'react'
import { HandRecord, PokerCard, GameType, BlindMode, Street, Action } from '@/types/poker'
import { SimpleCardSelector } from './SimpleCardSelector'
import { Button } from '@/components/ui/Button'
import { Portal } from '@/components/ui/Portal'
import { TournamentInfo } from './handRecord/TournamentInfo'
import { BlindSettings } from './handRecord/BlindSettings'
import { TournamentProgress } from './handRecord/TournamentProgress'
import { StreetSection } from './handRecord/StreetSection'
import { useActionLogic } from './handRecord/useActionLogic'

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

export function HandRecordModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isInline = false, 
  tournament = null 
}: HandRecordModalProps) {
  // ==================== 比赛信息状态 ====================
  const [tournamentName, setTournamentName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  
  // ==================== 盲注设置状态 ====================
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(50)
  const [bigBlind, setBigBlind] = useState(100)
  const [ante, setAnte] = useState(100)
  
  // ==================== 比赛进程状态 ====================
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [startingPlayers, setStartingPlayers] = useState(0)
  const [moneyBubble, setMoneyBubble] = useState(0)

  // ==================== 公共牌状态 ====================
  const [boardCards, setBoardCards] = useState<{
    flop: [PokerCard | null, PokerCard | null, PokerCard | null]
    turn: PokerCard | null
    river: PokerCard | null
  }>({
    flop: [null, null, null],
    turn: null,
    river: null
  })
  
  // ==================== 卡牌选择器状态 ====================
  const [cardSelectorOpen, setCardSelectorOpen] = useState(false)
  const [currentEditingActionId, setCurrentEditingActionId] = useState<string | null>(null)
  const [editingBoardCard, setEditingBoardCard] = useState<{ 
    street: 'flop' | 'turn' | 'river'
    index?: number 
  } | null>(null)
  const [tempSelectedCards, setTempSelectedCards] = useState<PokerCard[]>([])
  
  // ==================== 使用行动逻辑 Hook ====================
  const {
    actions,
    setActions,
    getAvailablePositions,
    isPositionAllIn,
    getFoldedOrAllInPositionsBeforeStreet,
    handleAddAction,
    handleUpdateAction: originalHandleUpdateAction,
    handleRemoveAction,
    handleAddDecision,
    handleUpdateDecision,
    handleRemoveDecision
  } = useActionLogic()
  
  // ==================== 包装 handleUpdateAction 以同步 HERO 状态 ====================
  const handleUpdateAction = (id: string, updates: Partial<Action>) => {
    // 如果正在更新 is_hero 状态
    if (updates.is_hero !== undefined) {
      const targetAction = actions.find(a => a.id === id)
      if (targetAction) {
        // 获取当前 action 的位置
        const heroPosition = targetAction.position
        
        // 如果设置为 HERO
        if (updates.is_hero) {
          // 将所有 action 设置为非 HERO，然后将同一位置的所有 action 设置为 HERO
          const updatedActions = actions.map(action => {
            if (action.position === heroPosition) {
              // 同一位置的所有街道都设为 HERO
              return { ...action, is_hero: true, hero_cards: targetAction.hero_cards }
            } else {
              // 其他位置都设为非 HERO
              return { ...action, is_hero: false, hero_cards: undefined }
            }
          })
          setActions(updatedActions)
          return
        } else {
          // 如果取消 HERO，将同一位置的所有 action 都取消 HERO
          const updatedActions = actions.map(action => {
            if (action.position === heroPosition) {
              return { ...action, is_hero: false, hero_cards: undefined }
      }
      return action
    })
          setActions(updatedActions)
          return
        }
      }
    }
    
    // 如果更新手牌，同步到同一位置的所有街道
    if (updates.hero_cards !== undefined) {
      const targetAction = actions.find(a => a.id === id)
      if (targetAction && targetAction.is_hero) {
        const updatedActions = actions.map(action => {
          if (action.position === targetAction.position && action.is_hero) {
            return { ...action, hero_cards: updates.hero_cards }
      }
      return action
    })
        setActions(updatedActions)
        return
      }
    }
    
    // 否则使用原始的 handleUpdateAction
    originalHandleUpdateAction(id, updates)
  }
  
  // ==================== 初始化比赛信息 ====================
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
  
  // ==================== 自动设置当前人数 ====================
  useEffect(() => {
    if (startingPlayers > 0 && currentPlayers === 0) {
      setCurrentPlayers(startingPlayers)
    }
  }, [startingPlayers, currentPlayers])

  // ==================== 处理盲注模式切换 ====================
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
  
  // ==================== 卡牌选择器函数 ====================
  const openCardSelector = (actionId: string) => {
    setCurrentEditingActionId(actionId)
    setCardSelectorOpen(true)
  }

  const openBoardCardSelector = (street: 'flop' | 'turn' | 'river', index?: number) => {
    setEditingBoardCard({ street, index })
    if (street === 'flop') {
      setTempSelectedCards(boardCards.flop.filter((card): card is PokerCard => card !== null))
    }
    setCardSelectorOpen(true)
  }

  const handleCardSelect = (card: PokerCard) => {
    // 处理公共牌选择
    if (editingBoardCard) {
      if (editingBoardCard.street === 'flop') {
        const currentSelection = [...tempSelectedCards]
        const cardIndex = currentSelection.findIndex(c => c.rank === card.rank && c.suit === card.suit)
        
        if (cardIndex !== -1) {
          currentSelection.splice(cardIndex, 1)
        } else if (currentSelection.length < 3) {
          currentSelection.push(card)
        }
        
        setTempSelectedCards(currentSelection)
        
        if (currentSelection.length === 3) {
          setBoardCards({ 
            ...boardCards, 
            flop: currentSelection as [PokerCard, PokerCard, PokerCard]
          })
          setCardSelectorOpen(false)
          setEditingBoardCard(null)
          setTempSelectedCards([])
        }
      } else if (editingBoardCard.street === 'turn') {
        setBoardCards({ ...boardCards, turn: card })
        setCardSelectorOpen(false)
        setEditingBoardCard(null)
      } else if (editingBoardCard.street === 'river') {
        setBoardCards({ ...boardCards, river: card })
        setCardSelectorOpen(false)
        setEditingBoardCard(null)
      }
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
    
    handleUpdateAction(currentEditingActionId, { 
      hero_cards: currentCards.length > 0 ? currentCards : undefined
    })
  }

  // ==================== 计算底池 ====================
  const getInitialPot = (): number => {
    return smallBlind + bigBlind + ante
  }
  
  const getPotAtStreet = (street: Street): number => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    let pot = getInitialPot()
    
    for (let i = 0; i <= targetIndex; i++) {
      const streetActions = actions.filter(a => a.street === streetOrder[i])
      
      streetActions.forEach(action => {
        if (action.action === 'bet' || action.action === 'raise' || 
            action.action === 'call' || action.action === 'allin') {
          pot += (action.amount || 0)
        }
        
        if (action.decisions && action.decisions.length > 0) {
          action.decisions.forEach(decision => {
            if (decision.action === 'bet' || decision.action === 'raise' || 
                decision.action === 'call' || decision.action === 'allin') {
              pot += (decision.amount || 0)
            }
          })
        }
      })
    }
    
    return pot
  }
  
  // ==================== 获取当前 HERO 位置 ====================
  const heroPosition = actions.find(a => a.is_hero)?.position || null
  
  // ==================== 保存手牌 ====================
  const handleSave = () => {
    if (!tournamentName) {
      alert('请填写比赛名称')
      return
    }

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

  // ==================== 渲染公共牌选择按钮 ====================
  const renderBoardCardSelector = (street: 'flop' | 'turn' | 'river') => {
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
                                          
    if (street === 'flop') {
                                          return (
        <div className="mb-2 md:mb-3">
          <span className="text-[10px] md:text-sm font-medium text-gray-700 block mb-1">翻牌：</span>
                                  <button
                                    type="button"
            onClick={() => openBoardCardSelector('flop')}
            className="flex items-center gap-2 p-2 md:p-3 border-2 border-dashed border-gray-400 rounded-lg hover:border-gray-600 hover:bg-gray-100 transition-all cursor-pointer w-full md:w-auto"
                        >
                          {boardCards.flop.every(card => card !== null) ? (
                            <div className="flex gap-2">
                              {boardCards.flop.map((card, index) => (
                  <span key={index} className={`font-bold text-base md:text-xl ${getSuitColor(card!.suit)}`}>
                    {card!.rank}{getSuitSymbol(card!.suit)}
                                </span>
                              ))}
                            </div>
                          ) : (
              <span className="text-gray-400 text-xs md:text-sm">点击选择3张翻牌</span>
                          )}
                        </button>
                      </div>
      )
    }
    
    const card = street === 'turn' ? boardCards.turn : boardCards.river
    const colorClass = 'border-gray-400 hover:border-gray-600 hover:bg-gray-100'
                                        
                                        return (
      <div className="mb-2 md:mb-3 flex items-center gap-2">
        <span className="text-[10px] md:text-sm font-medium text-gray-700">
          {street === 'turn' ? '转牌' : '河牌'}：
                            </span>
                                <button
                                  type="button"
          onClick={() => openBoardCardSelector(street)}
          className={`w-14 h-18 md:w-16 md:h-20 border-2 border-dashed ${colorClass} rounded-lg transition-all flex items-center justify-center cursor-pointer`}
        >
          {card ? (
            <span className={`font-bold text-base md:text-xl ${getSuitColor(card.suit)}`}>
              {card.rank}{getSuitSymbol(card.suit)}
                                          </span>
          ) : (
            <span className="text-gray-400 text-xs">选择</span>
          )}
                                      </button>
                                    </div>
    )
  }
  
  // ==================== 获取已使用的牌 ====================
  const getUsedCards = (): PokerCard[] => {
    const used: PokerCard[] = []
    
    actions.forEach(action => {
      if (action.hero_cards) {
        used.push(...action.hero_cards)
      }
    })
    
    boardCards.flop.forEach(card => {
      if (card) used.push(card)
    })
    
    if (boardCards.turn) used.push(boardCards.turn)
    if (boardCards.river) used.push(boardCards.river)
    
    if (currentEditingActionId) {
      const editingAction = actions.find(a => a.id === currentEditingActionId)
      if (editingAction?.hero_cards) {
        return used.filter(card => 
          !editingAction.hero_cards!.some(hc => hc.rank === card.rank && hc.suit === card.suit)
        )
      }
    }
    
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
  }
  
  if (!isOpen && !isInline) return null
  
  // ==================== 主内容 ====================
  const modalContent = (
    <div className={isInline ? "" : "bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-300"}>
        <div className={isInline ? "p-0" : "p-2 md:p-4 lg:p-6"}>
          {/* 标题 */}
          {!isInline && (
            <div className="flex justify-between items-center mb-3 md:mb-6 pb-3 md:pb-4 border-b-2 border-gray-300">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 font-orbitron flex items-center gap-2">
                <span className="text-2xl md:text-4xl">✏️</span>
                记录手牌
              </h2>
                                <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 text-3xl md:text-4xl font-bold transition-colors hover:rotate-90 transform duration-200"
                                >
                ×
                                </button>
                              </div>
          )}
          
          <div className="space-y-2 md:space-y-4">
            {/* 比赛信息 */}
            <TournamentInfo
              tournamentName={tournamentName}
              gameType={gameType}
              maxPlayers={maxPlayers}
              isLinked={!!tournament}
              onTournamentNameChange={setTournamentName}
              onGameTypeChange={setGameType}
              onMaxPlayersChange={setMaxPlayers}
            />
            
            {/* 盲注设置和比赛进程 */}
            <div className={`rounded-lg p-1 md:p-2 ${tournament ? 'bg-gray-100 border-2 border-gray-400' : 'bg-white border border-gray-300'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-4">
                <BlindSettings
                  blindMode={blindMode}
                  smallBlind={smallBlind}
                  bigBlind={bigBlind}
                  ante={ante}
                  isLinked={!!tournament}
                  canUpgradeBlind={true}
                  onBlindModeChange={handleBlindModeChange}
                  onSmallBlindChange={setSmallBlind}
                  onBigBlindChange={setBigBlind}
                  onAnteChange={setAnte}
                />
                
                <TournamentProgress
                  currentPlayers={currentPlayers}
                  startingPlayers={startingPlayers}
                  moneyBubble={moneyBubble}
                  onCurrentPlayersChange={setCurrentPlayers}
                  onStartingPlayersChange={setStartingPlayers}
                  onMoneyBubbleChange={setMoneyBubble}
                />
                                        </div>
                                    </div>
            
            {/* 行动线 */}
            <div className="bg-gray-50 rounded-xl p-2 md:p-4 border-2 border-gray-300">
              <h3 className="font-bold text-base md:text-2xl mb-2 md:mb-4 font-rajdhani flex items-center gap-2 text-gray-900">
                <span className="text-2xl md:text-3xl">🎬</span>
                行动线
              </h3>
              
              <div className="space-y-2 md:space-y-4">
                {/* Preflop */}
                <StreetSection
                  street="preflop"
                  title="翻牌前 (Preflop)"
                  emoji="♠️"
                  actions={actions.filter(a => a.street === 'preflop')}
                  potSize={getInitialPot()}
                  blindMode={blindMode}
                  colorScheme={{
                    header: 'text-gray-900',
                    pot: 'bg-gray-100 text-gray-900',
                    border: 'border-gray-300'
                  }}
                  heroPosition={heroPosition}
                  onAddAction={() => handleAddAction('preflop')}
                  onUpdateAction={handleUpdateAction}
                  onRemoveAction={handleRemoveAction}
                  onOpenCardSelector={openCardSelector}
                  onAddDecision={handleAddDecision}
                  onUpdateDecision={handleUpdateDecision}
                  onRemoveDecision={handleRemoveDecision}
                  getAvailablePositions={getAvailablePositions}
                  isPositionAllIn={isPositionAllIn}
                />
                
                {/* Flop */}
                <div className="space-y-2">
                  {renderBoardCardSelector('flop')}
                  <StreetSection
                    street="flop"
                    title="翻牌圈 (Flop)"
                    emoji="🎲"
                    actions={actions.filter(a => {
                      const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('flop')
                      return a.street === 'flop' && !excludedPositions.includes(a.position)
                    })}
                    potSize={getPotAtStreet('flop')}
                    blindMode={blindMode}
                    colorScheme={{
                      header: 'text-gray-900',
                      pot: 'bg-gray-100 text-gray-900',
                      border: 'border-gray-300'
                    }}
                    heroPosition={heroPosition}
                    onAddAction={() => handleAddAction('flop')}
                    onUpdateAction={handleUpdateAction}
                    onRemoveAction={handleRemoveAction}
                    onOpenCardSelector={openCardSelector}
                    onAddDecision={handleAddDecision}
                    onUpdateDecision={handleUpdateDecision}
                    onRemoveDecision={handleRemoveDecision}
                    getAvailablePositions={getAvailablePositions}
                    isPositionAllIn={isPositionAllIn}
                  />
                              </div>
                              
                {/* Turn */}
                <div className="space-y-2">
                  {renderBoardCardSelector('turn')}
                  <StreetSection
                    street="turn"
                    title="转牌圈 (Turn)"
                    emoji="🎰"
                    actions={actions.filter(a => {
                      const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('turn')
                      return a.street === 'turn' && !excludedPositions.includes(a.position)
                    })}
                    potSize={getPotAtStreet('turn')}
                    blindMode={blindMode}
                    colorScheme={{
                      header: 'text-gray-900',
                      pot: 'bg-gray-100 text-gray-900',
                      border: 'border-gray-300'
                    }}
                    heroPosition={heroPosition}
                    onAddAction={() => handleAddAction('turn')}
                    onUpdateAction={handleUpdateAction}
                    onRemoveAction={handleRemoveAction}
                    onOpenCardSelector={openCardSelector}
                    onAddDecision={handleAddDecision}
                    onUpdateDecision={handleUpdateDecision}
                    onRemoveDecision={handleRemoveDecision}
                    getAvailablePositions={getAvailablePositions}
                    isPositionAllIn={isPositionAllIn}
                  />
                      </div>
                      
                {/* River */}
                <div className="space-y-2">
                  {renderBoardCardSelector('river')}
                  <StreetSection
                    street="river"
                    title="河牌圈 (River)"
                    emoji="🎯"
                    actions={actions.filter(a => {
                          const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('river')
                          return a.street === 'river' && !excludedPositions.includes(a.position)
                    })}
                    potSize={getPotAtStreet('river')}
                    blindMode={blindMode}
                    colorScheme={{
                      header: 'text-gray-900',
                      pot: 'bg-gray-100 text-gray-900',
                      border: 'border-gray-300'
                    }}
                    heroPosition={heroPosition}
                    onAddAction={() => handleAddAction('river')}
                    onUpdateAction={handleUpdateAction}
                    onRemoveAction={handleRemoveAction}
                    onOpenCardSelector={openCardSelector}
                    onAddDecision={handleAddDecision}
                    onUpdateDecision={handleUpdateDecision}
                    onRemoveDecision={handleRemoveDecision}
                    getAvailablePositions={getAvailablePositions}
                    isPositionAllIn={isPositionAllIn}
                  />
                    </div>
                </div>
              </div>
          </div>

          {/* Footer */}
          {!isInline && (
            <div className="flex justify-end gap-3 mt-4 md:mt-6 pt-4 border-t-2 border-gray-300">
              <Button onClick={onClose} variant="ghost" className="px-6 py-2.5 text-base border-2 border-gray-300 hover:bg-gray-100">
                取消
              </Button>
              <Button 
                onClick={handleSave} 
                variant="primary" 
                className="px-8 py-2.5 text-base font-semibold bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all"
              >
                💾 保存手牌
              </Button>
            </div>
          )}

          {isInline && (
            <div className="flex justify-center gap-3 mt-4 md:mt-6">
              <Button 
                onClick={handleSave} 
                variant="primary" 
                className="px-10 py-3 text-lg font-semibold bg-black hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all"
              >
                💾 保存手牌记录
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  
  if (isInline) {
    return (
      <>
        {modalContent}
        
        {/* 卡牌选择器 - 使用 Portal 渲染到 body */}
      {cardSelectorOpen && (
          <Portal>
        <SimpleCardSelector
          onClose={() => {
            setCardSelectorOpen(false)
            setCurrentEditingActionId(null)
            setEditingBoardCard(null)
            setTempSelectedCards([])
          }}
        onSelectCard={handleCardSelect}
          maxCards={(() => {
            if (editingBoardCard) {
              if (editingBoardCard.street === 'flop') return 3
              if (editingBoardCard.street === 'turn') return 1
              if (editingBoardCard.street === 'river') return 1
            }
                return 2
          })()}
          selectedCards={(() => {
            if (editingBoardCard) {
              if (editingBoardCard.street === 'flop') {
                return tempSelectedCards
              }
              return []
            }
            if (!currentEditingActionId) return []
            const action = actions.find(a => a.id === currentEditingActionId)
            return action?.hero_cards ? [...action.hero_cards] : []
          })()}
              usedCards={getUsedCards()}
            />
          </Portal>
        )}
      </>
    )
  }
  
  return (
    <>
      {/* 主模态框 */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-2 md:p-4 animate-fade-in">
        {modalContent}
      </div>
      
      {/* 卡牌选择器 - 使用 Portal 渲染到 body */}
      {cardSelectorOpen && (
        <Portal>
          <SimpleCardSelector
            onClose={() => {
              setCardSelectorOpen(false)
              setCurrentEditingActionId(null)
              setEditingBoardCard(null)
              setTempSelectedCards([])
            }}
            onSelectCard={handleCardSelect}
            maxCards={(() => {
              if (editingBoardCard) {
                if (editingBoardCard.street === 'flop') return 3
                if (editingBoardCard.street === 'turn') return 1
                if (editingBoardCard.street === 'river') return 1
              }
              return 2
            })()}
            selectedCards={(() => {
            if (editingBoardCard) {
                if (editingBoardCard.street === 'flop') {
                  return tempSelectedCards
                }
                return []
              }
              if (!currentEditingActionId) return []
              const action = actions.find(a => a.id === currentEditingActionId)
              return action?.hero_cards ? [...action.hero_cards] : []
          })()}
            usedCards={getUsedCards()}
        />
        </Portal>
      )}
    </>
  )
}
