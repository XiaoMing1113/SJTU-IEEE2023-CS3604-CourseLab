import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 组件测试 - 实时验证反馈（密码强度）', () => {
  it('密码输入触发强度条显示并逐级激活', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    const pwd = container.querySelector('input[name="password"]') as HTMLInputElement
    await user.type(pwd, 'abc123')
    const levels = container.querySelectorAll('.strength-meter .level')
    expect(levels.length).toBe(3)
    expect(levels[0].classList.contains('active')).toBe(true)
  })
})