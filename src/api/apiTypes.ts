import type { components } from './generated/openapi'

type Schemas = components['schemas']

export type BookCreate = Schemas['BookCreate']
export type BookUpdate = Schemas['BookUpdate']
export type BookRead = Schemas['BookRead']
export type BookList = Schemas['BookList']

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

export type HealthResponse =
    Schemas['HealthResponse']

export type ErrorDetail =
    Schemas['ErrorDetail']

export type HTTPValidationError =
    Schemas['HTTPValidationError']

export type ValidationError =
    Schemas['ValidationError']

export type Category =
    Schemas['Category']

export type ShelfRead =
    Schemas['ShelfRead']

export type Status =
    Schemas['Status']
