import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import SearchResultsPage from '../../../../src/pages/P002/SearchResultsPage.jsx'

vi.mock('../../../../src/services/api', () => ({ searchTrains: vi.fn(async () => ([])) }))

describe('P002_Search 组件测试 - 空状态渲染', () => {
  it('API返回空数组时显示空状态提示', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/search' }] as any}>
        <SearchResultsPage />
      </MemoryRouter>
    )
    expect(await screen.findByText('未找到符合条件的车次')).toBeInTheDocument()
  })
})