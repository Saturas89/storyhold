import { describe, it, expect } from 'vitest'
import { pathToView } from './useNavigation'

describe('pathToView', () => {
  it('maps /impressum to the impressum view returning to home', () => {
    // The standalone LP marketing pages link to /impressum; it must resolve to
    // the Impressum view and not silently fall through to home.
    expect(pathToView('/impressum')).toEqual({ name: 'impressum', from: 'home' })
  })

  it('maps the known top-level routes', () => {
    expect(pathToView('/friends')).toEqual({ name: 'friends' })
    expect(pathToView('/archive')).toEqual({ name: 'archive' })
    expect(pathToView('/profile')).toEqual({ name: 'profile' })
    expect(pathToView('/landing')).toEqual({ name: 'landing' })
  })

  it('falls back to home for the root and unknown paths', () => {
    expect(pathToView('/')).toEqual({ name: 'home' })
    expect(pathToView('/totally-unknown')).toEqual({ name: 'home' })
  })
})
