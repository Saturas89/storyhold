import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { SandraTriggerStep } from './SandraTriggerStep'
import { SANDRA_FLOW_DE } from '../../locales/de/sandraFlow'
import { SANDRA_FLOW_EN } from '../../locales/en/sandraFlow'
import { getVariants } from '../../lib/sandraFlow/variants'

// ─────────────────────────────────────────────────────────────────────────────
// SandraTriggerStep – Screen 3 of Sandra-Flow.
//
// Contract (post composer redesign):
//   Trigger cards:  data-testid="sandra-trigger-{id}"
//   Freeform card:  data-testid="sandra-trigger-freeform"
//
// Each card previews the phrasing the composer will pre-fill (the first
// entry of `getVariants`), so the trigger screen and the composer stay
// consistent by construction.
// ─────────────────────────────────────────────────────────────────────────────

afterEach(cleanup)

function makeProps(
  overrides: Partial<React.ComponentProps<typeof SandraTriggerStep>> = {},
): React.ComponentProps<typeof SandraTriggerStep> {
  return {
    t: SANDRA_FLOW_DE,
    locale: 'de',
    anrede: 'Mama',
    onBack: vi.fn(),
    onPick: vi.fn(),
    onPickFreeform: vi.fn(),
    ...overrides,
  }
}

describe('SandraTriggerStep – card previews', () => {
  it('shows the composer pre-fill phrasing as preview on each trigger card', () => {
    const { getByTestId } = render(<SandraTriggerStep {...makeProps()} />)
    const card = getByTestId('sandra-trigger-never-dared-to-ask')
    const expected = getVariants('de', 'never-dared-to-ask', 'Mama')[0]
    expect(expected).toBeTruthy()
    expect(card.textContent).toContain(expected)
  })

  it('substitutes the anrede in title and preview', () => {
    const { getByTestId } = render(<SandraTriggerStep {...makeProps({ anrede: 'Omi' })} />)
    const card = getByTestId('sandra-trigger-time-rarely-spoken-of')
    expect(card.textContent).toContain('Zeit, von der Omi selten spricht')
    expect(card.textContent).toContain('Omi, wie war es wirklich, als Oma starb?')
  })

  it('clicking a trigger card calls onPick with the trigger id', () => {
    const onPick = vi.fn()
    const { getByTestId } = render(<SandraTriggerStep {...makeProps({ onPick })} />)
    fireEvent.click(getByTestId('sandra-trigger-before-i-was-born'))
    expect(onPick).toHaveBeenCalledWith('before-i-was-born')
  })
})

describe('SandraTriggerStep – freeform card', () => {
  it('renders the freeform option as a card with hint and calls onPickFreeform', () => {
    const onPickFreeform = vi.fn()
    const { getByTestId } = render(<SandraTriggerStep {...makeProps({ onPickFreeform })} />)
    const card = getByTestId('sandra-trigger-freeform')
    expect(card.textContent).toContain(SANDRA_FLOW_DE.trigger.typeMyOwn)
    expect(card.textContent).toContain(SANDRA_FLOW_DE.trigger.typeMyOwnHint)
    fireEvent.click(card)
    expect(onPickFreeform).toHaveBeenCalled()
  })
})

describe('SandraTriggerStep – screen lead', () => {
  it('renders the screen title with anrede and the subline', () => {
    const { getByText } = render(<SandraTriggerStep {...makeProps()} />)
    expect(getByText('Worüber möchtest du Mama fragen?')).toBeTruthy()
    expect(getByText(SANDRA_FLOW_DE.trigger.subline)).toBeTruthy()
  })

  it('renders English previews in EN locale', () => {
    const { getByTestId } = render(
      <SandraTriggerStep {...makeProps({ t: SANDRA_FLOW_EN, locale: 'en', anrede: 'Mom' })} />,
    )
    const card = getByTestId('sandra-trigger-time-rarely-spoken-of')
    expect(card.textContent).toContain('Mom, what was it really like when Grandma died?')
  })
})
