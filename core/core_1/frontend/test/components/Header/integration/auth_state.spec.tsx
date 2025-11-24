import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 集成测试 - 状态持久化响应', () => {
  it('模拟登录事件后Header更新为登录态', async () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText('登录')).toBeInTheDocument()
    localStorage.setItem('token', 't')
    localStorage.setItem('user', JSON.stringify({ realName: 'test_user' }))
    window.dispatchEvent(new CustomEvent('userLoginStatusChanged'))
    expect(await screen.findByText(/欢迎，test_user/)).toBeInTheDocument()
  })
})