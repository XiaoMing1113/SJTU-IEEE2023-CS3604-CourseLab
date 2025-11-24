import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../../../src/pages/P003/LoginPage.jsx'

describe('P003_Login 组件测试 - 输入交互与状态同步', () => {
  it('用户名与密码输入后状态变更且密码类型为password', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )
    const phoneInput = screen.getByPlaceholderText('用户名/邮箱/手机号') as HTMLInputElement
    const pwdInput = screen.getByPlaceholderText('密码') as HTMLInputElement
    await user.type(phoneInput, '13800138000')
    await user.type(pwdInput, 'abc123')
    expect(phoneInput.value).toBe('13800138000')
    expect(pwdInput.value).toBe('abc123')
    expect(pwdInput.getAttribute('type')).toBe('password')
  })
})