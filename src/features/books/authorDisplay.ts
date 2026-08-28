interface AuthorNameParts {
    first_name?: string | null
    surname: string
}

export function formatAuthorName(
    author: AuthorNameParts,
): string {
    return [
        author.first_name,
        author.surname,
    ]
        .filter(
            (part): part is string =>
                typeof part === 'string' &&
                part.trim() !== '',
        )
        .map((part) => part.trim())
        .join(' ')
}

export function formatBookAuthors(
    authors:
        | readonly AuthorNameParts[]
        | null
        | undefined,
): string {
    if (!authors || authors.length === 0) {
        return 'Unknown author'
    }

    return authors
        .map(formatAuthorName)
        .filter(Boolean)
        .join(', ')
}
