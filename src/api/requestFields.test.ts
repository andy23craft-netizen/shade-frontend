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
    pickShelfCreate,
    pickShelfUpdate,
    pickWishlistBookCreate,
    pickWishlistCreate,
    pickWishlistUpdate,
} from './requestFields'
import type {
    BookCreate,
    CheckoutRequest,
    MarkReadRequest,
    ShelfCreate,
    ShelfUpdate,
    WishlistBookCreate,
    WishlistCreate,
    WishlistUpdate,
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
                shelf_name: 'unknown',
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
            shelf_name: 'unknown',
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

    it('keeps documented shelf create and update fields only', () => {
        expect(
            pickShelfCreate({
                common_name: 'a1',
                location: 'Office',
                mystery: true,
            } as ShelfCreate & {
                mystery: boolean
            }),
        ).toEqual({
            common_name: 'a1',
            location: 'Office',
        })

        expect(
            pickShelfUpdate({
                description: null,
                mystery: true,
            } as ShelfUpdate & {
                mystery: boolean
            }),
        ).toEqual({
            description: null,
        })
    })

    it('keeps documented wishlist create, update, and add-book fields only', () => {
        expect(
            pickWishlistCreate({
                name: 'TBR',
                description: 'Later',
                mystery: true,
            } as WishlistCreate & {
                mystery: boolean
            }),
        ).toEqual({
            name: 'TBR',
            description: 'Later',
        })

        expect(
            pickWishlistUpdate({
                name: 'Later',
                mystery: true,
            } as WishlistUpdate & {
                mystery: boolean
            }),
        ).toEqual({
            name: 'Later',
        })

        expect(
            pickWishlistBookCreate({
                book_id: 'book-1',
                status: 'wanted',
                mystery: true,
            } as WishlistBookCreate & {
                mystery: boolean
            }),
        ).toEqual({
            book_id: 'book-1',
            status: 'wanted',
        })
    })

    it('omits wishlist add-book keys that are not present on the payload', () => {
        expect(
            pickWishlistBookCreate({
                book_id: 'book-1',
            } as WishlistBookCreate),
        ).toEqual({
            book_id: 'book-1',
        })
    })
})
