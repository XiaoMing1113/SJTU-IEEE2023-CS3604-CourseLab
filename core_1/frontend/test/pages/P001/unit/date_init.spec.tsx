import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 单元测试 - 日期初始化', () => {
  it('出发日期初始值为当天', () => {
    const expectedDate = new Date().toISOString().split('T')[0]
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    expect(screen.getByDisplayValue(expectedDate)).toBeInTheDocument()
  })
})