import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from '../../../../src/pages/P005/OrderConfirmationPage.jsx'

describe('P005_Order 组件测试 - 确认支付交互', () => {
  it('点击“立即支付”后页面发生跳转', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[{ pathname: '/order/XYZ' } as any]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    )
    const btn = await screen.findByRole('button', { name: '立即支付' })
    await user.click(btn)
    expect(screen.queryByRole('button', { name: '立即支付' })).toBeNull()
  })
})