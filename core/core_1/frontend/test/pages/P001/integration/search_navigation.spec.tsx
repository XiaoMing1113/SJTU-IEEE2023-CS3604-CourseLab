import React from 'react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import HomePage from '../../../../src/pages/P001/HomePage.jsx'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...actual, useNavigate: () => mockedNavigate }
})

describe('P001 集成测试 - 查询跳转逻辑', () => {
  it('填写完整后点击查询触发导航且携带state', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )
    const [fromInput, toInput] = container.querySelectorAll('input[type="text"]')
    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement
    const [studentCheckbox, highSpeedCheckbox] = container.querySelectorAll('input[type="checkbox"]')
    await user.clear(fromInput)
    await user.type(fromInput, 'Beijing')
    await user.clear(toInput)
    await user.type(toInput, 'Shanghai')
    await user.clear(dateInput)
    await user.type(dateInput, '2023-11-23')
    await user.click(studentCheckbox as HTMLElement)
    await user.click(highSpeedCheckbox as HTMLElement)
    const searchBtn = container.querySelector('.hero-search-btn')
    await user.click(searchBtn as HTMLElement)
    expect(mockedNavigate).toHaveBeenCalledTimes(1)
    const args = mockedNavigate.mock.calls[0]
    expect(args[0]).toBe('/search')
    const stateArg = args[1]?.state
    expect(stateArg).toEqual({ from: 'Beijing', to: 'Shanghai', date: '2023-11-23', isStudent: true, isHighSpeed: true })
  })
})