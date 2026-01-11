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
    large: 'w-20 h-28 md:w-24 md:h-32'
  }
  
  const rankSizeClasses = {
    small: 'text-[9px] md:text-[10px]',
    medium: 'text-[10px] md:text-xs',
    large: 'text-2xl md:text-3xl'
  }
  
  const suitSizeClasses = {
    small: 'text-[10px] md:text-xs',
    medium: 'text-xs md:text-sm',
    large: 'text-3xl md:text-4xl'
  }
  
  const borderClasses = {
    small: 'border border-gray-300 rounded shadow-sm',
    medium: 'border border-gray-300 rounded shadow-sm',
    large: 'border-2 border-gray-400 rounded-xl shadow-lg'
  }
  
  const gapClasses = {
    small: 'gap-0',
    medium: 'gap-0',
    large: 'gap-1'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${borderClasses[size]} bg-white flex flex-col items-center justify-center ${gapClasses[size]}`}>
      <span className={`font-bold ${rankSizeClasses[size]} ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        {rank}
      </span>
      <span className={`${suitSizeClasses[size]} ${isRed ? 'text-red-500' : 'text-gray-800'}`}>
        {suitSymbol}
      </span>
    </div>
  )
}


