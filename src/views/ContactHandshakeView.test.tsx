import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, waitFor, act } from '@testing-library/react'
import { ContactHandshakeView } from './ContactHandshakeView'
import type { ContactHandshake } from '../types'

vi.mock('../utils/secureLink', () => ({
  generateContactUrl: () => 'https://example.com/?contact=test',
  shareOrCopy: vi.fn(async () => false),
}))
vi.mock('../utils/shareCard', () => ({
  generateShareCard: vi.fn(async () => new File([], 'card.png')),
}))

afterEach(cleanup)

const HANDSHAKE: ContactHandshake = {
  $type: 'remember-me-contact',
  version: 1,
  deviceId: 'device-friend',
  publicKey: 'PUBKEY',
  displayName: 'Mama',
}

function renderView(overrides: {
  enabled?: boolean
  myDeviceId?: string | null
  myPublicKey?: string | null
  handshake?: ContactHandshake
} = {}) {
  const onAcceptContact = vi.fn()
  const onDismiss = vi.fn()
  const onEnable = vi.fn()
  const view = render(
    <ContactHandshakeView
      handshake={overrides.handshake ?? HANDSHAKE}
      profileName="Sandra"
      myDeviceId={'myDeviceId' in overrides ? overrides.myDeviceId! : 'self-device'}
      myPublicKey={'myPublicKey' in overrides ? overrides.myPublicKey! : 'selfPK'}
      enabled={overrides.enabled ?? true}
      onEnable={onEnable}
      onAcceptContact={onAcceptContact}
      onDismiss={onDismiss}
    />,
  )
  return { ...view, onAcceptContact, onDismiss, onEnable }
}

describe('ContactHandshakeView – REQ-022 shareAll opt-in', () => {
  it('shows the share-all checkbox once the connection is established, checked by default', () => {
    const { container } = renderView()
    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="contact-handshake-shareall"] input[type="checkbox"]',
    )!
    expect(checkbox).toBeTruthy()
    expect(checkbox.checked).toBe(true)
  })

  it('label mentions the friend\'s display name', () => {
    const { container } = renderView()
    const label = container.querySelector('[data-testid="contact-handshake-shareall"]')!
    expect(label.textContent).toContain('Mama')
  })

  it('calls onAcceptContact(handshake, true) on auto-accept', async () => {
    const { onAcceptContact } = renderView()
    await waitFor(() => expect(onAcceptContact).toHaveBeenCalled())
    expect(onAcceptContact).toHaveBeenLastCalledWith(HANDSHAKE, true)
  })

  it('unchecking the box re-fires onAcceptContact with shareAll=false', async () => {
    const { container, onAcceptContact } = renderView()
    await waitFor(() => expect(onAcceptContact).toHaveBeenCalledTimes(1))

    const checkbox = container.querySelector<HTMLInputElement>(
      '[data-testid="contact-handshake-shareall"] input[type="checkbox"]',
    )!
    fireEvent.click(checkbox)

    await waitFor(() => expect(onAcceptContact).toHaveBeenCalledTimes(2))
    expect(onAcceptContact).toHaveBeenLastCalledWith(HANDSHAKE, false)
  })

  it('does not render the checkbox while still connecting (myDeviceId null)', () => {
    const { container } = renderView({ myDeviceId: null, myPublicKey: null })
    expect(container.querySelector('[data-testid="contact-handshake-shareall"]')).toBeNull()
  })

  it('does not call onAcceptContact while online sharing is disabled', () => {
    const { onAcceptContact } = renderView({ enabled: false })
    expect(onAcceptContact).not.toHaveBeenCalled()
  })
})

describe('ContactHandshakeView – waiting states (#165)', () => {
  // The component samples elapsed time every 500 ms, so advances must
  // overshoot each milestone by at least one tick.
  function renderWaiting(handshake?: ContactHandshake) {
    vi.useFakeTimers()
    return renderView({ myDeviceId: null, myPublicKey: null, handshake })
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a spinner and the personalized connecting text immediately, without a retry button', () => {
    const { container } = renderWaiting()
    expect(container.querySelector('.contact-handshake__spinner')).toBeTruthy()
    expect(container.querySelector('.contact-handshake__connecting')!.textContent).toContain('Mama')
    expect(container.querySelector('[data-testid="contact-handshake-retry"]')).toBeNull()
  })

  it('falls back to the generic connecting text when the handshake has no display name', () => {
    const { container } = renderWaiting({ ...HANDSHAKE, displayName: '' })
    expect(container.querySelector('.contact-handshake__connecting')!.textContent).not.toContain('{name}')
    expect(container.querySelector('.contact-handshake__spinner')).toBeTruthy()
  })

  it('adds the reassuring hint after 3 s', () => {
    const { container } = renderWaiting()
    act(() => vi.advanceTimersByTime(3_500))
    expect(container.querySelector('.contact-handshake__waiting')!.textContent)
      .toContain('Einen Moment bitte')
  })

  it('offers a retry button after 10 s that re-triggers onEnable', () => {
    const { container, onEnable } = renderWaiting()
    act(() => vi.advanceTimersByTime(10_500))
    const retry = container.querySelector<HTMLButtonElement>('[data-testid="contact-handshake-retry"]')!
    expect(retry).toBeTruthy()
    fireEvent.click(retry)
    expect(onEnable).toHaveBeenCalled()
  })

  it('keeps the retry button available in the timeout state (no dead end)', () => {
    const { container } = renderWaiting()
    act(() => vi.advanceTimersByTime(31_000))
    const waiting = container.querySelector('.contact-handshake__waiting')!
    expect(waiting.textContent).toContain('länger als gewöhnlich')
    expect(waiting.textContent).not.toContain('Einen Moment bitte')
    expect(container.querySelector('[data-testid="contact-handshake-retry"]')).toBeTruthy()
  })
})
