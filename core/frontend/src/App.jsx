import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
// import TicketsPage from './pages/TicketsPage' 不再使用TicketPage页面，直接定位到搜索结果页面，所见即所得，然后删除Tickets页面的对应文件。
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import PaymentPage from './pages/PaymentPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import UserOrdersPage from './pages/UserOrdersPage'
import './App.css'

function App() {
  const location = useLocation()

  // 定义不显示全局Header的路径
  const hideHeaderPaths = ['/login']
  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname)

  return (
    <div className="App">
      {shouldShowHeader && <Header />}
      <main style={{ padding: shouldShowHeader ? '20px 0' : '0' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* <Route path="/tickets" element={<TicketsPage />} /> */}
          <Route path="/tickets" element={<SearchResultsPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/search-results" element={<SearchResultsPage />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/payment-success/:orderId" element={<PaymentSuccessPage />} />
          <Route path="/my-orders" element={<UserOrdersPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App