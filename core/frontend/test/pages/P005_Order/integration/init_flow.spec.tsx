import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from '../../../../src/pages/P005/OrderConfirmationPage.jsx'

describe('P005_Order 集成测试 - 确认页初始化流程', () => {
  it('加载后展示内容', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/order/INIT1' } as any]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('订单确认')).toBeInTheDocument()
  })
})