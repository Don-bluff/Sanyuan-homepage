'use client'

import { useState, useEffect } from 'react'
import { PokerCard } from './PokerCard'

interface PreflopTrainingProps {
  onClose?: () => void
}

type PokerCardType = {
  rank: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
}

export function PreflopTraining({ onClose }: PreflopTrainingProps) {
  const [hand, setHand] = useState<[PokerCardType, PokerCardType] | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  // 生成随机扑克牌
  const generateRandomCard = (excludeCards: PokerCardType[] = []): PokerCardType => {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']
    const suits: Array<'hearts' | 'diamonds' | 'clubs' | 'spades'> = ['hearts', 'diamonds', 'clubs', 'spades']
    
    let card: PokerCardType
    let attempts = 0
    
    do {
      const randomRank = ranks[Math.floor(Math.random() * ranks.length)]
      const randomSuit = suits[Math.floor(Math.random() * suits.length)]
      card = { rank: randomRank, suit: randomSuit }
      attempts++
    } while (
      attempts < 100 && 
      excludeCards.some(c => c.rank === card.rank && c.suit === card.suit)
    )
    
    return card
  }

  // 生成新的手牌
  const generateNewHand = () => {
    const card1 = generateRandomCard()
    const card2 = generateRandomCard([card1])
    setHand([card1, card2])
    setFeedback(null)
  }

  // 初始化第一手牌
  useEffect(() => {
    generateNewHand()
  }, [])

  // 处理玩家决策
  const handleDecision = (decision: 'raise' | 'fold') => {
    if (!hand) return

    // 简单的决策逻辑示例（可以根据实际策略调整）
    const isCorrect = evaluateDecision(hand, decision)
    
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))

    setFeedback({
      message: isCorrect 
        ? `✓ 正确！${decision === 'raise' ? 'RAISE' : 'FOLD'} 是个好决策` 
        : `✗ 建议${decision === 'raise' ? 'FOLD' : 'RAISE'}`,
      type: isCorrect ? 'success' : 'error'
    })

    // 1.5秒后自动生成下一手牌
    setTimeout(() => {
      generateNewHand()
    }, 1500)
  }

  // 评估决策是否正确（简化版本）
  const evaluateDecision = (hand: [PokerCardType, PokerCardType], decision: 'raise' | 'fold'): boolean => {
    const [card1, card2] = hand
    const rankValues: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    
    const val1 = rankValues[card1.rank]
    const val2 = rankValues[card2.rank]
    const isPair = card1.rank === card2.rank
    const isSuited = card1.suit === card2.suit
    const maxVal = Math.max(val1, val2)
    const minVal = Math.min(val1, val2)
    
    // 简化的策略：
    // RAISE: 对子、两张高牌(J+)、同花连牌、A+任意牌
    // FOLD: 其他
    const shouldRaise = 
      isPair || // 任意对子
      (maxVal >= 11 && minVal >= 11) || // JJ+ 两张高牌
      (maxVal === 14) || // 有A
      (isSuited && Math.abs(val1 - val2) <= 2 && maxVal >= 10) // 同花连牌或同花高牌
    
    return (shouldRaise && decision === 'raise') || (!shouldRaise && decision === 'fold')
  }

  // 获取准确率
  const getAccuracy = () => {
    if (score.total === 0) return 0
    return Math.round((score.correct / score.total) * 100)
  }

  if (!hand) {
    return <div className="flex items-center justify-center p-8">加载中...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-3 md:p-6">
      {/* 标题和关闭按钮 */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl">🃏</span>
            翻前训练
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">
            根据手牌做出 RAISE 或 FOLD 的决策
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* 统计信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 border-2 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs md:text-sm text-gray-600">总计</div>
            <div className="text-xl md:text-2xl font-bold text-gray-800">{score.total}</div>
          </div>
          <div>
            <div className="text-xs md:text-sm text-gray-600">正确</div>
            <div className="text-xl md:text-2xl font-bold text-green-600">{score.correct}</div>
          </div>
          <div>
            <div className="text-xs md:text-sm text-gray-600">准确率</div>
            <div className="text-xl md:text-2xl font-bold text-blue-600">{getAccuracy()}%</div>
          </div>
        </div>
      </div>

      {/* 手牌显示区域 */}
      <div className="bg-gradient-to-br from-green-700 to-green-800 rounded-xl md:rounded-2xl p-6 md:p-12 mb-4 md:mb-6 shadow-2xl">
        <div className="text-center mb-4 md:mb-6">
          <h3 className="text-white text-base md:text-xl font-bold mb-1 md:mb-2">你的手牌</h3>
          <p className="text-green-200 text-xs md:text-sm">你会怎么做？</p>
        </div>
        
        <div className="flex items-center justify-center gap-3 md:gap-6">
          <div className="transform hover:scale-110 transition-transform">
            <PokerCard rank={hand[0].rank} suit={hand[0].suit} size="large" />
          </div>
          <div className="transform hover:scale-110 transition-transform">
            <PokerCard rank={hand[1].rank} suit={hand[1].suit} size="large" />
          </div>
        </div>

        {/* 手牌描述 */}
        <div className="text-center mt-3 md:mt-4 text-white text-xs md:text-sm">
          {hand[0].rank === hand[1].rank ? (
            <span className="font-bold">对子 {hand[0].rank}{hand[0].rank}</span>
          ) : hand[0].suit === hand[1].suit ? (
            <span className="font-bold">同花 {hand[0].rank}{hand[1].rank}s</span>
          ) : (
            <span className="font-bold">非同花 {hand[0].rank}{hand[1].rank}o</span>
          )}
        </div>
      </div>

      {/* 反馈信息 */}
      {feedback && (
        <div className={`p-3 md:p-4 rounded-lg md:rounded-xl mb-4 md:mb-6 text-center text-sm md:text-base font-bold animate-fade-in ${
          feedback.type === 'success' 
            ? 'bg-green-100 text-green-700 border-2 border-green-300' 
            : 'bg-red-100 text-red-700 border-2 border-red-300'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* 决策按钮 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <button
          onClick={() => handleDecision('fold')}
          disabled={!!feedback}
          className="bg-gradient-to-br from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-4 md:py-8 rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-xl text-lg md:text-2xl disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          FOLD
        </button>
        <button
          onClick={() => handleDecision('raise')}
          disabled={!!feedback}
          className="bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-400 text-white font-bold py-4 md:py-8 rounded-lg md:rounded-xl transition-all duration-300 hover:shadow-xl text-lg md:text-2xl disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
        >
          RAISE
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs md:text-sm text-gray-600 text-center">
          💡 提示：这是一个简化的翻前策略训练。实际游戏中需要考虑位置、筹码深度、对手类型等因素。
        </p>
      </div>
    </div>
  )
}

