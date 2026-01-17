'use client'

import { PokerCard } from './PokerCard'

interface HandRecordCardProps {
  hand: {
    id: string
    tournament: string
    gameType: string
    blinds: string
    date: string
    time: string
    currentPlayers: number
    startingPlayers: number
    moneyBubble: number
    tags: string[]
    heroPosition: string
    heroCards: Array<{ rank: string; suit: 'hearts' | 'diamonds' | 'clubs' | 'spades' }>
    heroStack: number
  }
  isExpanded: boolean
  onToggle: () => void
}

export function HandRecordCard({ hand, isExpanded, onToggle }: HandRecordCardProps) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-md border-2 border-gray-300 overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* 折叠状态 - 基本信息 */}
      <div 
        className="p-2 md:p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={onToggle}
      >
        {/* 第一行：比赛名称和展开按钮 */}
        <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
          <h3 className="font-bold text-sm md:text-lg text-gray-900 font-rajdhani flex-1 min-w-0 truncate">
            {hand.tournament}
          </h3>
          <button 
            className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 bg-black hover:bg-gray-800 text-white rounded-full flex items-center justify-center transition-all duration-300 transform"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <span className="text-sm md:text-lg">▼</span>
          </button>
        </div>
        
        {/* 第二行：游戏类型、盲注、时间 */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-2 md:mb-3">
          <span className="text-[10px] md:text-xs text-gray-800 bg-white px-2 py-0.5 md:py-1 rounded-full font-medium border-2 border-gray-400">
            {hand.gameType}
          </span>
          <span className="text-[10px] md:text-xs text-gray-800 bg-white px-2 py-0.5 md:py-1 rounded-full font-medium border-2 border-gray-400">
            {hand.blinds}
          </span>
          <span className="text-[10px] md:text-xs text-gray-600 bg-white px-2 py-0.5 md:py-1 rounded-md border border-gray-300">
            {hand.date} {hand.time}
          </span>
        </div>
        
        {/* 第三行：比赛人数和钱圈 */}
        <div className="grid grid-cols-2 gap-1.5 md:gap-2 mb-2 md:mb-3">
          <div className="bg-white px-2 md:px-3 py-1 md:py-1.5 rounded-md border-2 border-gray-300">
            <div className="text-[8px] md:text-[10px] text-gray-600 font-medium">比赛人数</div>
            <div className="font-bold text-[10px] md:text-xs text-gray-900">
              {hand.currentPlayers} / {hand.startingPlayers}
            </div>
          </div>
          <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-md border-2 ${
            hand.currentPlayers <= hand.moneyBubble
              ? 'bg-gray-100 border-gray-500'
              : 'bg-white border-gray-300'
          }`}>
            <div className="text-[8px] md:text-[10px] text-gray-600 font-medium">钱圈</div>
            <div className="font-bold text-[10px] md:text-xs text-gray-900">
              {hand.currentPlayers <= hand.moneyBubble ? '✓ ' : ''}{hand.moneyBubble}
            </div>
          </div>
        </div>
        
        {/* 第四行：标签 */}
        <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
          {hand.tags.map((tag: string, idx: number) => (
            <span key={idx} className="bg-gray-200 text-gray-800 border border-gray-400 px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-medium whitespace-nowrap">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* 展开状态 - 行动线详情 */}
      {isExpanded && (
        <div className="border-t-2 border-gray-300 bg-gray-50 p-2 md:p-4 space-y-2 md:space-y-3 animate-fade-in">
          {/* 翻牌前 */}
          <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border-2 border-gray-400">
            <h4 className="font-bold text-xs md:text-sm text-gray-900 mb-2">♠️ 翻牌前 (Preflop)</h4>
            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center border border-gray-400">UTG</span>
                <span className="text-gray-600 font-medium">Fold</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center border border-gray-400">CO</span>
                <span className="text-gray-900 font-medium">Raise</span>
                <span className="text-gray-600">3BB</span>
              </div>
              {/* HERO行动 */}
              <div className="flex items-start gap-1.5 md:gap-2 bg-gray-100 p-1.5 md:p-2 rounded-md border-2 border-black">
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="bg-black text-white px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center">
                      {hand.heroPosition}
                    </span>
                    <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                    <span className="text-gray-900 font-medium">Call</span>
                    <span className="text-gray-600">3BB</span>
                  </div>
                  {/* Hero手牌 */}
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <span className="text-[9px] md:text-[10px] text-gray-600 font-medium">手牌:</span>
                    <div className="flex gap-0.5 md:gap-1">
                      {hand.heroCards.map((card: any, idx: number) => (
                        <PokerCard key={idx} rank={card.rank} suit={card.suit} size="small" />
                      ))}
                    </div>
                    <span className="text-[9px] md:text-[10px] text-gray-600">筹码: {hand.heroStack}BB</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center border border-gray-400">BB</span>
                <span className="text-gray-900 font-medium">Call</span>
                <span className="text-gray-600">3BB</span>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t-2 border-gray-400 my-2 md:my-3"></div>

          {/* 翻牌圈 */}
          <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border-2 border-gray-400">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-xs md:text-sm text-gray-900 whitespace-nowrap">🎲 翻牌圈 (Flop)</h4>
              <div className="flex gap-0.5 md:gap-1">
                <div className="w-6 h-8 md:w-8 md:h-11 bg-white border-2 border-gray-400 rounded shadow-sm flex flex-col items-center justify-center">
                  <span className="text-red-500 text-[9px] md:text-[10px] font-bold">Q</span>
                  <span className="text-red-500 text-[10px] md:text-xs">♥️</span>
                </div>
                <div className="w-6 h-8 md:w-8 md:h-11 bg-white border-2 border-gray-400 rounded shadow-sm flex flex-col items-center justify-center">
                  <span className="text-red-500 text-[9px] md:text-[10px] font-bold">J</span>
                  <span className="text-red-500 text-[10px] md:text-xs">♦️</span>
                </div>
                <div className="w-6 h-8 md:w-8 md:h-11 bg-white border-2 border-gray-400 rounded shadow-sm flex flex-col items-center justify-center">
                  <span className="text-gray-800 text-[9px] md:text-[10px] font-bold">10</span>
                  <span className="text-gray-800 text-[10px] md:text-xs">♠️</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center border border-gray-400">BB</span>
                <span className="text-gray-700 font-medium">Check</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2 bg-gray-100 p-1.5 md:p-2 rounded-md border-2 border-black">
                <span className="bg-black text-white px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center">{hand.heroPosition}</span>
                <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                <span className="text-gray-900 font-medium">Bet</span>
                <span className="text-gray-600">5BB</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="bg-gray-200 px-1.5 md:px-2 py-0.5 rounded font-medium min-w-[35px] md:min-w-[45px] text-center border border-gray-400">BB</span>
                <span className="text-gray-600 font-medium">Fold</span>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t-2 border-gray-400 my-2 md:my-3"></div>

          {/* 转牌圈 */}
          <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border-2 border-gray-400">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-xs md:text-sm text-gray-900 whitespace-nowrap">🎰 转牌圈 (Turn)</h4>
              <div className="w-6 h-8 md:w-8 md:h-11 bg-white border-2 border-gray-400 rounded shadow-sm flex flex-col items-center justify-center">
                <span className="text-red-500 text-[9px] md:text-[10px] font-bold">9</span>
                <span className="text-red-500 text-[10px] md:text-xs">♥️</span>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
              <div className="flex items-center gap-1.5 md:gap-2 bg-gray-100 p-1.5 md:p-2 rounded-md border-2 border-black">
                <span className="bg-black text-white px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center">{hand.heroPosition}</span>
                <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                <span className="text-gray-700 font-medium">Check</span>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t-2 border-gray-400 my-2 md:my-3"></div>

          {/* 河牌圈 */}
          <div className="bg-white rounded-md md:rounded-lg p-2 md:p-3 border-2 border-gray-400">
            <div className="flex items-center gap-1.5 md:gap-2 mb-2 flex-wrap">
              <h4 className="font-bold text-xs md:text-sm text-gray-900 whitespace-nowrap">🎯 河牌圈 (River)</h4>
              <div className="w-6 h-8 md:w-8 md:h-11 bg-white border-2 border-gray-400 rounded shadow-sm flex flex-col items-center justify-center">
                <span className="text-gray-800 text-[9px] md:text-[10px] font-bold">2</span>
                <span className="text-gray-800 text-[10px] md:text-xs">♣️</span>
              </div>
            </div>
            <div className="space-y-1.5 md:space-y-2 text-[10px] md:text-xs text-gray-700">
              <div className="flex items-center gap-1.5 md:gap-2 bg-gray-100 p-1.5 md:p-2 rounded-md border-2 border-black">
                <span className="bg-black text-white px-1.5 md:px-2 py-0.5 rounded font-bold min-w-[35px] md:min-w-[45px] text-center">{hand.heroPosition}</span>
                <span className="bg-gray-800 text-white px-1.5 py-0.5 rounded text-[8px] md:text-[9px] font-bold">HERO</span>
                <span className="text-gray-700 font-medium">Check</span>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t-2 border-gray-400 my-2 md:my-3"></div>

          {/* 结果 */}
          <div className="bg-gray-100 rounded-md p-2 border-2 border-gray-400">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <span className="font-medium text-gray-700">结果</span>
              <span className="text-gray-900 font-bold">+15 BB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


