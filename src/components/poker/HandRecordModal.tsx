'use client'

import { useState, useEffect } from 'react'
import { HandRecord, Player, PokerCard, GameType, BlindMode, PokerPosition, Action, ActionType, Street, ActionDecision } from '@/types/poker'
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

// 位置顺序映射（用于判断前置位/后置位）
const positionOrder: Record<PokerPosition, number> = {
  'SB': 0,
  'BB': 1,
  'UTG': 2,
  'UTG+1': 3,
  'UTG+2': 4,
  'MP': 5,
  'MP+1': 6,
  'CO': 7,
  'BTN': 8
}

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

  // 获取在某个街道之前已经FOLD或ALL-IN的位置列表
  const getFoldedOrAllInPositionsBeforeStreet = (street: Street): PokerPosition[] => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === -1) return []
    
    const excludedPositions = new Set<PokerPosition>()
    
    // 检查当前街道之前的所有街道
    for (let i = 0; i < targetIndex; i++) {
      const streetActions = actions.filter(a => a.street === streetOrder[i])
      
      // 找出在这个街道FOLD或ALL-IN的位置
      streetActions.forEach(action => {
        // 检查第一个行动
        if (action.action === 'fold') {
          excludedPositions.add(action.position)
        }
        
        // 检查所有后续决策
        if (action.decisions && action.decisions.length > 0) {
          action.decisions.forEach(decision => {
            if (decision.action === 'fold') {
              excludedPositions.add(action.position)
            }
          })
        }
      })
    }
    
    // 检查在上一个街道结束后筹码为0的位置（已ALL-IN）
    if (targetIndex > 0) {
      const previousStreet = streetOrder[targetIndex - 1]
      const allPositions = new Set<PokerPosition>()
      
      // 收集所有参与的位置
      actions.filter(a => a.street === previousStreet).forEach(a => allPositions.add(a.position))
      
      // 检查每个位置在上一个街道结束时的筹码
      allPositions.forEach(position => {
        if (getPositionStackAtStreet(position, previousStreet) === 0) {
          excludedPositions.add(position)
        }
      })
    }
    
    return Array.from(excludedPositions)
  }

  // 获取某个街道已经被使用的位置列表（用于位置唯一性检查）
  const getUsedPositionsInStreet = (street: Street, excludeActionId?: string): PokerPosition[] => {
    return actions
      .filter(a => a.street === street && a.id !== excludeActionId)
      .map(a => a.position)
  }

  // 获取某个action可用的位置列表
  const getAvailablePositions = (street: Street, currentActionId: string): PokerPosition[] => {
    const usedPositions = getUsedPositionsInStreet(street, currentActionId)
    return positions.filter(pos => !usedPositions.includes(pos))
  }

  // 检查某个位置在某个街道是否已经ALL-IN
  const isPositionAllIn = (position: PokerPosition, street: Street): boolean => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === 0) return false // 翻牌前不可能已经ALL-IN
    
    // 计算该位置在上一个街道结束时的筹码
    const previousStreet = streetOrder[targetIndex - 1]
    const remainingStack = getPositionStackAtStreet(position, previousStreet)
    
    return remainingStack === 0
  }

  // 计算某个位置在某个street结束时的筹码
  const getPositionStackAtStreet = (position: PokerPosition, street: Street, actionsArray: Action[] = actions): number => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === -1) return 100 // 默认初始筹码
    
    // 从该street往前找，找到该位置的最后一个action
    for (let i = targetIndex; i >= 0; i--) {
      const streetActions = actionsArray.filter(a => 
        a.street === streetOrder[i] && a.position === position
      )
      
      if (streetActions.length > 0) {
        // 取该street该位置的最后一个action
        const lastAction = streetActions[streetActions.length - 1]
        let finalStack = lastAction.stack
        
        // 减去该action的金额
        if (lastAction.action === 'bet' || lastAction.action === 'raise' || lastAction.action === 'call' || lastAction.action === 'allin') {
          finalStack -= (lastAction.amount || 0)
        }
        
        // 减去所有后续决策的金额
        if (lastAction.decisions && lastAction.decisions.length > 0) {
          lastAction.decisions.forEach(decision => {
            if (decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') {
              finalStack -= (decision.amount || 0)
            }
          })
        }
        
        return finalStack
      }
    }
    
    return 100 // 如果没找到，返回默认值
  }

  const handleAddAction = (street: Street) => {
    const newActionId = Date.now().toString()
    
    // 获取该街道的可用位置列表
    const usedPositions = getUsedPositionsInStreet(street)
    const availablePositions = positions.filter(pos => !usedPositions.includes(pos))
    
    // 如果没有可用位置，使用UTG（理论上不应该发生，因为有9个位置）
    const defaultPosition = availablePositions.length > 0 ? availablePositions[0] : 'UTG'
    
    const newAction: Action = {
      id: newActionId,
      street: street,
      position: defaultPosition,
      stack: getPositionStackAtStreet(defaultPosition, street),
      action: 'fold',
      amount: 0,
      is_hero: false,
      hero_cards: undefined
    }
    
    const newActions = [...actions, newAction]
    
    // 如果是在翻牌前、翻牌圈或转牌圈添加行动，自动在后续回合创建该位置的行动
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentStreetIndex = streetOrder.indexOf(street)
    
    if (currentStreetIndex < streetOrder.length - 1) {
      // 为后续每个street创建对应位置的action
      for (let i = currentStreetIndex + 1; i < streetOrder.length; i++) {
        const nextStreet = streetOrder[i]
        const nextAction: Action = {
          id: `${newActionId}_${nextStreet}`,
          street: nextStreet,
          position: newAction.position,
          stack: 100, // 临时值，会在setActions后重新计算
          action: 'fold',
          amount: 0,
          is_hero: newAction.is_hero,
          hero_cards: newAction.is_hero ? newAction.hero_cards : undefined
        }
        newActions.push(nextAction)
      }
    }
    
    setActions(newActions)
  }

  // 为某个action添加后续决策
  const handleAddDecision = (actionId: string) => {
    const newActions = actions.map(action => {
      if (action.id === actionId) {
        const decisions = action.decisions || []
        return {
          ...action,
          decisions: [...decisions, { action: 'fold' as ActionType, amount: 0 }]
        }
      }
      return action
    })
    setActions(newActions)
  }

  // 更新某个决策
  const handleUpdateDecision = (actionId: string, decisionIndex: number, updates: Partial<ActionDecision>) => {
    const targetAction = actions.find(a => a.id === actionId)
    if (!targetAction) return
    
    const currentDecision = targetAction.decisions?.[decisionIndex]
    
    // 如果切换到Call，自动填充需要补齐的差额
    if (updates.action === 'call' && currentDecision?.action !== 'call') {
      const callAmount = getCallAmountForDecision(targetAction.street, actionId, decisionIndex)
      if (callAmount > 0 && !updates.amount) {
        updates.amount = callAmount
      }
    }
    
    // 如果切换到All-in，自动计算并填充剩余筹码
    if (updates.action === 'allin' && !updates.amount) {
      // 计算经过前面所有决策后的剩余筹码
      let remainingStack = targetAction.stack
      
      // 减去第一个action的金额
      if (targetAction.action === 'bet' || targetAction.action === 'raise' || 
          targetAction.action === 'call' || targetAction.action === 'allin') {
        remainingStack -= (targetAction.amount || 0)
      }
      
      // 减去之前所有决策的金额
      if (targetAction.decisions) {
        for (let i = 0; i < decisionIndex; i++) {
          const decision = targetAction.decisions[i]
          if (decision.action === 'bet' || decision.action === 'raise' || 
              decision.action === 'call' || decision.action === 'allin') {
            remainingStack -= (decision.amount || 0)
          }
        }
      }
      
      updates.amount = Math.max(0, remainingStack)
    }
    
    let newActions = actions.map(action => {
      if (action.id === actionId && action.decisions) {
        const newDecisions = [...action.decisions]
        newDecisions[decisionIndex] = { ...newDecisions[decisionIndex], ...updates }
        return { ...action, decisions: newDecisions }
      }
      return action
    })
    
    // 如果某个后续决策变为raise或allin（非FOLD），自动为同街道所有其他玩家添加新的后续决策
    if (updates.action && updates.action !== 'fold' && updates.action !== 'check') {
      // 如果是raise或allin，或者其他需要回应的行动，为所有其他玩家添加后续决策
      const needsResponse = updates.action === 'raise' || updates.action === 'allin' || updates.action === 'bet'
      
      if (needsResponse) {
        const currentPosition = targetAction.position
        
        // 为同街道中所有其他玩家添加新的后续决策
        newActions = newActions.map(action => {
          if (action.street === targetAction.street && action.id !== actionId) {
            const decisions = action.decisions || []
            
            // 检查该玩家是否已经FOLD
            const hasFolded = action.action === 'fold' || 
              (decisions.length > 0 && decisions[decisions.length - 1].action === 'fold')
            
            if (!hasFolded) {
              // 确保有足够的后续决策（至少比当前决策多一轮）
              if (decisions.length <= decisionIndex) {
                const newDecisions = [...decisions]
                // 添加缺失的决策轮次
                while (newDecisions.length <= decisionIndex) {
                  newDecisions.push({ action: 'fold' as ActionType, amount: 0 })
                }
                return { ...action, decisions: newDecisions }
              }
            }
          }
          return action
        })
      }
    }
    
    // 如果更新了决策的金额，重新计算该位置在后续street的筹码
    if (updates.action || updates.amount !== undefined) {
      const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      
      // 更新后续street中同一位置的筹码
      if (currentStreetIndex < streetOrder.length - 1) {
        newActions = newActions.map(action => {
          const actionStreetIndex = streetOrder.indexOf(action.street)
          
          // 只更新后续street中同一位置的action
          if (action.position === targetAction.position && actionStreetIndex > currentStreetIndex) {
            const previousStreet = streetOrder[actionStreetIndex - 1]
            const calculatedStack = getPositionStackAtStreet(action.position, previousStreet, newActions)
            return { ...action, stack: calculatedStack }
          }
          
          return action
        })
      }
    }
    
    setActions(newActions)
  }

  // 删除某个决策
  const handleRemoveDecision = (actionId: string, decisionIndex: number) => {
    const targetAction = actions.find(a => a.id === actionId)
    if (!targetAction) return
    
    let newActions = actions.map(action => {
      if (action.id === actionId && action.decisions) {
        const newDecisions = action.decisions.filter((_, idx) => idx !== decisionIndex)
        return { ...action, decisions: newDecisions }
      }
      return action
    })
    
    // 重新计算该位置在后续street的筹码
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentStreetIndex = streetOrder.indexOf(targetAction.street)
    
    // 更新后续street中同一位置的筹码
    if (currentStreetIndex < streetOrder.length - 1) {
      newActions = newActions.map(action => {
        const actionStreetIndex = streetOrder.indexOf(action.street)
        
        // 只更新后续street中同一位置的action
        if (action.position === targetAction.position && actionStreetIndex > currentStreetIndex) {
          const previousStreet = streetOrder[actionStreetIndex - 1]
          const calculatedStack = getPositionStackAtStreet(action.position, previousStreet, newActions)
          return { ...action, stack: calculatedStack }
        }
        
        return action
      })
    }
    
    setActions(newActions)
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


  // 获取当前street中最后一个bet/raise的金额
  // 获取当前玩家需要CALL的金额（差额）
  const getLastBetAmount = (street: Street, currentActionId: string): number => {
    let maxTotalInvested = 0
    
    // 找到当前街道每个玩家的总投入，并取最大值
    const streetActions = actions.filter(a => a.street === street)
    
    streetActions.forEach(action => {
      let playerTotalInvested = 0
      
      // 加上第一个行动的金额
      if ((action.action === 'bet' || action.action === 'raise' || 
           action.action === 'call' || action.action === 'allin') &&
          action.amount && action.amount > 0) {
        playerTotalInvested += action.amount
      }
      
      // 加上所有后续决策的金额
      if (action.decisions && action.decisions.length > 0) {
        action.decisions.forEach(decision => {
          if ((decision.action === 'bet' || decision.action === 'raise' || 
               decision.action === 'call' || decision.action === 'allin') &&
              decision.amount && decision.amount > 0) {
            playerTotalInvested += decision.amount
          }
        })
      }
      
      maxTotalInvested = Math.max(maxTotalInvested, playerTotalInvested)
    })
    
    // 计算当前玩家已经投入的金额
    const currentAction = actions.find(a => a.id === currentActionId)
    let playerInvested = 0
    
    if (currentAction) {
      // 加上第一个行动的金额
      if ((currentAction.action === 'bet' || currentAction.action === 'raise' || 
           currentAction.action === 'call' || currentAction.action === 'allin') &&
          currentAction.amount && currentAction.amount > 0) {
        playerInvested += currentAction.amount
      }
      
      // 加上所有后续决策的金额
      if (currentAction.decisions && currentAction.decisions.length > 0) {
        currentAction.decisions.forEach(decision => {
          if ((decision.action === 'bet' || decision.action === 'raise' || 
               decision.action === 'call' || decision.action === 'allin') &&
              decision.amount && decision.amount > 0) {
            playerInvested += decision.amount
          }
        })
      }
    }
    
    // 返回需要补齐的差额
    return Math.max(0, maxTotalInvested - playerInvested)
  }

  // 获取某个决策需要CALL的金额（差额），考虑到当前决策之前的所有投入
  const getCallAmountForDecision = (street: Street, currentActionId: string, decisionIndex: number): number => {
    let maxTotalInvested = 0
    
    // 找到当前街道每个玩家的总投入，并取最大值
    const streetActions = actions.filter(a => a.street === street)
    
    streetActions.forEach(action => {
      let playerTotalInvested = 0
      
      // 加上第一个行动的金额
      if ((action.action === 'bet' || action.action === 'raise' || 
           action.action === 'call' || action.action === 'allin') &&
          action.amount && action.amount > 0) {
        playerTotalInvested += action.amount
      }
      
      // 加上所有后续决策的金额
      if (action.decisions && action.decisions.length > 0) {
        action.decisions.forEach(decision => {
          if ((decision.action === 'bet' || decision.action === 'raise' || 
               decision.action === 'call' || decision.action === 'allin') &&
              decision.amount && decision.amount > 0) {
            playerTotalInvested += decision.amount
          }
        })
      }
      
      maxTotalInvested = Math.max(maxTotalInvested, playerTotalInvested)
    })
    
    // 计算当前玩家在当前决策之前已经投入的金额
    const currentAction = actions.find(a => a.id === currentActionId)
    let playerInvested = 0
    
    if (currentAction) {
      // 加上第一个行动的金额
      if ((currentAction.action === 'bet' || currentAction.action === 'raise' || 
           currentAction.action === 'call' || currentAction.action === 'allin') &&
          currentAction.amount && currentAction.amount > 0) {
        playerInvested += currentAction.amount
      }
      
      // 加上当前决策之前的所有决策金额
      if (currentAction.decisions && currentAction.decisions.length > 0) {
        for (let i = 0; i < decisionIndex; i++) {
          const decision = currentAction.decisions[i]
          if ((decision.action === 'bet' || decision.action === 'raise' || 
               decision.action === 'call' || decision.action === 'allin') &&
              decision.amount && decision.amount > 0) {
            playerInvested += decision.amount
          }
        }
      }
    }
    
    // 返回需要补齐的差额
    return Math.max(0, maxTotalInvested - playerInvested)
  }

  const handleUpdateAction = (id: string, updates: Partial<Action>) => {
    console.log('handleUpdateAction called:', id, updates)
    
    const targetAction = actions.find(a => a.id === id)
    if (!targetAction) return
    
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    
    // 如果切换到Call，自动填充金额
    if (updates.action === 'call' && targetAction.action !== 'call') {
      const lastBetAmount = getLastBetAmount(targetAction.street, id)
      if (lastBetAmount > 0 && !updates.amount) {
        updates.amount = lastBetAmount
      }
    }
    
    // 如果切换到All-in，自动填充剩余所有后手
    if (updates.action === 'allin' && targetAction.action !== 'allin') {
      if (!updates.amount) {
        updates.amount = targetAction.stack
      }
    }
    
    // 如果从Call切换到其他行动，清除金额（fold/check不需要金额）
    if (updates.action && updates.action !== 'call' && 
        updates.action !== 'bet' && updates.action !== 'raise' && 
        updates.action !== 'allin' && targetAction.action === 'call') {
      updates.amount = 0
    }
    
    // 如果更改了position，自动更新stack并在后续street创建/更新对应位置的action
    if (updates.position && updates.position !== targetAction.position) {
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      
      // 如果不是第一个street，从上一个street获取该position的筹码
      if (currentStreetIndex > 0) {
        const previousStreet = streetOrder[currentStreetIndex - 1]
        const calculatedStack = getPositionStackAtStreet(updates.position as PokerPosition, previousStreet, actions)
        updates.stack = calculatedStack
      }
      
      // 获取基础ID（去掉street后缀）
      const baseId = id.split('_')[0]
      
      // 更新或删除后续street中从这个action自动生成的旧位置的actions
      const newActions = actions.filter(a => {
        // 检查是否是从这个action自动生成的（基于ID前缀）
        const isRelatedAction = a.id === id || a.id.startsWith(`${baseId}_`)
        
        if (!isRelatedAction) return true // 保留不相关的actions
        
        // 对于相关的actions，只保留当前及之前street的
        const actionStreetIndex = streetOrder.indexOf(a.street)
        return actionStreetIndex <= currentStreetIndex
      })
      
      // 更新当前action
      const updatedCurrentAction = { ...targetAction, ...updates }
      const currentIndex = newActions.findIndex(a => a.id === id)
      if (currentIndex !== -1) {
        newActions[currentIndex] = updatedCurrentAction
      } else {
        newActions.push(updatedCurrentAction)
      }
      
      // 为后续street创建新位置的actions
      if (currentStreetIndex < streetOrder.length - 1) {
        for (let i = currentStreetIndex + 1; i < streetOrder.length; i++) {
          const nextStreet = streetOrder[i]
          const nextAction: Action = {
            id: `${baseId}_${nextStreet}`,
            street: nextStreet,
            position: updates.position as PokerPosition,
            stack: 100, // 临时值
            action: 'fold',
            amount: 0,
            is_hero: updatedCurrentAction.is_hero,
            hero_cards: updatedCurrentAction.is_hero ? updatedCurrentAction.hero_cards : undefined
          }
          newActions.push(nextAction)
        }
      }
      
      setActions(newActions)
      return
    }
    
    // 正常更新action
    let newActions = actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    )
    
    // 如果更新了action/amount，重新计算该位置在后续street的筹码
    if (updates.action || updates.amount !== undefined || updates.stack !== undefined) {
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      const updatedAction = newActions.find(a => a.id === id)!
      
      // 更新后续street中同一位置的筹码
      if (currentStreetIndex < streetOrder.length - 1) {
        newActions = newActions.map(action => {
          const actionStreetIndex = streetOrder.indexOf(action.street)
          
          // 只更新后续street中同一位置的action
          if (action.position === updatedAction.position && actionStreetIndex > currentStreetIndex) {
            const previousStreet = streetOrder[actionStreetIndex - 1]
            const calculatedStack = getPositionStackAtStreet(action.position, previousStreet, newActions)
            return { ...action, stack: calculatedStack }
          }
          
          return action
        })
      }
      
      // 如果某个action变为raise或allin，自动为同街道所有其他玩家添加后续决策
      if (updates.action === 'raise' || updates.action === 'allin' || updates.action === 'bet') {
        // 为同街道中所有其他玩家添加后续决策
        newActions = newActions.map(action => {
          if (action.street === targetAction.street && action.id !== id) {
            // 检查该玩家是否已经FOLD
            const hasFolded = action.action === 'fold'
            
            if (!hasFolded) {
              const decisions = action.decisions || []
              // 如果还没有后续决策，自动添加一个
              if (decisions.length === 0) {
                return {
                  ...action,
                  decisions: [{ action: 'fold' as ActionType, amount: 0 }]
                }
              }
            }
          }
          return action
        })
      }
    }
    
    console.log('New actions:', newActions)
    setActions(newActions)
  }

  const handleRemoveAction = (id: string) => {
    const targetAction = actions.find(a => a.id === id)
    if (!targetAction) return
    
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentStreetIndex = streetOrder.indexOf(targetAction.street)
    
    // 获取基础ID（去掉street后缀）
    const baseId = id.split('_')[0]
    
    // 删除当前action以及后续street中从这个action自动生成的所有actions
    let newActions = actions.filter(action => {
      // 检查是否是这个action或从它自动生成的
      const isRelatedAction = action.id === id || action.id.startsWith(`${baseId}_`)
      
      if (!isRelatedAction) return true // 保留不相关的actions
      
      // 对于相关的actions，只保留当前之前street的（即删除当前及之后的）
      const actionStreetIndex = streetOrder.indexOf(action.street)
      return actionStreetIndex < currentStreetIndex
    })
    
    setActions(newActions)
  }

  const [tempSelectedCards, setTempSelectedCards] = useState<PokerCard[]>([])
  
  // 计算初始底池（翻牌前的盲注+前注）
  const getInitialPot = (): number => {
    if (blindMode === 'bb') {
      return smallBlind + bigBlind + ante // BB模式：0.5 + 1 + 1 = 2.5
    } else {
      return smallBlind + bigBlind + ante // 具体数字模式
    }
  }
  
  // 计算某个street的底池
  const getPotAtStreet = (street: Street): number => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    // 初始底池
    let pot = getInitialPot()
    
    // 累加之前所有street的投注
    for (let i = 0; i <= targetIndex; i++) {
      const streetActions = actions.filter(a => a.street === streetOrder[i])
      
      streetActions.forEach(action => {
        // 加上第一个行动的金额
        if (action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'allin') {
          pot += (action.amount || 0)
        }
        
        // 加上所有后续决策的金额
        if (action.decisions && action.decisions.length > 0) {
          action.decisions.forEach(decision => {
            if (decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') {
              pot += (decision.amount || 0)
            }
          })
        }
      })
    }
    
    return pot
  }

  const handleCardSelect = (card: PokerCard) => {
    console.log('Card selected:', card)
    
    // 处理公共牌选择
    if (editingBoardCard) {
      if (editingBoardCard.street === 'flop') {
        // Flop - 选择3张牌
        const currentSelection = [...tempSelectedCards]
        const cardIndex = currentSelection.findIndex(c => c.rank === card.rank && c.suit === card.suit)
        
        if (cardIndex !== -1) {
      // 取消选择
          currentSelection.splice(cardIndex, 1)
        } else if (currentSelection.length < 3) {
      // 添加选择
          currentSelection.push(card)
        }
        
        setTempSelectedCards(currentSelection)
        
        // 如果选择了3张牌，自动保存并关闭
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
                  <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-blue-200">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-base md:text-xl text-blue-700">♠️ 翻牌前 (Preflop)</h4>
                        <div className="bg-blue-100 px-3 py-1 rounded-lg">
                          <span className="text-sm font-semibold text-blue-800">
                            底池: {getInitialPot()} {blindMode === 'bb' ? 'BB' : ''}
                          </span>
                        </div>
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
                                      {positions.map(pos => {
                                        const isUsed = getUsedPositionsInStreet(action.street, action.id).includes(pos)
                                        return (
                                          <option key={pos} value={pos} disabled={isUsed}>
                                            {pos}{isUsed ? ' (已使用)' : ''}
                                          </option>
                                        )
                                      })}
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
                                  {(action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'allin') && (
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
                            
                            {/* 多轮决策 */}
                            {action.decisions && action.decisions.length > 0 && (
                              <div className="mt-3 pl-4 border-l-4 border-blue-300 space-y-2">
                                {action.decisions.map((decision, idx) => (
                                  <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-blue-50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-600 font-medium md:w-20">第{idx + 2}轮:</span>
                                    
                                    <div className="flex items-center gap-2 flex-1">
                                      <select
                                        value={decision.action}
                                        onChange={(e) => handleUpdateDecision(action.id, idx, { action: e.target.value as ActionType })}
                                        className="flex-1 md:flex-initial md:w-24 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                      >
                                        <option value="fold">Fold</option>
                                        <option value="check">Check</option>
                                        <option value="call">Call</option>
                                        <option value="bet">Bet</option>
                                        <option value="raise">Raise</option>
                                        <option value="allin">All-in</option>
                                      </select>
                                      
                                      {(decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') && (
                                        <div className="flex items-center gap-1">
                                          <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                          <input
                                            type="number"
                                            value={decision.amount || 0}
                                            onChange={(e) => handleUpdateDecision(action.id, idx, { amount: Number(e.target.value) })}
                                            className="w-16 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-gray-500 font-medium">
                                            {blindMode === 'chips' ? '' : 'BB'}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDecision(action.id, idx)}
                                        className="px-2 py-1.5 text-xs bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium whitespace-nowrap"
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 添加后续决策按钮 */}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => handleAddDecision(action.id)}
                                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                              >
                                + 添加后续决策
                              </button>
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

                    </div>

                  {/* 翻牌圈 */}
                  <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-green-200">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-base md:text-xl text-green-700">🎲 翻牌圈 (Flop)</h4>
                        <div className="bg-green-100 px-3 py-1 rounded-lg">
                          <span className="text-sm font-semibold text-green-800">
                            底池: {getPotAtStreet('flop')} {blindMode === 'bb' ? 'BB' : ''}
                          </span>
                        </div>
                      </div>
                      
                      {/* 翻牌 */}
                      <div className="mb-4">
                        <span className="text-sm font-medium text-gray-700 block mb-2">翻牌：</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempSelectedCards(boardCards.flop.filter((card): card is PokerCard => card !== null))
                            openBoardCardSelector('flop')
                          }}
                          className="flex items-center gap-2 p-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                        >
                          {boardCards.flop.every(card => card !== null) ? (
                            <div className="flex gap-2">
                              {boardCards.flop.map((card, index) => (
                                <span key={index} className={`font-bold text-xl ${
                                  card!.suit === 'hearts' || card!.suit === 'diamonds'
                                  ? 'text-red-500'
                                  : 'text-gray-800'
                                }`}>
                                  {card!.rank}
                                  {card!.suit === 'hearts' && '♥️'}
                                  {card!.suit === 'diamonds' && '♦️'}
                                  {card!.suit === 'clubs' && '♣️'}
                                  {card!.suit === 'spades' && '♠️'}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">点击选择3张翻牌</span>
                          )}
                        </button>
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
                                    {positions.map(pos => {
                                      const isUsed = getUsedPositionsInStreet(action.street, action.id).includes(pos)
                                      return (
                                        <option key={pos} value={pos} disabled={isUsed}>
                                          {pos}{isUsed ? ' (已使用)' : ''}
                                        </option>
                                      )
                                    })}
                                  </select>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                                  {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                                    <div className="px-3 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                                      <span className="text-sm font-bold text-red-600">ALL-IN！</span>
                                    </div>
                                  ) : (
                                    <>
                                      <input
                                        type="number"
                                        value={action.stack}
                                        onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                                        disabled={action.street !== 'preflop'}
                                        className={`w-16 px-2 py-2 text-sm border-2 rounded-lg font-medium ${
                                          action.street === 'preflop'
                                            ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                            : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-600'
                                        }`}
                                        placeholder="0"
                                      />
                                      <span className="text-xs text-gray-500 font-medium">
                                        {blindMode === 'chips' ? '' : 'BB'}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* 第三行 */}
                              {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                                <div className="flex-1">
                                  <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
                                    <span className="text-sm font-medium text-yellow-800">该玩家已ALL-IN，无需行动</span>
                                  </div>
                                </div>
                              ) : (
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
                                  {(action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'allin') && (
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
                              )}
                              
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
                  
                            {/* 多轮决策 */}
                            {action.decisions && action.decisions.length > 0 && (
                              <div className="mt-3 pl-4 border-l-4 border-green-300 space-y-2">
                                {action.decisions.map((decision, idx) => (
                                  <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-green-50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-600 font-medium md:w-20">第{idx + 2}轮:</span>
                                    
                                    <div className="flex items-center gap-2 flex-1">
                                      <select
                                        value={decision.action}
                                        onChange={(e) => handleUpdateDecision(action.id, idx, { action: e.target.value as ActionType })}
                                        className="flex-1 md:flex-initial md:w-24 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                      >
                                        <option value="fold">Fold</option>
                                        <option value="check">Check</option>
                                        <option value="call">Call</option>
                                        <option value="bet">Bet</option>
                                        <option value="raise">Raise</option>
                                        <option value="allin">All-in</option>
                                      </select>
                                      
                                      {(decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') && (
                                        <div className="flex items-center gap-1">
                                          <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                    <input
                      type="number"
                                            value={decision.amount || 0}
                                            onChange={(e) => handleUpdateDecision(action.id, idx, { amount: Number(e.target.value) })}
                                            className="w-16 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-gray-500 font-medium">
                                            {blindMode === 'chips' ? '' : 'BB'}
                                          </span>
                  </div>
                                      )}
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDecision(action.id, idx)}
                                        className="px-2 py-1.5 text-xs bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium whitespace-nowrap"
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                          ))}
                        </div>
                      )}
                            
                            {/* 添加后续决策按钮 */}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => handleAddDecision(action.id)}
                                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                              >
                                + 添加后续决策
                    </button>
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

                    </div>

                  {/* 转牌圈 */}
                  <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-orange-200">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-base md:text-xl text-orange-700">🎰 转牌圈 (Turn)</h4>
                        <div className="bg-orange-100 px-3 py-1 rounded-lg">
                          <span className="text-sm font-semibold text-orange-800">
                            底池: {getPotAtStreet('turn')} {blindMode === 'bb' ? 'BB' : ''}
                          </span>
                        </div>
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
                        {actions.filter(a => {
                          // 过滤掉已经在之前街道FOLD或ALL-IN的位置
                          const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('turn')
                          return a.street === 'turn' && !excludedPositions.includes(a.position)
                        }).map((action) => (
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
                      {positions.map(pos => {
                        const isUsed = getUsedPositionsInStreet(action.street, action.id).includes(pos)
                        return (
                          <option key={pos} value={pos} disabled={isUsed}>
                            {pos}{isUsed ? ' (已使用)' : ''}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                                
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                    {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                      <div className="px-3 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                        <span className="text-sm font-bold text-red-600">ALL-IN！</span>
                      </div>
                    ) : (
                      <>
                    <input
                      type="number"
                          value={action.stack}
                          onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                          disabled={action.street !== 'preflop'}
                          className={`w-16 px-2 py-2 text-sm border-2 rounded-lg font-medium ${
                            action.street === 'preflop'
                              ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-600'
                          }`}
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500 font-medium">
                          {blindMode === 'chips' ? '' : 'BB'}
                        </span>
                      </>
                    )}
                </div>
                  </div>
                  
                              {/* 第三行 */}
                              {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                                <div className="flex-1">
                                  <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
                                    <span className="text-sm font-medium text-yellow-800">该玩家已ALL-IN，无需行动</span>
                                  </div>
                                </div>
                              ) : (
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
                                  {(action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'allin') && (
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
                              )}

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
                
                            {/* 多轮决策 */}
                            {action.decisions && action.decisions.length > 0 && (
                              <div className="mt-3 pl-4 border-l-4 border-orange-300 space-y-2">
                                {action.decisions.map((decision, idx) => (
                                  <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-orange-50 p-2 rounded-lg">
                                    <span className="text-xs text-gray-600 font-medium md:w-20">第{idx + 2}轮:</span>
                                    
                                    <div className="flex items-center gap-2 flex-1">
                        <select
                                        value={decision.action}
                                        onChange={(e) => handleUpdateDecision(action.id, idx, { action: e.target.value as ActionType })}
                                        className="flex-1 md:flex-initial md:w-24 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                      >
                                        <option value="fold">Fold</option>
                                        <option value="check">Check</option>
                                        <option value="call">Call</option>
                                        <option value="bet">Bet</option>
                                        <option value="raise">Raise</option>
                                        <option value="allin">All-in</option>
                                      </select>
                                      
                                      {(decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') && (
                                        <div className="flex items-center gap-1">
                                          <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                          <input
                                            type="number"
                                            value={decision.amount || 0}
                                            onChange={(e) => handleUpdateDecision(action.id, idx, { amount: Number(e.target.value) })}
                                            className="w-16 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                            placeholder="0"
                                          />
                                          <span className="text-xs text-gray-500 font-medium">
                                            {blindMode === 'chips' ? '' : 'BB'}
                                          </span>
                                        </div>
                                      )}
                                      
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDecision(action.id, idx)}
                                        className="px-2 py-1.5 text-xs bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium whitespace-nowrap"
                                      >
                                        删除
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 添加后续决策按钮 */}
                            <div className="mt-2">
                              <button
                                type="button"
                                onClick={() => handleAddDecision(action.id)}
                                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                              >
                                + 添加后续决策
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {actions.filter(a => {
                          const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('turn')
                          return a.street === 'turn' && !excludedPositions.includes(a.position)
                        }).length === 0 && (
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
                
                    </div>

                  {/* 河牌圈 */}
                  <div className="bg-white rounded-xl p-3 md:p-5 border-2 border-red-200">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="font-bold text-base md:text-xl text-red-700">🎯 河牌圈 (River)</h4>
                        <div className="bg-red-100 px-3 py-1 rounded-lg">
                          <span className="text-sm font-semibold text-red-800">
                            底池: {getPotAtStreet('river')} {blindMode === 'bb' ? 'BB' : ''}
                          </span>
                        </div>
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
                        {actions.filter(a => {
                          // 过滤掉已经在之前街道FOLD或ALL-IN的位置
                          const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('river')
                          return a.street === 'river' && !excludedPositions.includes(a.position)
                        }).map((action) => (
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
                          {positions.map(pos => {
                            const isUsed = getUsedPositionsInStreet(action.street, action.id).includes(pos)
                            return (
                              <option key={pos} value={pos} disabled={isUsed}>
                                {pos}{isUsed ? ' (已使用)' : ''}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      
                                <div className="flex items-center gap-1">
                                  <label className="text-xs text-gray-600 whitespace-nowrap">后手:</label>
                        {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                          <div className="px-3 py-2 bg-red-100 border-2 border-red-300 rounded-lg">
                            <span className="text-sm font-bold text-red-600">ALL-IN！</span>
                          </div>
                        ) : (
                          <>
                        <input
                          type="number"
                              value={action.stack}
                              onChange={(e) => handleUpdateAction(action.id, { stack: Number(e.target.value) })}
                              disabled={action.street !== 'preflop'}
                              className={`w-16 px-2 py-2 text-sm border-2 rounded-lg font-medium ${
                                action.street === 'preflop'
                                  ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                                  : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-600'
                              }`}
                              placeholder="0"
                            />
                            <span className="text-xs text-gray-500 font-medium">
                              {blindMode === 'chips' ? '' : 'BB'}
                            </span>
                          </>
                        )}
                                </div>
                      </div>
                      
                              {/* 第三行 */}
                              {action.street !== 'preflop' && isPositionAllIn(action.position, action.street) ? (
                                <div className="flex-1">
                                  <div className="px-4 py-2 bg-yellow-100 border-2 border-yellow-300 rounded-lg">
                                    <span className="text-sm font-medium text-yellow-800">该玩家已ALL-IN，无需行动</span>
                                  </div>
                                </div>
                              ) : (
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
                                  {(action.action === 'bet' || action.action === 'raise' || action.action === 'call' || action.action === 'allin') && (
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
                              )}
                              
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
                      
                      {/* 多轮决策 */}
                      {action.decisions && action.decisions.length > 0 && (
                        <div className="mt-3 pl-4 border-l-4 border-red-300 space-y-2">
                          {action.decisions.map((decision, idx) => (
                            <div key={idx} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-red-50 p-2 rounded-lg">
                              <span className="text-xs text-gray-600 font-medium md:w-20">第{idx + 2}轮:</span>
                              
                              <div className="flex items-center gap-2 flex-1">
                                <select
                                  value={decision.action}
                                  onChange={(e) => handleUpdateDecision(action.id, idx, { action: e.target.value as ActionType })}
                                  className="flex-1 md:flex-initial md:w-24 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
                                >
                                  <option value="fold">Fold</option>
                                  <option value="check">Check</option>
                                  <option value="call">Call</option>
                                  <option value="bet">Bet</option>
                                  <option value="raise">Raise</option>
                                  <option value="allin">All-in</option>
                                </select>
                                
                                {(decision.action === 'bet' || decision.action === 'raise' || decision.action === 'call' || decision.action === 'allin') && (
                                  <div className="flex items-center gap-1">
                                    <label className="text-xs text-gray-600 whitespace-nowrap">数量:</label>
                                    <input
                                      type="number"
                                      value={decision.amount || 0}
                                      onChange={(e) => handleUpdateDecision(action.id, idx, { amount: Number(e.target.value) })}
                                      className="w-16 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 font-medium">
                                      {blindMode === 'chips' ? '' : 'BB'}
                                    </span>
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDecision(action.id, idx)}
                                  className="px-2 py-1.5 text-xs bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium whitespace-nowrap"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                        </div>
                      )}
                      
                      {/* 添加后续决策按钮 */}
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => handleAddDecision(action.id)}
                          className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >
                          + 添加后续决策
                        </button>
                      </div>
                    </div>
                  ))}
                  
                        {actions.filter(a => {
                          const excludedPositions = getFoldedOrAllInPositionsBeforeStreet('river')
                          return a.street === 'river' && !excludedPositions.includes(a.position)
                        }).length === 0 && (
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
            setTempSelectedCards([])
          }}
        onSelectCard={handleCardSelect}
          maxCards={(() => {
            if (editingBoardCard) {
              if (editingBoardCard.street === 'flop') return 3
              if (editingBoardCard.street === 'turn') return 1
              if (editingBoardCard.street === 'river') return 1
            }
            return 2 // Hero手牌默认2张
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
