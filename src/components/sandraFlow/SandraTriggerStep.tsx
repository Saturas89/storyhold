import type { SandraFlowStrings } from '../../locales/types'
import type { Locale } from '../../locales'
import type { TriggerDef } from '../../types/sandraFlow'
import { getPersonalQuestionTriggers } from '../../data/loadPersonalQuestions'
import { getVariants } from '../../lib/sandraFlow/variants'

interface Props {
  t: SandraFlowStrings
  locale: Locale
  anrede: string
  onBack: () => void
  onPick: (triggerId: string) => void
  onPickFreeform: () => void
}

export function SandraTriggerStep({ t, locale, anrede, onBack, onPick, onPickFreeform }: Props) {
  const triggers = getPersonalQuestionTriggers(locale)
  const biography = triggers.filter(tr => tr.group === 'biography')
  const relationship = triggers.filter(tr => tr.group === 'relationship')
  const renderTitle = (title: string) => title.replace('{anrede}', anrede)

  // Each card previews the phrasing the composer will pre-fill, so Sandra
  // knows what awaits behind a topic before she taps it.
  const renderCard = (tr: TriggerDef, accent: boolean) => {
    const preview = getVariants(locale, tr.id, anrede)[0]
    return (
      <button
        key={tr.id}
        type="button"
        className={`family-card sandra-trigger-card${accent ? ' sandra-trigger-card--accent' : ''}`}
        onClick={() => onPick(tr.id)}
        data-testid={`sandra-trigger-${tr.id}`}
      >
        <span className="sandra-trigger-card__main">
          <span className="sandra-trigger-card__title">{renderTitle(tr.title)}</span>
          {preview && <span className="sandra-trigger-card__preview">{preview}</span>}
        </span>
        <span className="sandra-trigger-card__chevron" aria-hidden="true">
          ›
        </span>
      </button>
    )
  }

  return (
    <div className="sandra-flow-view">
      <div className="quiz-topbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          {t.back}
        </button>
      </div>

      <section className="friends-section">
        <h2 className="friends-section-title">
          {t.trigger.title.replace('{anrede}', anrede)}
        </h2>
        <p className="friends-hint">{t.trigger.subline}</p>
      </section>

      <section className="friends-section">
        <h3 className="friends-section-title">
          {t.trigger.sectionAboutThem.replace('{anrede}', anrede)}
        </h3>
        <div className="friends-list">{biography.map(tr => renderCard(tr, false))}</div>
      </section>

      <section className="friends-section sandra-section--accent">
        <h3 className="friends-section-title">
          <span aria-hidden="true">{t.trigger.sectionAboutUsHeart} </span>
          {t.trigger.sectionAboutUs}
        </h3>
        <p className="friends-hint">{t.trigger.sectionAboutUsHint}</p>
        <div className="friends-list">{relationship.map(tr => renderCard(tr, true))}</div>
      </section>

      <section className="friends-section">
        <button
          type="button"
          className="family-card sandra-trigger-card"
          onClick={onPickFreeform}
          data-testid="sandra-trigger-freeform"
        >
          <span className="sandra-trigger-card__main">
            <span className="sandra-trigger-card__title">{t.trigger.typeMyOwn}</span>
            <span className="sandra-trigger-card__preview">{t.trigger.typeMyOwnHint}</span>
          </span>
          <span className="sandra-trigger-card__chevron" aria-hidden="true">
            ›
          </span>
        </button>
      </section>
    </div>
  )
}
