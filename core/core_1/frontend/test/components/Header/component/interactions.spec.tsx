import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 组件测试 - 交互行为验证', () => {
  it('点击退出清除本地状态并回到未登录视图', async () => {
    localStorage.setItem('token', 't')
    localStorage.setItem('user', JSON.stringify({ realName: 'test_user' }))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    await user.click(screen.getByText('[退出]'))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(screen.getByText('登录')).toBeInTheDocument()
    expect(screen.getByText('注册')).toBeInTheDocument()
  })
})