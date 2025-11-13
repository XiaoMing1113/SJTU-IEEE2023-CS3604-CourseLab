import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from 'antd'
import { useAuthStore } from './stores/authStore'

// 导入页面组件
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TicketSearchPage from './pages/TicketSearchPage'
import TicketBookingPage from './pages/TicketBookingPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import PassengersPage from './pages/PassengersPage'

// 导入布局组件
import Header from './components/Layout/Header'
import ProtectedRoute from './components/Auth/ProtectedRoute'

import './App.css'

const { Content } = Layout

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <Layout className="min-h-screen">
      <Header />
      <Content className="flex-1">
        <Routes>
          {/* 公开路由 */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/search" element={<TicketSearchPage />} />
          
          {/* 需要登录的路由 */}
          <Route path="/booking" element={
            <ProtectedRoute>
              <TicketBookingPage />
            </ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/passengers" element={
            <ProtectedRoute>
              <PassengersPage />
            </ProtectedRoute>
          } />
          
          {/* 重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Content>
    </Layout>
  )
}

export default App