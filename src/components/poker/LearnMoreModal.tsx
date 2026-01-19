'use client'

interface LearnMoreModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LearnMoreModal({ isOpen, onClose }: LearnMoreModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 font-orbitron flex items-center gap-3">
            <span className="text-3xl md:text-4xl">📖</span>
            选择你的计划
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* 介绍文字 */}
        <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
          选择适合你的订阅计划，开启你的扑克学习之旅
        </p>

        {/* 订阅卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Bluff Catcher Free */}
          <div className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 hover:shadow-xl">
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-semibold">
              免费
            </div>

            {/* Icon */}
            <div className="text-5xl md:text-6xl mb-4 md:mb-6 text-center group-hover:scale-110 transition-transform">
              🎯
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-bold text-gray-800 text-center mb-2">
              Bluff Catcher
            </h3>
            <p className="text-xl md:text-2xl font-bold text-gray-600 text-center mb-4 md:mb-6">
              FREE
            </p>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-4xl md:text-5xl font-bold text-gray-800">¥0</span>
              <span className="text-gray-600 text-sm md:text-base">/月</span>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6 md:mb-8">
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700">基础手牌记录功能</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700">比赛管理与统计</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700">翻前训练工具</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700">社群交流</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-xl flex-shrink-0">✗</span>
                <span className="text-sm md:text-base text-gray-400">AI 手牌分析</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-xl flex-shrink-0">✗</span>
                <span className="text-sm md:text-base text-gray-400">高级训练模式</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-gray-400 text-xl flex-shrink-0">✗</span>
                <span className="text-sm md:text-base text-gray-400">详细数据分析</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => alert('Free 版本已激活！')}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 md:py-4 rounded-lg transition-all duration-300 hover:shadow-lg text-sm md:text-base"
            >
              当前方案
            </button>
          </div>

          {/* Bluff Catcher Pro */}
          <div className="group relative bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border-2 border-blue-400 hover:border-blue-500 transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1">
            {/* Badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
              推荐
            </div>

            {/* Icon */}
            <div className="text-5xl md:text-6xl mb-4 md:mb-6 text-center group-hover:scale-110 transition-transform">
              👑
            </div>

            {/* Title */}
            <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-center mb-2">
              Bluff Catcher
            </h3>
            <p className="text-xl md:text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-center mb-4 md:mb-6">
              PRO
            </p>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">¥99</span>
              <span className="text-gray-600 text-sm md:text-base">/月</span>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6 md:mb-8">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">所有 Free 版功能</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">AI 智能手牌分析</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">GTO 策略建议</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">高级训练模式</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">详细数据可视化</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">锦标赛模拟器</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl flex-shrink-0">✓</span>
                <span className="text-sm md:text-base text-gray-700 font-medium">优先客服支持</span>
              </div>
            </div>

            {/* Button */}
            <button
              onClick={() => alert('Pro 版本即将上线！敬请期待')}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 md:py-4 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:scale-105 text-sm md:text-base"
            >
              立即升级
            </button>
          </div>
        </div>

        {/* 底部说明 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 md:p-6 border border-blue-200 text-center">
          <p className="text-sm md:text-base text-gray-700 mb-2">
            💡 <strong>提示：</strong>Pro 版本功能正在开发中，敬请期待！
          </p>
          <p className="text-xs md:text-sm text-gray-600">
            有任何问题或建议？欢迎联系我们的客服团队
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-center mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}



