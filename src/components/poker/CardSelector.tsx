'use client'

import React, { useState } from 'react'
import { PokerCard, PokerRank, PokerSuit } from '@/types/poker'

interface CardSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectCard: (card: PokerCard) => void
  selectedCards: PokerCard[]
}

const suits: { suit: PokerSuit; symbol: string; color: string }[] = [
  { suit: 'hearts', symbol: '♥️', color: 'text-red-500' },
  { suit: 'diamonds', symbol: '♦️', color: 'text-red-500' },
  { suit: 'clubs', symbol: '♣️', color: 'text-gray-800' },
  { suit: 'spades', symbol: '♠️', color: 'text-gray-800' }
]

const ranks: PokerRank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2']

export function CardSelector({ isOpen, onClose, onSelectCard, selectedCards }: CardSelectorProps) {
  if (!isOpen) return null

  const isCardSelected = (rank: PokerRank, suit: PokerSuit) => {
    return selectedCards.some(card => card.rank === rank && card.suit === suit)
  }

  const handleCardClick = (rank: PokerRank, suit: PokerSuit) => {
    if (selectedCards.length >= 2 && !isCardSelected(rank, suit)) {
      return // 已选择2张牌且当前牌未被选中
    }
    onSelectCard({ rank, suit })
  }

  console.log('CardSelector render, isOpen:', isOpen)
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-2xl p-3 md:p-6 max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3 md:mb-6">
          <h3 className="text-lg md:text-2xl font-bold text-gray-800 font-orbitron">选择扑克牌</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="mb-3 md:mb-4 text-center">
          <p className="text-xs md:text-sm text-gray-600">
            已选择 {selectedCards.length}/2 张牌
          </p>
          {selectedCards.length > 0 && (
            <div className="flex justify-center gap-2 mt-2">
              {selectedCards.map((card, index) => (
                <div key={index} className="px-2 md:px-3 py-1 bg-blue-100 rounded-lg">
                  <span className={`font-bold text-sm md:text-base ${
                    suits.find(s => s.suit === card.suit)?.color
                  }`}>
                    {card.rank}{suits.find(s => s.suit === card.suit)?.symbol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4行13列的完整矩阵 */}
        <div className="space-y-1 md:space-y-2">
          {/* 表头 - 点数 */}
          <div className="grid grid-cols-13 gap-0.5 md:gap-2 mb-1 md:mb-2">
            {ranks.map(rank => (
              <div key={rank} className="text-center font-bold text-[10px] md:text-sm p-1 md:p-2 bg-gray-100 rounded">
                {rank}
              </div>
            ))}
          </div>
          
          {/* 每一行代表一个花色 */}
          {suits.map(({ suit, symbol, color }) => (
            <div key={suit} className="grid grid-cols-13 gap-0.5 md:gap-2">
              {ranks.map(rank => {
                const selected = isCardSelected(rank, suit)
                const canSelect = selectedCards.length < 2 || selected
                
                return (
                  <button
                    key={`${rank}-${suit}`}
                    onClick={() => handleCardClick(rank, suit)}
                    disabled={!canSelect}
                    className={`
                      aspect-[2/3] border md:border-2 rounded md:rounded-lg text-xs font-bold transition-all duration-200 relative active:scale-95
                      ${selected 
                        ? 'border-blue-500 bg-blue-100 scale-95 shadow-md' 
                        : canSelect 
                          ? 'border-gray-300 bg-white hover:border-gray-500 hover:shadow-md md:hover:scale-105' 
                          : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                      }
                      ${color}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full gap-0.5">
                      <span className="text-[9px] md:text-sm font-bold leading-none">{rank}</span>
                      <span className={`text-xs md:text-lg leading-none ${color}`}>{symbol}</span>
                    </div>
                    
                    {/* 选中时的标记 */}
                    {selected && (
                      <div className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[8px] md:text-xs">✓</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* 花色说明 */}
        <div className="flex justify-center gap-2 md:gap-4 mt-3 md:mt-4 p-2 md:p-3 bg-gray-50 rounded-lg">
          {suits.map(({ suit, symbol, color }) => (
            <div key={suit} className="flex items-center gap-0.5 md:gap-1">
              <span className={`text-sm md:text-lg ${color}`}>{symbol}</span>
              <span className="text-[10px] md:text-xs text-gray-600 capitalize hidden sm:inline">{suit}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 md:gap-3 mt-4 md:mt-6">
          <button
            onClick={() => {
              // 清空所有选择
              selectedCards.forEach(card => onSelectCard(card))
            }}
            className="px-3 md:px-4 py-2 text-sm md:text-base text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-transform"
          >
            清空选择
          </button>
          <button
            onClick={onClose}
            className="px-4 md:px-6 py-2 text-sm md:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            确认选择
          </button>
        </div>
      </div>
    </div>
  )
}
