import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true, // Crucial for sending httpOnly cookies
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returns 401 Unauthorized, automatically log the user out
    // EXCEPT if the request was to /auth/logout, to prevent an infinite loop
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/logout')) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
