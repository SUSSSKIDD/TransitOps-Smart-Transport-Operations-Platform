import { create } from 'zustand'
import { api } from '../lib/axios'

interface User {
  id: string
  name: string
  email: string
  role: 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'
}

interface AuthState {
  user: User | null
  isLoading: boolean
  login: (user: User) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  login: (user) => set({ user }),
  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout failed', error)
    } finally {
      set({ user: null })
    }
  },
  checkAuth: async () => {
    try {
      set({ isLoading: true })
      const { data } = await api.get('/auth/me')
      set({ user: data.data, isLoading: false })
    } catch (error) {
      set({ user: null, isLoading: false })
    }
  },
}))
