import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化日期
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// 截取文本
export function truncate(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

// 延迟函数
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}


















