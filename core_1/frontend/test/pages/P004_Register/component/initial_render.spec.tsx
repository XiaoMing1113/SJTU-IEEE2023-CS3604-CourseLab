import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegisterPage from '../../../../src/pages/P004/RegisterPage.jsx'

describe('P004_Register 组件测试 - 初始渲染完整性', () => {
  it('包含所有必填输入与协议勾选', () => {
    const { container } = render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('用户名设置成功后不可修改')).toBeInTheDocument()
    expect(container.querySelector('input[name="password"]')).toBeTruthy()
    expect(screen.getByPlaceholderText('再次输入您的登录密码')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入姓名')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请输入您的证件号码')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('请正确填写邮箱地址')).toBeInTheDocument()
    const phoneInput = document.querySelector('.phone-input')
    expect(phoneInput).toBeTruthy()
    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })
})