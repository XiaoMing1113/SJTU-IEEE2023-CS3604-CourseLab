import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from '../../../../src/pages/P005/OrderConfirmationPage.jsx'

describe('P005_Order 组件测试 - 异常状态处理', () => {
  it('存在订单时不显示“订单不存在”', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/order/EFGH' } as any]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('订单确认')).toBeInTheDocument()
    expect(screen.queryByText('订单不存在')).toBeNull()
  })
})