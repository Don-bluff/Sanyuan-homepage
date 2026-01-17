'use client'

import { useState } from 'react'

interface HomeTabProps {
  isLoggedIn: boolean
  loginEmail: string
  loginPassword: string
  userDisplayName: string
  isLoggingIn?: boolean
  onLoginEmailChange: (email: string) => void
  onLoginPasswordChange: (password: string) => void
  onLogin: (e: React.FormEvent) => void
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
  onLogout,
  onStartTraining,
  onAboutUs,
  onLearnMore
}: HomeTabProps) {
  return (
    <div className="relative max-w-2xl mx-auto px-2">
      {/* 登录区域 */}
      <div className="mb-6 md:mb-8 p-3 md:p-4 bg-white rounded-xl border-2 border-gray-300 shadow-md">
        {!isLoggedIn ? (
          <form onSubmit={onLogin} className="space-y-2 md:space-y-3">
            <h3 className="text-sm md:text-base font-bold text-gray-900 mb-2 md:mb-3">登录账号</h3>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => onLoginEmailChange(e.target.value)}
              placeholder="邮箱地址"
              required
              disabled={isLoggingIn}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => onLoginPasswordChange(e.target.value)}
              placeholder="密码"
              required
              disabled={isLoggingIn}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-2 md:py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? '登录中...' : '登录'}
            </button>
          </form>
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


