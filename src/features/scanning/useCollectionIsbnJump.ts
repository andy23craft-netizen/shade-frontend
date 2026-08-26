import {
    useNavigate,
} from 'react-router-dom'
import { useRef } from 'react'

import { createBooksApi } from '../../api/booksApi'
import { useConnection } from '../connection/useConnection'
import {
    compactIsbnForListFilter,
} from '../books/utils/isbn'
import {
    useHardwareIsbnScanner,
} from './useHardwareIsbnScanner'

export function useCollectionIsbnJump(): void {
    const navigate = useNavigate()
    const {
        apiClient,
    } = useConnection()

    const isResolvingRef = useRef(false)

    useHardwareIsbnScanner({
        ignoreEditableTargets: true,
        preventDefaultWhenConsumed: true,
        onDetected: (isbn) => {
            if (isResolvingRef.current) {
                return
            }

            const compacted =
                compactIsbnForListFilter(isbn)

            if (!compacted) {
                return
            }

            isResolvingRef.current = true

            const booksApi =
                createBooksApi(apiClient)

            void booksApi
                .list({
                    isbn: compacted,
                })
                .then((result) => {
                    const soleBook =
                        result.total === 1
                            ? result.items[0]
                            : undefined

                    if (soleBook !== undefined) {
                        navigate(
                            `/books/${soleBook.id}`,
                        )

                        return
                    }

                    const nextSearch =
                        new URLSearchParams({
                            isbn: compacted,
                        })

                    if (result.total === 0) {
                        navigate({
                            pathname: '/books/new',
                            search:
                                `?${nextSearch.toString()}`,
                        })

                        return
                    }

                    navigate({
                        pathname: '/books',
                        search:
                            `?${nextSearch.toString()}`,
                    })
                })
                .catch(() => {
                    // A failed prefetch must not navigate.
                })
                .finally(() => {
                    isResolvingRef.current = false
                })
        },
    })
}
