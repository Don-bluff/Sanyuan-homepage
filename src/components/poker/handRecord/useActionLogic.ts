import { useState } from 'react'
import { Action, ActionType, Street, PokerPosition, ActionDecision, PokerCard } from '@/types/poker'

const positions: PokerPosition[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB']

export function useActionLogic() {
  const [actions, setActions] = useState<Action[]>([])

  // 获取某个街道已经被使用的位置列表
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

  // 计算某个位置在某个street结束时的筹码
  const getPositionStackAtStreet = (position: PokerPosition, street: Street, actionsArray: Action[] = actions): number => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === -1) return 100
    
    for (let i = targetIndex; i >= 0; i--) {
      const streetActions = actionsArray.filter(a => 
        a.street === streetOrder[i] && a.position === position
      )
      
      if (streetActions.length > 0) {
        const lastAction = streetActions[streetActions.length - 1]
        let finalStack = lastAction.stack
        
        if (lastAction.action === 'bet' || lastAction.action === 'raise' || 
            lastAction.action === 'call' || lastAction.action === 'allin') {
          finalStack -= (lastAction.amount || 0)
        }
        
        if (lastAction.decisions && lastAction.decisions.length > 0) {
          lastAction.decisions.forEach(decision => {
            if (decision.action === 'bet' || decision.action === 'raise' || 
                decision.action === 'call' || decision.action === 'allin') {
              finalStack -= (decision.amount || 0)
            }
          })
        }
        
        return finalStack
      }
    }
    
    return 100
  }

  // 检查某个位置在某个街道是否已经ALL-IN
  const isPositionAllIn = (position: PokerPosition, street: Street): boolean => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === 0) return false
    
    const previousStreet = streetOrder[targetIndex - 1]
    const remainingStack = getPositionStackAtStreet(position, previousStreet)
    
    return remainingStack === 0
  }

  // 获取在某个街道之前已经FOLD或ALL-IN的位置列表
  const getFoldedOrAllInPositionsBeforeStreet = (street: Street): PokerPosition[] => {
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const targetIndex = streetOrder.indexOf(street)
    
    if (targetIndex === -1) return []
    
    const excludedPositions = new Set<PokerPosition>()
    
    for (let i = 0; i < targetIndex; i++) {
      const streetActions = actions.filter(a => a.street === streetOrder[i])
      
      streetActions.forEach(action => {
        if (action.action === 'fold') {
          excludedPositions.add(action.position)
        }
        
        if (action.decisions && action.decisions.length > 0) {
          action.decisions.forEach(decision => {
            if (decision.action === 'fold') {
              excludedPositions.add(action.position)
            }
          })
        }
      })
    }
    
    if (targetIndex > 0) {
      const previousStreet = streetOrder[targetIndex - 1]
      const allPositions = new Set<PokerPosition>()
      
      actions.filter(a => a.street === previousStreet).forEach(a => allPositions.add(a.position))
      
      allPositions.forEach(position => {
        if (getPositionStackAtStreet(position, previousStreet) === 0) {
          excludedPositions.add(position)
        }
      })
    }
    
    return Array.from(excludedPositions)
  }

  const handleAddAction = (street: Street) => {
    const newActionId = Date.now().toString()
    const usedPositions = getUsedPositionsInStreet(street)
    const availablePositions = positions.filter(pos => !usedPositions.includes(pos))
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
    
    let newActions = [...actions, newAction]
    
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentStreetIndex = streetOrder.indexOf(street)
    
    if (currentStreetIndex < streetOrder.length - 1) {
      for (let i = currentStreetIndex + 1; i < streetOrder.length; i++) {
        const nextStreet = streetOrder[i]
        const previousStreet = streetOrder[i - 1]
        const stackAtPreviousStreet = getPositionStackAtStreet(newAction.position, previousStreet, newActions)
        
        const nextAction: Action = {
          id: `${newActionId}_${nextStreet}`,
          street: nextStreet,
          position: newAction.position,
          stack: stackAtPreviousStreet,
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

  // 获取需要 Call 的金额
  const getLastBetAmount = (street: Street, currentActionId: string): number => {
    let maxTotalInvested = 0
    const streetActions = actions.filter(a => a.street === street)
    
    streetActions.forEach(action => {
      let playerTotalInvested = 0
      
      if ((action.action === 'bet' || action.action === 'raise' || 
           action.action === 'call' || action.action === 'allin') &&
          action.amount && action.amount > 0) {
        playerTotalInvested += action.amount
      }
      
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
    
    const currentAction = actions.find(a => a.id === currentActionId)
    let playerInvested = 0
    
    if (currentAction) {
      if ((currentAction.action === 'bet' || currentAction.action === 'raise' || 
           currentAction.action === 'call' || currentAction.action === 'allin') &&
          currentAction.amount && currentAction.amount > 0) {
        playerInvested += currentAction.amount
      }
      
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
    
    return Math.max(0, maxTotalInvested - playerInvested)
  }

  const handleUpdateAction = (id: string, updates: Partial<Action>) => {
    const targetAction = actions.find(a => a.id === id)
    if (!targetAction) return
    
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    
    // 如果切换到 Call，自动填充金额
    if (updates.action === 'call' && targetAction.action !== 'call') {
      const lastBetAmount = getLastBetAmount(targetAction.street, id)
      if (lastBetAmount > 0 && !updates.amount) {
        updates.amount = lastBetAmount
      }
    }
    
    // 如果切换到 All-in，自动填充剩余所有后手
    if (updates.action === 'allin' && targetAction.action !== 'allin') {
      if (!updates.amount) {
        updates.amount = targetAction.stack
      }
    }
    
    // 如果从 Call 切换到其他行动，清除金额（fold/check 不需要金额）
    if (updates.action && updates.action !== 'call' && 
        updates.action !== 'bet' && updates.action !== 'raise' && 
        updates.action !== 'allin' && targetAction.action === 'call') {
      updates.amount = 0
    }
    
    // 处理位置更改
    if (updates.position && updates.position !== targetAction.position) {
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      
      if (currentStreetIndex > 0) {
        const previousStreet = streetOrder[currentStreetIndex - 1]
        const calculatedStack = getPositionStackAtStreet(updates.position as PokerPosition, previousStreet, actions)
        updates.stack = calculatedStack
      }
      
      const baseId = id.split('_')[0]
      
      const newActions = actions.filter(a => {
        const isRelatedAction = a.id === id || a.id.startsWith(`${baseId}_`)
        
        if (!isRelatedAction) return true
        
        const actionStreetIndex = streetOrder.indexOf(a.street)
        return actionStreetIndex <= currentStreetIndex
      })
      
      const updatedCurrentAction = { ...targetAction, ...updates }
      const currentIndex = newActions.findIndex(a => a.id === id)
      if (currentIndex !== -1) {
        newActions[currentIndex] = updatedCurrentAction
      } else {
        newActions.push(updatedCurrentAction)
      }
      
      if (currentStreetIndex < streetOrder.length - 1) {
        for (let i = currentStreetIndex + 1; i < streetOrder.length; i++) {
          const nextStreet = streetOrder[i]
          const previousStreet = streetOrder[i - 1]
          const stackAtPreviousStreet = getPositionStackAtStreet(updates.position as PokerPosition, previousStreet, newActions)
          
          const nextAction: Action = {
            id: `${baseId}_${nextStreet}`,
            street: nextStreet,
            position: updates.position as PokerPosition,
            stack: stackAtPreviousStreet,
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
    
    // 正常更新
    let newActions = actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    )
    
    // 重新计算后续街道筹码
    if (updates.action || updates.amount !== undefined || updates.stack !== undefined) {
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      const updatedAction = newActions.find(a => a.id === id)!
      
      if (currentStreetIndex < streetOrder.length - 1) {
        newActions = newActions.map(action => {
          const actionStreetIndex = streetOrder.indexOf(action.street)
          
          if (action.position === updatedAction.position && actionStreetIndex > currentStreetIndex) {
            const previousStreet = streetOrder[actionStreetIndex - 1]
            const calculatedStack = getPositionStackAtStreet(action.position, previousStreet, newActions)
            return { ...action, stack: calculatedStack }
          }
          
          return action
        })
      }
      
      // 如果某个 action 变为 raise 或 allin，自动为同街道所有其他玩家添加后续决策
      if (updates.action === 'raise' || updates.action === 'allin' || updates.action === 'bet') {
        newActions = newActions.map(action => {
          if (action.street === targetAction.street && action.id !== id) {
            const hasFolded = action.action === 'fold'
            
            if (!hasFolded) {
              const decisions = action.decisions || []
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
    
    setActions(newActions)
  }

  const handleRemoveAction = (id: string) => {
    const targetAction = actions.find(a => a.id === id)
    if (!targetAction) return
    
    const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
    const currentStreetIndex = streetOrder.indexOf(targetAction.street)
    const baseId = id.split('_')[0]
    
    const newActions = actions.filter(action => {
      const isRelatedAction = action.id === id || action.id.startsWith(`${baseId}_`)
      
      if (!isRelatedAction) return true
      
      const actionStreetIndex = streetOrder.indexOf(action.street)
      return actionStreetIndex < currentStreetIndex
    })
    
    setActions(newActions)
  }

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

  // 获取某个决策需要 Call 的金额
  const getCallAmountForDecision = (street: Street, currentActionId: string, decisionIndex: number): number => {
    let maxTotalInvested = 0
    const streetActions = actions.filter(a => a.street === street)
    
    streetActions.forEach(action => {
      let playerTotalInvested = 0
      
      if ((action.action === 'bet' || action.action === 'raise' || 
           action.action === 'call' || action.action === 'allin') &&
          action.amount && action.amount > 0) {
        playerTotalInvested += action.amount
      }
      
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
    
    const currentAction = actions.find(a => a.id === currentActionId)
    let playerInvested = 0
    
    if (currentAction) {
      if ((currentAction.action === 'bet' || currentAction.action === 'raise' || 
           currentAction.action === 'call' || currentAction.action === 'allin') &&
          currentAction.amount && currentAction.amount > 0) {
        playerInvested += currentAction.amount
      }
      
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
    
    return Math.max(0, maxTotalInvested - playerInvested)
  }

  const handleUpdateDecision = (actionId: string, decisionIndex: number, updates: Partial<ActionDecision>) => {
    const targetAction = actions.find(a => a.id === actionId)
    if (!targetAction) return
    
    const currentDecision = targetAction.decisions?.[decisionIndex]
    
    // 如果切换到 Call，自动填充需要补齐的差额
    if (updates.action === 'call' && currentDecision?.action !== 'call') {
      const callAmount = getCallAmountForDecision(targetAction.street, actionId, decisionIndex)
      if (callAmount > 0 && !updates.amount) {
        updates.amount = callAmount
      }
    }
    
    // 如果切换到 All-in，自动计算并填充剩余筹码
    if (updates.action === 'allin' && !updates.amount) {
      let remainingStack = targetAction.stack
      
      if (targetAction.action === 'bet' || targetAction.action === 'raise' || 
          targetAction.action === 'call' || targetAction.action === 'allin') {
        remainingStack -= (targetAction.amount || 0)
      }
      
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
    
    // 如果某个后续决策变为 raise 或 allin（非 FOLD），自动为同街道所有其他玩家添加新的后续决策
    if (updates.action && updates.action !== 'fold' && updates.action !== 'check') {
      const needsResponse = updates.action === 'raise' || updates.action === 'allin' || updates.action === 'bet'
      
      if (needsResponse) {
        newActions = newActions.map(action => {
          if (action.street === targetAction.street && action.id !== actionId) {
            const decisions = action.decisions || []
            
            const hasFolded = action.action === 'fold' || 
              (decisions.length > 0 && decisions[decisions.length - 1].action === 'fold')
            
            if (!hasFolded) {
              if (decisions.length <= decisionIndex) {
                const newDecisions = [...decisions]
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
    
    // 如果更新了决策的金额，重新计算该位置在后续 street 的筹码
    if (updates.action || updates.amount !== undefined) {
      const streetOrder: Street[] = ['preflop', 'flop', 'turn', 'river']
      const currentStreetIndex = streetOrder.indexOf(targetAction.street)
      
      if (currentStreetIndex < streetOrder.length - 1) {
        newActions = newActions.map(action => {
          const actionStreetIndex = streetOrder.indexOf(action.street)
          
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

  const handleRemoveDecision = (actionId: string, decisionIndex: number) => {
    const newActions = actions.map(action => {
      if (action.id === actionId && action.decisions) {
        const newDecisions = action.decisions.filter((_, idx) => idx !== decisionIndex)
        return { ...action, decisions: newDecisions }
      }
      return action
    })
    setActions(newActions)
  }

  return {
    actions,
    setActions,
    getAvailablePositions,
    isPositionAllIn,
    getFoldedOrAllInPositionsBeforeStreet,
    handleAddAction,
    handleUpdateAction,
    handleRemoveAction,
    handleAddDecision,
    handleUpdateDecision,
    handleRemoveDecision
  }
}

