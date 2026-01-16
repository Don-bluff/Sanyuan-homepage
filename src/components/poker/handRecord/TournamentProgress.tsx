'use client'

interface TournamentProgressProps {
  currentPlayers: number
  startingPlayers: number
  moneyBubble: number
  onCurrentPlayersChange: (value: number) => void
  onStartingPlayersChange: (value: number) => void
  onMoneyBubbleChange: (value: number) => void
}

export function TournamentProgress({
  currentPlayers,
  startingPlayers,
  moneyBubble,
  onCurrentPlayersChange,
  onStartingPlayersChange,
  onMoneyBubbleChange
}: TournamentProgressProps) {
  return (
    <div>
      <div className="mb-1 md:mb-3">
        <h3 className="font-bold text-sm md:text-lg font-rajdhani text-gray-900">比赛进程</h3>
      </div>
      
      <div className="space-y-1 md:space-y-3">
        {/* 人数 */}
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">
            人数（当前/总买入）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={currentPlayers || ''}
              onChange={(e) => onCurrentPlayersChange(Number(e.target.value))}
              min="0"
              placeholder="当前"
              className="w-24 md:flex-1 px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
            />
            <span className="text-gray-500 font-bold">/</span>
            <input
              type="number"
              value={startingPlayers || ''}
              onChange={(e) => onStartingPlayersChange(Number(e.target.value))}
              min="0"
              placeholder="总买入"
              className="w-24 md:flex-1 px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
            />
          </div>
        </div>

        {/* 钱圈 */}
        <div>
          <label className="block text-[10px] md:text-sm font-medium mb-0 md:mb-1 text-gray-700">
            钱圈（ITM位置）
          </label>
          <input
            type="number"
            value={moneyBubble || ''}
            onChange={(e) => onMoneyBubbleChange(Number(e.target.value))}
            min="0"
            placeholder="进入钱圈的名次"
            className="w-full px-1 md:px-3 py-1 md:py-2 text-xs md:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 bg-white"
          />
          {moneyBubble > 0 && currentPlayers > 0 && (
            <p className="text-xs text-gray-600 mt-1">
              {currentPlayers <= moneyBubble 
                ? `✅ 已进入钱圈` 
                : `还差 ${currentPlayers - moneyBubble} 人进入钱圈`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

