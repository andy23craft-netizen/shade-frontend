export {
    INFINITE_SCROLL_BATCH_SIZE as LOANS_BATCH_SIZE,
    INFINITE_SCROLL_PREFETCH_ROWS,
} from '../shared/infiniteScrollConfig'

export function flattenInfiniteListPages<
    TPage extends {
        items: TItem[]
    },
    TItem,
>(
    pages: TPage[] | undefined,
): TItem[] {
    return pages?.flatMap(
        (page) => page.items,
    ) ?? []
}
