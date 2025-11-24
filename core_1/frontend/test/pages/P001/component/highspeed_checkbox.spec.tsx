import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 高铁/动车复选框交互', () => {
  it('点击高铁/动车复选框后选中', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    const highSpeedCheckbox = checkboxes[1]
    await user.click(highSpeedCheckbox as HTMLElement)
    expect(highSpeedCheckbox).toBeChecked()
  })
})