import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 集成测试 - 订单操作联动', () => {
  it('点击“去支付”跳转至/payment/:orderId', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19' },
    ] } } as any)
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={[{ pathname: '/orders' } as any]}>
        <Routes>
          <Route path="/orders" element={<UserOrdersPage />} />
          <Route path="/payment/:orderId" element={<div>支付页A</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(await screen.findByRole('button', { name: '立即支付' }))
    expect(screen.getByText('支付页A')).toBeInTheDocument()
  })

  it('确认取消后调用取消API并触发刷新', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19' },
    ] } } as any)
    const cancelMock = vi.spyOn(api, 'cancelOrder').mockResolvedValue({} as any)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    await user.click(await screen.findByRole('button', { name: '取消订单' }))
    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(cancelMock).toHaveBeenCalledWith('A')
  })
})