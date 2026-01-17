'use client'

interface AboutUsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AboutUsModal({ isOpen, onClose }: AboutUsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 font-orbitron flex items-center gap-3">
            <span className="text-3xl md:text-4xl">🤝</span>
            关于我们
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl md:text-3xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 text-gray-700 leading-relaxed">
          {/* 欢迎语 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
            <p className="text-lg md:text-xl font-semibold text-center text-gray-800 mb-2">
              欢迎来到 Don't Bluff Me
            </p>
            <p className="text-center text-gray-600 text-sm md:text-base">
              和谐共进的中文扑克学习社群
            </p>
          </div>

          {/* 我们的使命 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              我们的使命
            </h3>
            <p className="text-sm md:text-base">
              Don't Bluff Me 致力于打造一个友好、专业的中文德州扑克学习社群。我们相信，通过共同学习、相互交流、分享经验，每一位扑克爱好者都能不断进步，提升自己的牌技水平。
            </p>
          </div>

          {/* 我们提供什么 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">✨</span>
              我们提供什么
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">📝</span>
                <div>
                  <p className="font-semibold text-gray-800">手牌记录与分析</p>
                  <p className="text-sm text-gray-600">详细记录每一手牌的行动线，帮助你复盘和总结</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">🎓</span>
                <div>
                  <p className="font-semibold text-gray-800">AI 辅助训练</p>
                  <p className="text-sm text-gray-600">利用 AI 模拟锦标赛进程，提供智能化的训练工具</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">🚀</span>
                <div>
                  <p className="font-semibold text-gray-800">降低学习成本</p>
                  <p className="text-sm text-gray-600">为新手提供易用的策略训练工具，快速建立预设策略体系</p>
                </div>
              </div>
              
              <div className="flex gap-3 items-start">
                <span className="text-xl flex-shrink-0">💬</span>
                <div>
                  <p className="font-semibold text-gray-800">社群交流</p>
                  <p className="text-sm text-gray-600">分享手牌、讨论策略、相互学习、共同进步</p>
                </div>
              </div>
            </div>
          </div>

          {/* 我们的理念 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              我们的理念
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm md:text-base">
              <p>🌟 <strong>和谐共进</strong> - 营造友好、包容的学习氛围</p>
              <p>📈 <strong>持续进步</strong> - 通过科学训练不断提升牌技</p>
              <p>🤝 <strong>互助共赢</strong> - 分享经验，共同成长</p>
              <p>🎯 <strong>专业严谨</strong> - 提供专业的扑克学习工具和方法</p>
              <p>🆕 <strong>新手友好</strong> - 降低学习门槛，让更多人享受扑克的乐趣</p>
            </div>
          </div>

          {/* 加入我们 */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">
              🎉 加入我们，一起进步！
            </p>
            <p className="text-sm md:text-base text-gray-600">
              无论你是扑克新手还是资深玩家，Don't Bluff Me 都欢迎你的加入。让我们一起学习、一起成长、一起享受德州扑克的魅力！
            </p>
          </div>

          {/* 联系方式 */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              有任何问题或建议？欢迎随时联系我们
            </p>
            <p className="text-sm text-gray-500 mt-1">
              © 2024 DON BLUFF LLC. All rights reserved.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-center mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}


