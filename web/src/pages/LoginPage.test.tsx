import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'

const captcha = vi.hoisted(() => ({
  id: vi.fn().mockResolvedValue({ captchaID: 'captcha-id', enabled: true }),
  image: vi.fn((id: string) => `/api/v1/captcha/image?id=${id}`),
}))

vi.mock('../lib/client', () => ({
  api: {
    captcha: captcha.id,
    captchaImage: captcha.image,
    login: vi.fn(),
  },
}))

describe('LoginPage', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    captcha.id.mockResolvedValue({ captchaID: 'captcha-id', enabled: true })
  })

  it('keeps the full captcha image visible for reliable demo login', async () => {
    render(<LoginPage onAuthenticated={vi.fn()} />)

    const image = await screen.findByRole('img', { name: 'Captcha' })
    await waitFor(() => expect(captcha.image).toHaveBeenCalledWith('captcha-id'))

    expect(image).toHaveClass('object-contain')
    expect(image.parentElement).toHaveClass('aspect-[5/2]')
  })

  it('hides captcha input when the backend marks demo mode as captcha-free', async () => {
    captcha.id.mockResolvedValueOnce({ captchaID: '', enabled: false })
    render(<LoginPage onAuthenticated={vi.fn()} />)

    await waitFor(() => expect(screen.getByText('Captcha is disabled in demo mode.')).toBeInTheDocument())
    expect(screen.queryByRole('img', { name: 'Captcha' })).not.toBeInTheDocument()
  })
})
