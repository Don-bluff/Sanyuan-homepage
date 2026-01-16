'use client'

import { Action, ActionType, PokerPosition, PokerCard, BlindMode, ActionDecision } from '@/types/poker'
import { DecisionItem } from './DecisionItem'

interface ActionItemProps {
  action: Action
  blindMode: BlindMode
  availablePositions: PokerPosition[]
  isAllIn: boolean
  heroPosition: PokerPosition | null
  onUpdate: (updates: Partial<Action>) => void
  onRemove: () => void
  onOpenCardSelector: () => void
  onAddDecision: () => void
  onUpdateDecision: (index: number, updates: Partial<ActionDecision>) => void
  onRemoveDecision: (index: number) => void
}

export function ActionItem({
  action,
  blindMode,
  availablePositions,
  isAllIn,
  heroPosition,
  onUpdate,
  onRemove,
  onOpenCardSelector,
  onAddDecision,
  onUpdateDecision,
  onRemoveDecision
}: ActionItemProps) {
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
    <div className={`p-1 md:p-2.5 rounded-lg border-2 ${action.is_hero ? 'bg-gray-100 border-black' : 'bg-white border-gray-300'}`}>
      <div className="flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-2 md:gap-3">
        {/* 移动端：垂直排列，桌面端：水平排列 */}
        <div className="w-full md:w-auto flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-2 md:gap-3">
          {/* Hero Checkbox 和手牌 */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <label className="text-[10px] text-gray-700 font-medium">HERO</label>
              <input
                type="checkbox"
                checked={action.is_hero}
                onChange={(e) => onUpdate({ is_hero: e.target.checked })}
                disabled={heroPosition !== null && heroPosition !== action.position && !action.is_hero}
                className={`w-5 h-5 text-black rounded focus:ring-2 focus:ring-gray-500 ${
                  heroPosition !== null && heroPosition !== action.position && !action.is_hero
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }`}
              />
            </div>
            
            {/* Hero手牌 */}
            {action.is_hero && (
              <div className="flex gap-1">
                <div 
                  onClick={onOpenCardSelector}
                  className="flex gap-1 cursor-pointer"
                >
                  {[0, 1].map((cardIndex) => {
                    const card = action.hero_cards?.[cardIndex]
                    
                    return (
                      <div
                        key={cardIndex}
                        className={`w-9 h-12 md:w-11 md:h-15 border-2 rounded-md flex flex-col items-center justify-center gap-0.5 transition-all ${
                          card 
                            ? 'bg-white border-gray-300 shadow-sm hover:shadow-md' 
                                                  : 'bg-gray-100 border-dashed border-gray-400 hover:border-gray-600 hover:bg-gray-200'
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
                onChange={(e) => onUpdate({ position: e.target.value as PokerPosition })}
                className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white font-medium"
              >
                {availablePositions.map(pos => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <label className="text-xs text-gray-700 whitespace-nowrap">后手:</label>
              {isAllIn ? (
                <div className="px-3 py-2 bg-gray-200 border-2 border-gray-400 rounded-lg">
                  <span className="text-sm font-bold text-gray-900">ALL-IN！</span>
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    value={action.stack}
                    onChange={(e) => onUpdate({ stack: Number(e.target.value) })}
                    disabled={action.street !== 'preflop'}
                    className={`w-16 px-2 py-2 text-sm border-2 rounded-lg font-medium ${
                      action.street === 'preflop'
                        ? 'border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white'
                        : 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-600'
                    }`}
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-600 font-medium">
                    {blindMode === 'chips' ? '' : 'BB'}
                  </span>
                </>
              )}
            </div>
          </div>
          
          {/* 行动和数量 */}
          {isAllIn ? (
            <div className="flex-1">
              <div className="px-4 py-2 bg-gray-200 border-2 border-gray-400 rounded-lg">
                <span className="text-sm font-medium text-gray-800">该玩家已ALL-IN，无需行动</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 md:flex-initial">
              <div className="flex-1 md:flex-initial md:w-24">
                <select
                  value={action.action}
                  onChange={(e) => onUpdate({ action: e.target.value as ActionType })}
                  className="w-full px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white font-medium"
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
              {(action.action === 'bet' || action.action === 'raise' || 
                action.action === 'call' || action.action === 'allin') && (
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-700 whitespace-nowrap">数量:</label>
                  <input
                    type="number"
                    value={action.amount || 0}
                    onChange={(e) => onUpdate({ amount: Number(e.target.value) })}
                    className="w-16 px-2 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-medium bg-white"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-600 font-medium">
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
              onClick={onRemove}
              className="w-full md:w-auto px-4 py-2 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-900 active:bg-black transition-colors font-medium whitespace-nowrap"
            >
              删除
            </button>
          </div>
        </div>
      </div>
      
      {/* 多轮决策 */}
      {action.decisions && action.decisions.length > 0 && (
        <div className="mt-3 pl-4 border-l-4 border-gray-400 space-y-2">
          {action.decisions.map((decision, idx) => (
            <DecisionItem
              key={idx}
              decision={decision}
              index={idx}
              blindMode={blindMode}
              onUpdate={(updates) => onUpdateDecision(idx, updates)}
              onRemove={() => onRemoveDecision(idx)}
            />
          ))}
        </div>
      )}
      
      {/* 添加后续决策按钮 */}
      <div className="mt-2">
        <button
          type="button"
          onClick={onAddDecision}
          className="px-3 py-1.5 text-xs bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium border border-gray-400"
        >
          + 添加后续决策
        </button>
      </div>
    </div>
  )
}

