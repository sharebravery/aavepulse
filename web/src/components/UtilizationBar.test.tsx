import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UtilizationBar } from './UtilizationBar'

describe('UtilizationBar', () => {
  it('clamps ratios and exposes the percentage to assistive technology', () => {
    const { rerender } = render(<UtilizationBar value={1.4} showValue />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('100.00%')).toBeInTheDocument()

    rerender(<UtilizationBar value={-0.2} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})
