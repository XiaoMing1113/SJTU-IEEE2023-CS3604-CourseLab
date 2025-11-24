import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 组件测试 - 静态结构渲染', () => {
  it('包含Logo且Logo链接指向首页', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    const logoImg = screen.getByAltText('12306 Logo')
    expect(logoImg).toBeInTheDocument()
    const logoLink = logoImg.closest('a') as HTMLAnchorElement
    expect(logoLink?.getAttribute('href')).toBe('/')
    expect(screen.getByText('首页')).toBeInTheDocument()
  })
})