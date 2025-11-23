import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 单元测试 - 密码一致性校验（基于实际行为）', () => {
  it('密码与确认密码输入不同，组件未显示行内错误提示', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    const pwd = container.querySelector('input[name="password"]') as HTMLInputElement
    const cpwd = container.querySelector('input[name="confirmPassword"]') as HTMLInputElement
    await user.type(pwd, 'Abc123')
    await user.type(cpwd, 'Abc1234')
    expect(pwd.value).toBe('Abc123')
    expect(cpwd.value).toBe('Abc1234')
    expect(container.querySelector('.error-text')).toBeNull()
  })
})