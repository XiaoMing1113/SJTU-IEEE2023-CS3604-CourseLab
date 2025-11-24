import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 交换按钮', () => {
  it('点击交换后两个输入框值按当前逻辑更新', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const [fromInput, toInput] = container.querySelectorAll('input[type="text"]')
    await user.clear(fromInput)
    await user.type(fromInput, 'Beijing')
    await user.clear(toInput)
    await user.type(toInput, 'Shanghai')
    const swapBtn = container.querySelector('.swap-icon')
    await user.click(swapBtn as HTMLElement)
    expect(fromInput).toHaveValue('Shanghai')
    expect(toInput).toHaveValue('Beijing')
  })
})