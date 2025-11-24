import React from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - 列表渲染完整性', () => {
  it('渲染多个订单项，包含关键信息', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19', passengers: [{ name: '张三', seatType: '二等座' }] },
      { orderId: 'B', status: 'PAID', trainNumber: 'G2', date: '2024-10-21', from: '北京南', to: '南京南', totalAmount: 200, createdAt: '2024-10-19', passengers: [{ name: '李四', seatType: '二等座' }] },
    ] } } as any)
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    const cardA = await screen.findByText(/订单号：A/)
    const orderCardA = cardA.closest('.order-card') as HTMLElement
    expect(screen.getByText('G1')).toBeInTheDocument()
    expect(within(orderCardA).getByText('北京南')).toBeInTheDocument()
    expect(within(orderCardA).getByText('上海虹桥')).toBeInTheDocument()
    expect(screen.getByText('¥100')).toBeInTheDocument()
    expect(within(orderCardA).getByText('待支付')).toBeInTheDocument()
    const cardB = screen.getByText(/订单号：B/)
    const orderCardB = cardB.closest('.order-card') as HTMLElement
    expect(within(orderCardB).getByText('G2')).toBeInTheDocument()
    expect(within(orderCardB).getByText('¥200')).toBeInTheDocument()
    expect(within(orderCardB).getByText('未出行')).toBeInTheDocument()
  })
})