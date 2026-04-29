// @ts-nocheck
/**
 * Unit tests for `normalizeErrorMessage` (FE bug 058 — "[object Object]" fix).
 *
 * Runner: Vitest. Test deps (vitest, @testing-library/*) are not yet wired
 * into OIO-FE/package.json (see existing tests under src/**\/__tests__/* —
 * they all carry `@ts-nocheck` for the same reason). Drop the `@ts-nocheck`
 * when the harness is set up.
 *
 * Contract under test:
 *   - Plain string input is returned as-is (after trim guard).
 *   - Error instance returns its `.message`.
 *   - ProblemDetails priority: detail → message → title.
 *   - Validation dict / array → first non-empty message.
 *   - SignalR ErrorNotification `{ code, message, errors }` → message.
 *   - Arbitrary object → fallback (NEVER "[object Object]").
 *   - null / undefined / empty / whitespace-only → fallback.
 */

import { describe, it, expect } from 'vitest'
import axios from 'axios'
import { normalizeErrorMessage } from '../errorNormalizer'

const FALLBACK = 'Fallback message'

describe('normalizeErrorMessage', () => {
  it('returns plain string input unchanged', () => {
    expect(normalizeErrorMessage('Boom', FALLBACK)).toBe('Boom')
  })

  it('returns Error.message for Error instances', () => {
    expect(normalizeErrorMessage(new Error('exploded'), FALLBACK)).toBe('exploded')
  })

  it('returns fallback for Error with empty message', () => {
    expect(normalizeErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK)
  })

  it('extracts ProblemDetails detail (highest priority)', () => {
    const input = { detail: 'detail msg', message: 'msg', title: 'title' }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('detail msg')
  })

  it('falls through to message when detail missing', () => {
    const input = { message: 'msg', title: 'title' }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('msg')
  })

  it('falls through to title when only title present', () => {
    const input = { title: 'title only' }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('title only')
  })

  it('extracts SignalR ErrorNotification message', () => {
    const input = {
      code: 'Auction.InvalidStatus',
      message: 'Auction is no longer available for bidding',
      errors: null,
    }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe(
      'Auction is no longer available for bidding',
    )
  })

  it('extracts first message from validation dictionary errors', () => {
    const input = {
      errors: {
        amount: ['Amount must be positive', 'Amount too small'],
        currency: ['Invalid currency'],
      },
    }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('Amount must be positive')
  })

  it('extracts first message from validation errors array', () => {
    const input = { errors: ['first error', 'second error'] }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('first error')
  })

  it('skips empty/whitespace strings in validation dict', () => {
    const input = {
      errors: {
        a: ['  ', ''],
        b: ['real message'],
      },
    }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe('real message')
  })

  it('returns fallback for arbitrary object — NEVER "[object Object]"', () => {
    const input = { foo: 'bar', nested: { other: true } }
    const result = normalizeErrorMessage(input, FALLBACK)
    expect(result).toBe(FALLBACK)
    expect(result).not.toBe('[object Object]')
  })

  it('returns fallback for null', () => {
    expect(normalizeErrorMessage(null, FALLBACK)).toBe(FALLBACK)
  })

  it('returns fallback for undefined', () => {
    expect(normalizeErrorMessage(undefined, FALLBACK)).toBe(FALLBACK)
  })

  it('returns fallback for empty string', () => {
    expect(normalizeErrorMessage('', FALLBACK)).toBe(FALLBACK)
  })

  it('returns fallback for whitespace-only string', () => {
    expect(normalizeErrorMessage('   ', FALLBACK)).toBe(FALLBACK)
  })

  it('extracts detail from Axios error response data', () => {
    const axiosErr = new axios.AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        config: {} as never,
        data: { detail: 'Validation failed', title: 'Bad Request' },
      },
    )
    expect(normalizeErrorMessage(axiosErr, FALLBACK)).toBe('Validation failed')
  })

  it('falls back to Axios message when response data has no usable field', () => {
    const axiosErr = new axios.AxiosError(
      'Network Error',
      'ERR_NETWORK',
      undefined,
      undefined,
      undefined,
    )
    expect(normalizeErrorMessage(axiosErr, FALLBACK)).toBe('Network Error')
  })

  it('handles ErrorNotification with both message and validation errors (prefers message)', () => {
    const input = {
      code: 'Validation',
      message: 'One or more validation errors occurred',
      errors: { amount: ['Required'] },
    }
    expect(normalizeErrorMessage(input, FALLBACK)).toBe(
      'One or more validation errors occurred',
    )
  })

  it('returns fallback for primitive number/boolean', () => {
    expect(normalizeErrorMessage(42, FALLBACK)).toBe(FALLBACK)
    expect(normalizeErrorMessage(true, FALLBACK)).toBe(FALLBACK)
  })
})
