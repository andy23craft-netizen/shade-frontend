import type {
    BookRead,
    LoanRead,
} from '../../api/apiTypes'

export function findActiveLoan(
    bookId: string,
    loans: readonly LoanRead[],
): LoanRead | undefined {
    return loans.find(
        (loan) =>
            loan.book_id === bookId &&
            loan.returned_at === null,
    )
}

export function isCheckinEligible(
    book: BookRead,
    loans: readonly LoanRead[],
): boolean {
    return findActiveLoan(book.book_id, loans) !== undefined
}
