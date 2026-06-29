'use client'

/**
 * usePreferences — the user's onboarding answers. A richer profile than a simple
 * setting: their goal, how they feel about politics, voting status, the issues
 * they care about (and which matter most), their comfort level, and how they
 * like to learn. Stored in localStorage for now (works without an account);
 * will sync to the account alongside the AI companion phase.
 *
 * Every field personalises the *experience* — none of it produces a voting
 * recommendation. Non-partisan by design.
 */

import { useCallback, useEffect, useState } from 'react'
import type { PolicyTopic } from '@/types'

export type Goal = 'decide-vote' | 'understand' | 'accountability' | 'help-others' | 'curious'
export type Mood = 'overwhelmed' | 'sceptical' | 'curious' | 'engaged'
export type VotingStatus = 'never' | 'first-2026' | 'sometimes' | 'always'
export type ComfortLevel = 'beginner' | 'intermediate' | 'expert'
export type LearnStyle = 'quick' | 'deep' | 'visual' | 'bitesize'

export interface Preferences {
  goals: Goal[]
  mood: Mood | null
  votingStatus: VotingStatus | null
  issues: PolicyTopic[]
  topIssues: PolicyTopic[]   // ordered subset of issues — most important first
  level: ComfortLevel | null
  learnStyles: LearnStyle[]
  compass: Record<string, number>   // compass statement id → Likert value (-2..2)
  completed: boolean
}

const EMPTY: Preferences = {
  goals: [],
  mood: null,
  votingStatus: null,
  issues: [],
  topIssues: [],
  level: null,
  learnStyles: [],
  compass: {},
  completed: false,
}

const STORAGE_KEY = 'aratika_prefs_v2'

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(EMPTY)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefs({ ...EMPTY, ...JSON.parse(raw) })
    } catch { /* ignore */ }
    setLoaded(true)
  }, [])

  const save = useCallback((next: Preferences) => {
    setPrefs(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const reset = useCallback(() => {
    setPrefs(EMPTY)
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  return { prefs, loaded, save, reset, EMPTY }
}
