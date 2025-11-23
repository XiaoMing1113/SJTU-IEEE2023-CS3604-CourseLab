import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 组件测试 - 未登录态视图', () => {
  it('显示登录与注册链接，隐藏欢迎语', () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText('登录')).toBeInTheDocument()
    expect(screen.getByText('注册')).toBeInTheDocument()
    expect(screen.queryByText(/欢迎/)).toBeNull()
  })
})