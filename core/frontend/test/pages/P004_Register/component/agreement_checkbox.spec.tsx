import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 组件测试 - 协议勾选交互', () => {
  it('勾选协议后允许提交并调用 register', async () => {
    const user = userEvent.setup()
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const registerMock = vi.spyOn(api, 'register').mockResolvedValue({} as any)
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(registerMock).toHaveBeenCalled()
    expect(alertMock).toHaveBeenCalledWith('注册成功')
  })
})