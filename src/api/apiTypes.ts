import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type BookCreate = Omit<Schemas['BookCreate'], 'isbn_not_applicable'> &
    Partial<Pick<Schemas['BookCreate'], 'isbn_not_applicable'>>
export type BookUpdate = Schemas['BookUpdate']
type GeneratedBookRead = Schemas['BookRead']
export type BookRead = Omit<GeneratedBookRead, 'borrower_rating' | 'isbn_not_applicable' | 'work_id'> &
    Partial<Pick<GeneratedBookRead, 'borrower_rating' | 'isbn_not_applicable' | 'work_id'>>
export type BookList = Omit<Schemas['BookList'], 'items'> & { items: BookRead[] }

export type BulkBookCatalogState =
    Schemas['BulkBookCatalogState']

export type BulkBookImportAction =
    Schemas['BulkBookImportAction']

export type BulkBookImportItemRequest =
    Schemas['BulkBookImportItemRequest']

export type BulkBookImportItemResult =
    Schemas['BulkBookImportItemResult']

export type BulkBookImportRequest =
    Schemas['BulkBookImportRequest']

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
export type ReservationWrite = Schemas['ReservationWrite']
export type WorkRead = Schemas['WorkRead']

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
    Schemas['AuthorCreate']

export type AuthorList =
    Schemas['AuthorList']

export type AuthorRead =
    Schemas['AuthorRead']

export type AuthorUpdate =
    Schemas['AuthorUpdate']

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
export type AlbumTrackWrite = Schemas['AlbumTrackWrite']
export type AlbumArtworkRefetchRequest = Schemas['AlbumArtworkRefetchRequest']
export type AlbumStatus = Schemas['AlbumStatus']
export type MediaFormat = Schemas['MediaFormat']
export type MarkPlayedRequest = Schemas['MarkPlayedRequest']
export type ArtistCreate = Schemas['ArtistCreate']
export type ArtistUpdate = Schemas['ArtistUpdate']
export type ArtistRead = Schemas['ArtistRead']
export type ArtistList = Schemas['ArtistList']
export type GenreCreate = Schemas['GenreCreate']
export type GenreUpdate = Schemas['GenreUpdate']
export type GenreRead = Schemas['GenreRead']
export type WishlistAlbumCreate = Schemas['WishlistAlbumCreate']
export type WishlistItemRead = Schemas['WishlistItemRead']
export type WishlistItemList = Schemas['WishlistItemList']
