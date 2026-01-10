interface PokerCardProps {
  rank: string
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'
  size?: 'small' | 'medium' | 'large'
}

export function PokerCard({ rank, suit, size = 'small' }: PokerCardProps) {
  const isRed = suit === 'hearts' || suit === 'diamonds'
  const suitSymbol = suit === 'hearts' ? '♥️' : suit === 'diamonds' ? '♦️' : suit === 'clubs' ? '♣️' : '♠️'
  
  // 尺寸配置
  const sizeClasses = {
    small: 'w-6 h-8 md:w-8 md:h-11',
    medium: 'w-7 h-10 md:w-9 md:h-12',
    large: 'w-8 h-11 md:w-10 md:h-14'
  }
  
  const rankSizeClasses = {
    small: 'text-[9px] md:text-[10px]',
    medium: 'text-[10px] md:text-xs',
    large: 'text-xs md:text-sm'
  }
  
  const suitSizeClasses = {
    small: 'text-[10px] md:text-xs',
    medium: 'text-xs md:text-sm',
    large: 'text-sm md:text-base'
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-white border border-gray-300 rounded shadow-sm flex flex-col items-center justify-center gap-0`}>
      <span className={`font-bold ${rankSizeClasses[size]} ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        {rank}
      </span>
      <span className={`${suitSizeClasses[size]} ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        {suitSymbol}
      </span>
    </div>
  )
}

