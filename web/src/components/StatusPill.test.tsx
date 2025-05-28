import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusPill } from './StatusPill'

describe('StatusPill', () => {
  it('exposes the status label and semantic data state', () => {
    render(<StatusPill status="success" label="Synced" />)
    expect(screen.getByText('Synced')).toBeInTheDocument()
    expect(screen.getByText('Synced').parentElement).toHaveAttribute('data-status', 'success')
  })
})
