import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/P001/HomePage'
import LoginPage from './pages/P003/LoginPage'
import RegisterPage from './pages/P004/RegisterPage'
// import TicketsPage from './pages/TicketsPage' 不再使用TicketPage页面，直接定位到搜索结果页面，所见即所得，然后删除Tickets页面的对应文件。
import SearchResultsPage from './pages/P002/SearchResultsPage'
import BookingPage from './pages/P002/BookingPage'
import OrderConfirmationPage from './pages/P005/OrderConfirmationPage'
import PaymentPage from './pages/P005/PaymentPage'
import PaymentSuccessPage from './pages/P005/PaymentSuccessPage'
import UserOrdersPage from './pages/P006/UserOrdersPage'
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
          <Route path="/search" element={<SearchResultsPage />} />
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