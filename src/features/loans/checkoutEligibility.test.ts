import {
    describe,
    expect,
    it,
} from 'vitest'

import type { BookRead } from '../../api/apiTypes'
import { isCheckoutEligible } from './checkoutEligibility'

const availableBook = {
    id: 'book-1',
    status: 'available',
    deletion_date: null,
} as BookRead

describe('isCheckoutEligible', () => {
    it('allows an active available book', () => {
        expect(
            isCheckoutEligible(availableBook),
        ).toBe(true)
    })

    it('rejects a deleted available book', () => {
        expect(
            isCheckoutEligible({
                ...availableBook,
                deletion_date:
                    '2026-08-19T12:00:00Z',
            }),
        ).toBe(false)
    })

    it('rejects an on-loan book', () => {
        expect(
            isCheckoutEligible({
                ...availableBook,
                status: 'on_loan',
            }),
        ).toBe(false)
    })

    it('rejects a display-only book', () => {
        expect(
            isCheckoutEligible({
                ...availableBook,
                status: 'display_only',
            }),
        ).toBe(false)
    })
})
