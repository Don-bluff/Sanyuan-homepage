'use client'

import React from 'react'
import { PokerCard, PokerRank, PokerSuit } from '@/types/poker'

interface SimpleCardSelectorProps {
  onSelectCard: (card: PokerCard) => void
  onClose: () => void
  selectedCards: PokerCard[]
  usedCards?: PokerCard[]  // 全局已使用的牌
  maxCards?: number  // 最多可选择的牌数
}

const suits: { suit: PokerSuit; symbol: string; color: string }[] = [
  { suit: 'hearts', symbol: '♥️', color: 'text-red-500' },
  { suit: 'diamonds', symbol: '♦️', color: 'text-red-500' },
  { suit: 'clubs', symbol: '♣️', color: 'text-gray-800' },
  { suit: 'spades', symbol: '♠️', color: 'text-gray-800' }
]

const ranks: PokerRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

export function SimpleCardSelector({ onSelectCard, onClose, selectedCards, usedCards = [], maxCards = 2 }: SimpleCardSelectorProps) {
  const isCardSelected = (rank: PokerRank, suit: PokerSuit) => {
    return selectedCards.some(card => card.rank === rank && card.suit === suit)
  }

  const isCardUsed = (rank: PokerRank, suit: PokerSuit) => {
    return usedCards.some(card => card.rank === rank && card.suit === suit)
  }

  const handleCardClick = (rank: PokerRank, suit: PokerSuit) => {
    // 如果牌已被全局使用（且不是当前选中的），不允许选择
    if (isCardUsed(rank, suit) && !isCardSelected(rank, suit)) {
      return
    }
    onSelectCard({ rank, suit })
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl p-3 md:p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h3 className="text-lg md:text-xl font-bold">选择扑克牌</h3>
          <button
            onClick={onClose}
            className="text-3xl font-bold hover:text-red-500 w-10 h-10"
          >
            ×
          </button>
        </div>

        <div className="mb-3 text-center">
          <p className="text-sm text-gray-600">
            已选择 {selectedCards.length}/{maxCards} 张牌
          </p>
          {selectedCards.length > 0 && (
            <div className="flex justify-center gap-2 mt-2">
              {selectedCards.map((card, index) => (
                <div key={index} className="px-3 py-1 bg-blue-100 rounded-lg">
                  <span className={`font-bold ${
                    suits.find(s => s.suit === card.suit)?.color
                  }`}>
                    {card.rank}{suits.find(s => s.suit === card.suit)?.symbol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5 md:space-y-2">
          {/* 表头 */}
          <div className="grid grid-cols-13 gap-0.5 md:gap-1 mb-1 md:mb-2">
            {ranks.map(rank => (
              <div key={rank} className="text-center font-bold text-[10px] md:text-xs p-0.5 md:p-1 bg-gray-100 rounded">
                {rank}
              </div>
            ))}
          </div>
          
          {/* 每一行代表一个花色 */}
          {suits.map(({ suit, symbol, color }) => (
            <div key={suit} className="grid grid-cols-13 gap-0.5 md:gap-1">
              {ranks.map(rank => {
                const selected = isCardSelected(rank, suit)
                const used = isCardUsed(rank, suit)
                const disabled = used && !selected
                
                return (
                  <button
                    key={`${rank}-${suit}`}
                    onClick={() => handleCardClick(rank, suit)}
                    disabled={disabled}
                    className={`aspect-[2/3] border-2 rounded-md md:rounded-lg text-xs font-bold transition-all relative ${
                      selected 
                        ? 'border-blue-500 bg-blue-100 shadow-md' 
                        : disabled
                          ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-40'
                          : 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-md'
                    } ${color}`}
                    title={disabled ? '此牌已被使用' : ''}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-0.5 md:gap-1">
                      <span className="text-[10px] md:text-xs leading-none font-bold">{rank}</span>
                      <span className={`text-sm md:text-base leading-none ${color}`}>{symbol}</span>
                    </div>
                    {disabled && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-red-500 text-lg">×</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 md:gap-3 mt-3 md:mt-4">
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

