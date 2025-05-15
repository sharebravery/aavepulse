import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TokenOrb } from './TokenOrb'

describe('TokenOrb', () => {
  it('renders an accessible token label and stable visual marker', () => {
    const { container, rerender } = render(<TokenOrb symbol="USDC" />)
    const orb = screen.getByLabelText('USDC token')
    const firstClassName = orb.className

    expect(orb).toHaveTextContent('USDC')
    expect(firstClassName).toContain('token-orb')

    rerender(<TokenOrb symbol="USDC" />)
    expect(screen.getByLabelText('USDC token').className).toBe(firstClassName)
    expect(container.querySelector('[aria-hidden="true"]')).toBeTruthy()
  })
})
