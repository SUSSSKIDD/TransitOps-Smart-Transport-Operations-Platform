import { z } from 'zod'

/** Trims whitespace. minLen defaults to 1 (non-empty). */
export const trimmedString = (minLen = 1) =>
  z.string().trim().min(minLen, `Must be at least ${minLen} character(s)`)

/** Trims, lowercases, and validates as email. */
export const normalizedEmail = () =>
  z.string().trim().toLowerCase().email('Invalid email address')

/** Trims and uppercases — used for registration numbers. */
export const normalizedRegNum = () =>
  z.string().trim().toUpperCase().min(1, 'Registration number required')

/** Optional trimmed string — returns undefined if empty after trim. */
export const optionalTrimmedString = () =>
  z.string().trim().optional().transform(v => (v === '' ? undefined : v))
