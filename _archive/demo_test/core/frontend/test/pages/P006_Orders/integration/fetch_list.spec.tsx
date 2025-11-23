import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import UserOrdersPage from '../../../../src/pages/P006/UserOrdersPage.jsx'

describe('P006_Orders 集成测试 - 列表数据获取', () => {
  it('页面加载时调用获取订单列表API', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 'U1' }))
    const spy = vi.spyOn(api, 'getUserOrders').mockResolvedValue({ data: { orders: [] } } as any)
    render(
      <MemoryRouter>
        <UserOrdersPage />
      </MemoryRouter>
    )
    await new Promise(r => setTimeout(r))
    expect(spy).toHaveBeenCalled()
  })
})