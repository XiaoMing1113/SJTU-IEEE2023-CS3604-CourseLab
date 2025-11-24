import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 单元测试 - 注册参数构造（基于实际行为）', () => {
  it('调用 register 原样传递包含 confirmPassword 在内的表单数据', async () => {
    const user = userEvent.setup()
    const registerMock = vi.spyOn(api, 'register').mockResolvedValue({} as any)
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText('用户名设置成功后不可修改'), 'user_abc')
    await user.type(container.querySelector('.phone-input') as HTMLInputElement, '13800138000')
    await user.type(screen.getByPlaceholderText('请输入姓名'), '张三')
    await user.type(screen.getByPlaceholderText('请输入您的证件号码'), '12345678901234567X')
    const pwd = container.querySelector('input[name="password"]') as HTMLInputElement
    await user.type(pwd, 'Abc123!')
    await user.type(screen.getByPlaceholderText('再次输入您的登录密码'), 'Abc123!')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(alertMock).toHaveBeenCalledWith('注册成功')
    expect(registerMock).toHaveBeenCalled()
    const arg = registerMock.mock.calls[0][0]
    expect(arg.confirmPassword).toBe('Abc123!')
  })
})