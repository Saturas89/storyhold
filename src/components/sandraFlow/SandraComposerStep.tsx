import { useState, useMemo, useEffect } from 'react'
import type { SandraFlowStrings } from '../../locales/types'
import type { Locale } from '../../locales'
import type { SandraAnchor } from '../../types/sandraFlow'
import { findTrigger } from '../../data/loadPersonalQuestions'
import { getVariants } from '../../lib/sandraFlow/variants'

interface Props {
  t: SandraFlowStrings
  locale: Locale
  anchor: SandraAnchor
  triggerId: string
  onChangeTrigger: () => void
  onDiscard: () => void
  onAdd: (text: string) => void
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

  // All ready-made phrasings for this trigger (empty for freeform).
  const variants = useMemo(
    () => getVariants(locale, triggerId, anchor.anrede),
    [locale, triggerId, anchor.anrede],
  )

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
