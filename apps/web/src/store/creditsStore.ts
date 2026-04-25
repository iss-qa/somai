import { create } from 'zustand'
import { api } from '@/lib/api'

interface CreditsStore {
  creditos: number | null
  setCreditos: (n: number) => void
  fetch: () => Promise<void>
}

export const useCreditsStore = create<CreditsStore>((set) => ({
  creditos: null,
  setCreditos: (n) => set({ creditos: n }),
  fetch: async () => {
    try {
      const data = await api.get<{ creditos: number }>('/api/gamificacao/state')
      set({ creditos: data.creditos ?? 0 })
    } catch {
      set({ creditos: 0 })
    }
  },
}))
