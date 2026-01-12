'use client'

import { useState } from 'react'

interface Comment {
  id: string
  author: string
  content: string
  timestamp: string
  avatar?: string
}

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  handId: string
  handTitle: string
}

export function CommentModal({ isOpen, onClose, handId, handTitle }: CommentModalProps) {
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'PokerPro88',
      content: '这手牌打得很漂亮！翻牌圈的check-raise时机抓得很准。',
      timestamp: '2小时前',
      avatar: '🎮'
    },
    {
      id: '2',
      author: 'CardShark',
      content: '我觉得turn应该bet小一点，这样可以保护range。',
      timestamp: '1小时前',
      avatar: '🦈'
    },
    {
      id: '3',
      author: 'AllInAndy',
      content: '对手持有A♠️ A♣️真是太不幸了，Set Over Set没办法',
      timestamp: '30分钟前',
      avatar: '🃏'
    }
  ])
  const [newComment, setNewComment] = useState('')

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: Date.now().toString(),
      author: '我',
      content: newComment,
      timestamp: '刚刚',
      avatar: '👤'
    }

    setComments([...comments, comment])
    setNewComment('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment()
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl md:rounded-2xl w-full md:w-[600px] max-h-[85vh] md:max-h-[80vh] flex flex-col shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 md:px-6 py-4 rounded-t-3xl md:rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-lg md:text-xl text-gray-800">评论</h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1 truncate">{handTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <span className="text-gray-500 text-2xl leading-none">×</span>
            </button>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {comments.length} 条评论
          </div>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <span className="text-5xl mb-3">💬</span>
              <p className="text-sm">还没有评论</p>
              <p className="text-xs mt-1">快来发表你的看法吧！</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 animate-fade-in">
                {/* Avatar */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 text-xl md:text-2xl shadow-md">
                  {comment.avatar || '👤'}
                </div>
                
                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm md:text-base text-gray-800">
                      {comment.author}
                    </span>
                    <span className="text-xs text-gray-400">
                      {comment.timestamp}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed break-words">
                    {comment.content}
                  </p>
                  
                  {/* Comment Actions */}
                  <div className="flex items-center gap-4 mt-2">
                    <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      回复
                    </button>
                    <button className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1">
                      <span>👍</span>
                      <span>赞</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex gap-2 md:gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="写下你的评论..."
              className="flex-1 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 resize-none transition-colors"
              rows={2}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-medium text-sm md:text-base transition-all flex-shrink-0 ${
                newComment.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              发送
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        @media (min-width: 768px) {
          @keyframes slide-up {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  )
}











