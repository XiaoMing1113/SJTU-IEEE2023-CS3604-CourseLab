import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - 操作按钮逻辑', () => {
  it('不同状态显示对应操作按钮', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19' },
      { orderId: 'B', status: 'PAID', trainNumber: 'G2', date: '2024-10-21', from: '北京南', to: '南京南', totalAmount: 200, createdAt: '2024-10-19' },
      { orderId: 'C', status: 'COMPLETED', trainNumber: 'G3', date: '2024-10-22', from: '杭州东', to: '上海虹桥', totalAmount: 300, createdAt: '2024-10-19' },
    ] } } as any)
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    expect(await screen.findByRole('button', { name: '立即支付' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消订单' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '申请退票' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '再次购买' })).toBeInTheDocument()
  })
})