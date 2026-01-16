'use client'

import { ActionType, ActionDecision, BlindMode } from '@/types/poker'

interface DecisionItemProps {
  decision: ActionDecision
  index: number
  blindMode: BlindMode
  onUpdate: (updates: Partial<ActionDecision>) => void
  onRemove: () => void
}

export function DecisionItem({
  decision,
  index,
  blindMode,
  onUpdate,
  onRemove
}: DecisionItemProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-gray-100 p-2 rounded-lg border border-gray-300">
      <span className="text-xs text-gray-700 font-medium md:w-20">第{index + 2}轮:</span>
      
      <div className="flex items-center gap-2 flex-1">
        <select
          value={decision.action}
          onChange={(e) => onUpdate({ action: e.target.value as ActionType })}
          className="flex-1 md:flex-initial md:w-24 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white font-medium"
        >
          <option value="fold">Fold</option>
          <option value="check">Check</option>
          <option value="call">Call</option>
          <option value="bet">Bet</option>
          <option value="raise">Raise</option>
          <option value="allin">All-in</option>
        </select>
        
        {(decision.action === 'bet' || decision.action === 'raise' || 
          decision.action === 'call' || decision.action === 'allin') && (
          <div className="flex items-center gap-1">
            <label className="text-xs text-gray-700 whitespace-nowrap">数量:</label>
            <input
              type="number"
              value={decision.amount || 0}
              onChange={(e) => onUpdate({ amount: Number(e.target.value) })}
              className="w-16 px-2 py-1.5 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-medium bg-white"
              placeholder="0"
            />
            <span className="text-xs text-gray-600 font-medium">
              {blindMode === 'chips' ? '' : 'BB'}
            </span>
          </div>
        )}
        
        <button
          type="button"
          onClick={onRemove}
          className="px-2 py-1.5 text-xs bg-gray-700 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium whitespace-nowrap"
        >
          删除
        </button>
      </div>
    </div>
  )
}

