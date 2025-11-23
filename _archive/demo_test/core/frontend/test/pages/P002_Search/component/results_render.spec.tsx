import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import * as api from '../../../../src/services/api'
import SearchResultsPage from '../../../../src/pages/P002/SearchResultsPage.jsx'

const mockData = [{
  trainNumber: 'G12',
  departureStation: '北京南',
  arrivalStation: '上海虹桥',
  departureTime: '09:00',
  arrivalTime: '13:30',
  duration: '4:30',
  seats: { secondClass: { available: 12, price: 553 } }
}]

describe('P002_Search 组件测试 - 搜索结果渲染', () => {
  it('渲染车次数量与关键信息', async () => {
    const searchMock = vi.spyOn(api, 'searchTrains')
    searchMock.mockResolvedValue(mockData as any)
    render(
      <MemoryRouter initialEntries={[{ pathname: '/search' }] as any}>
        <SearchResultsPage />
      </MemoryRouter>
    )
    const headerInfo = await screen.findByText((content, element) => {
      if (!element) return false
      const isHeader = element.classList.contains('table-header-info')
      const text = element.textContent || ''
      return isHeader && /共计\s*1\s*个车次/.test(text)
    })
    expect(headerInfo).toBeInTheDocument()
    expect(screen.getByText('G12')).toBeInTheDocument()
    expect(screen.getByText('北京南')).toBeInTheDocument()
    expect(screen.getByText('上海虹桥')).toBeInTheDocument()
    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('13:30')).toBeInTheDocument()
    expect(screen.getByText('4:30')).toBeInTheDocument()
  })
})