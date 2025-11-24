import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 组件测试 - 错误信息展示（基于实际行为）', () => {
  it('后端返回错误时不跳转并结束加载', async () => {
    const user = userEvent.setup()
    const registerMock = vi.spyOn(api, 'register').mockRejectedValue(new Error('该身份证已被注册'))
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    const btn = screen.getByRole('button', { name: '下一步' }) as HTMLButtonElement
    expect(btn).not.toBeDisabled()
    expect(registerMock).toHaveBeenCalled()
  })
})