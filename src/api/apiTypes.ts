import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type BookCreate = Schemas['BookCreate']
export type BookUpdate = Schemas['BookUpdate']
export type BookRead = Schemas['BookRead']
export type BookList = Schemas['BookList']

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

export type BulkBookLookupItemResult =
    Schemas['BulkBookLookupItemResult']

export type BulkBookLookupRequest =
    Schemas['BulkBookLookupRequest']

export type BulkBookLookupResponse =
    Schemas['BulkBookLookupResponse']

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
