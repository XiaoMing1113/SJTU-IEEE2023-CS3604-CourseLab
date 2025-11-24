import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../../../../src/components/Header.jsx'

describe('Header 单元测试 - 导航配置验证', () => {
  it('主导航包含预期链接与路径', () => {
    const { container } = render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    const anchors = Array.from(container.querySelectorAll('.main-nav-bar .nav-item')) as HTMLAnchorElement[]
    const map = anchors.map(a => [a.textContent?.trim()?.replace(/\s+⌄$/, ''), a.getAttribute('href')])
    expect(map).toEqual(expect.arrayContaining([
      ['首页', '/'],
      ['车票', '/search'],
      ['团购服务', '/groups'],
      ['会员服务', '/members'],
      ['站车服务', '/stations'],
      ['商旅服务', '/business'],
      ['出行指南', '/guide'],
      ['信息查询', '/info'],
    ]))
  })
})