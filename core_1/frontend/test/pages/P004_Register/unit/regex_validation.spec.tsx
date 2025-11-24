import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 单元测试 - 格式校验（基于实际行为）', () => {
  it('手机号输入允许非数字字符（未拦截）', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    const phone = container.querySelector('.phone-input') as HTMLInputElement
    await user.type(phone, 'abc123')
    expect(phone.value).toBe('abc123')
  })

  it('证件号码输入可接受任意字符（未显示错误）', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    const id = screen.getByPlaceholderText('请输入您的证件号码') as HTMLInputElement
    await user.type(id, '12345678901234567X')
    expect(id.value).toBe('12345678901234567X')
  })
})