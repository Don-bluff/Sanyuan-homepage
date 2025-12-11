'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"

// 德州扑克下雨emoji
const pokerRainEmojis = ['♠️', '♥️', '♣️', '♦️', '😱', '😭', '😤']

function FloatingEmojiBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Emoji下雨效果 - 稀少的斜角落下 */}
      <div className="emoji-rain-container">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`rain-${i}`}
            className="emoji-raindrop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          >
            {pokerRainEmojis[Math.floor(Math.random() * pokerRainEmojis.length)]}
          </div>
        ))}
      </div>
    </div>
  )
}

const pokerFeatures = [
  {
    name: '游览手牌',
    icon: '👁️',
    emoji: '♠️',
    action: () => console.log('Browse hands')
  },
  {
    name: '记录手牌',
    icon: '✏️',
    emoji: '♥️',
    action: () => console.log('Record hands')
  },
  {
    name: '我的手牌',
    icon: '🃏',
    emoji: '♣️',
    action: () => console.log('My hands')
  }
]

export default function Home() {

  return (
    <main className="relative min-h-screen flex items-center justify-center p-8">
      {/* 德州扑克主题飘动emoji背景 */}
      <FloatingEmojiBackground />
      
      {/* 漂浮装饰元素 - 白色背景风格 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-gray-200/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-gray-300/20 rounded-full blur-lg animate-bounce" />
        <div className="absolute bottom-32 left-1/4 w-20 h-20 bg-gray-200/25 rounded-full blur-md animate-pulse" />
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gray-300/15 rounded-full blur-xl animate-bounce" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* LOGO和主标题 - 向上移动 */}
        <div className="space-y-6 mb-28 -mt-16">
          {/* LOGO - 简洁版 */}
          <div className="flex justify-center mb-8 logo-container">
            <div className="relative logo-wrapper group">
              {/* 主LOGO */}
              <Image
                src="/LOGO/LOGO.png"
                alt="Don't Bluff Me Logo"
                width={140}
                height={140}
                className="cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg"
                onClick={() => window.open('https://donbluff.com', '_blank')}
                priority
              />
            </div>
          </div>
          
          {/* 主标题 */}
          <h1 
            className="text-6xl md:text-8xl font-black font-orbitron bg-gradient-to-r from-gray-800 via-gray-600 to-gray-900 bg-clip-text text-transparent cursor-pointer transition-all duration-500 hover:scale-105 active:scale-95 hover:from-gray-900 hover:via-black hover:to-gray-700 tracking-wider poker-title"
            onClick={() => window.open('https://donbluff.com', '_blank')}
          >
            Don't Bluff Me
          </h1>
        </div>

        {/* 德州扑克功能按钮 - 游戏登录风格，向下移动 */}
        <div className="flex flex-col space-y-4 max-w-xs mx-auto w-full mt-16">
          {pokerFeatures.map((feature, index) => (
            <button
              key={feature.name}
              onClick={feature.action}
              className="group relative w-full py-5 px-6 bg-gradient-to-b from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-200 hover:border-gray-400 rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-gray-400/25 hover:-translate-y-1 social-button"
              style={{ 
                animationDelay: `${index * 150}ms`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center group-hover:shadow-md transition-shadow">
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </span>
                </div>
                <span className="flex-grow text-left text-gray-800 group-hover:text-black font-semibold font-rajdhani text-lg">
                  {feature.name}
                </span>
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                  <span className="text-lg">
                    {feature.emoji}
                  </span>
                </div>
              </div>
              
              {/* 现代化的按钮高光效果 */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-60" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>

      </div>

      
      {/* 版权信息 - 固定在页面底部 */}
      <footer className="absolute bottom-0 left-0 right-0 py-6 text-center">
        <p className="text-gray-500 text-sm font-rajdhani">
          © 2024 DON BLUFF LLC. All rights reserved.
        </p>
      </footer>
    </main>
  )
}
