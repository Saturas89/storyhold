// Shared phrasing helpers for the Sandra-flow composer and trigger screens.
//
// `getVariants` merges the two phrasing banks of a trigger into one flat,
// de-duplicated list:
//   1. template variants that render without a seed (`withoutSeed`)
//   2. curated inspiration examples, prefixed with the anrede
//
// The first entry is the "best" phrasing – the composer pre-fills its draft
// with it and the trigger cards show it as a preview, so both screens stay
// consistent by construction.

import type { Locale } from '../../locales'
import { findTrigger, getInspirationQuestions } from '../../data/loadPersonalQuestions'
import { composeAll } from './templateEngine'

/** Prefix a curated example with the anrede so it reads as one sentence
 *  ("Mama, wie war es wirklich …"). The first letter is lowercased because
 *  the example continues the sentence after the vocative comma. */
export function withAnrede(anrede: string, question: string): string {
  return `${anrede}, ${question.charAt(0).toLowerCase()}${question.slice(1)}`
}

/** All ready-made phrasings for a trigger. Empty for freeform/unknown ids. */
export function getVariants(locale: Locale, triggerId: string, anrede: string): string[] {
  const trigger = findTrigger(locale, triggerId)
  if (!trigger || triggerId === 'freeform') return []
  const fromTemplates = composeAll(trigger.templates, anrede, undefined).map(s => s.text)
  const fromInspiration = getInspirationQuestions(locale, triggerId).map(q =>
    withAnrede(anrede, q),
  )
  const seen = new Set<string>()
  return [...fromTemplates, ...fromInspiration].filter(v => {
    const key = v.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
