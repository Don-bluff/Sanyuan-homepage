'use client'

import { GameType } from '@/types/poker'

interface TournamentInfoProps {
  tournamentName: string
  gameType: GameType
  maxPlayers: number
  isLinked: boolean
  onTournamentNameChange: (name: string) => void
  onGameTypeChange: (type: GameType) => void
  onMaxPlayersChange: (players: number) => void
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: '6max', label: '6-Max' },
  { value: '9max', label: '9-Max' },
  { value: 'custom', label: '自定义' }
]

export function TournamentInfo({
  tournamentName,
  gameType,
  maxPlayers,
  isLinked,
  onTournamentNameChange,
  onGameTypeChange,
  onMaxPlayersChange
}: TournamentInfoProps) {
  const handleGameTypeChange = (type: GameType) => {
    onGameTypeChange(type)
    if (type === '6max') onMaxPlayersChange(6)
    else if (type === '9max') onMaxPlayersChange(9)
  }

  return (
    <div className={`rounded-lg p-1 md:p-2 ${isLinked ? 'bg-gray-100 border-2 border-gray-400' : 'bg-white border border-gray-300'}`}>
      <h3 className="font-bold text-sm md:text-lg mb-1 md:mb-3 font-rajdhani flex items-center gap-2 text-gray-900">
        比赛信息
        {isLinked && (
          <span className="text-xs bg-black text-white px-2 py-1 rounded-full font-normal">
            已关联比赛
          </span>
        )}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 md:gap-2">
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">比赛名称</label>
          <input
            type="text"
            value={tournamentName}
            onChange={(e) => onTournamentNameChange(e.target.value)}
            className="w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
            placeholder="输入比赛名称"
          />
        </div>
        
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">游戏类型</label>
          <div className="flex gap-0.5 md:gap-2">
            {gameTypes.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleGameTypeChange(value)}
                className={`px-1 md:px-3 py-1 md:py-2 rounded-md text-[10px] md:text-sm font-medium transition-colors ${
                  gameType === value
                    ? 'bg-black text-white'
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
              onChange={(e) => onMaxPlayersChange(Number(e.target.value))}
              min="2"
              max="10"
              className="mt-0.5 md:mt-2 w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
              placeholder="自定义人数"
            />
          )}
        </div>
      </div>
    </div>
  )
}

