describe('P005_Order 单元测试 - 倒计时计算逻辑', () => {
  const computeRemainingMs = (createAt: number, now: number, limitMs: number) => {
    const elapsed = now - createAt
    const left = limitMs - elapsed
    return left > 0 ? left : 0
  }

  it('在时限内返回剩余毫秒数', () => {
    const createAt = Date.now() - 10 * 60 * 1000
    const now = Date.now()
    const left = computeRemainingMs(createAt, now, 30 * 60 * 1000)
    expect(left).toBeGreaterThan(19 * 60 * 1000)
  })

  it('超时后返回0', () => {
    const createAt = Date.now() - 40 * 60 * 1000
    const now = Date.now()
    const left = computeRemainingMs(createAt, now, 30 * 60 * 1000)
    expect(left).toBe(0)
  })
})