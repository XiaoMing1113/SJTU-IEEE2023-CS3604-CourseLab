import React from 'react'
import { Layout, Menu, Button, Space, Avatar, Dropdown } from 'antd'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../stores/authStore'

const { Header: AntHeader } = Layout

const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    // TODO: 实现登出逻辑
    logout()
    navigate('/login')
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人信息</Link>,
    },
    {
      key: 'passengers',
      icon: <UserOutlined />,
      label: <Link to="/passengers">乘车人管理</Link>,
    },
    {
      key: 'orders',
      icon: <UserOutlined />,
      label: <Link to="/orders">我的订单</Link>,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  const menuItems = [
    {
      key: '/',
      label: <Link to="/">首页</Link>,
    },
    {
      key: '/search',
      label: <Link to="/search">车票预订</Link>,
    },
  ]

  return (
    <AntHeader className="bg-blue-600 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/" className="text-white text-xl font-bold mr-8">
          中国铁路12306
        </Link>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="bg-transparent border-none"
        />
      </div>
      
      <div className="flex items-center">
        {isAuthenticated && user ? (
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space className="text-white cursor-pointer">
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.username || user.phoneNumber}</span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button type="link" className="text-white">
              <Link to="/login">登录</Link>
            </Button>
            <Button type="primary" ghost>
              <Link to="/register">注册</Link>
            </Button>
          </Space>
        )}
      </div>
    </AntHeader>
  )
}

export default Header