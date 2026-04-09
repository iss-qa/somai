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
  accessEnabled?: boolean
  trialExpiresAt?: string | null
}

interface AuthState {
  user: User | null
  setUser: (user: User) => void
  clearUser: () => void
  isAdmin: () => boolean
  isPro: () => boolean
  isEnterprise: () => boolean
  hasAccess: () => boolean
  isInTrial: () => boolean
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
      isEnterprise: () => {
        const { user } = get()
        return user?.plan === 'enterprise'
      },
      hasAccess: () => {
        const { user } = get()
        if (!user) return false
        // Admin always has access
        if (user.role === 'superadmin' || user.role === 'support') return true
        // Only access_enabled grants access (set by admin after setup payment)
        return user.accessEnabled === true
      },
      isInTrial: () => {
        const { user } = get()
        if (!user) return false
        if (!user.trialExpiresAt) return false
        return new Date(user.trialExpiresAt) > new Date()
      },
    }),
    {
      name: 'soma-auth',
    },
  ),
)
