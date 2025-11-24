import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 集成测试 - 新闻数据加载', () => {
  it('渲染最新发布的第一条新闻标题', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByText('关于2025年部分旅客列车时刻调整的公告')).toBeInTheDocument()
  })
})