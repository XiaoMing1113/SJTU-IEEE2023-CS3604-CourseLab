import { swapLogic } from '../../../../src/pages/P001/HomePage.jsx'

describe('P001 单元测试 - 交换逻辑纯函数', () => {
  it('输入{from:A,to:B}返回{from:B,to:A}', () => {
    const input = { from: 'A', to: 'B' }
    const result = swapLogic(input)
    expect(result).toEqual({ from: 'B', to: 'A' })
  })
})