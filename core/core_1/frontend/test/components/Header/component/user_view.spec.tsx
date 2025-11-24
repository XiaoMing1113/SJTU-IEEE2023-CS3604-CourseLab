import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 组件测试 - 登录态视图', () => {
  it('显示欢迎语与退出，隐藏登录/注册', () => {
    localStorage.setItem('token', 't')
    localStorage.setItem('user', JSON.stringify({ realName: 'test_user' }))
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText(/欢迎，test_user/)).toBeInTheDocument()
    expect(screen.getByText('[退出]')).toBeInTheDocument()
    expect(screen.queryByText('登录')).toBeNull()
    expect(screen.queryByText('注册')).toBeNull()
  })
})