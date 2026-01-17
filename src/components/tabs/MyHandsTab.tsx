'use client'

import { HandRecordCard } from '@/components/poker/HandRecordCard'

interface Hand {
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

interface MyHandsTabProps {
  hands: Hand[]
  expandedHandIds: Set<string>
  currentPage: number
  handsPerPage: number
  onToggleExpand: (handId: string) => void
  onPageChange: (page: number) => void
}

export function MyHandsTab({
  hands,
  expandedHandIds,
  currentPage,
  handsPerPage,
  onToggleExpand,
  onPageChange
}: MyHandsTabProps) {
  const totalPages = Math.ceil(hands.length / handsPerPage)

  return (
    <div>
      <h2 className="text-xl md:text-2xl font-bold font-rajdhani text-gray-800 mb-4 md:mb-6 flex items-center gap-3">
        <span className="text-2xl md:text-3xl">🃏</span>
        我的手牌
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-normal border-2 border-gray-300">
          {hands.length} 条记录
        </span>
      </h2>
      
      {/* 手牌列表 */}
      <div className="space-y-3 md:space-y-4">
        {hands
          .slice((currentPage - 1) * handsPerPage, currentPage * handsPerPage)
          .map((hand) => (
            <HandRecordCard
              key={hand.id}
              hand={hand}
              isExpanded={expandedHandIds.has(hand.id)}
              onToggle={() => onToggleExpand(hand.id)}
            />
          ))}
      </div>
      
      {/* 分页 */}
      {hands.length > handsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                : 'bg-black text-white hover:bg-gray-800 border-2 border-black'
            }`}
          >
            上一页
          </button>
          
          <div className="flex items-center gap-1 md:gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-lg text-xs md:text-sm font-medium transition-all border-2 ${
                  currentPage === page
                    ? 'bg-black text-white border-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-2 border-gray-300'
                : 'bg-black text-white hover:bg-gray-800 border-2 border-black'
            }`}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}


