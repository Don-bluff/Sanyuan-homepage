import { Tournament } from '@/types/poker'

// 使用localStorage管理比赛（可以后续改为Supabase）
const TOURNAMENTS_KEY = 'active_tournaments'

export function getAllTournaments(): Tournament[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(TOURNAMENTS_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getActiveTournaments(): Tournament[] {
  const all = getAllTournaments()
  return all.filter(t => t.status === 'active')
}

export function createTournament(
  tournament: Omit<Tournament, 'id' | 'created_at' | 'status' | 'hand_count'>
): Tournament {
  const newTournament: Tournament = {
    ...tournament,
    id: `tournament_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString(),
    status: 'active',
    hand_count: 0,
    hand_ids: []
  }
  
  const tournaments = getAllTournaments()
  tournaments.push(newTournament)
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments))
  
  return newTournament
}

export function updateTournament(id: string, updates: Partial<Tournament>): Tournament | null {
  const tournaments = getAllTournaments()
  const index = tournaments.findIndex(t => t.id === id)
  
  if (index === -1) return null
  
  tournaments[index] = { ...tournaments[index], ...updates }
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments))
  
  return tournaments[index]
}

export function finishTournament(
  id: string, 
  finishData?: { 
    total_entries: number
    finish_position: number
    cash_out: number 
  }
): boolean {
  const tournaments = getAllTournaments()
  const index = tournaments.findIndex(t => t.id === id)
  
  if (index === -1) return false
  
  tournaments[index] = {
    ...tournaments[index],
    status: 'finished',
    ...finishData
  }
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments))
  
  return true
}

export function getFinishedTournaments(): Tournament[] {
  const all = getAllTournaments()
  return all.filter(t => t.status === 'finished')
}

export function deleteTournament(id: string): boolean {
  const tournaments = getAllTournaments()
  const filtered = tournaments.filter(t => t.id !== id)
  
  if (filtered.length === tournaments.length) return false
  
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(filtered))
  return true
}

export function incrementHandCount(tournamentId: string): void {
  const tournament = getAllTournaments().find(t => t.id === tournamentId)
  if (tournament) {
    updateTournament(tournamentId, { 
      hand_count: (tournament.hand_count || 0) + 1 
    })
  }
}












