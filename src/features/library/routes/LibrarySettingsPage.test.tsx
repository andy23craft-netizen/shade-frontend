import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../api/apiErrors'
import { LibrarySettingsPage } from './LibrarySettingsPage'

const mutate = vi.fn(), reset = vi.fn(), settingsRefetch = vi.fn(), shelvesRefetch = vi.fn()
const settingsState = { data: { enable_loans: true, book_tbr_shelf_ids: ['shelf-tbr'], reserved_shelf_id: null as string | null }, isPending: false, isError: false, error: null as unknown, refetch: settingsRefetch }
const shelvesState = { data: [
    { shelf_id: 'system-unknown', common_name: 'unknown', created_date: '', updated_date: '' },
    { shelf_id: 'system-removed', common_name: 'removed', created_date: '', updated_date: '' },
    { shelf_id: 'shelf-tbr', common_name: 'new_name_after_rename', created_date: '', updated_date: '' },
    { shelf_id: 'shelf-reserved', common_name: 'front_desk', created_date: '', updated_date: '' },
], isPending: false, isError: false, error: null as unknown, refetch: shelvesRefetch }
const mutationState = { mutate, reset, isPending: false, isError: false, isSuccess: false, error: null as unknown }

vi.mock('../../../api/libraryQueries', () => ({ useLibrarySettings: () => settingsState, useUpdateLibrarySettings: () => mutationState }))
vi.mock('../../../api/shelvesQueries', () => ({ useShelves: () => shelvesState }))

describe('LibrarySettingsPage', () => {
    beforeEach(() => { vi.clearAllMocks(); mutationState.isError = false; mutationState.isSuccess = false; mutationState.error = null })

    it('uses stable shelf IDs, reflects renamed labels, and excludes system shelves', () => {
        render(<LibrarySettingsPage />)
        expect(screen.getByRole('checkbox', { name: 'New Name After Rename' })).toBeChecked()
        expect(screen.queryByText('Unknown')).not.toBeInTheDocument()
        expect(screen.queryByText('Removed')).not.toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Reserved / will-call shelf'), { target: { value: 'shelf-reserved' } })
        fireEvent.change(screen.getByLabelText('Circulation'), { target: { value: 'disabled' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save settings' }))
        expect(mutate).toHaveBeenCalledWith({ enable_loans: false, reserved_shelf_id: 'shelf-reserved' })
        expect(screen.getByText(/does not delete loan history/i)).toBeInTheDocument()
    })

    it('shows server field validation beside its control', () => {
        mutationState.isError = true
        mutationState.error = new ApiError({ kind: 'validation', status: 422, message: 'Invalid settings', fieldErrors: [{ field: 'reserved_shelf_id', message: 'Reserved shelf must be distinct' }] })
        render(<LibrarySettingsPage />)
        expect(screen.getByText('Reserved shelf must be distinct')).toBeInTheDocument()
    })
})
