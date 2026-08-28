import {
    lazy,
    Suspense,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FormEvent,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert } from '../../../components/Alert'
import { AppLink } from '../../../components/AppLink'
import { Button } from '../../../components/Button'
import { Field } from '../../../components/Field'
import { LoadingState } from '../../../components/LoadingState'
import { QueryErrorState } from '../../../components/QueryErrorState'
import { ConfirmationDialog } from '../../../components'
import {
    useBulkBookImport,
    useBulkBookLookup,
    useInfiniteBooks,
} from '../../../api/booksQueries'
import {
    useCategories,
    useCreateCategory,
} from '../../../api/categoriesQueries'
import {
    useShelves,
} from '../../../api/shelvesQueries'
import {
    formatShelfCommonNameForDisplay,
} from '../../shelves/shelfDisplay'
import {
    bulkAddLookupDetail,
    bulkAddStatusLabel,
    classifyBulkLookupResult,
    normalizeBulkAddIsbn,
    type BulkAddQueueItem,
} from '../bulkAddModel'

const BULK_LOOKUP_MAX_ITEMS = 50
const BULK_IMPORT_MAX_ITEMS = 50

function categorySlug(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

const IsbnCameraScanner = lazy(
    () =>
        import('../../scanning/IsbnCameraScanner').then(
            (module) => ({
                default: module.IsbnCameraScanner,
            }),
        ),
)

type BulkAddDraft = {
    title: string
    authors: string
    publisher: string
    publicationDate: string
    pages: string
    categoryIds: string[]
    acquireWishlist: boolean
}

function emptyDraft(): BulkAddDraft {
    return {
        title: '',
        authors: '',
        publisher: '',
        publicationDate: '',
        pages: '',
        categoryIds: [],
        acquireWishlist: false,
    }
}

function draftFromQueueItem(
    item: BulkAddQueueItem,
): BulkAddDraft {
    const lookupDraft = item.lookupResult?.draft

    return {
        ...emptyDraft(),
        title: lookupDraft?.title?.trim() ?? '',
        authors: lookupDraft?.authors?.trim() ?? '',
        publisher: lookupDraft?.publisher?.trim() ?? '',
        publicationDate:
            lookupDraft?.publication_date?.trim() ?? '',
        pages:
            lookupDraft?.pages === null ||
            lookupDraft?.pages === undefined
                ? ''
                : String(lookupDraft.pages),
    }
}

function lookupFailureMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : 'Bulk ISBN lookup failed. Review this item or try again.'
}

function importFailureMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : 'The shelf could not be saved.'
}

function queueItemTitle(
    item: BulkAddQueueItem,
    draft?: BulkAddDraft,
): string {
    if (draft?.title.trim()) {
        return draft.title.trim()
    }

    const title = item.lookupResult?.draft?.title

    return typeof title === 'string' && title.trim()
        ? title.trim()
        : 'Metadata pending'
}

function parseAuthor(
    rawName: string,
): {
    first_name?: string | null
    surname: string
} | null {
    const normalized = rawName
        .replace(/\s+/g, ' ')
        .trim()

    if (!normalized) {
        return null
    }

    if (normalized.includes(',')) {
        const [
            surnamePart,
            ...firstNameParts
        ] = normalized.split(',')

        const surname = surnamePart.trim()
        const firstName = firstNameParts
            .join(',')
            .trim()

        if (!surname) {
            return null
        }

        return {
            first_name: firstName || null,
            surname,
        }
    }

    const parts = normalized.split(' ')

    if (parts.length === 1) {
        return {
            first_name: null,
            surname: parts[0],
        }
    }

    return {
        first_name: parts
            .slice(0, -1)
            .join(' '),
        surname: parts.at(-1) ?? normalized,
    }
}

function parseAuthors(
    value: string,
): Array<{
    first_name?: string | null
    surname: string
}> {
    return value
        .split(/\s*(?:;|\band\b|&)\s*/i)
        .map(parseAuthor)
        .filter(
            (
                author,
            ): author is {
                first_name?: string | null
                surname: string
            } => author !== null,
        )
}

function isRequiredDraftComplete(
    draft: BulkAddDraft,
): boolean {
    return (
        draft.title.trim().length > 0 &&
        parseAuthors(draft.authors).length > 0
    )
}

function isExistingCatalogItem(
    item: BulkAddQueueItem,
): boolean {
    return (
        item.lookupResult?.catalog_state === 'owned' ||
        item.lookupResult?.catalog_state === 'unshelved'
    )
}

function isWishlistItem(
    item: BulkAddQueueItem,
): boolean {
    return item.lookupResult?.catalog_state === 'wishlist'
}

function wishlistBookId(
    item: BulkAddQueueItem,
): string | null {
    if (!isWishlistItem(item)) {
        return null
    }

    const ids =
        item.lookupResult?.catalog_book_ids ?? []

    return ids.length === 1
        ? ids[0]
        : null
}

function isSaveEligible(
    item: BulkAddQueueItem,
    draft: BulkAddDraft | undefined,
    savedIds: ReadonlySet<string>,
): boolean {
    if (
        savedIds.has(item.clientItemId) ||
        item.status === 'queued' ||
        item.status === 'looking_up' ||
        isExistingCatalogItem(item)
    ) {
        return false
    }

    if (!draft || !isRequiredDraftComplete(draft)) {
        return false
    }

    if (isWishlistItem(item)) {
        return (
            draft.acquireWishlist &&
            wishlistBookId(item) !== null
        )
    }

    if (
        item.lookupResult?.catalog_state ===
        'ambiguous'
    ) {
        return false
    }

    return true
}

function reviewStatusLabel(
    item: BulkAddQueueItem,
    draft: BulkAddDraft | undefined,
    savedIds: ReadonlySet<string>,
    importErrors: ReadonlyMap<string, string>,
): string {
    if (savedIds.has(item.clientItemId)) {
        return 'Saved'
    }

    if (importErrors.has(item.clientItemId)) {
        return 'Needs Review'
    }

    if (item.status === 'queued') {
        return 'Queued'
    }

    if (item.status === 'looking_up') {
        return 'Looking Up'
    }

    if (isExistingCatalogItem(item)) {
        return 'Already Exists'
    }

    if (
        item.lookupResult?.catalog_state ===
        'ambiguous'
    ) {
        return 'Needs Review'
    }

    if (
        isWishlistItem(item) &&
        !draft?.acquireWishlist
    ) {
        return 'Needs Review'
    }

    if (
        !draft ||
        !isRequiredDraftComplete(draft)
    ) {
        return 'Incomplete'
    }

    return bulkAddStatusLabel(item.status)
}

export function BulkAddPage() {
    const navigate = useNavigate()
    const shelvesQuery = useShelves()
    const categoriesQuery = useCategories()
    const {
        mutateAsync: createCategory,
        isPending: isCreatingCategory,
    } = useCreateCategory()

    const {
        mutateAsync: lookupBooks,
        isPending: isLookupPending,
    } = useBulkBookLookup()

    const {
        mutateAsync: importBooks,
    } = useBulkBookImport()

    const isbnInputRef =
        useRef<HTMLInputElement>(null)


    const pendingManualFocusIdRef =
        useRef<string | null>(null)

    const nextClientIdRef = useRef(1)
    const lookupInFlightRef = useRef(false)

    const [shelfName, setShelfName] =
        useState('')

    const [
        acquisitionSource,
        setAcquisitionSource,
    ] = useState('')

    const [
        sessionStarted,
        setSessionStarted,
    ] = useState(false)

    const [
        isbnInput,
        setIsbnInput,
    ] = useState('')

    const [
        queue,
        setQueue,
    ] = useState<BulkAddQueueItem[]>([])

    const [
        drafts,
        setDrafts,
    ] = useState<
        Record<string, BulkAddDraft>
    >({})

    const [
        savedIds,
        setSavedIds,
    ] = useState<Set<string>>(
        () => new Set(),
    )

    const [
        importErrors,
        setImportErrors,
    ] = useState<Map<string, string>>(
        () => new Map(),
    )

    const [
        captureMessage,
        setCaptureMessage,
    ] = useState<string | null>(null)

    const [
        saveMessage,
        setSaveMessage,
    ] = useState<string | null>(null)

    const [
        saveError,
        setSaveError,
    ] = useState<string | null>(null)

    const [
        isCameraOpen,
        setIsCameraOpen,
    ] = useState(false)

    const [
        isSaving,
        setIsSaving,
    ] = useState(false)

    const [
        activeCategoryPickerId,
        setActiveCategoryPickerId,
    ] = useState<string | null>(null)

    const [
        categorySearch,
        setCategorySearch,
    ] = useState('')

    const [
        categoryCreateError,
        setCategoryCreateError,
    ] = useState<string | null>(null)

    const [
        createdCategories,
        setCreatedCategories,
    ] = useState<
        Array<{
            category_id: string
            name: string
        }>
    >([])

    const [
        rebalancePrompt,
        setRebalancePrompt,
    ] = useState<{
        shelfName: string
        existingCount: number
    } | null>(null)

    const [
        rebalanceCheck,
        setRebalanceCheck,
    ] = useState<{
        shelfName: string
        movedCount: number
    } | null>(null)

    const selectedShelfBooksQuery = useInfiniteBooks({
        shelfName: shelfName || undefined,
        enabled: sessionStarted && Boolean(shelfName),
    })

    const rebalanceShelfBooksQuery = useInfiniteBooks({
        shelfName: rebalanceCheck?.shelfName,
        enabled: rebalanceCheck !== null,
    })

    const returnedShelfExistingCount =
        rebalanceCheck !== null &&
        rebalanceShelfBooksQuery.isSuccess
            ? Math.max(
                (rebalanceShelfBooksQuery.data?.pages[0]
                    ?.total ?? 0) -
                    rebalanceCheck.movedCount,
                0,
            )
            : 0

    const activeRebalancePrompt =
        rebalancePrompt ??
        (rebalanceCheck !== null &&
        returnedShelfExistingCount > 0
            ? {
                shelfName: rebalanceCheck.shelfName,
                existingCount:
                    returnedShelfExistingCount,
            }
            : null)

    const assignableShelves = useMemo(
        () =>
            (shelvesQuery.data ?? []).filter(
                (shelf) =>
                    shelf.common_name !== 'removed',
            ),
        [shelvesQuery.data],
    )

    const selectedShelf =
        assignableShelves.find(
            (shelf) =>
                shelf.common_name === shelfName,
        )

    const categories = useMemo(() => {
        const queryCategories =
            categoriesQuery.data ?? []

        return [
            ...queryCategories,
            ...createdCategories.filter(
                (created) =>
                    !queryCategories.some(
                        (category) =>
                            category.category_id ===
                            created.category_id,
                    ),
            ),
        ].sort((left, right) =>
            left.name.localeCompare(
                right.name,
                undefined,
                { sensitivity: 'base' },
            ),
        )
    }, [
        categoriesQuery.data,
        createdCategories,
    ])

    const saveEligibleItems = useMemo(
        () =>
            queue.filter((item) =>
                isSaveEligible(
                    item,
                    drafts[item.clientItemId],
                    savedIds,
                ),
            ),
        [
            drafts,
            queue,
            savedIds,
        ],
    )

    useEffect(() => {
        if (
            !sessionStarted ||
            isLookupPending ||
            lookupInFlightRef.current
        ) {
            return
        }

        const batch = queue
            .filter(
                (item) =>
                    item.status === 'queued',
            )
            .slice(
                0,
                BULK_LOOKUP_MAX_ITEMS,
            )

        if (batch.length === 0) {
            return
        }

        const batchIds = new Set(
            batch.map(
                (item) =>
                    item.clientItemId,
            ),
        )

        lookupInFlightRef.current = true
        let lookupStarted = false

        const timeoutId =
            window.setTimeout(() => {
                lookupStarted = true

                setQueue((current) =>
                    current.map((item) =>
                        batchIds.has(
                            item.clientItemId,
                        )
                            ? {
                                ...item,
                                status:
                                    'looking_up',
                                lookupError:
                                undefined,
                            }
                            : item,
                    ),
                )

                void lookupBooks({
                    items: batch.map(
                        (item) => ({
                            client_item_id:
                            item.clientItemId,
                            isbn: item.isbn,
                        }),
                    ),
                })
                    .then((response) => {
                        const results =
                            new Map(
                                response.items.map(
                                    (item) => [
                                        item.client_item_id,
                                        item,
                                    ],
                                ),
                            )

                        setQueue(
                            (current) =>
                                current.map(
                                    (item) => {
                                        if (
                                            !batchIds.has(
                                                item.clientItemId,
                                            )
                                        ) {
                                            return item
                                        }

                                        const result =
                                            results.get(
                                                item.clientItemId,
                                            )

                                        if (!result) {
                                            return {
                                                ...item,
                                                status:
                                                    'lookup_failed',
                                                lookupError:
                                                    'The lookup response did not include this scan.',
                                            }
                                        }

                                        return {
                                            ...item,
                                            isbn:
                                                result.isbn13 ??
                                                item.isbn,
                                            status:
                                                classifyBulkLookupResult(
                                                    result,
                                                ),
                                            lookupResult:
                                            result,
                                            lookupError:
                                            undefined,
                                        }
                                    },
                                ),
                        )

                        setDrafts(
                            (current) => {
                                const next = {
                                    ...current,
                                }

                                for (
                                    const item
                                    of batch
                                    ) {
                                    const result =
                                        results.get(
                                            item.clientItemId,
                                        )

                                    if (
                                        !result ||
                                        next[
                                            item
                                                .clientItemId
                                            ]
                                    ) {
                                        continue
                                    }

                                    next[
                                        item
                                            .clientItemId
                                        ] =
                                        draftFromQueueItem(
                                            {
                                                ...item,
                                                isbn:
                                                    result.isbn13 ??
                                                    item.isbn,
                                                status:
                                                    classifyBulkLookupResult(
                                                        result,
                                                    ),
                                                lookupResult:
                                                result,
                                            },
                                        )
                                }

                                return next
                            },
                        )
                    })
                    .catch(
                        (
                            error: unknown,
                        ) => {
                            const message =
                                lookupFailureMessage(
                                    error,
                                )

                            setQueue(
                                (current) =>
                                    current.map(
                                        (item) =>
                                            batchIds.has(
                                                item.clientItemId,
                                            )
                                                ? {
                                                    ...item,
                                                    status:
                                                        'lookup_failed',
                                                    lookupError:
                                                    message,
                                                }
                                                : item,
                                    ),
                            )

                            setDrafts(
                                (current) => {
                                    const next = {
                                        ...current,
                                    }

                                    for (
                                        const item
                                        of batch
                                        ) {
                                        if (
                                            !next[
                                                item
                                                    .clientItemId
                                                ]
                                        ) {
                                            next[
                                                item
                                                    .clientItemId
                                                ] =
                                                emptyDraft()
                                        }
                                    }

                                    return next
                                },
                            )
                        },
                    )
                    .finally(() => {
                        lookupInFlightRef.current =
                            false
                    })
            }, 0)

        return () => {
            if (!lookupStarted) {
                window.clearTimeout(timeoutId)
                lookupInFlightRef.current = false
            }
        }
    }, [
        isLookupPending,
        lookupBooks,
        queue,
        sessionStarted,
    ])

    useEffect(() => {
        if (
            !sessionStarted ||
            isCameraOpen ||
            pendingManualFocusIdRef.current !== null
        ) {
            return
        }

        isbnInputRef.current?.focus()
    }, [
        isCameraOpen,
        queue.length,
        sessionStarted,
    ])
    useEffect(() => {
        const clientItemId =
            pendingManualFocusIdRef.current

        if (clientItemId === null) {
            return
        }

        const titleInput =
            document.getElementById(
                `${clientItemId}-title`,
            )

        if (titleInput instanceof HTMLInputElement) {
            titleInput.focus()
            pendingManualFocusIdRef.current = null
        }
    }, [queue.length])

    function openShelfRebalance(
        targetShelfName: string,
    ) {
        const params = new URLSearchParams({
            shelf_name: targetShelfName,
            bulk_rebalance: '1',
        })

        window.open(
            `/books?${params.toString()}`,
            '_blank',
        )
    }

    useEffect(() => {
        function handleRebalanceMessage(
            event: MessageEvent,
        ) {
            if (event.origin !== window.location.origin) {
                return
            }

            const data = event.data as {
                type?: unknown
                shelfName?: unknown
                movedCount?: unknown
            } | null

            if (
                data?.type !==
                    'shade-bulk-add-rebalance-complete' ||
                typeof data.shelfName !== 'string' ||
                !data.shelfName.trim() ||
                typeof data.movedCount !== 'number' ||
                data.movedCount < 0
            ) {
                return
            }

            setRebalanceCheck({
                shelfName: data.shelfName.trim(),
                movedCount: data.movedCount,
            })
        }

        window.addEventListener(
            'message',
            handleRebalanceMessage,
        )

        return () => {
            window.removeEventListener(
                'message',
                handleRebalanceMessage,
            )
        }
    }, [])

    function confirmRebalance() {
        if (activeRebalancePrompt === null) {
            return
        }

        const targetShelfName =
            activeRebalancePrompt.shelfName

        setRebalancePrompt(null)
        setRebalanceCheck(null)
        openShelfRebalance(targetShelfName)
    }

    function cancelRebalance() {
        setRebalancePrompt(null)
        setRebalanceCheck(null)
    }

    function startSession(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        if (!shelfName) {
            return
        }

        setSessionStarted(true)
    }

    function addIsbn(
        rawValue: string,
    ) {
        const isbn =
            normalizeBulkAddIsbn(rawValue)

        if (!isbn) {
            setCaptureMessage(
                'Enter or scan an ISBN first.',
            )
            isbnInputRef.current?.focus()
            return
        }

        if (
            queue.some(
                (item) =>
                    item.isbn === isbn,
            )
        ) {
            setCaptureMessage(
                `${isbn} is already in this Bulk Add session.`,
            )
            setIsbnInput('')
            isbnInputRef.current?.focus()
            return
        }

        const clientItemId =
            `bulk-add-${nextClientIdRef.current}`

        nextClientIdRef.current += 1

        setQueue((current) => [
            ...current,
            {
                clientItemId,
                isbn,
                status: 'queued',
            },
        ])

        setIsbnInput('')
        setCaptureMessage(
            `Added ${isbn}.`,
        )
        setSaveMessage(null)
        setSaveError(null)

        isbnInputRef.current?.focus()
    }

    function addManualBook() {
        const clientItemId =
            `bulk-add-${nextClientIdRef.current}`

        nextClientIdRef.current += 1

        setQueue((current) => [
            ...current,
            {
                clientItemId,
                isbn: '',
                status: 'lookup_failed',
            },
        ])

        setDrafts((current) => ({
            ...current,
            [clientItemId]: emptyDraft(),
        }))

        pendingManualFocusIdRef.current =
            clientItemId

        setCaptureMessage(
            'Added a book for manual entry.',
        )
        setSaveMessage(null)
        setSaveError(null)
    }

    function submitIsbn(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()
        addIsbn(isbnInput)
    }

    function ensureDraft(
        item: BulkAddQueueItem,
    ): BulkAddDraft {
        return (
            drafts[item.clientItemId] ??
            draftFromQueueItem(item)
        )
    }

    function updateDraft(
        item: BulkAddQueueItem,
        update: Partial<BulkAddDraft>,
    ) {
        setDrafts((current) => ({
            ...current,
            [item.clientItemId]: {
                ...ensureDraft(item),
                ...update,
            },
        }))

        setImportErrors(
            (current) => {
                if (
                    !current.has(
                        item.clientItemId,
                    )
                ) {
                    return current
                }

                const next =
                    new Map(current)

                next.delete(
                    item.clientItemId,
                )

                return next
            },
        )

        setSaveMessage(null)
        setSaveError(null)
    }

    function toggleCategory(
        item: BulkAddQueueItem,
        categoryId: string,
    ) {
        const draft =
            ensureDraft(item)

        const hasCategory =
            draft.categoryIds.includes(
                categoryId,
            )

        updateDraft(item, {
            categoryIds: hasCategory
                ? draft.categoryIds.filter(
                    (id) =>
                        id !== categoryId,
                )
                : [
                    ...draft.categoryIds,
                    categoryId,
                ],
        })
    }

    async function handleCreateCategory(
        item: BulkAddQueueItem,
    ) {
        const name = categorySearch
            .trim()
            .replace(/\s+/g, ' ')

        if (!name) {
            return
        }

        setCategoryCreateError(null)

        try {
            const created =
                await createCategory({
                    name,
                    slug: categorySlug(name),
                })

            setCreatedCategories((current) =>
                current.some(
                    (category) =>
                        category.category_id ===
                        created.category_id,
                )
                    ? current
                    : [...current, created],
            )

            const draft = ensureDraft(item)

            if (
                !draft.categoryIds.includes(
                    created.category_id,
                )
            ) {
                updateDraft(item, {
                    categoryIds: [
                        ...draft.categoryIds,
                        created.category_id,
                    ],
                })
            }

            setCategorySearch('')
        } catch (error) {
            setCategoryCreateError(
                error instanceof Error
                    ? error.message
                    : 'The category could not be created.',
            )
        }
    }

    async function saveShelf() {
        if (
            isSaving ||
            saveEligibleItems.length === 0
        ) {
            return
        }

        const preSaveShelfCount =
            selectedShelfBooksQuery.isSuccess
                ? selectedShelfBooksQuery.data?.pages[0]
                    ?.total ?? 0
                : 0

        setIsSaving(true)
        setSaveMessage(null)
        setSaveError(null)

        let succeeded = 0
        let failed = 0

        try {
            for (
                let offset = 0;
                offset <
                saveEligibleItems.length;
                offset +=
                    BULK_IMPORT_MAX_ITEMS
            ) {
                const batch =
                    saveEligibleItems.slice(
                        offset,
                        offset +
                        BULK_IMPORT_MAX_ITEMS,
                    )

                const response =
                    await importBooks({
                        shelf_name:
                        shelfName,
                        acquisition_source:
                            acquisitionSource.trim() ||
                            null,
                        items: batch.map(
                            (item) => {
                                const draft =
                                    ensureDraft(
                                        item,
                                    )

                                const existingBookId =
                                    wishlistBookId(
                                        item,
                                    )

                                if (
                                    isWishlistItem(
                                        item,
                                    ) &&
                                    draft.acquireWishlist &&
                                    existingBookId
                                ) {
                                    return {
                                        client_item_id:
                                        item.clientItemId,
                                        action:
                                            'acquire_wishlist' as const,
                                        existing_book_id:
                                        existingBookId,
                                        book: {
                                            title:
                                                draft.title.trim(),
                                            isbn13:
                                            item.isbn,
                                            publisher:
                                                draft.publisher.trim() ||
                                                null,
                                            publication_date:
                                                draft.publicationDate.trim() ||
                                                null,
                                            pages:
                                                draft.pages.trim()
                                                    ? Number(
                                                        draft.pages,
                                                    )
                                                    : null,
                                        },
                                    }
                                }

                                return {
                                    client_item_id:
                                    item.clientItemId,
                                    action:
                                        'create' as const,
                                    book: {
                                        title:
                                            draft.title.trim(),
                                        isbn13:
                                        item.isbn,
                                        authors:
                                            parseAuthors(
                                                draft.authors,
                                            ),
                                        publisher:
                                            draft.publisher.trim() ||
                                            null,
                                        publication_date:
                                            draft.publicationDate.trim() ||
                                            null,
                                        pages:
                                            draft.pages.trim()
                                                ? Number(
                                                    draft.pages,
                                                )
                                                : null,
                                        category_ids:
                                        draft.categoryIds,
                                    },
                                }
                            },
                        ),
                    })

                const successfulIds =
                    new Set<string>()

                const failedMessages =
                    new Map<
                        string,
                        string
                    >()

                for (
                    const result
                    of response.items
                    ) {
                    if (
                        result.status ===
                        'created' ||
                        result.status ===
                        'wishlist_acquired'
                    ) {
                        successfulIds.add(
                            result.client_item_id,
                        )
                        succeeded += 1
                        continue
                    }

                    failed += 1

                    failedMessages.set(
                        result.client_item_id,
                        result.detail ??
                        result.error_code ??
                        'This item could not be saved.',
                    )
                }

                if (
                    successfulIds.size >
                    0
                ) {
                    setSavedIds(
                        (current) => {
                            const next =
                                new Set(
                                    current,
                                )

                            for (
                                const id
                                of successfulIds
                                ) {
                                next.add(id)
                            }

                            return next
                        },
                    )
                }

                setImportErrors(
                    (current) => {
                        const next =
                            new Map(
                                current,
                            )

                        for (
                            const id
                            of successfulIds
                            ) {
                            next.delete(id)
                        }

                        for (
                            const [
                                id,
                                message,
                            ]
                            of failedMessages
                            ) {
                            next.set(
                                id,
                                message,
                            )
                        }

                        return next
                    },
                )
            }

            if (failed === 0) {
                setSaveMessage(
                    `${succeeded} ${
                        succeeded === 1
                            ? 'book'
                            : 'books'
                    } saved successfully.`,
                )
            } else {
                setSaveMessage(
                    `${succeeded} ${
                        succeeded === 1
                            ? 'book'
                            : 'books'
                    } saved successfully. ${failed} ${
                        failed === 1
                            ? 'item'
                            : 'items'
                    } still need attention.`,
                )
            }

            if (
                succeeded > 0 &&
                preSaveShelfCount > 0
            ) {
                setRebalancePrompt({
                    shelfName,
                    existingCount: preSaveShelfCount,
                })
            }
        } catch (error) {
            setSaveError(
                importFailureMessage(
                    error,
                ),
            )
        } finally {
            setIsSaving(false)
        }
    }

    function hasUnresolvedItems(): boolean {
        return queue.some(
            (item) =>
                !savedIds.has(item.clientItemId) &&
                !isExistingCatalogItem(item),
        )
    }

    function confirmDiscardUnresolved(): boolean {
        if (!hasUnresolvedItems()) {
            return true
        }

        return window.confirm(
            'Some scanned books have not been saved. Discard those unresolved items and leave this shelf?',
        )
    }

    function startNextShelf() {
        if (!confirmDiscardUnresolved()) {
            return
        }

        setShelfName('')
        setAcquisitionSource('')
        setSessionStarted(false)
        setIsbnInput('')
        setQueue([])
        setDrafts({})
        setSavedIds(new Set())
        setImportErrors(new Map())
        setCaptureMessage(null)
        setSaveMessage(null)
        setSaveError(null)
        setIsCameraOpen(false)
        setActiveCategoryPickerId(null)
        setCategorySearch('')
        setCategoryCreateError(null)
        nextClientIdRef.current = 1
    }

    function finishBulkAdd() {
        if (!confirmDiscardUnresolved()) {
            return
        }

        navigate('/collection/manage')
    }

    if (shelvesQuery.isPending) {
        return (
            <section className="route-page bulk-add-page">
                <h1 tabIndex={-1}>
                    Bulk Add
                </h1>
                <LoadingState label="Loading shelves…" />
            </section>
        )
    }

    if (shelvesQuery.isError) {
        return (
            <section className="route-page bulk-add-page">
                <h1 tabIndex={-1}>
                    Bulk Add
                </h1>

                <QueryErrorState
                    title="Unable to load shelves"
                    error={
                        shelvesQuery.error
                    }
                    onRetry={() => {
                        void shelvesQuery.refetch()
                    }}
                />
            </section>
        )
    }

    if (!sessionStarted) {
        return (
            <section className="route-page bulk-add-page">
                <header className="bulk-add-page__heading">
                    <p className="bulk-add-page__eyebrow">
                        Collection Intake
                    </p>

                    <h1 tabIndex={-1}>
                        Bulk Add
                    </h1>

                    <p>
                        Choose the physical shelf
                        first, then scan every book
                        on that shelf into one
                        intake session.
                    </p>
                </header>

                <form
                    className="bulk-add-setup"
                    onSubmit={
                        startSession
                    }
                >
                    <Field
                        id="bulk-add-shelf"
                        label="Destination shelf"
                    >
                        <select
                            id="bulk-add-shelf"
                            value={
                                shelfName
                            }
                            onChange={(
                                event,
                            ) => {
                                setShelfName(
                                    event
                                        .target
                                        .value,
                                )
                            }}
                            required
                        >
                            <option value="">
                                Choose a shelf
                            </option>

                            {assignableShelves.map(
                                (
                                    shelf,
                                ) => (
                                    <option
                                        key={
                                            shelf.shelf_id
                                        }
                                        value={
                                            shelf.common_name
                                        }
                                    >
                                        {formatShelfCommonNameForDisplay(
                                            shelf.common_name,
                                        )}
                                    </option>
                                ),
                            )}
                        </select>
                    </Field>

                    <Field
                        id="bulk-add-acquisition-source"
                        label="Acquisition source"
                        helpText="Optional. Applied to books saved from this shelf session."
                    >
                        <input
                            id="bulk-add-acquisition-source"
                            value={
                                acquisitionSource
                            }
                            onChange={(
                                event,
                            ) => {
                                setAcquisitionSource(
                                    event
                                        .target
                                        .value,
                                )
                            }}
                        />
                    </Field>

                    {assignableShelves.length ===
                    0 ? (
                        <Alert
                            variant="warning"
                            title="No assignable shelves"
                        >
                            Create a shelf
                            before starting
                            Bulk Add.
                        </Alert>
                    ) : null}

                    <div className="form-actions">
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                !shelfName ||
                                assignableShelves.length ===
                                0
                            }
                        >
                            Start Shelf
                        </Button>

                        <AppLink
                            to="/collection/manage"
                            variant="secondary"
                        >
                            Cancel
                        </AppLink>
                    </div>
                </form>
            </section>
        )
    }

    return (
        <section className="route-page bulk-add-page">
            <header className="bulk-add-page__heading">
                <p className="bulk-add-page__eyebrow">
                    Collection Intake
                </p>

                <h1 tabIndex={-1}>
                    Bulk Add
                </h1>

                <p>
                    Shelf{' '}
                    <strong>
                        {selectedShelf
                            ? formatShelfCommonNameForDisplay(
                                selectedShelf.common_name,
                            )
                            : shelfName}
                    </strong>

                    {acquisitionSource.trim()
                        ? ` · ${acquisitionSource.trim()}`
                        : ''}
                </p>
            </header>

            <section
                className="bulk-add-capture"
                aria-labelledby="bulk-add-capture-heading"
            >
                <div>
                    <h2 id="bulk-add-capture-heading">
                        Scan books
                    </h2>

                    <p>
                        Keep scanning.
                        Metadata lookup runs
                        in the background and
                        does not block the
                        next book.
                    </p>
                </div>

                <form
                    className="bulk-add-capture__form"
                    onSubmit={
                        submitIsbn
                    }
                >
                    <Field
                        id="bulk-add-isbn"
                        label="ISBN"
                        helpText="Scan a barcode or type an ISBN and press Enter."
                    >
                        <input
                            ref={
                                isbnInputRef
                            }
                            id="bulk-add-isbn"
                            autoComplete="off"
                            value={
                                isbnInput
                            }
                            onChange={(
                                event,
                            ) => {
                                setIsbnInput(
                                    event
                                        .target
                                        .value,
                                )
                                setCaptureMessage(
                                    null,
                                )
                            }}
                        />
                    </Field>

                    <div className="bulk-add-capture__actions">
                        <Button
                            type="submit"
                            variant="primary"
                        >
                            Add ISBN
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={addManualBook}
                        >
                            Add manually
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setIsCameraOpen(
                                    true,
                                )
                            }}
                        >
                            Use Camera
                        </Button>
                    </div>
                </form>

                {captureMessage ? (
                    <p
                        className="bulk-add-capture__message"
                        role="status"
                        aria-live="polite"
                    >
                        {
                            captureMessage
                        }
                    </p>
                ) : null}

                {isCameraOpen ? (
                    <div className="bulk-add-camera">
                        <Suspense
                            fallback={
                                <LoadingState label="Loading camera scanner…" />
                            }
                        >
                            <IsbnCameraScanner
                                onDetected={(
                                    isbn,
                                ) => {
                                    setIsCameraOpen(
                                        false,
                                    )
                                    addIsbn(
                                        isbn,
                                    )
                                }}
                                onCancel={() => {
                                    setIsCameraOpen(
                                        false,
                                    )
                                }}
                            />
                        </Suspense>
                    </div>
                ) : null}
            </section>

            <section
                className="bulk-add-queue"
                aria-labelledby="bulk-add-queue-heading"
            >
                <div className="bulk-add-queue__heading">
                    <div>
                        <h2 id="bulk-add-queue-heading">
                            Intake queue
                        </h2>

                        <p>
                            {queue.length}{' '}
                            {queue.length ===
                            1
                                ? 'book'
                                : 'books'}{' '}
                            scanned
                            {' · '}
                            {
                                savedIds.size
                            }{' '}
                            saved
                            {' · '}
                            {
                                saveEligibleItems.length
                            }{' '}
                            ready to save
                        </p>
                    </div>

                    {isLookupPending ? (
                        <p
                            role="status"
                            aria-live="polite"
                        >
                            Looking up
                            metadata…
                        </p>
                    ) : null}
                </div>

                {categoriesQuery.isError ? (
                    <QueryErrorState
                        title="Unable to load categories"
                        error={
                            categoriesQuery.error
                        }
                        onRetry={() => {
                            void categoriesQuery.refetch()
                        }}
                    />
                ) : null}

                {saveError ? (
                    <Alert
                        variant="error"
                        title="Unable to save shelf"
                    >
                        {saveError}
                    </Alert>
                ) : null}

                {saveMessage ? (
                    <p
                        className="bulk-add-save__message"
                        role="status"
                        aria-live="polite"
                    >
                        {saveMessage}
                    </p>
                ) : null}

                {queue.length === 0 ? (
                    <p className="bulk-add-queue__empty">
                        No books scanned yet.
                    </p>
                ) : (
                    <ol className="bulk-add-queue__list">
                        {queue.map(
                            (item) => {
                                const detail =
                                    bulkAddLookupDetail(
                                        item,
                                    )

                                const draft =
                                    ensureDraft(
                                        item,
                                    )

                                const saved =
                                    savedIds.has(
                                        item.clientItemId,
                                    )

                                const existing =
                                    isExistingCatalogItem(
                                        item,
                                    )

                                const wishlist =
                                    isWishlistItem(
                                        item,
                                    )

                                const ambiguous =
                                    item
                                        .lookupResult
                                        ?.catalog_state ===
                                    'ambiguous'

                                const titleMissing =
                                    !draft.title.trim()

                                const authorsMissing =
                                    parseAuthors(
                                        draft.authors,
                                    ).length ===
                                    0

                                const importError =
                                    importErrors.get(
                                        item.clientItemId,
                                    )

                                const editable =
                                    !saved &&
                                    !existing &&
                                    item.status !==
                                    'queued' &&
                                    item.status !==
                                    'looking_up'

                                return (
                                    <li
                                        key={
                                            item.clientItemId
                                        }
                                        className="bulk-add-queue-item"
                                    >
                                        <div className="bulk-add-queue-item__main">
                                            <p className="bulk-add-queue-item__title">
                                                {queueItemTitle(
                                                    item,
                                                    draft,
                                                )}
                                            </p>

                                            <p className="bulk-add-queue-item__isbn">
                                                {item.isbn || 'No ISBN · Manual entry'}
                                            </p>
                                        </div>

                                        <div className="bulk-add-queue-item__status">
                                            <span>
                                                {reviewStatusLabel(
                                                    item,
                                                    draft,
                                                    savedIds,
                                                    importErrors,
                                                )}
                                            </span>
                                        </div>

                                        {detail ? (
                                            <p className="bulk-add-queue-item__detail">
                                                {
                                                    detail
                                                }
                                            </p>
                                        ) : null}

                                        {importError ? (
                                            <p
                                                className="bulk-add-queue-item__error"
                                                role="alert"
                                            >
                                                {
                                                    importError
                                                }
                                            </p>
                                        ) : null}

                                        {existing ? (
                                            <Alert
                                                variant="warning"
                                                title="Already in library"
                                            >
                                                This
                                                ISBN is
                                                already
                                                owned and
                                                will not
                                                be
                                                imported
                                                again.
                                            </Alert>
                                        ) : null}

                                        {ambiguous ? (
                                            <Alert
                                                variant="warning"
                                                title="Existing match needs review"
                                            >
                                                More than
                                                one
                                                existing
                                                catalog
                                                record
                                                matches
                                                this
                                                scan. It
                                                will not
                                                be saved
                                                until
                                                that
                                                conflict
                                                is
                                                resolved.
                                            </Alert>
                                        ) : null}

                                        {wishlist &&
                                        editable ? (
                                            <label className="bulk-add-review__wishlist">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        draft.acquireWishlist
                                                    }
                                                    disabled={
                                                        wishlistBookId(
                                                            item,
                                                        ) ===
                                                        null
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) => {
                                                        updateDraft(
                                                            item,
                                                            {
                                                                acquireWishlist:
                                                                event
                                                                    .target
                                                                    .checked,
                                                            },
                                                        )
                                                    }}
                                                />

                                                Acquire
                                                the
                                                existing
                                                wishlist
                                                copy onto
                                                this
                                                shelf
                                            </label>
                                        ) : null}

                                        {editable &&
                                        !ambiguous ? (
                                            <div className="bulk-add-review">
                                                <Field
                                                    id={`${item.clientItemId}-title`}
                                                    label="Title"
                                                    error={
                                                        titleMissing
                                                            ? 'Title is required before this book can be saved.'
                                                            : undefined
                                                    }
                                                >
                                                    <input
                                                        id={`${item.clientItemId}-title`}
                                                        value={draft.title}
                                                        aria-invalid={
                                                            titleMissing
                                                                ? true
                                                                : undefined
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            updateDraft(
                                                                item,
                                                                {
                                                                    title:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                </Field>

                                                <Field
                                                    id={`${item.clientItemId}-authors`}
                                                    label="Authors"
                                                    error={
                                                        authorsMissing
                                                            ? 'At least one author is required before this book can be saved.'
                                                            : undefined
                                                    }
                                                    helpText="Separate multiple authors with semicolons, “and”, or &."
                                                >
                                                    <input
                                                        id={`${item.clientItemId}-authors`}
                                                        value={
                                                            draft.authors
                                                        }
                                                        aria-invalid={
                                                            authorsMissing
                                                                ? true
                                                                : undefined
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            updateDraft(
                                                                item,
                                                                {
                                                                    authors:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                </Field>

                                                <Field
                                                    id={`${item.clientItemId}-publisher`}
                                                    label="Publisher"
                                                >
                                                    <input
                                                        id={`${item.clientItemId}-publisher`}
                                                        value={
                                                            draft.publisher
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            updateDraft(
                                                                item,
                                                                {
                                                                    publisher:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                </Field>

                                                <Field
                                                    id={`${item.clientItemId}-publication-date`}
                                                    label="Publication date"
                                                >
                                                    <input
                                                        id={`${item.clientItemId}-publication-date`}
                                                        value={
                                                            draft.publicationDate
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            updateDraft(
                                                                item,
                                                                {
                                                                    publicationDate:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                </Field>

                                                <Field
                                                    id={`${item.clientItemId}-pages`}
                                                    label="Pages"
                                                >
                                                    <input
                                                        id={`${item.clientItemId}-pages`}
                                                        type="number"
                                                        min="1"
                                                        value={
                                                            draft.pages
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) => {
                                                            updateDraft(
                                                                item,
                                                                {
                                                                    pages:
                                                                    event
                                                                        .target
                                                                        .value,
                                                                },
                                                            )
                                                        }}
                                                    />
                                                </Field>

                                                {categoriesQuery.isPending ? (
                                                    <LoadingState label="Loading categories…" />
                                                ) : null}

                                                {!categoriesQuery.isPending &&
                                                !categoriesQuery.isError ? (
                                                    <fieldset className="bulk-add-review__category-field">
                                                        <legend>
                                                            Categories
                                                        </legend>

                                                        {(() => {
                                                            const selectedCategories =
                                                                categories.filter(
                                                                    (category) =>
                                                                        draft.categoryIds.includes(
                                                                            category.category_id,
                                                                        ),
                                                                )

                                                            const pickerOpen =
                                                                activeCategoryPickerId ===
                                                                item.clientItemId

                                                            const normalizedSearch =
                                                                categorySearch
                                                                    .trim()
                                                                    .toLowerCase()

                                                            const searchName =
                                                                categorySearch
                                                                    .trim()
                                                                    .replace(
                                                                        /\s+/g,
                                                                        ' ',
                                                                    )

                                                            const hasExactMatch =
                                                                searchName !== '' &&
                                                                categories.some(
                                                                    (category) =>
                                                                        category.name
                                                                            .trim()
                                                                            .toLowerCase() ===
                                                                        searchName.toLowerCase(),
                                                                )

                                                            const visibleCategories =
                                                                normalizedSearch === ''
                                                                    ? categories
                                                                    : categories.filter(
                                                                        (category) =>
                                                                            category.name
                                                                                .toLowerCase()
                                                                                .includes(
                                                                                    normalizedSearch,
                                                                                ),
                                                                    )

                                                            return (
                                                                <>
                                                                    {selectedCategories.length >
                                                                    0 ? (
                                                                        <div
                                                                            className="book-form__selected-categories"
                                                                            aria-label={`Selected categories for ${queueItemTitle(
                                                                                item,
                                                                                draft,
                                                                            )}`}
                                                                        >
                                                                            {selectedCategories.map(
                                                                                (category) => (
                                                                                    <Button
                                                                                        key={
                                                                                            category.category_id
                                                                                        }
                                                                                        type="button"
                                                                                        variant="secondary"
                                                                                        aria-label={`Remove ${category.name} category`}
                                                                                        onClick={() => {
                                                                                            toggleCategory(
                                                                                                item,
                                                                                                category.category_id,
                                                                                            )
                                                                                        }}
                                                                                    >
                                                                                        {category.name}{' '}
                                                                                        ×
                                                                                    </Button>
                                                                                ),
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="bulk-add-review__categories-empty">
                                                                            No categories selected.
                                                                        </p>
                                                                    )}

                                                                    <div className="book-form__category-picker">
                                                                        <Button
                                                                            type="button"
                                                                            variant="secondary"
                                                                            aria-expanded={
                                                                                pickerOpen
                                                                            }
                                                                            aria-controls={`${item.clientItemId}-category-picker`}
                                                                            onClick={() => {
                                                                                if (
                                                                                    pickerOpen
                                                                                ) {
                                                                                    setActiveCategoryPickerId(
                                                                                        null,
                                                                                    )
                                                                                    setCategorySearch(
                                                                                        '',
                                                                                    )
                                                                                    setCategoryCreateError(
                                                                                        null,
                                                                                    )
                                                                                    return
                                                                                }

                                                                                setActiveCategoryPickerId(
                                                                                    item.clientItemId,
                                                                                )
                                                                                setCategorySearch(
                                                                                    '',
                                                                                )
                                                                                setCategoryCreateError(
                                                                                    null,
                                                                                )
                                                                            }}
                                                                        >
                                                                            {pickerOpen
                                                                                ? 'Close categories'
                                                                                : selectedCategories.length >
                                                                                    0
                                                                                  ? `Select categories (${selectedCategories.length})`
                                                                                  : 'Select categories'}
                                                                        </Button>

                                                                        {pickerOpen ? (
                                                                            <div
                                                                                id={`${item.clientItemId}-category-picker`}
                                                                                className="book-form__category-dropdown"
                                                                            >
                                                                                <Field label="Search categories">
                                                                                    <input
                                                                                        type="search"
                                                                                        value={
                                                                                            categorySearch
                                                                                        }
                                                                                        onChange={(
                                                                                            event,
                                                                                        ) => {
                                                                                            setCategorySearch(
                                                                                                event
                                                                                                    .target
                                                                                                    .value,
                                                                                            )
                                                                                            setCategoryCreateError(
                                                                                                null,
                                                                                            )
                                                                                        }}
                                                                                        autoComplete="off"
                                                                                    />
                                                                                </Field>

                                                                                <div className="book-form__category-dropdown-list">
                                                                                    {searchName !== '' &&
                                                                                    !hasExactMatch ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="book-form__picker-create"
                                                                                            disabled={
                                                                                                isCreatingCategory
                                                                                            }
                                                                                            onClick={() => {
                                                                                                void handleCreateCategory(
                                                                                                    item,
                                                                                                )
                                                                                            }}
                                                                                        >
                                                                                            {isCreatingCategory
                                                                                                ? 'Adding category…'
                                                                                                : `+ Add “${searchName}”`}
                                                                                        </button>
                                                                                    ) : null}

                                                                                    {visibleCategories.length >
                                                                                    0 ? (
                                                                                        visibleCategories.map(
                                                                                            (
                                                                                                category,
                                                                                            ) => {
                                                                                                const inputId =
                                                                                                    `${item.clientItemId}-category-${category.category_id}`

                                                                                                return (
                                                                                                    <label
                                                                                                        key={
                                                                                                            category.category_id
                                                                                                        }
                                                                                                        htmlFor={
                                                                                                            inputId
                                                                                                        }
                                                                                                        className="book-form__category-option"
                                                                                                    >
                                                                                                        <input
                                                                                                            id={
                                                                                                                inputId
                                                                                                            }
                                                                                                            type="checkbox"
                                                                                                            checked={draft.categoryIds.includes(
                                                                                                                category.category_id,
                                                                                                            )}
                                                                                                            onChange={() => {
                                                                                                                toggleCategory(
                                                                                                                    item,
                                                                                                                    category.category_id,
                                                                                                                )
                                                                                                            }}
                                                                                                        />

                                                                                                        <span>
                                                                                                            {
                                                                                                                category.name
                                                                                                            }
                                                                                                        </span>
                                                                                                    </label>
                                                                                                )
                                                                                            },
                                                                                        )
                                                                                    ) : (
                                                                                        <p className="book-form__category-no-results">
                                                                                            No categories match your search.
                                                                                        </p>
                                                                                    )}
                                                                                </div>

                                                                                {categoryCreateError ? (
                                                                                    <p
                                                                                        className="field__error bulk-add-review__category-error"
                                                                                        role="alert"
                                                                                    >
                                                                                        {
                                                                                            categoryCreateError
                                                                                        }
                                                                                    </p>
                                                                                ) : null}
                                                                            </div>
                                                                        ) : null}
                                                                    </div>
                                                                </>
                                                            )
                                                        })()}
                                                    </fieldset>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </li>
                                )
                            },
                        )}
                    </ol>
                )}

                {queue.length > 0 ? (
                    <div className="bulk-add-save">
                        <Button
                            type="button"
                            variant="primary"
                            disabled={
                                isSaving ||
                                saveEligibleItems.length ===
                                0
                            }
                            onClick={() => {
                                void saveShelf()
                            }}
                        >
                            {isSaving
                                ? 'Saving Shelf…'
                                : `Save Shelf${
                                    saveEligibleItems.length >
                                    0
                                        ? ` (${saveEligibleItems.length})`
                                        : ''
                                }`}
                        </Button>
                    </div>
                ) : null}

                {savedIds.size > 0 ? (
                    <div className="bulk-add-complete-actions">
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={
                                isSaving
                            }
                            onClick={
                                startNextShelf
                            }
                        >
                            Start Next Shelf
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isSaving}
                            onClick={finishBulkAdd}
                        >
                            Finish Bulk Add
                        </Button>
                    </div>
                ) : null}
            </section>

            <ConfirmationDialog
                open={activeRebalancePrompt !== null}
                title="Rebalance shelf?"
                confirmLabel="Move books"
                cancelLabel="No"
                confirmVariant="primary"
                onConfirm={confirmRebalance}
                onCancel={cancelRebalance}
            >
                {activeRebalancePrompt ? (
                    <p>
                        {formatShelfCommonNameForDisplay(
                            activeRebalancePrompt.shelfName,
                        )}{' '}
                        already has{' '}
                        {activeRebalancePrompt.existingCount}{' '}
                        {activeRebalancePrompt.existingCount === 1
                            ? 'book'
                            : 'books'}
                        . Do any need to move?
                    </p>
                ) : null}
            </ConfirmationDialog>
        </section>
    )
}
