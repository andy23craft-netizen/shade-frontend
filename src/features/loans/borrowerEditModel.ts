export interface BorrowerEditErrors {
    borrower?: string
}

export function validateBorrower(
    borrower: string,
): BorrowerEditErrors {
    if (borrower.trim() === '') {
        return {
            borrower: 'Enter a borrower name.',
        }
    }

    if (borrower.length > 255) {
        return {
            borrower: 'Borrower must be 255 characters or fewer.',
        }
    }

    return {}
}
