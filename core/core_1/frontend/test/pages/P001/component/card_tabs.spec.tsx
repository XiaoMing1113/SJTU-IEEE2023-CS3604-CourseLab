import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 顶部卡片Tab切换', () => {
  it('点击往返后该Tab获得active，单程失去active', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const singleTab = screen.getByText('单程')
    const roundTab = screen.getByText('往返')
    expect(singleTab).toHaveClass('active')
    await user.click(roundTab)
    expect(roundTab).toHaveClass('active')
    expect(singleTab).not.toHaveClass('active')
  })
})