'use client'

import { useState } from 'react'

interface FinishTournamentModalProps {
  isOpen: boolean
  onClose: () => void
  onFinish: (data: {
    total_entries: number
    finish_position: number
    cash_out: number
  }) => void
  tournamentName: string
}

export function FinishTournamentModal({ 
  isOpen, 
  onClose, 
  onFinish,
  tournamentName 
}: FinishTournamentModalProps) {
  const [totalEntries, setTotalEntries] = useState<number>(0)
  const [finishPosition, setFinishPosition] = useState<number>(0)
  const [cashOut, setCashOut] = useState<number>(0)

  const handleFinish = () => {
    if (totalEntries <= 0) {
      alert('请输入总参赛人数')
      return
    }
    if (finishPosition <= 0 || finishPosition > totalEntries) {
      alert('请输入有效的名次')
      return
    }

    onFinish({
      total_entries: totalEntries,
      finish_position: finishPosition,
      cash_out: cashOut
    })

    // 重置表单
    setTotalEntries(0)
    setFinishPosition(0)
    setCashOut(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 font-orbitron">结束比赛</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">比赛：</span>{tournamentName}
          </p>
        </div>

        <div className="space-y-4">
          {/* 总参赛人数 */}
          <div>
            <label className="block text-sm font-medium mb-2">总参赛人数 *</label>
            <input
              type="number"
              value={totalEntries || ''}
              onChange={(e) => setTotalEntries(Number(e.target.value))}
              min="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：180"
            />
          </div>

          {/* 实际名次 */}
          <div>
            <label className="block text-sm font-medium mb-2">实际名次 *</label>
            <input
              type="number"
              value={finishPosition || ''}
              onChange={(e) => setFinishPosition(Number(e.target.value))}
              min="1"
              max={totalEntries || undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：15"
            />
          </div>

          {/* Cash Out金额 */}
          <div>
            <label className="block text-sm font-medium mb-2">Cash Out金额</label>
            <input
              type="number"
              value={cashOut || ''}
              onChange={(e) => setCashOut(Number(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：5000"
            />
            <p className="text-xs text-gray-500 mt-1">未获奖金可填写0或留空</p>
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
            onClick={handleFinish}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            结束比赛
          </button>
        </div>
      </div>
    </div>
  )
}


