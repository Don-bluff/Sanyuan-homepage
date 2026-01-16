'use client'

import { HandRecordModal } from '@/components/poker/HandRecordModal'
import { Tournament } from '@/types/poker'

interface RecordHandTabProps {
  selectedTournament: Tournament | null
  onSaveHand: (record: any) => Promise<void>
}

export function RecordHandTab({ selectedTournament, onSaveHand }: RecordHandTabProps) {
  return (
    <div className="animate-fade-in">
      <HandRecordModal 
        isOpen={true}
        onClose={() => {}}
        isInline={true} 
        tournament={selectedTournament}
        onSave={onSaveHand}
      />
    </div>
  )
}

