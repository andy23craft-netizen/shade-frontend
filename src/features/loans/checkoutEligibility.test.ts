import {
    describe,
    expect,
    it,
} from 'vitest'

import type { BookRead } from '../../api/apiTypes'
import { isCheckoutEligible } from './checkoutEligibility'

const availableBook = {
    book_id: 'book-1',
    status: 'available',
} as BookRead

describe('isCheckoutEligible', () => {
    it('allows an active available book', () => {
        expect(
            isCheckoutEligible(availableBook),
        ).toBe(true)
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
