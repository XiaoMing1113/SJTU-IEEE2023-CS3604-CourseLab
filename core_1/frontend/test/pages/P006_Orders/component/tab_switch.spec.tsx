import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - Tab切换交互', () => {
  it('切换Tab高亮且内容变化', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [
      { orderId: 'A', status: 'PENDING_PAYMENT', trainNumber: 'G1', date: '2024-10-20', from: '北京南', to: '上海虹桥', totalAmount: 100, createdAt: '2024-10-19' },
      { orderId: 'B', status: 'PAID', trainNumber: 'G2', date: '2024-10-21', from: '北京南', to: '南京南', totalAmount: 200, createdAt: '2024-10-19' },
    ] } } as any)
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    await screen.findByText('我的订单')
    const unpaid = screen.getByRole('button', { name: '待支付' })
    await user.click(unpaid)
    expect(unpaid).toHaveClass('active')
    expect(screen.getAllByText(/订单号：/).length).toBe(1)
    const upcoming = screen.getByRole('button', { name: '未出行' })
    await user.click(upcoming)
    expect(upcoming).toHaveClass('active')
    expect(screen.getAllByText(/订单号：/).length).toBe(1)
  })
})