import {
    renderHook,
} from '@testing-library/react'
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    INFINITE_SCROLL_PREFETCH_ROWS,
} from '../features/shared/infiniteScrollConfig'
import {
    getInfiniteScrollSentinelIndex,
    useInfiniteScrollTrigger,
} from './useInfiniteScrollTrigger'

type IntersectionObserverCallback =
    (
        entries: IntersectionObserverEntry[],
        observer: IntersectionObserver,
    ) => void

let observerCallback:
    | IntersectionObserverCallback
    | null = null

const observe = vi.fn()
const disconnect = vi.fn()
const unobserve = vi.fn()

class MockIntersectionObserver {
    constructor(
        callback: IntersectionObserverCallback,
    ) {
        observerCallback = callback
    }

    observe = observe
    disconnect = disconnect
    unobserve = unobserve
}

function triggerIntersection(
    isIntersecting: boolean,
) {
    observerCallback?.(
        [
            {
                isIntersecting,
            } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
    )
}

describe('getInfiniteScrollSentinelIndex', () => {
    it('uses the prefetch row threshold from the bottom', () => {
        expect(
            getInfiniteScrollSentinelIndex(10),
        ).toBe(10 - INFINITE_SCROLL_PREFETCH_ROWS)

        expect(
            getInfiniteScrollSentinelIndex(3),
        ).toBe(0)
    })
})

describe('useInfiniteScrollTrigger', () => {
    beforeEach(() => {
        observerCallback = null
        observe.mockReset()
        disconnect.mockReset()
        unobserve.mockReset()

        vi.stubGlobal(
            'IntersectionObserver',
            MockIntersectionObserver,
        )
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('observes the prefetch sentinel row and fetches the next page once', () => {
        const fetchNextPage = vi.fn()

        const { result } = renderHook(() =>
            useInfiniteScrollTrigger({
                enabled: true,
                hasNextPage: true,
                isFetchingNextPage: false,
                fetchNextPage,
                itemCount: 10,
            }),
        )

        expect(
            result.current.sentinelIndex,
        ).toBe(10 - INFINITE_SCROLL_PREFETCH_ROWS)

        const sentinelNode =
            document.createElement('li')
        const otherNode =
            document.createElement('li')

        result.current.getRowRef(0)(otherNode)
        result.current.getRowRef(
            result.current.sentinelIndex,
        )(sentinelNode)

        expect(observe).toHaveBeenCalledWith(
            sentinelNode,
        )

        triggerIntersection(true)

        expect(
            fetchNextPage,
        ).toHaveBeenCalledOnce()

        triggerIntersection(true)

        expect(
            fetchNextPage,
        ).toHaveBeenCalledOnce()
    })

    it('does not fetch when there is no next page', () => {
        const fetchNextPage = vi.fn()

        const { result } = renderHook(() =>
            useInfiniteScrollTrigger({
                enabled: true,
                hasNextPage: false,
                isFetchingNextPage: false,
                fetchNextPage,
                itemCount: 10,
            }),
        )

        const sentinelNode =
            document.createElement('li')

        result.current.getRowRef(
            result.current.sentinelIndex,
        )(sentinelNode)

        triggerIntersection(true)

        expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does not fetch while the next page is already loading', () => {
        const fetchNextPage = vi.fn()

        const { result } = renderHook(() =>
            useInfiniteScrollTrigger({
                enabled: true,
                hasNextPage: true,
                isFetchingNextPage: true,
                fetchNextPage,
                itemCount: 10,
            }),
        )

        const sentinelNode =
            document.createElement('li')

        result.current.getRowRef(
            result.current.sentinelIndex,
        )(sentinelNode)

        triggerIntersection(true)

        expect(fetchNextPage).not.toHaveBeenCalled()
    })

    it('does not observe rows when disabled', () => {
        const fetchNextPage = vi.fn()

        const { result } = renderHook(() =>
            useInfiniteScrollTrigger({
                enabled: false,
                hasNextPage: true,
                isFetchingNextPage: false,
                fetchNextPage,
                itemCount: 10,
            }),
        )

        const sentinelNode =
            document.createElement('li')

        result.current.getRowRef(
            result.current.sentinelIndex,
        )(sentinelNode)

        expect(observe).not.toHaveBeenCalled()
    })

    it('allows another request after the sentinel moves', () => {
        const fetchNextPage = vi.fn()

        const { result, rerender } =
            renderHook(
                ({
                     itemCount,
                 }: {
                    itemCount: number
                }) =>
                    useInfiniteScrollTrigger({
                        enabled: true,
                        hasNextPage: true,
                        isFetchingNextPage: false,
                        fetchNextPage,
                        itemCount,
                    }),
                {
                    initialProps: {
                        itemCount: 10,
                    },
                },
            )

        const firstSentinel =
            document.createElement('li')

        result.current.getRowRef(
            result.current.sentinelIndex,
        )(firstSentinel)

        triggerIntersection(true)

        expect(fetchNextPage).toHaveBeenCalledOnce()

        triggerIntersection(true)

        expect(fetchNextPage).toHaveBeenCalledOnce()

        rerender({
            itemCount: 20,
        })

        const secondSentinel =
            document.createElement('li')

        result.current.getRowRef(
            result.current.sentinelIndex,
        )(secondSentinel)

        triggerIntersection(true)

        expect(fetchNextPage).toHaveBeenCalledTimes(
            2,
        )
    })
})
