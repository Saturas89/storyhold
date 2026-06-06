import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { LandingView } from './LandingView'
import { de } from '../locales/de'

afterEach(cleanup)

const defaultProps = {
  onStart: vi.fn(),
  onShowImpressum: vi.fn(),
}

describe('LandingView', () => {
  it('resolves every in-page nav anchor to a matching section id', () => {
    // Guards the dead-link regression: nav links #about / #privacy previously
    // pointed at ids that did not exist anywhere in the markup.
    const { container } = render(<LandingView {...defaultProps} />)

    const hashLinks = Array.from(container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
    expect(hashLinks.length).toBeGreaterThan(0)

    for (const link of hashLinks) {
      const id = link.getAttribute('href')!.slice(1)
      expect(container.querySelector(`#${id}`), `no target element for #${id}`).not.toBeNull()
    }
  })

  it('calls onShowImpressum when the footer Impressum link is clicked', () => {
    const onShowImpressum = vi.fn()
    render(<LandingView {...defaultProps} onShowImpressum={onShowImpressum} />)

    fireEvent.click(screen.getByText(de.landing.footer.impressumLink))

    expect(onShowImpressum).toHaveBeenCalledTimes(1)
  })
})
