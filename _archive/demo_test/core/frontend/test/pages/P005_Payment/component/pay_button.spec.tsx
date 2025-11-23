import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import PaymentPage from '../../../../src/pages/P005/PaymentPage.jsx'

describe('P005_Payment 组件测试 - 支付按钮交互', () => {
  it('点击后进入Loading状态并禁用按钮', async () => {
    const user = userEvent.setup()
    vi.spyOn(api, 'getOrderDetails').mockResolvedValue({ data: { totalAmount: 553, status: 'PENDING_PAYMENT', trainInfo: { trainNumber: 'G8', from: '北京南', to: '上海虹桥', date: '2024-10-20' } } } as any)
    vi.spyOn(api, 'initiatePayment').mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { paymentId: 'PM1' } } as any), 50)))
    render(
      <MemoryRouter initialEntries={[{ pathname: '/payment/ORDER3' } as any]}>
        <Routes>
          <Route path="/payment/:orderId" element={<PaymentPage />} />
        </Routes>
      </MemoryRouter>
    )
    const btn = screen.getByRole('button', { name: '生成支付凭据' })
    await user.click(btn)
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent('正在生成…')
  })
})