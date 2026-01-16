'use client'

import { Action, Street, BlindMode, PokerPosition, ActionDecision } from '@/types/poker'
import { ActionItem } from './ActionItem'
import { Button } from '@/components/ui/Button'

interface StreetSectionProps {
  street: Street
  title: string
  emoji: string
  actions: Action[]
  potSize: number
  blindMode: BlindMode
  colorScheme: {
    header: string
    pot: string
    border: string
  }
  heroPosition: PokerPosition | null
  onAddAction: () => void
  onUpdateAction: (id: string, updates: Partial<Action>) => void
  onRemoveAction: (id: string) => void
  onOpenCardSelector: (actionId: string) => void
  onAddDecision: (actionId: string) => void
  onUpdateDecision: (actionId: string, index: number, updates: Partial<ActionDecision>) => void
  onRemoveDecision: (actionId: string, index: number) => void
  getAvailablePositions: (street: Street, actionId: string) => PokerPosition[]
  isPositionAllIn: (position: PokerPosition, street: Street) => boolean
}

export function StreetSection({
  street,
  title,
  emoji,
  actions,
  potSize,
  blindMode,
  colorScheme,
  heroPosition,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onOpenCardSelector,
  onAddDecision,
  onUpdateDecision,
  onRemoveDecision,
  getAvailablePositions,
  isPositionAllIn
}: StreetSectionProps) {
  return (
    <div className="bg-white rounded-lg p-1 md:p-2.5 border-2 border-gray-300">
      <div className="mb-1 md:mb-3 flex items-center justify-between">
        <h4 className="font-bold text-base md:text-xl text-gray-900">
          {emoji} {title}
        </h4>
        <div className="bg-gray-100 border border-gray-400 px-3 py-1 rounded-lg">
          <span className="text-sm font-semibold text-gray-900">
            底池: {potSize} {blindMode === 'bb' ? 'BB' : ''}
          </span>
        </div>
      </div>
      
      <div className="space-y-1 md:space-y-3">
        {actions.map((action) => (
          <ActionItem
            key={action.id}
            action={action}
            blindMode={blindMode}
            availablePositions={getAvailablePositions(street, action.id)}
            isAllIn={street !== 'preflop' && isPositionAllIn(action.position, street)}
            heroPosition={heroPosition}
            onUpdate={(updates) => onUpdateAction(action.id, updates)}
            onRemove={() => onRemoveAction(action.id)}
            onOpenCardSelector={() => onOpenCardSelector(action.id)}
            onAddDecision={() => onAddDecision(action.id)}
            onUpdateDecision={(idx, updates) => onUpdateDecision(action.id, idx, updates)}
            onRemoveDecision={(idx) => onRemoveDecision(action.id, idx)}
          />
        ))}
        
        {actions.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            暂无行动，点击下方"+ 添加行动"开始记录
          </div>
        )}
        
        <div className="pt-2">
          <Button onClick={onAddAction} variant="primary" className="w-full">
            + 添加行动
          </Button>
        </div>
      </div>
    </div>
  )
}

