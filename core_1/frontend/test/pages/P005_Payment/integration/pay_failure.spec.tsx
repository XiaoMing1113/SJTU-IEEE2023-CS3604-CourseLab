import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import PaymentPage from '../../../../src/pages/P005/PaymentPage.jsx'

describe('P005_Payment 集成测试 - 支付失败流程', () => {
  it('生成支付凭据后模拟失败显示失败弹层', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'getOrderDetails').mockResolvedValue({ data: { totalAmount: 200, status: 'PENDING_PAYMENT', trainInfo: { trainNumber: 'G9', from: 'A', to: 'B', date: '2024-10-20' } } } as any)
    vi.spyOn(api, 'initiatePayment').mockResolvedValue({ data: { paymentId: 'PM3' } } as any)
    vi.spyOn(api, 'handlePaymentCallback').mockResolvedValue({} as any)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment/ORDERY' } as any]}>
        <Routes>
          <Route path="/payment/:orderId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: '生成支付凭据' }))
    await user.click(await screen.findByRole('button', { name: '模拟支付失败' }))
    expect(await screen.findByText('支付失败')).toBeInTheDocument()
  })
})