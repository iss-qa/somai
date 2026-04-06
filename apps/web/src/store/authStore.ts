'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  name: string
  email: string
  companyId: string | null
  role: 'owner' | 'admin' | 'member' | 'superadmin' | 'support'
  companyName?: string
  plan?: 'starter' | 'pro' | 'enterprise'
  niche?: string
}

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isAdmin: () => boolean
  isPro: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user: User) => set({ user }),
      clearUser: () => set({ user: null }),
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'superadmin' || user?.role === 'support'
      },
      isPro: () => {
        const { user } = get()
        return user?.plan === 'pro' || user?.plan === 'enterprise'
      },
    }),
    {
      name: 'soma-auth',
    }
  )
)
