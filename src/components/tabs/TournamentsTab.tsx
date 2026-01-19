'use client'

import { Tournament } from '@/types/poker'

interface TournamentsTabProps {
  activeTournaments: Tournament[]
  finishedTournaments: Tournament[]
  onAddTournament: () => void
  onLinkHand: (tournament: Tournament) => void
  onFinishTournament: (tournament: Tournament) => void
}

export function TournamentsTab({
  activeTournaments,
  finishedTournaments,
  onAddTournament,
  onLinkHand,
  onFinishTournament
}: TournamentsTabProps) {
  const totalBuyIn = [...activeTournaments, ...finishedTournaments]
    .reduce((sum, t) => sum + (t.buy_in || 0), 0)
  
  const totalCashOut = finishedTournaments
    .reduce((sum, t) => sum + (t.cash_out || 0), 0)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 统计面板 */}
      <div className="bg-gray-100 rounded-xl md:rounded-2xl p-4 md:p-6 border-2 border-gray-300 shadow-lg">
        <h2 className="text-xl md:text-2xl font-bold font-rajdhani text-gray-800 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
          <span className="text-2xl md:text-3xl">📊</span>
          比赛统计
        </h2>
        <div className="grid grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border-2 border-gray-300">
            <div className="text-xs md:text-sm text-gray-600 mb-1 font-medium">总比赛场数</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {activeTournaments.length + finishedTournaments.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border-2 border-gray-300">
            <div className="text-xs md:text-sm text-gray-600 mb-1 font-medium">总买入</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {totalBuyIn.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border-2 border-gray-300">
            <div className="text-xs md:text-sm text-gray-600 mb-1 font-medium">总Cash Out</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {totalCashOut.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 进行中的比赛 */}
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-xl md:text-2xl">🎮</span>
            进行中
          </h3>
          <button
            onClick={onAddTournament}
            className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base border-2 border-black"
          >
            <span className="text-lg md:text-xl">➕</span>
            添加比赛
          </button>
        </div>

        {activeTournaments.length === 0 ? (
          <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">暂无进行中的比赛</p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {activeTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-gray-50 rounded-lg p-3 md:p-4 border-2 border-gray-300 hover:border-gray-500 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex-1">
                    <h4 className="text-base md:text-lg font-bold text-gray-800 mb-1 md:mb-2">
                      {tournament.name}
                    </h4>
                    <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600">
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        {tournament.game_type === '6max' ? '6-Max' : tournament.game_type === '9max' ? '9-Max' : '自定义'}
                      </span>
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        {tournament.blind_mode === 'chips' 
                          ? `${tournament.small_blind}/${tournament.big_blind}${tournament.ante ? `/${tournament.ante}` : ''}`
                          : `${tournament.small_blind}bb/${tournament.big_blind}bb${tournament.ante ? `/${tournament.ante}bb` : ''}`
                        }
                      </span>
                      {tournament.buy_in && (
                        <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                          买入: {tournament.buy_in}
                        </span>
                      )}
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        手牌数: {tournament.hand_count || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onLinkHand(tournament)}
                      className="flex-1 sm:flex-initial bg-gray-700 hover:bg-gray-800 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border-2 border-gray-700"
                    >
                      关联手牌
                    </button>
                    <button
                      onClick={() => onFinishTournament(tournament)}
                      className="flex-1 sm:flex-initial bg-gray-600 hover:bg-gray-700 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border-2 border-gray-600"
                    >
                      结束比赛
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 历史战绩 */}
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border-2 border-gray-300">
        <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 mb-4 md:mb-6">
          <span className="text-xl md:text-2xl">📜</span>
          历史战绩
        </h3>

        {finishedTournaments.length === 0 ? (
          <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">暂无历史战绩</p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {finishedTournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="bg-gray-50 rounded-lg p-3 md:p-4 border-2 border-gray-300 hover:border-gray-500 transition-all duration-300 hover:shadow-md"
              >
                <div className="flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 md:mb-3">
                    <h4 className="text-base md:text-lg font-bold text-gray-800">
                      {tournament.name}
                    </h4>
                    <div className="text-xs md:text-sm text-gray-500">
                      {new Date(tournament.created_at).toLocaleDateString('zh-CN')}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs md:text-sm text-gray-600 mb-2 md:mb-3">
                    <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                      {tournament.game_type === '6max' ? '6-Max' : tournament.game_type === '9max' ? '9-Max' : '自定义'}
                    </span>
                    {tournament.buy_in && (
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        买入: {tournament.buy_in}
                      </span>
                    )}
                    {tournament.total_entries && (
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        参赛人数: {tournament.total_entries}
                      </span>
                    )}
                    {tournament.finish_position && (
                      <span className="bg-white px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 border-gray-400">
                        名次: {tournament.finish_position}
                      </span>
                    )}
                    {tournament.cash_out !== undefined && (
                      <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full border-2 ${
                        tournament.cash_out > 0 ? 'bg-gray-100 border-gray-500 text-gray-900 font-bold' : 'bg-white border-gray-400'
                      }`}>
                        奖金: {tournament.cash_out}
                      </span>
                    )}
                  </div>
                  {tournament.buy_in !== undefined && tournament.cash_out !== undefined && (
                    <div className={`text-xs md:text-sm font-semibold ${
                      tournament.cash_out - tournament.buy_in > 0 
                        ? 'text-gray-900' 
                        : tournament.cash_out - tournament.buy_in < 0 
                        ? 'text-gray-600' 
                        : 'text-gray-600'
                    }`}>
                      盈亏: {tournament.cash_out - tournament.buy_in > 0 ? '+' : ''}{tournament.cash_out - tournament.buy_in}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



