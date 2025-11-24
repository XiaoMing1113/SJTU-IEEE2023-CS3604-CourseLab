import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 集成测试 - 注册成功跳转', () => {
  it('完整填写并勾选协议后成功注册，提示并跳转登录页', async () => {
    const user = userEvent.setup()
    const registerMock = vi.spyOn(api, 'register').mockResolvedValue({} as any)
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText('用户名设置成功后不可修改'), 'user_123')
    const pwd = document.querySelector('input[name="password"]') as HTMLInputElement
    await user.type(pwd, 'Abc123!')
    await user.type(screen.getByPlaceholderText('再次输入您的登录密码'), 'Abc123!')
    await user.type(screen.getByPlaceholderText('请输入姓名'), '张三')
    await user.type(screen.getByPlaceholderText('请输入您的证件号码'), '12345678901234567X')
    await user.type(container.querySelector('.phone-input') as HTMLInputElement, '13800138000')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(registerMock).toHaveBeenCalled()
    expect(alertMock).toHaveBeenCalledWith('注册成功')
  })
})