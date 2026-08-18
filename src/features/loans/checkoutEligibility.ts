import type { BookRead } from '../../api/apiTypes'

export function isCheckoutEligible(
    book: BookRead,
): boolean {
    return (
        book.deletion_date === null &&
        book.status === 'available'
    )
}
