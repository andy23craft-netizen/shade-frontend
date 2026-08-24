import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type BookCreate = Schemas['BookCreate']
export type BookUpdate = Schemas['BookUpdate']
export type BookRead = Schemas['BookRead']
export type BookList = Schemas['BookList']

export type BulkShelfMoveRequest =
    Schemas['BulkShelfMoveRequest']

export type BulkShelfMoveResponse =
    Schemas['BulkShelfMoveResponse']

export type BookLookupDraft =
    Schemas['BookLookupDraft']

export type BookLookupResponse =
    Schemas['BookLookupResponse']

export type CheckoutRequest =
    Schemas['CheckoutRequest']

export type CheckinRequest =
    Schemas['CheckinRequest']

export type MarkReadRequest =
    Schemas['MarkReadRequest']

export type LoanRead = Schemas['LoanRead']
export type LoanList = Schemas['LoanList']

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

export type BookCategoryRead =
    Schemas['BookCategoryRead']

export type ShelfCreate =
    Schemas['ShelfCreate']

export type ShelfUpdate =
    Schemas['ShelfUpdate']

export type ShelfRead =
    Schemas['ShelfRead']

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

export type CollectionBookReorder =
    Schemas['CollectionBookReorder']

export type Status =
    Schemas['Status']

