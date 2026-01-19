'use client'

import { useState } from 'react'

type AuthMode = 'login' | 'register' | 'reset'

interface HomeTabProps {
  isLoggedIn: boolean
  loginEmail: string
  loginPassword: string
  userDisplayName: string
  isLoggingIn?: boolean
  onLoginEmailChange: (email: string) => void
  onLoginPasswordChange: (password: string) => void
  onLogin: (e: React.FormEvent) => void
  onRegister: (e: React.FormEvent) => void
  onResetPassword: (e: React.FormEvent) => void
  onLogout: () => void
  onStartTraining: () => void
  onAboutUs: () => void
  onLearnMore: () => void
}

export function HomeTab({
  isLoggedIn,
  loginEmail,
  loginPassword,
  userDisplayName,
  isLoggingIn = false,
  onLoginEmailChange,
  onLoginPasswordChange,
  onLogin,
  onRegister,
  onResetPassword,
  onLogout,
  onStartTraining,
  onAboutUs,
  onLearnMore
}: HomeTabProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('login')

  return (
    <div className="relative max-w-2xl mx-auto px-2">
      {/* 登录/注册区域 */}
      <div className="mb-6 md:mb-8 p-3 md:p-4 bg-white rounded-xl border-2 border-gray-300 shadow-md">
        {!isLoggedIn ? (
          <div>
            {/* 标题 */}
            <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2 md:mb-3">
              {authMode === 'login' && '登录账号'}
              {authMode === 'register' && '创建账号'}
              {authMode === 'reset' && '重置密码'}
            </h3>

            {/* 表单 */}
            <form 
              onSubmit={authMode === 'login' ? onLogin : authMode === 'register' ? onRegister : onResetPassword}
              className="space-y-2 md:space-y-3"
            >
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => onLoginEmailChange(e.target.value)}
                placeholder="邮箱地址"
                required
                disabled={isLoggingIn}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {authMode !== 'reset' && (
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => onLoginPasswordChange(e.target.value)}
                  placeholder={authMode === 'register' ? '设置密码（至少6位）' : '密码'}
                  required
                  disabled={isLoggingIn}
                  minLength={authMode === 'register' ? 6 : undefined}
                  className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 md:py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? '处理中...' : (
                  authMode === 'login' ? '登录' : 
                  authMode === 'register' ? '注册' : 
                  '发送重置邮件'
                )}
              </button>
            </form>

            {/* 模式切换链接 */}
            <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 space-y-1">
              {authMode === 'login' && (
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-black hover:underline font-medium"
                  >
                    创建新账号
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('reset')}
                    className="text-gray-600 hover:text-black hover:underline"
                  >
                    忘记密码？
                  </button>
                </div>
              )}
              {authMode === 'register' && (
                <div className="text-center">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="ml-1 text-black hover:underline font-medium"
                  >
                    立即登录
                  </button>
                </div>
              )}
              {authMode === 'reset' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-black hover:underline font-medium"
                  >
                    返回登录
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="text-sm md:text-base text-gray-700">
                欢迎回来, <span className="font-bold text-gray-900">{userDisplayName || loginEmail}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-1.5 md:py-2 px-3 md:px-4 rounded-lg transition-all duration-200 text-xs md:text-sm border-2 border-gray-400"
            >
              退出
            </button>
          </div>
        )}
      </div>

      {/* 三个功能按钮 */}
      <div className="space-y-3 md:space-y-4 animate-fade-in">
        <button
          onClick={onStartTraining}
          className="w-full group relative bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-black rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-3 md:gap-4"
        >
          <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform">🎯</span>
          <span className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-black font-rajdhani">开始训练</span>
        </button>

        <button
          onClick={onAboutUs}
          className="w-full group relative bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-black rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-3 md:gap-4"
        >
          <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform">ℹ️</span>
          <span className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-black font-rajdhani">关于我们</span>
        </button>

        <button
          onClick={onLearnMore}
          className="w-full group relative bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-black rounded-xl md:rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-3 md:gap-4"
        >
          <span className="text-5xl md:text-6xl group-hover:scale-110 transition-transform">📖</span>
          <span className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-black font-rajdhani">了解更多</span>
        </button>
      </div>
    </div>
  )
}


