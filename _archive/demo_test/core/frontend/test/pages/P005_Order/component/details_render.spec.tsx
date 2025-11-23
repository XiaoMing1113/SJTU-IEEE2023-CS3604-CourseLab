import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from '../../../../src/pages/P005/OrderConfirmationPage.jsx'

describe('P005_Order 组件测试 - 订单详情渲染', () => {
  it('显示车次、站点、乘客与金额', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/order/ABCD' } as any]}>
        <Routes>
          <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(await screen.findByText('车次：G1')).toBeInTheDocument()
    expect(screen.getByText(/出发：北京南/)).toBeInTheDocument()
    expect(screen.getByText(/到达：上海虹桥/)).toBeInTheDocument()
    expect(screen.getByText('姓名：张三')).toBeInTheDocument()
    expect(screen.getByText('总金额：¥553')).toBeInTheDocument()
  })
})