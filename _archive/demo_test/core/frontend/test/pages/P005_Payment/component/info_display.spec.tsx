import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import PaymentPage from '../../../../src/pages/P005/PaymentPage.jsx'

describe('P005_Payment 组件测试 - 支付信息展示', () => {
  it('显示订单号与应付金额', async () => {
    vi.spyOn(api, 'getOrderDetails').mockResolvedValue({ data: { totalAmount: 553, status: 'PENDING_PAYMENT', trainInfo: { trainNumber: 'G8', from: '北京南', to: '上海虹桥', date: '2024-10-20' } } } as any)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment/ORDER1' } as any]}>
        <Routes>
          <Route path="/payment/:orderId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText('订单号：ORDER1')).toBeInTheDocument()
    expect(await screen.findByText('应付金额 ¥553')).toBeInTheDocument()
  })
})