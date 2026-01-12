'use client'

import { useState } from 'react'
import { Tournament, GameType, BlindMode } from '@/types/poker'

interface TournamentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (tournament: Omit<Tournament, 'id' | 'created_at' | 'status' | 'hand_count'>) => void
}

const gameTypes: { value: GameType; label: string }[] = [
  { value: '6max', label: '6-Max' },
  { value: '9max', label: '9-Max' },
  { value: 'custom', label: '自定义' }
]

export function TournamentModal({ isOpen, onClose, onSave }: TournamentModalProps) {
  const [name, setName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(50)
  const [bigBlind, setBigBlind] = useState(100)
  const [ante, setAnte] = useState(100)
  const [buyIn, setBuyIn] = useState<number>(0)

  const handleBlindModeChange = (mode: BlindMode) => {
    setBlindMode(mode)
    if (mode === 'bb') {
      setSmallBlind(0.5)
      setBigBlind(1)
      setAnte(1)
    } else {
      setSmallBlind(50)
      setBigBlind(100)
      setAnte(100)
    }
  }

  const handleGameTypeChange = (type: GameType) => {
    setGameType(type)
    if (type === '6max') setMaxPlayers(6)
    else if (type === '9max') setMaxPlayers(9)
  }

  const handleSave = () => {
    if (!name.trim()) {
      alert('请输入比赛名称')
      return
    }

    onSave({
      name: name.trim(),
      game_type: gameType,
      max_players: maxPlayers,
      blind_mode: blindMode,
      small_blind: smallBlind,
      big_blind: bigBlind,
      ante: ante || undefined,
      buy_in: buyIn || undefined
    })

    // 重置表单
    setName('')
    setGameType('6max')
    setMaxPlayers(6)
    setBlindMode('chips')
    setSmallBlind(50)
    setBigBlind(100)
    setAnte(100)
    setBuyIn(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-orbitron">新增比赛</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* 比赛名称 */}
          <div>
            <label className="block text-sm font-medium mb-2">比赛名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：WSOP Main Event"
            />
          </div>

          {/* 游戏类型 */}
          <div>
            <label className="block text-sm font-medium mb-2">游戏类型</label>
            <div className="flex gap-2">
              {gameTypes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleGameTypeChange(value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

          {/* 盲注模式 */}
          <div>
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

          {/* 盲注设置 */}
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
                前注 {blindMode === 'bb' && '(BB)'}
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

          {/* 买入金额 */}
          <div>
            <label className="block text-sm font-medium mb-2">买入金额 (可选)</label>
            <input
              type="number"
              value={buyIn}
              onChange={(e) => setBuyIn(Number(e.target.value))}
              min="0"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="例如：1000"
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建比赛
          </button>
        </div>
      </div>
    </div>
  )
}

