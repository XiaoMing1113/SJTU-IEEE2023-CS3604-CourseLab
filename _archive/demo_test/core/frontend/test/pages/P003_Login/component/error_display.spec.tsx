import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import LoginPage from '../../../../src/pages/P003/LoginPage.jsx'

describe('P003_Login 组件测试 - 错误提示渲染', () => {
  it('API返回错误信息时显示错误提示', async () => {
    const user = userEvent.setup()
    const loginMock = vi.spyOn(api, 'login')
    loginMock.mockResolvedValue({ success: false, message: '用户名或密码错误' } as any)
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText('用户名/邮箱/手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('密码'), 'abc12345')
    await user.click(screen.getByRole('button', { name: '立即登录' }))
    expect(await screen.findByText('用户名或密码错误')).toBeInTheDocument()
  })
})