import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 初始渲染', () => {
  it('包含两个文本输入框和日期选择器', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const textInputs = container.querySelectorAll('input[type="text"]')
    const dateInput = container.querySelector('input[type="date"]')
    expect(textInputs.length).toBe(2)
    expect(dateInput).toBeTruthy()
  })

  it('默认激活的卡片Tab为单程', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const singleTab = screen.getByText('单程')
    expect(singleTab).toHaveClass('active')
  })

  it('ServiceItem渲染数量为7且包含指定标题', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const items = container.querySelectorAll('.service-item')
    expect(items.length).toBe(7)
    expect(screen.getByText('重点旅客预约')).toBeInTheDocument()
    expect(screen.getByText('遗失物品查找')).toBeInTheDocument()
    expect(screen.getByText('约车服务')).toBeInTheDocument()
    expect(screen.getByText('便民托运')).toBeInTheDocument()
    expect(screen.getByText('车站引导')).toBeInTheDocument()
    expect(screen.getByText('站车风采')).toBeInTheDocument()
    expect(screen.getByText('用户反馈')).toBeInTheDocument()
  })
})