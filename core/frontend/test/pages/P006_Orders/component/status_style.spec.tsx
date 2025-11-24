import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - 状态标签样式', () => {
  it('不同状态显示对应类名', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19' },
      { orderId: 'B', status: 'PAID', trainNumber: 'G2', date: '2024-10-21', from: '北京南', to: '南京南', totalAmount: 200, createdAt: '2024-10-19' },
      { orderId: 'C', status: 'COMPLETED', trainNumber: 'G3', date: '2024-10-22', from: '杭州东', to: '上海虹桥', totalAmount: 300, createdAt: '2024-10-19' },
    ] } } as any)
    const { container } = render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    await new Promise(r => setTimeout(r))
    const labels = container.querySelectorAll('.order-status')
    expect(labels[0].classList.contains('status-pending')).toBe(true)
    expect(labels[1].classList.contains('status-paid')).toBe(true)
    expect(labels[2].classList.contains('status-completed')).toBe(true)
  })
})