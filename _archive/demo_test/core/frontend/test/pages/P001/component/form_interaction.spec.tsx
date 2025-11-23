import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 组件测试 - 表单交互', () => {
  it('输入出发地后输入框值更新', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const fromInput = container.querySelectorAll('input[type="text"]')[0]
    await user.clear(fromInput)
    await user.type(fromInput, 'Beijing')
    expect(fromInput).toHaveValue('Beijing')
  })

  it('点击学生复选框后选中', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    const studentCheckbox = checkboxes[0]
    await user.click(studentCheckbox)
    expect(studentCheckbox).toBeChecked()
  })
})