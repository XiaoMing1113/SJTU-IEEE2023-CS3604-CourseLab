import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - 取消订单交互', () => {
  it('点击取消订单弹出确认弹窗并调用取消API', async () => {
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
    const title = document.querySelector('.modal-title')
    expect(title?.textContent).toBe('取消订单')
    await user.click(screen.getByRole('button', { name: '确认' }))
    expect(cancelMock).toHaveBeenCalledWith('A')
  })
})