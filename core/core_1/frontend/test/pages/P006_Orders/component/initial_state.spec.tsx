import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 组件测试 - 初始加载与空状态', () => {
  it('API返回空数组显示“暂无订单”', async () => {
    localStorage.removeItem('user')
    vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [] } } as any)
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    expect(await screen.findByText('暂无订单')).toBeInTheDocument()
  })
})