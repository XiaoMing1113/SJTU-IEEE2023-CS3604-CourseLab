import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 集成测试 - 注册失败处理', () => {
  it('注册冲突时不跳转并不显示成功提示', async () => {
    const user = userEvent.setup()
    const registerMock = vi.spyOn(api, 'register').mockRejectedValue(new Error('用户已存在'))
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(registerMock).toHaveBeenCalled()
    expect(alertMock).not.toHaveBeenCalledWith('注册成功')
  })
})