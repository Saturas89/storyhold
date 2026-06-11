import { useState, useMemo, useEffect } from 'react'
import type { SandraFlowStrings } from '../../locales/types'
import type { Locale } from '../../locales'
import type { SandraAnchor } from '../../types/sandraFlow'
import { findTrigger, getInspirationQuestions } from '../../data/loadPersonalQuestions'
import { composeAll } from '../../lib/sandraFlow/templateEngine'

interface Props {
  t: SandraFlowStrings
  locale: Locale
  anchor: SandraAnchor
  triggerId: string
  onChangeTrigger: () => void
  onDiscard: () => void
  onAdd: (text: string) => void
}

/** Prefix a curated example with the anrede so it reads as one sentence
 *  ("Mama, wie war es wirklich …"). The first letter is lowercased because
 *  the example continues the sentence after the vocative comma. */
function withAnrede(anrede: string, question: string): string {
  return `${anrede}, ${question.charAt(0).toLowerCase()}${question.slice(1)}`
}

export function SandraComposerStep({
  t,
  locale,
  anchor,
  triggerId,
  onChangeTrigger,
  onDiscard,
  onAdd,
}: Props) {
  const trigger = useMemo(() => findTrigger(locale, triggerId), [locale, triggerId])
  const isFreeform = triggerId === 'freeform'

  // All ready-made phrasings for this trigger: template variants that render
  // without a seed, plus the curated inspiration examples. De-duplicated –
  // a few triggers carry the same question in both banks.
  const variants = useMemo(() => {
    if (!trigger || isFreeform) return []
    const fromTemplates = composeAll(trigger.templates, anchor.anrede, undefined).map(s => s.text)
    const fromInspiration = getInspirationQuestions(locale, triggerId).map(q =>
      withAnrede(anchor.anrede, q),
    )
    const seen = new Set<string>()
    return [...fromTemplates, ...fromInspiration].filter(v => {
      const key = v.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [trigger, isFreeform, anchor.anrede, locale, triggerId])

  // Single editable draft – pre-filled with the best phrasing so the
  // zero-typing path (pick topic → "Frage übernehmen") is two taps long.
  const [draftText, setDraftText] = useState(() => variants[0] ?? '')
  const [showEmptyError, setShowEmptyError] = useState(false)

  useEffect(() => {
    setDraftText(variants[0] ?? '')
    setShowEmptyError(false)
  }, [triggerId, variants])

  function handleAdd() {
    const text = draftText.trim()
    if (!text) {
      setShowEmptyError(true)
      return
    }
    onAdd(text)
  }

  function handlePickVariant(text: string) {
    setDraftText(text)
    setShowEmptyError(false)
  }

  return (
    <div className="sandra-flow-view">
      <div className="quiz-topbar">
        <button className="btn btn--ghost btn--sm" onClick={onDiscard}>
          {t.back}
        </button>
      </div>

      <section className="friends-section sandra-composer">
        {/* Header: active trigger chip, tap to switch topics */}
        <div className="sandra-composer__zone-a">
          <button
            type="button"
            className="friends-tag sandra-trigger-chip"
            onClick={onChangeTrigger}
            data-testid="sandra-composer-trigger-chip"
          >
            {(trigger?.title ?? t.composer.triggerChipLabel).replace('{anrede}', anchor.anrede)}
          </button>
        </div>

        {/* The question draft – the single source of truth on this screen */}
        <div className="sandra-composer__zone-b">
          <label className="input-label" htmlFor="sandra-draft-input">
            {t.composer.questionLabel.replace('{anrede}', anchor.anrede)}
          </label>
          <textarea
            id="sandra-draft-input"
            className="input-textarea sandra-composer__textarea"
            placeholder={t.composer.questionPlaceholder}
            value={draftText}
            onChange={e => {
              setDraftText(e.target.value)
              setShowEmptyError(false)
            }}
            rows={4}
            aria-describedby="sandra-draft-hint"
            data-testid="sandra-composer-draft"
          />
          <p id="sandra-draft-hint" className="friends-hint">
            {t.composer.questionHelper.replace('{anrede}', anchor.anrede)}
          </p>
        </div>

        {/* Alternative phrasings – tapping one replaces the draft above */}
        {variants.length > 0 && (
          <div className="sandra-composer__variants">
            <h3 className="friends-section-title">{t.composer.variantsTitle}</h3>
            <p className="friends-hint">{t.composer.variantsHint}</p>
            <ul className="sandra-variant-list">
              {variants.map((text, i) => (
                <li key={text}>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm sandra-variant"
                    aria-pressed={text === draftText}
                    onClick={() => handlePickVariant(text)}
                    data-testid={`sandra-variant-${i}`}
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="sandra-composer__footer">
          <button
            type="button"
            className="share-cta-btn sandra-composer__add"
            onClick={handleAdd}
            data-testid="sandra-composer-add"
          >
            {t.composer.addQuestion}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onDiscard}
            data-testid="sandra-composer-discard"
          >
            {t.composer.discard}
          </button>
        </div>
        {showEmptyError && (
          <p className="friends-hint friends-hint--warn">{t.composer.addEmptyError}</p>
        )}
      </section>
    </div>
  )
}
