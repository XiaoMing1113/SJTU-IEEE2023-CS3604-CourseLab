import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../../../src/pages/P003/LoginPage.jsx'

describe('P003_Login 组件测试 - 初始渲染完整性', () => {
  it('包含标题、输入框、按钮及常用链接', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    expect(screen.getByText('欢迎登录12306')).toBeInTheDocument()
    expect(screen.getByText('扫码登录')).toBeInTheDocument()
    const accountTab = screen.getByText('账号登录')
    expect(accountTab).toBeInTheDocument()
    expect(screen.getByPlaceholderText('用户名/邮箱/手机号')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('密码')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '立即登录' })).toBeInTheDocument()
    expect(screen.getByText('注册12306账号')).toBeInTheDocument()
    expect(screen.getByText('忘记密码？')).toBeInTheDocument()
  })
})