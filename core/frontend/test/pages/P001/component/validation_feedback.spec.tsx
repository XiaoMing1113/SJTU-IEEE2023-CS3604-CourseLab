import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'
import { vi } from 'vitest'

describe('P001 组件测试 - 表单校验反馈', () => {
  it('出发地和到达地为空时点击查询触发提示', async () => {
    const user = userEvent.setup()
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const searchBtn = container.querySelector('.hero-search-btn')
    await user.click(searchBtn as HTMLElement)
    expect(alertSpy).toHaveBeenCalled()
    expect(alertSpy.mock.calls[0][0]).toContain('请输入出发地和目的地')
    alertSpy.mockRestore()
  })
})