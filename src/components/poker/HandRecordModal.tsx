'use client'

import { useState } from 'react'
import { HandRecord, Player, PokerCard, GameType, BlindMode, PokerPosition } from '@/types/poker'
import { CardSelector } from './CardSelector'
import { Button } from '@/components/ui/Button'

interface HandRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (record: Partial<HandRecord>) => void
  isInline?: boolean
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: '6max', label: '6-Max' },
  { value: '9max', label: '9-Max' },
  { value: 'custom', label: '自定义' }
]

const positions: PokerPosition[] = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB']

export function HandRecordModal({ isOpen, onClose, onSave, isInline = false }: HandRecordModalProps) {
  const [tournamentName, setTournamentName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(0.5)
  const [bigBlind, setBigBlind] = useState(1)
  const [ante, setAnte] = useState(0)

  // 处理盲注模式切换
  const handleBlindModeChange = (mode: BlindMode) => {
    setBlindMode(mode)
    if (mode === 'bb') {
      // BB模式默认值：小盲0.5BB，大盲1BB，前注1BB
      setSmallBlind(0.5)
      setBigBlind(1)
      setAnte(1)
    } else {
      // 具体数字模式默认值
      setSmallBlind(50)
      setBigBlind(100)
      setAnte(0)
    }
  }
  const [heroCards, setHeroCards] = useState<PokerCard[]>([])
  const [heroStack, setHeroStack] = useState(100)
  const [heroPosition, setHeroPosition] = useState<PokerPosition>('BTN')
  const [players, setPlayers] = useState<Player[]>([])
  const [showCardSelector, setShowCardSelector] = useState(false)
  
  const handleGameTypeChange = (type: GameType) => {
    setGameType(type)
    if (type === '6max') setMaxPlayers(6)
    else if (type === '9max') setMaxPlayers(9)
  }

  const handleAddPlayer = () => {
    const newPlayer: Player = {
      id: Date.now().toString(),
      position: 'UTG',
      stack: 100
    }
    setPlayers([...players, newPlayer])
  }

  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers(players.map(player => 
      player.id === id ? { ...player, ...updates } : player
    ))
  }

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(player => player.id !== id))
  }

  const handleCardSelect = (card: PokerCard) => {
    if (heroCards.find(c => c.rank === card.rank && c.suit === card.suit)) {
      // 取消选择
      setHeroCards(heroCards.filter(c => !(c.rank === card.rank && c.suit === card.suit)))
    } else if (heroCards.length < 2) {
      // 添加选择
      setHeroCards([...heroCards, card])
    }
  }

  const handleSave = () => {
    if (!tournamentName || heroCards.length !== 2) {
      alert('请填写完整信息')
      return
    }

    const record: Partial<HandRecord> = {
      tournament_name: tournamentName,
      game_type: gameType,
      max_players: maxPlayers,
      blind_mode: blindMode,
      small_blind: smallBlind,
      big_blind: bigBlind,
      ante: ante || undefined,
      hero_cards: heroCards as [PokerCard, PokerCard],
      hero_stack: heroStack,
      hero_position: heroPosition,
      total_players: players.length + 1, // +1 for hero
      players: players
    }

    onSave(record)
    onClose()
  }

  const getStackUnit = () => blindMode === 'chips' ? 'Chips' : 'BB'

  if (!isOpen && !isInline) return null

  const content = (
    <>
      <div className={isInline ? "" : "bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"}>
        <div className="p-6">
          {!isInline && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 font-orbitron">记录手牌</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
          )}

          <div className="space-y-6">
              {/* 比赛信息 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-4 font-rajdhani">比赛信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">比赛名称</label>
                    <input
                      type="text"
                      value={tournamentName}
                      onChange={(e) => setTournamentName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入比赛名称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">游戏类型</label>
                    <div className="flex gap-2">
                      {gameTypes.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => handleGameTypeChange(value)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            gameType === value
                              ? 'bg-blue-600 text-white'
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
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                        min="2"
                        max="10"
                        className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="自定义人数"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 盲注设置 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-4 font-rajdhani">盲注设置</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">盲注模式</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBlindModeChange('chips')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        blindMode === 'chips'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      具体数字
                    </button>
                    <button
                      onClick={() => handleBlindModeChange('bb')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        blindMode === 'bb'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      BB模式 (0.5/1/1)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      小盲 {blindMode === 'bb' && '(BB)'}
                    </label>
                    <input
                      type="number"
                      value={smallBlind}
                      onChange={(e) => setSmallBlind(Number(e.target.value))}
                      step={blindMode === 'bb' ? '0.1' : '1'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      大盲 {blindMode === 'bb' && '(BB)'}
                    </label>
                    <input
                      type="number"
                      value={bigBlind}
                      onChange={(e) => setBigBlind(Number(e.target.value))}
                      step={blindMode === 'bb' ? '0.1' : '1'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      前注 {blindMode === 'bb' && '(BB)'} (可选)
                    </label>
                    <input
                      type="number"
                      value={ante}
                      onChange={(e) => setAnte(Number(e.target.value))}
                      step={blindMode === 'bb' ? '0.1' : '1'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Hero信息 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-4 font-rajdhani">Hero信息</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hero手牌</label>
                    <button
                      onClick={() => setShowCardSelector(true)}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                    >
                      {heroCards.length === 0 ? (
                        <span className="text-gray-500">点击选择手牌</span>
                      ) : (
                        <div className="flex justify-center gap-2">
                          {heroCards.map((card, index) => (
                            <span
                              key={index}
                              className={`font-bold ${
                                card.suit === 'hearts' || card.suit === 'diamonds'
                                  ? 'text-red-500'
                                  : 'text-gray-800'
                              }`}
                            >
                              {card.rank}
                              {card.suit === 'hearts' && '♥️'}
                              {card.suit === 'diamonds' && '♦️'}
                              {card.suit === 'clubs' && '♣️'}
                              {card.suit === 'spades' && '♠️'}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hero筹码 ({getStackUnit()})
                    </label>
                    <input
                      type="number"
                      value={heroStack}
                      onChange={(e) => setHeroStack(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Hero位置</label>
                    <select
                      value={heroPosition}
                      onChange={(e) => setHeroPosition(e.target.value as PokerPosition)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {positions.map(pos => (
                        <option key={pos} value={pos}>{pos}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 其他玩家 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg font-rajdhani">其他玩家</h3>
                  <Button onClick={handleAddPlayer} variant="primary" size="sm">
                    + 添加玩家
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div key={player.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded-lg">
                      <div>
                        <label className="block text-xs font-medium mb-1">位置</label>
                        <select
                          value={player.position}
                          onChange={(e) => handleUpdatePlayer(player.id, { position: e.target.value as PokerPosition })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        >
                          {positions.map(pos => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          筹码 ({getStackUnit()})
                        </label>
                        <input
                          type="number"
                          value={player.stack}
                          onChange={(e) => handleUpdatePlayer(player.id, { stack: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-end">
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="w-full px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {players.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      点击"添加玩家"开始添加其他玩家
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Footer */}
          {!isInline && (
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button onClick={onClose} variant="ghost">
                取消
              </Button>
              <Button onClick={handleSave} variant="primary">
                保存手牌
              </Button>
            </div>
          )}

          {isInline && (
            <div className="flex justify-center gap-3 mt-8">
              <Button onClick={handleSave} variant="primary" className="px-8">
                保存手牌记录
              </Button>
            </div>
          )}
        </div>
      </div>

      <CardSelector
        isOpen={showCardSelector}
        onClose={() => setShowCardSelector(false)}
        onSelectCard={handleCardSelect}
        selectedCards={heroCards}
      />
    </>
  )

  if (isInline) {
    return content
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      {content}
    </div>
  )
}
