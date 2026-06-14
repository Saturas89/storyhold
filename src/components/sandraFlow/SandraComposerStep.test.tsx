import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { SandraComposerStep } from './SandraComposerStep'
import { getVariants } from '../../lib/sandraFlow/variants'
import { SANDRA_FLOW_DE } from '../../locales/de/sandraFlow'
import { SANDRA_FLOW_EN } from '../../locales/en/sandraFlow'
import type { SandraAnchor } from '../../types/sandraFlow'

// ─────────────────────────────────────────────────────────────────────────────
// SandraComposerStep – Screen 4 of Sandra-Flow.
//
// Contract (post seed-removal redesign):
//   props: { t, locale, anchor, triggerId, onChangeTrigger, onDiscard, onAdd }
//   Draft textarea: data-testid="sandra-composer-draft"
//   Add CTA:        data-testid="sandra-composer-add"
//   Variant pills:  data-testid="sandra-variant-{i}"
//   Trigger chip:   data-testid="sandra-composer-trigger-chip"
//
// SPEC contract (FR-020.4 / FR-020.5):
//   - Draft is pre-filled with the trigger's best phrasing (withoutSeed
//     variant or first curated example) → zero-typing path is two taps
//   - Variant list merges template variants + inspiration examples (deduped,
//     examples get the anrede prefix); tapping one replaces the draft only
//   - Freeform trigger starts with an empty draft and no variant list;
//     "Frage übernehmen" on an empty draft shows an error instead of adding
// ─────────────────────────────────────────────────────────────────────────────

afterEach(cleanup)

const ANCHOR: SandraAnchor = { relation: 'mama', anrede: 'Mama' }

function makeProps(
  overrides: Partial<React.ComponentProps<typeof SandraComposerStep>> = {},
): React.ComponentProps<typeof SandraComposerStep> {
  return {
    t: SANDRA_FLOW_DE,
    locale: 'de',
    anchor: ANCHOR,
    triggerId: 'never-dared-to-ask',
    onChangeTrigger: vi.fn(),
    onDiscard: vi.fn(),
    onAdd: vi.fn(),
    ...overrides,
  }
}

describe('SandraComposerStep – pre-filled draft', () => {
  it('pre-fills the draft with the withoutSeed variant of the trigger', () => {
    const { getByTestId } = render(<SandraComposerStep {...makeProps()} />)
    const draft = getByTestId('sandra-composer-draft') as HTMLTextAreaElement
    expect(draft.value).toBe(
      'Mama, gibt es etwas, was ich dich nie zu fragen gewagt habe – das du mir aber sagen würdest?',
    )
  })

  it('falls back to the first inspiration example (anrede-prefixed) when the trigger has no withoutSeed variant', () => {
    const { getByTestId } = render(
      <SandraComposerStep {...makeProps({ triggerId: 'time-rarely-spoken-of' })} />,
    )
    const draft = getByTestId('sandra-composer-draft') as HTMLTextAreaElement
    expect(draft.value).toBe('Mama, wie war es wirklich, als Oma starb?')
  })

  it('adds the pre-filled draft via the CTA – the two-tap path', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<SandraComposerStep {...makeProps({ onAdd })} />)
    fireEvent.click(getByTestId('sandra-composer-add'))
    expect(onAdd).toHaveBeenCalledWith(
      'Mama, gibt es etwas, was ich dich nie zu fragen gewagt habe – das du mir aber sagen würdest?',
    )
  })
})

describe('SandraComposerStep – variant list', () => {
  it('tapping a variant replaces the draft but does NOT add a question', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<SandraComposerStep {...makeProps({ onAdd })} />)
    const second = getByTestId('sandra-variant-1') as HTMLButtonElement
    fireEvent.click(second)
    const draft = getByTestId('sandra-composer-draft') as HTMLTextAreaElement
    expect(draft.value).toBe(second.textContent)
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('does not show the variant that matches the current draft', () => {
    // The draft is pre-filled with variants[0]; that text must not appear in
    // the rendered list – the textarea already shows it, showing it again
    // in the pill list was confusing (duplicate visual).
    const { getAllByTestId, getByTestId } = render(<SandraComposerStep {...makeProps()} />)
    const draftText = (getByTestId('sandra-composer-draft') as HTMLTextAreaElement).value
    const texts = getAllByTestId(/sandra-variant-\d+/).map(b => b.textContent?.trim())
    expect(texts).not.toContain(draftText)
  })

  it('de-duplicates phrasings that exist as template variant AND inspiration example', () => {
    // 'what-you-would-do-differently' carries „Was hättest du in der Erziehung
    // anders gemacht?" in both banks → getVariants must return it only once.
    // We test via getVariants() directly because the component now filters out
    // whichever variant matches the current draft from the rendered pill list.
    const variants = getVariants('de', 'what-you-would-do-differently', 'Mama')
    const target = 'Mama, was hättest du in der Erziehung anders gemacht?'
    expect(variants.filter(t => t === target)).toHaveLength(1)
  })

  it('edited draft is sent verbatim via the CTA', () => {
    const onAdd = vi.fn()
    const { getByTestId } = render(<SandraComposerStep {...makeProps({ onAdd })} />)
    fireEvent.change(getByTestId('sandra-composer-draft'), {
      target: { value: 'Mama, meine eigene Frage?' },
    })
    fireEvent.click(getByTestId('sandra-composer-add'))
    expect(onAdd).toHaveBeenCalledWith('Mama, meine eigene Frage?')
  })
})

describe('SandraComposerStep – freeform trigger', () => {
  it('starts with an empty draft and no variant list', () => {
    const { getByTestId, queryByTestId } = render(
      <SandraComposerStep {...makeProps({ triggerId: 'freeform' })} />,
    )
    expect((getByTestId('sandra-composer-draft') as HTMLTextAreaElement).value).toBe('')
    expect(queryByTestId('sandra-variant-0')).toBeNull()
  })

  it('shows the empty error instead of adding when the draft is blank', () => {
    const onAdd = vi.fn()
    const { getByTestId, getByText } = render(
      <SandraComposerStep {...makeProps({ triggerId: 'freeform', onAdd })} />,
    )
    fireEvent.click(getByTestId('sandra-composer-add'))
    expect(onAdd).not.toHaveBeenCalled()
    expect(getByText(SANDRA_FLOW_DE.composer.addEmptyError)).toBeTruthy()
  })
})

describe('SandraComposerStep – EN locale', () => {
  it('pre-fills an English phrasing without German fillers', () => {
    const { getByTestId } = render(
      <SandraComposerStep
        {...makeProps({
          t: SANDRA_FLOW_EN,
          locale: 'en',
          anchor: { relation: 'mama', anrede: 'Mom' },
          triggerId: 'time-rarely-spoken-of',
        })}
      />,
    )
    const draft = (getByTestId('sandra-composer-draft') as HTMLTextAreaElement).value
    expect(draft.length).toBeGreaterThan(0)
    expect(draft.startsWith('Mom, ')).toBe(true)
    expect(draft.toLowerCase()).not.toMatch(/\bhast du\b/)
  })
})
