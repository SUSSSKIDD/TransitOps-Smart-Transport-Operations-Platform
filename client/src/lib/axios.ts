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
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
