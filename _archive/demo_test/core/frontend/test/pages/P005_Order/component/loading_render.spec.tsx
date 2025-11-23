import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from '../../../../src/pages/P005/OrderConfirmationPage.jsx'

describe('P005_Order 组件测试 - 数据加载状态', () => {
  it('展示确认页内容', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/order/ABC' } as any]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('订单确认')).toBeInTheDocument()
  })
})