import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    pickBookCreate,
    pickCheckoutRequest,
    pickDocumentedRequestFields,
    pickMarkReadRequest,
} from './requestFields'
import type {
    BookCreate,
    CheckoutRequest,
    MarkReadRequest,
} from './apiTypes'

describe('requestFields', () => {
    it('keeps only documented keys', () => {
        const picked = pickDocumentedRequestFields(
            {
                title: 'Title',
                authors: 'Author',
                mystery: 'drop-me',
            } as BookCreate & {
                mystery: string
            },
            [
                'title',
                'authors',
            ],
        )

        expect(picked).toEqual({
            title: 'Title',
            authors: 'Author',
        })
        expect(picked).not.toHaveProperty(
            'mystery',
        )
    })

    it('drops BookRead-only fields from create payloads', () => {
        expect(
            pickBookCreate({
                title: 'Title',
                authors: 'Author',
                category: 'unknown',
                shelf: 'unknown',
                id: 'book-1',
                updated_date:
                    '2026-08-01T00:00:00Z',
            } as BookCreate & {
                id: string
                updated_date: string
            }),
        ).toEqual({
            title: 'Title',
            authors: 'Author',
            category: 'unknown',
            shelf: 'unknown',
        })
    })

    it('preserves empty mark-read bodies', () => {
        expect(
            pickMarkReadRequest(
                {} as MarkReadRequest,
            ),
        ).toEqual({})
    })

    it('keeps documented checkout fields only', () => {
        expect(
            pickCheckoutRequest({
                borrower: 'Pat',
                notes: 'Handle with care',
                extra: true,
            } as CheckoutRequest & {
                extra: boolean
            }),
        ).toEqual({
            borrower: 'Pat',
            notes: 'Handle with care',
        })
    })
})
