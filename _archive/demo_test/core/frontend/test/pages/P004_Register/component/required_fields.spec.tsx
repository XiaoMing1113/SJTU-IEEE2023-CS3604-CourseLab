import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 组件测试 - 必填项拦截', () => {
  it('未勾选协议点击注册弹出提示', async () => {
    const user = userEvent.setup()
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: '下一步' }))
    expect(alertMock).toHaveBeenCalledWith('请同意服务条款')
  })
})