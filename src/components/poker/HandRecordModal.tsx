'use client'

import { useState } from 'react'
import { HandRecord, PokerCard, PokerPosition, Tournament, PokerRank, PokerSuit } from '@/types/poker'

interface HandRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (record: Partial<HandRecord>) => void
  isInline?: boolean
  tournament?: Tournament | null
}

const positions: PokerPosition[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB']

const ranks: PokerRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']
const suits: { suit: PokerSuit; symbol: string; color: string }[] = [
  { suit: 'hearts', symbol: '♥️', color: 'text-red-500' },
  { suit: 'diamonds', symbol: '♦️', color: 'text-red-500' },
  { suit: 'clubs', symbol: '♣️', color: 'text-gray-800' },
  { suit: 'spades', symbol: '♠️', color: 'text-gray-800' }
]

export function HandRecordModal({ isOpen, onClose, onSave, isInline = false, tournament }: HandRecordModalProps) {
  const [heroCards, setHeroCards] = useState<[PokerCard | null, PokerCard | null]>([null, null])
  const [heroPosition, setHeroPosition] = useState<PokerPosition>('BTN')
  const [heroStack, setHeroStack] = useState<number>(50)
  const [showCardSelector, setShowCardSelector] = useState<0 | 1 | null>(null)
  
  const handleSelectCard = (card: PokerCard) => {
    if (showCardSelector === null) return
    
    const newCards: [PokerCard | null, PokerCard | null] = [...heroCards]
    newCards[showCardSelector] = card
    setHeroCards(newCards)
    setShowCardSelector(null)
  }

  const handleSave = () => {
    if (!heroCards[0] || !heroCards[1]) {
      alert('请选择两张手牌')
      return
    }

    const record: Partial<HandRecord> = {
      hero_cards: heroCards as [PokerCard, PokerCard],
      hero_position: heroPosition,
      hero_stack: heroStack,
      tournament_name: tournament?.name || '未命名比赛',
      game_type: tournament?.game_type || '6max',
      max_players: tournament?.max_players || 6,
      blind_mode: tournament?.blind_mode || 'chips',
      small_blind: tournament?.small_blind || 50,
      big_blind: tournament?.big_blind || 100,
      ante: tournament?.ante,
      total_players: tournament?.max_players || 6,
      players: [],
      user_id: 'temp-user-id'
    }

    onSave(record)
    
    // 重置表单
    setHeroCards([null, null])
    setHeroPosition('BTN')
    setHeroStack(50)
    
    if (!isInline) {
      onClose()
    }
  }

  const isCardUsed = (rank: PokerRank, suit: PokerSuit) => {
    return heroCards.some(card => card && card.rank === rank && card.suit === suit)
  }

  if (!isOpen && !isInline) return null

  const content = (
    <div className={`${isInline ? '' : 'bg-white rounded-2xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto'}`}>
      {!isInline && (
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-orbitron">记录手牌</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        {/* Hero手牌 */}
        <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-200">
          <label className="block text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-800">
            🃏 Hero 手牌
          </label>
          <div className="flex gap-2 md:gap-4 justify-center">
            {[0, 1].map((index) => (
              <button
                key={index}
                onClick={() => setShowCardSelector(index as 0 | 1)}
                className="w-20 h-28 md:w-24 md:h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-all flex items-center justify-center text-gray-400 hover:text-blue-500 bg-white hover:bg-blue-50"
              >
                {heroCards[index] ? (
                  <div className="text-center">
                    <div className={`text-2xl md:text-3xl font-bold ${
                      heroCards[index]!.suit === 'hearts' || heroCards[index]!.suit === 'diamonds'
                        ? 'text-red-500'
                        : 'text-gray-800'
                    }`}>
                      {heroCards[index]!.rank}
                    </div>
                    <div className="text-xl md:text-2xl">
                      {suits.find(s => s.suit === heroCards[index]!.suit)?.symbol}
                    </div>
                  </div>
                ) : (
                  <span className="text-3xl md:text-4xl">+</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Hero位置 */}
        <div>
          <label className="block text-sm md:text-base font-medium mb-2 md:mb-3 text-gray-700">
            📍 Hero 位置
          </label>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
            {positions.map((pos) => (
              <button
                key={pos}
                onClick={() => setHeroPosition(pos)}
                className={`px-3 py-2 md:py-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  heroPosition === pos
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Hero筹码 */}
        <div>
          <label className="block text-sm md:text-base font-medium mb-2 md:mb-3 text-gray-700">
            💰 Hero 筹码（BB）
          </label>
          <input
            type="number"
            value={heroStack || ''}
            onChange={(e) => setHeroStack(Number(e.target.value))}
            min="0"
            step="0.1"
            className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            placeholder="例如：50"
          />
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end gap-3 mt-6 md:mt-8 pt-4 md:pt-6 border-t-2 border-gray-200">
        {!isInline && (
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 md:py-3 text-sm md:text-base text-gray-600 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-medium"
          >
            取消
          </button>
        )}
        <button
          onClick={handleSave}
          className="px-6 md:px-8 py-2 md:py-3 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
        >
          保存手牌
        </button>
      </div>

      {/* 卡片选择器模态框 */}
      {showCardSelector !== null && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowCardSelector(null)}
        >
          <div 
            className="bg-white rounded-2xl p-3 md:p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <h3 className="text-lg md:text-xl font-bold">选择第 {showCardSelector + 1} 张牌</h3>
              <button
                onClick={() => setShowCardSelector(null)}
                className="text-3xl font-bold hover:text-red-500 w-10 h-10"
              >
                ×
              </button>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              {suits.map(({ suit, symbol, color }) => (
                <div key={suit} className="flex gap-1 md:gap-2">
                  {ranks.map(rank => {
                    const used = isCardUsed(rank, suit)
                    return (
                      <button
                        key={`${rank}-${suit}`}
                        onClick={() => handleSelectCard({ rank, suit })}
                        disabled={used}
                        className={`flex-1 aspect-[2/3] border-2 rounded-md md:rounded-lg text-xs font-bold transition-all ${
                          used
                            ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-40'
                            : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-md hover:bg-blue-50'
                        } ${color}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-0.5 md:gap-1">
                          <span className="text-[10px] md:text-xs leading-none font-bold">{rank}</span>
                          <span className="text-sm md:text-base leading-none">{symbol}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (isInline) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {content}
    </div>
  )
}
