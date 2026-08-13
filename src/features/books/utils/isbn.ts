function normalizeIsbn(value: string): string {
    return value.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidIsbn10(
    value: string,
): boolean {
    const isbn = normalizeIsbn(value)

    if (!/^\d{9}[\dX]$/.test(isbn)) {
        return false
    }

    let sum = 0

    for (let i = 0; i < 10; i += 1) {
        const digit =
            isbn[i] === 'X'
                ? 10
                : Number(isbn[i])

        sum += digit * (10 - i)
    }

    return sum % 11 === 0
}

export function isValidIsbn13(
    value: string,
): boolean {
    const isbn = normalizeIsbn(value)

    if (!/^\d{13}$/.test(isbn)) {
        return false
    }

    let sum = 0

    for (let i = 0; i < 13; i += 1) {
        const digit = Number(isbn[i])

        sum +=
            digit * (i % 2 === 0 ? 1 : 3)
    }

    return sum % 10 === 0
}

export function isValidIsbn(
    value: string,
): boolean {
    return (
        isValidIsbn10(value) ||
        isValidIsbn13(value)
    )
}
