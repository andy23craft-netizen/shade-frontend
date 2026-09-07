import { resolveLibraryContext } from '../config/libraryContext'
import { getLibraryIdentity } from '../config/libraryIdentity'

export interface LibraryWordmarkProps {
    className?: string
}

export function LibraryWordmark({ className }: LibraryWordmarkProps) {
    const context = resolveLibraryContext(window.location.hostname)
    const identity = getLibraryIdentity(context?.id)

    return <p className={className}>{identity.wordmark}</p>
}
