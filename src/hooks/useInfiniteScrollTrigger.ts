import {
    useCallback,
    useEffect,
    useRef,
} from 'react'

import {
    INFINITE_SCROLL_PREFETCH_ROWS,
} from '../features/shared/infiniteScrollConfig'

export interface InfiniteScrollTriggerOptions {
    enabled: boolean
    hasNextPage: boolean | undefined
    isFetchingNextPage: boolean
    fetchNextPage: () => void
    itemCount: number
}

export function getInfiniteScrollSentinelIndex(
    itemCount: number,
): number {
    return Math.max(
        0,
        itemCount - INFINITE_SCROLL_PREFETCH_ROWS,
    )
}

export function useInfiniteScrollTrigger(
    options: InfiniteScrollTriggerOptions,
): {
    sentinelIndex: number
    getRowRef: (
        index: number,
    ) => (node: HTMLElement | null) => void
} {
    const observerRef =
        useRef<IntersectionObserver | null>(
            null,
        )
    const observedNodeRef =
        useRef<HTMLElement | null>(null)
    const requestedRef = useRef(false)

    const {
        enabled,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
        itemCount,
    } = options

    const sentinelIndex =
        getInfiniteScrollSentinelIndex(
            itemCount,
        )

    const disconnectObserver =
        useCallback(() => {
            observerRef.current?.disconnect()
            observerRef.current = null
            observedNodeRef.current = null
        }, [])

    useEffect(() => {
        if (!isFetchingNextPage) {
            requestedRef.current = false
        }
    }, [isFetchingNextPage])

    useEffect(() => {
        requestedRef.current = false
    }, [sentinelIndex])

    useEffect(() => {
        return () => {
            disconnectObserver()
        }
    }, [disconnectObserver])

    const getRowRef = useCallback(
        (index: number) =>
            (node: HTMLElement | null) => {
                if (
                    index !== sentinelIndex ||
                    !enabled
                ) {
                    return
                }

                if (
                    observedNodeRef.current === node
                ) {
                    return
                }

                disconnectObserver()

                if (node === null) {
                    return
                }

                observedNodeRef.current = node

                observerRef.current =
                    new IntersectionObserver(
                        (entries) => {
                            const entry =
                                entries[0]

                            if (
                                !entry?.isIntersecting
                            ) {
                                requestedRef.current = false
                                return
                            }

                            if (
                                requestedRef.current ||
                                !hasNextPage ||
                                isFetchingNextPage
                            ) {
                                return
                            }

                            requestedRef.current = true
                            fetchNextPage()
                        },
                    )

                observerRef.current.observe(
                    node,
                )
            },
        [
            disconnectObserver,
            enabled,
            fetchNextPage,
            hasNextPage,
            isFetchingNextPage,
            sentinelIndex,
        ],
    )

    return {
        sentinelIndex,
        getRowRef,
    }
}
