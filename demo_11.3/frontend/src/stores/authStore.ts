import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  phoneNumber: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (phoneNumber: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setLoading: (loading: boolean) => void
}

interface RegisterData {
  phoneNumber: string
  password: string
  username: string
  idCard: string
  verificationCode: string
  codeId: string
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // 登录
      login: async (phoneNumber: string, password: string) => {
        set({ isLoading: true })
        try {
          // TODO: 实现登录API调用
          // 1. 调用后端登录接口
          // 2. 处理响应数据
          // 3. 存储用户信息和token
          
          console.log('登录请求:', { phoneNumber, password })
          
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // 模拟成功响应
          const mockUser = {
            id: 'user-123',
            username: '测试用户',
            phoneNumber
          }
          const mockToken = 'mock-jwt-token'
          
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false
          })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // 注册
      register: async (userData: RegisterData) => {
        set({ isLoading: true })
        try {
          // TODO: 实现注册API调用
          console.log('注册请求:', userData)
          
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          set({ isLoading: false })
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      // 登出
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      // 刷新Token
      refreshToken: async () => {
        try {
          // TODO: 实现token刷新逻辑
          const { token } = get()
          if (!token) return
          
          console.log('刷新Token')
        } catch (error) {
          // Token刷新失败，清除认证状态
          get().logout()
          throw error
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)