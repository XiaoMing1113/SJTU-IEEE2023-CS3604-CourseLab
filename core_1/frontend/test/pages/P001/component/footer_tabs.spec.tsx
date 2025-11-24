import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 底部Tab', () => {
  it('默认最新发布为激活且新闻列表渲染', () => {
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const latestTab = screen.getByText('最新发布')
    expect(latestTab).toHaveClass('active')
    const list = container.querySelectorAll('.news-list li')
    expect(list.length).toBeGreaterThan(0)
  })

  it('点击常见问题后仍保持当前逻辑的激活状态', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const latestTab = screen.getByText('最新发布')
    const faqTab = screen.getByText('常见问题')
    await user.click(faqTab)
    expect(latestTab).toHaveClass('active')
  })
})