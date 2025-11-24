import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import LoginPage from '../../../../src/pages/P003/LoginPage.jsx'

describe('P003_Login 集成测试 - 登录成功流程', () => {
  it('存储Token与用户信息并跳转首页', async () => {
    const user = userEvent.setup()
    const loginMock = vi.spyOn(api, 'login')
    loginMock.mockResolvedValue({ success: true, token: 't123', user: { name: 'Alice' }, userId: 'u001' } as any)
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText('用户名/邮箱/手机号'), '13800138000')
    await user.type(screen.getByPlaceholderText('密码'), 'abc12345')
    await user.click(screen.getByRole('button', { name: '立即登录' }))
    expect(localStorage.getItem('token')).toBe('t123')
    const storedUser = localStorage.getItem('user')
    expect(storedUser).toBeTruthy()
    const parsed = storedUser ? JSON.parse(storedUser) : null
    expect(parsed?.id).toBe('u001')
    expect(dispatchSpy).toHaveBeenCalled()
  })
})