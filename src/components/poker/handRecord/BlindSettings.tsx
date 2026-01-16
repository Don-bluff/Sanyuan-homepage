'use client'

import { BlindMode } from '@/types/poker'

interface BlindSettingsProps {
  blindMode: BlindMode
  smallBlind: number
  bigBlind: number
  ante: number
  isLinked: boolean
  canUpgradeBlind: boolean
  onBlindModeChange: (mode: BlindMode) => void
  onSmallBlindChange: (value: number) => void
  onBigBlindChange: (value: number) => void
  onAnteChange: (value: number) => void
}

export function BlindSettings({
  blindMode,
  smallBlind,
  bigBlind,
  ante,
  isLinked,
  canUpgradeBlind,
  onBlindModeChange,
  onSmallBlindChange,
  onBigBlindChange,
  onAnteChange
}: BlindSettingsProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 md:mb-3">
        <h3 className="font-bold text-sm md:text-lg font-rajdhani text-gray-900">盲注设置</h3>
        {isLinked && canUpgradeBlind && (
          <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full border border-gray-400">
            可升盲
          </span>
        )}
      </div>
      
      <div className="mb-1 md:mb-3">
        <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">盲注模式</label>
        <div className="flex gap-0.5 md:gap-2">
          <button
            onClick={() => onBlindModeChange('chips')}
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded-md text-[10px] md:text-sm font-medium transition-colors ${
              blindMode === 'chips'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            具体数字
          </button>
          <button
            onClick={() => onBlindModeChange('bb')}
            className={`flex-1 px-2 md:px-3 py-1 md:py-2 rounded-md text-[10px] md:text-sm font-medium transition-colors ${
              blindMode === 'bb'
                ? 'bg-black text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            BB模式
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-0.5 md:gap-1.5">
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">
            小盲 {blindMode === 'bb' && '(BB)'}
          </label>
          <input
            type="number"
            value={smallBlind}
            onChange={(e) => onSmallBlindChange(Number(e.target.value))}
            step={blindMode === 'bb' ? '0.1' : '1'}
            className="w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
          />
        </div>
        
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">
            大盲 {blindMode === 'bb' && '(BB)'}
          </label>
          <input
            type="number"
            value={bigBlind}
            onChange={(e) => onBigBlindChange(Number(e.target.value))}
            step={blindMode === 'bb' ? '0.1' : '1'}
            className="w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
          />
        </div>
        
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">
            前注 {blindMode === 'bb' && '(BB)'}
          </label>
          <input
            type="number"
            value={ante}
            onChange={(e) => onAnteChange(Number(e.target.value))}
            step={blindMode === 'bb' ? '0.1' : '1'}
            className="w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
          />
        </div>
      </div>
    </div>
  )
}

