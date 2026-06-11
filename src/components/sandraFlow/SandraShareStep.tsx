import { useState, useEffect } from 'react'
import type { SandraFlowStrings } from '../../locales/types'
import type { ComposedQuestion, SandraAnchor } from '../../types/sandraFlow'

function pronounForRelation(relation: string): string {
  return relation === 'papa' || relation === 'opa' ? 'er' : 'sie'
}

interface Props {
  t: SandraFlowStrings
  anchor: SandraAnchor
  questions: ComposedQuestion[]
  preferSimpleMode: boolean
  onTogglePreferSimpleMode: (next: boolean) => void
  /**
   * Async function that creates the invite in Supabase and returns the short
   * URL. Called on mount; result is cached so the share button can fire
   * navigator.share() synchronously when clicked.
   * Pass null when online sharing is not ready yet (identity still bootstrapping).
   */
  onShare: (() => Promise<string>) | null
  /** True when online sharing is configured but the user hasn't enabled it. */
  onlineSharingEnabled: boolean
  /** Called when the user taps "Activate online sharing" from this step. */
  onEnableOnlineSharing: () => void
  onBack: () => void
  /** Called once the link has left the device (share-sheet completed or link
   *  copied). Clears the persisted draft so a reload can't re-send the same
   *  questions — the in-memory draft stays alive for the success screen. */
  onShared: () => void
  /** Called from the success screen's "Done" button: resets the draft and
   *  exits the flow. */
  onClearDraft: () => void
}

export function SandraShareStep({
  t,
  anchor,
  questions,
  preferSimpleMode,
  onTogglePreferSimpleMode,
  onShare,
  onlineSharingEnabled,
  onEnableOnlineSharing,
  onBack,
  onShared,
  onClearDraft,
}: Props) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState(false)
  // 'compose' = preview + CTA; 'sent' = success screen after the link left
  // the device. The success screen replaces the old silent exit-to-home so
  // Sandra gets confirmation and learns what happens next (#invite-ux).
  const [phase, setPhase] = useState<'compose' | 'sent'>('compose')
  const [sentVia, setSentVia] = useState<'share' | 'copy'>('share')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const [isSharing, setIsSharing] = useState(false)

  // Pre-generate the invite URL as soon as onShare becomes available.
  useEffect(() => {
    if (!onShare) {
      setShareUrl(null)
      setUrlLoading(false)
      setUrlError(false)
      return
    }
    setUrlLoading(true)
    setUrlError(false)
    setShareUrl(null)
    onShare()
      .then(url => setShareUrl(url))
      .catch(() => setUrlError(true))
      .finally(() => setUrlLoading(false))
  }, [onShare])

  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 3500)
    return () => clearTimeout(timer)
  }, [copyState])

  const hasRelationship = questions.some(q => q.group === 'relationship')

  function enterSent(via: 'share' | 'copy') {
    setSentVia(via)
    setPhase('sent')
    onShared()
  }

  /** Copy the invite URL. `advance` moves to the success screen on success
   *  (compose phase); without it we only flash inline feedback (re-copy on
   *  the success screen). */
  function copyToClipboard(url: string, advance: boolean) {
    if (!navigator.clipboard) {
      setCopyState('error')
      setIsSharing(false)
      return
    }
    navigator.clipboard
      .writeText(url)
      .then(() => (advance ? enterSent('copy') : setCopyState('copied')))
      .catch(() => setCopyState('error'))
      .finally(() => setIsSharing(false))
  }

  function handleShare() {
    if (isSharing || !shareUrl) return
    setIsSharing(true)
    const title = t.share.shareTitle.replace('{anrede}', anchor.anrede)
    const text = t.share.shareMessage

    if (typeof navigator.share === 'function') {
      navigator
        .share({ title, text, url: shareUrl })
        .then(() => {
          setIsSharing(false)
          enterSent('share')
        })
        .catch(err => {
          setIsSharing(false)
          if ((err as Error).name === 'AbortError') return
          copyToClipboard(shareUrl, true)
        })
    } else {
      copyToClipboard(shareUrl, true)
    }
  }

  function handleRetry() {
    if (!onShare) return
    setUrlError(false)
    setUrlLoading(true)
    onShare()
      .then(url => setShareUrl(url))
      .catch(() => setUrlError(true))
      .finally(() => setUrlLoading(false))
  }

  const sub = (s: string) => s.split('{anrede}').join(anchor.anrede)

  // ── Success screen: the link left the device ──────────────────────
  if (phase === 'sent') {
    return (
      <div className="sandra-flow-view">
        <section className="friends-section sandra-share" data-testid="sandra-share-sent">
          <h2 className="friends-section-title">
            {sub(sentVia === 'share' ? t.share.sentTitleShare : t.share.sentTitleCopy)}
          </h2>

          {sentVia === 'copy' && (
            <p className="friends-hint">{sub(t.share.sentCopyHint)}</p>
          )}

          <p className="friends-hint">{sub(t.share.sentNextSteps)}</p>

          {copyState === 'error' && (
            <p className="friends-hint friends-hint--warn">{t.share.copyError}</p>
          )}

          <div className="friends-share">
            <button
              type="button"
              className="share-cta-btn"
              onClick={onClearDraft}
              data-testid="sandra-share-done"
            >
              {t.share.done}
            </button>
          </div>

          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => shareUrl && copyToClipboard(shareUrl, false)}
            data-testid="sandra-share-copy-again"
          >
            {copyState === 'copied' ? t.share.copied : t.share.copyAgain}
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="sandra-flow-view">
      <div className="quiz-topbar">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>
          {t.share.backToList}
        </button>
      </div>

      <section className="friends-section sandra-share">
        <h2 className="friends-section-title">
          {t.share.title
            .replace('{anrede}', anchor.anrede)
            .replace('{count}', String(questions.length))}
        </h2>

        {hasRelationship && (
          <p className="friends-hint">
            {t.share.relationshipHint.replace('{anrede}', anchor.anrede)}
          </p>
        )}

        <div className="sandra-share__preview" data-testid="sandra-share-preview">
          <p className="sandra-share__preview-heading">
            {t.share.recipientPreviewHeading
              .replace('{anrede}', anchor.anrede)
              .replace('{pronoun}', pronounForRelation(anchor.relation))}
          </p>
          <ul className="sandra-share__preview-list">
            {t.share.recipientPreviewLines.map((line, i) => (
              <li key={i} className="sandra-share__preview-line">
                {line.split('{anrede}').join(anchor.anrede)}
              </li>
            ))}
          </ul>
        </div>

        <label
          className="sandra-share__simple-toggle"
          data-testid="sandra-share-prefer-simple"
        >
          <input
            type="checkbox"
            checked={preferSimpleMode}
            onChange={e => onTogglePreferSimpleMode(e.target.checked)}
          />
          <span>
            <strong>
              {t.share.preferSimpleModeLabel.replace('{anrede}', anchor.anrede)}
            </strong>
            <span className="sandra-share__simple-toggle-hint">
              {t.share.preferSimpleModeHint.split('{anrede}').join(anchor.anrede)}
            </span>
          </span>
        </label>

        <div className="friends-share">
          {!onlineSharingEnabled && (
            <>
              <p className="friends-hint">{t.share.connectingHint}</p>
              <button className="share-cta-btn" onClick={onEnableOnlineSharing}>
                {t.share.activateOnlineSharingCta}
              </button>
            </>
          )}

          {onlineSharingEnabled && urlError && (
            <>
              <p className="friends-hint friends-hint--warn">{t.share.inviteError}</p>
              <button type="button" className="share-cta-btn" onClick={handleRetry}>
                {t.share.retryInvite}
              </button>
            </>
          )}

          {onlineSharingEnabled && !urlError && (
            <button
              type="button"
              className="share-cta-btn"
              onClick={handleShare}
              disabled={isSharing || urlLoading || !shareUrl}
              data-testid="sandra-share-cta"
            >
              {(isSharing || urlLoading) && <span className="share-cta-btn__spinner" aria-hidden="true" />}
              {urlLoading
                ? t.share.generatingInvite
                : isSharing
                ? t.share.sending
                : t.share.primaryCta.replace('{anrede}', anchor.anrede)}
            </button>
          )}
        </div>

        {onlineSharingEnabled && !urlError && (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => shareUrl && copyToClipboard(shareUrl, true)}
            disabled={urlLoading || !shareUrl}
            data-testid="sandra-share-copy"
          >
            {copyState === 'error' ? t.share.error : t.share.copyCta}
          </button>
        )}

        {copyState === 'error' && (
          <p className="friends-hint friends-hint--warn">{t.share.copyError}</p>
        )}

        <p className="friends-hint">
          {t.share.privacyHint.split('{anrede}').join(anchor.anrede)}
        </p>
      </section>
    </div>
  )
}
