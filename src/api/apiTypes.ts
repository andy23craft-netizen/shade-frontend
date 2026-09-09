import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type BookCreate = Omit<Schemas['BookCreate'], 'isbn_not_applicable' | 'is_flagged'> &
    Partial<Pick<Schemas['BookCreate'], 'isbn_not_applicable' | 'is_flagged'>>
export type BookUpdate = Schemas['BookUpdate']
type GeneratedBookRead = Schemas['BookRead']
export type BookRead = Omit<GeneratedBookRead, 'borrower_rating' | 'isbn_not_applicable' | 'is_flagged' | 'work_id'> &
    Partial<Pick<GeneratedBookRead, 'borrower_rating' | 'isbn_not_applicable' | 'is_flagged' | 'work_id'>>
export type BookList = Omit<Schemas['BookList'], 'items'> & { items: BookRead[] }

export type BulkBookCatalogState =
    Schemas['BulkBookCatalogState']

export type BulkBookImportAction =
    Schemas['BulkBookImportAction']

export type BulkBookImportItemRequest =
    Omit<Schemas['BulkBookImportItemRequest'], 'allow_duplicate'> &
    Partial<Pick<Schemas['BulkBookImportItemRequest'], 'allow_duplicate'>>

export type BulkBookImportItemResult =
    Schemas['BulkBookImportItemResult']

export type BulkBookImportRequest =
    Omit<Schemas['BulkBookImportRequest'], 'items'> & {
        items: BulkBookImportItemRequest[]
    }

export type BulkBookImportResponse =
    Schemas['BulkBookImportResponse']

export type BulkBookImportResultStatus =
    Schemas['BulkBookImportResultStatus']

export type BulkBookLookupItemRequest =
    Schemas['BulkBookLookupItemRequest']

type GeneratedBulkBookLookupItemResult = Schemas['BulkBookLookupItemResult']
export type BulkBookLookupItemResult = Omit<GeneratedBulkBookLookupItemResult, 'draft'> & {
    draft?: GeneratedBulkBookLookupItemResult['draft'] extends infer Draft
        ? Draft extends { isbn_not_applicable: boolean }
            ? Omit<Draft, 'isbn_not_applicable'> & Partial<Pick<Draft, 'isbn_not_applicable'>>
            : Draft
        : never
}

export type BulkBookLookupRequest =
    Schemas['BulkBookLookupRequest']

export type BulkBookLookupResponse = Omit<Schemas['BulkBookLookupResponse'], 'items'> & {
    items: BulkBookLookupItemResult[]
}

export type BulkBookLookupStatus =
    Schemas['BulkBookLookupStatus']

export type BulkShelfMoveRequest =
    Schemas['BulkShelfMoveRequest']

export type BulkShelfMoveResponse =
    Schemas['BulkShelfMoveResponse']

export type BulkBookStashRequest =
    Schemas['BulkBookStashRequest']
export type BulkBookStashResponse =
    Schemas['BulkBookStashResponse']
export type BulkStashApplyRequest =
    Schemas['BulkStashApplyRequest']
export type BulkStashApplyResponse =
    Schemas['BulkStashApplyResponse']
export type PlacementState =
    Schemas['PlacementState']

export type BookLookupDraft =
    Schemas['BookLookupDraft']

export type BookLookupResponse =
    Schemas['BookLookupResponse']

export type CheckoutRequest = Omit<Schemas['CheckoutRequest'], 'availability_override'> &
    Partial<Pick<Schemas['CheckoutRequest'], 'availability_override'>>

export type CheckinRequest =
    Schemas['CheckinRequest']

export type MarkReadRequest =
    Schemas['MarkReadRequest']

export type MarkUnreadRequest =
    Schemas['MarkUnreadRequest']

type GeneratedLoanRead = Schemas['LoanRead']
export type LoanRead = Omit<GeneratedLoanRead, 'feedback_present'> &
    Partial<Pick<GeneratedLoanRead, 'feedback_present'>>
export type LoanList = Omit<Schemas['LoanList'], 'items'> & { items: LoanRead[] }
export type LoanUpdate = Schemas['LoanUpdate']
export type LoanFeedbackWrite = Schemas['LoanFeedbackWrite']
export type LoanFeedbackRead = Schemas['LoanFeedbackRead']
export type LoanFeedbackList = Schemas['LoanFeedbackList']
export type BorrowerRatingSummary = Schemas['BorrowerRatingSummary']

export type LibrarySetupRead = Schemas['LibrarySetupRead']
export type CompleteLibrarySetupRequest = Schemas['CompleteLibrarySetupRequest']
export type LibrarySettingsRead = Schemas['LibrarySettingsRead']
export type LibrarySettingsUpdate = Schemas['LibrarySettingsUpdate']
export type SetBookAvailabilityRequest = Schemas['SetBookAvailabilityRequest']
export type SetBookFlagRequest = Schemas['SetBookFlagRequest']
export type BulkBookAvailabilityRequest = Schemas['BulkBookAvailabilityRequest']
export type BulkBookAvailabilityResponse = Omit<Schemas['BulkBookAvailabilityResponse'], 'items'> & { items: BookRead[] }
export type ReservationWrite = Schemas['ReservationWrite']
export type WorkRead = Schemas['WorkRead']
export type ResolveCodeRequest = Schemas['ResolveCodeRequest']
export type ResolveCodeResponse = Schemas['ResolveCodeResponse']
export type PhysicalItemSummary = Schemas['PhysicalItemSummary']

export type DashboardBorrowing =
    Schemas['DashboardBorrowing']

export type DashboardReading =
    Schemas['DashboardReading']

export type DashboardSummary =
    Schemas['DashboardSummary']

export type DashboardBreakdowns =
    Schemas['DashboardBreakdowns']

export type DashboardCountBucket =
    Schemas['DashboardCountBucket']

export type DashboardIncompleteMetadata =
    Schemas['DashboardIncompleteMetadata']

export type HealthResponse =
    Schemas['HealthResponse']

export type VersionResponse =
    Schemas['VersionResponse']

export type ErrorDetail =
    Schemas['ErrorDetail']

export type HTTPValidationError =
    Schemas['HTTPValidationError']

export type ValidationError =
    Schemas['ValidationError']

export type CategoryRead =
    Schemas['CategoryRead']

export type CategoryCreate =
    Schemas['CategoryCreate']

export type CategoryUpdate =
    Schemas['CategoryUpdate']

export type BookCategoryRead =
    Schemas['BookCategoryRead']

export type ShelfCreate =
    Schemas['ShelfCreate']

export type ShelfUpdate =
    Schemas['ShelfUpdate']

export type ShelfRead =
    Schemas['ShelfRead']

export type AuthorCreate =
    Schemas['PersonCreate']

export type AuthorList =
    Schemas['PersonList']

export type AuthorRead =
    Schemas['PersonRead']

export type AuthorUpdate =
    Schemas['PersonUpdate']

export type WishlistCreate =
    Schemas['WishlistCreate']

export type WishlistUpdate =
    Schemas['WishlistUpdate']

export type WishlistRead =
    Schemas['WishlistRead']

export type WishlistList =
    Schemas['WishlistList']

export type WishlistBookCreate =
    Schemas['WishlistBookCreate']

export type WishlistBookRead =
    Schemas['WishlistBookRead']

export type WishlistBookList =
    Schemas['WishlistBookList']

export type WishlistBookUpdate =
    Schemas['WishlistBookUpdate']

export type WishlistBookStatus =
    Schemas['WishlistBookStatus']

export type CollectionCreate =
    Schemas['CollectionCreate']

export type CollectionUpdate =
    Schemas['CollectionUpdate']

export type CollectionRead =
    Schemas['CollectionRead']

export type CollectionList =
    Schemas['CollectionList']

export type CollectionBookCreate =
    Schemas['CollectionBookCreate']

export type CollectionBookRead =
    Schemas['CollectionBookRead']

export type CollectionBookList =
    Schemas['CollectionBookList']

export type CollectionBookUpdate =
    Schemas['CollectionBookUpdate']

export type CollectionBookReorder =
    Pick<CollectionBookUpdate, 'order_num'>

export type Status =
    Schemas['Status']

export type AlbumCreate = Schemas['AlbumCreate']
export type AlbumUpdate = Schemas['AlbumUpdate']
export type AlbumRead = Schemas['AlbumRead']
export type AlbumList = Schemas['AlbumList']
export type AlbumLookupResponse = Schemas['AlbumLookupResponse']
export type AlbumLookupDraft = Schemas['AlbumLookupDraft']
export type BulkAlbumLookupRequest = Schemas['BulkAlbumLookupRequest']
export type BulkAlbumLookupResponse = Schemas['BulkAlbumLookupResponse']
export type BulkAlbumLookupItemResult = Schemas['BulkAlbumLookupItemResult']
export type BulkAlbumImportRequest = Schemas['BulkAlbumImportRequest']
export type BulkAlbumImportResponse = Schemas['BulkAlbumImportResponse']
export type AlbumTrackWrite = Schemas['AlbumTrackWrite']
export type AlbumArtworkRefetchRequest = Schemas['AlbumArtworkRefetchRequest']
export type AlbumStatus = Schemas['AlbumStatus']
export type MediaFormat = Schemas['MediaFormat']
export type MarkPlayedRequest = Schemas['MarkPlayedRequest']
export type ArtistCreate = Schemas['PersonCreate']
export type ArtistUpdate = Schemas['PersonUpdate']
export type ArtistRead = Schemas['PersonRead']
export type ArtistList = Schemas['PersonList']
export type GenreCreate = Schemas['GenreCreate']
export type GenreUpdate = Schemas['GenreUpdate']
export type GenreRead = Schemas['GenreRead']
export type WishlistAlbumCreate = Schemas['WishlistAlbumCreate']
export type WishlistItemRead = Schemas['WishlistItemRead']
export type WishlistItemList = Schemas['WishlistItemList']
export type WishlistAlbumUpdate = Schemas['WishlistAlbumUpdate']
export type WishlistAlbumMoveRequest = Schemas['WishlistAlbumMoveRequest']
export type WishlistAlbumMoveResponse = Schemas['WishlistAlbumMoveResponse']
export type CollectionAlbumCreate = Schemas['CollectionAlbumCreate']
export type CollectionAlbumRead = Schemas['CollectionAlbumRead']
export type CollectionAlbumList = Schemas['CollectionAlbumList']
export type CollectionAlbumUpdate = Schemas['CollectionAlbumUpdate']
export type AlbumPlacementState = Schemas['AlbumPlacementState']
export type QuoteCreate = Schemas['QuoteCreate']
export type QuoteUpdate = Schemas['QuoteUpdate']
export type QuoteRead = Schemas['QuoteRead']
export type QuoteList = Schemas['QuoteList']
export type QuoteOrderRequest = Schemas['QuoteOrderRequest']
