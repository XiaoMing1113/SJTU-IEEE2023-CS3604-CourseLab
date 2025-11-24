import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PaymentSuccessPage from '../../../../src/pages/P005/PaymentSuccessPage.jsx'

describe('P005_Success 组件测试 - 成功结果渲染', () => {
  it('显示支付成功图标、订单号与金额', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment-success/ORDERX' } as any]}>
        <Routes>
          <Route path="/payment-success/:orderId" element={<PaymentSuccessPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('支付成功')).toBeInTheDocument()
    expect(screen.getByText('订单号：ORDERX')).toBeInTheDocument()
    expect(screen.getByText('支付金额：¥553')).toBeInTheDocument()
  })
})