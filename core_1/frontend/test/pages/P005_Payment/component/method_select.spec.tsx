import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaymentPage from '../../../../src/pages/P005/PaymentPage.jsx'

describe('P005_Payment 组件测试 - 支付方式选择', () => {
  it('默认选中支付宝，切换至微信', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment/ORDER2' } as any]}>
        <Routes>
          <Route path="/payment/:orderId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    )
    const alipay = screen.getByLabelText('支付宝') as HTMLInputElement
    const wechat = screen.getByLabelText('微信支付') as HTMLInputElement
    expect(alipay.checked).toBe(true)
    expect(wechat.checked).toBe(false)
    wechat.click()
    expect(wechat.checked).toBe(true)
    expect(alipay.checked).toBe(false)
  })
})