import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HouseholdReadersSettings } from './HouseholdReadersSettings'

const state = { data: { items: [{ profile_id: 'owner', display_name: 'Alex', is_owner: true, created_date: '', updated_date: '' }, { profile_id: 'sam', display_name: 'Sam', is_owner: false, created_date: '', updated_date: '' }], household_mode_enabled: true }, isPending: false, isError: false, refetch: vi.fn() }
const create = { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false, error: null }
const update = { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false, error: null }
const remove = { mutate: vi.fn(), reset: vi.fn(), isPending: false, isError: false, error: null }

vi.mock('../../../api/householdProfilesQueries', () => ({
    useHouseholdProfiles: () => state,
    useCreateHouseholdProfile: () => create,
    useUpdateHouseholdProfile: () => update,
    useRemoveHouseholdProfile: () => remove,
}))

describe('HouseholdReadersSettings', () => {
    beforeEach(() => vi.clearAllMocks())

    it('trims names before creating a household reader', () => {
        render(<HouseholdReadersSettings />)
        fireEvent.change(screen.getByLabelText('Add household reader'), { target: { value: '  Jo  ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add reader' }))
        expect(create.mutate).toHaveBeenCalledWith({ display_name: 'Jo' }, expect.any(Object))
    })

    it('rejects case-insensitive duplicate names before mutating', () => {
        render(<HouseholdReadersSettings />)
        fireEvent.change(screen.getByLabelText('Add household reader'), { target: { value: ' sam ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add reader' }))
        expect(screen.getByText(/unique, ignoring letter case/i)).toBeInTheDocument()
        expect(create.mutate).not.toHaveBeenCalled()
    })

    it('requires an explicit removal outcome and target', () => {
        render(<HouseholdReadersSettings />)
        fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
        expect(screen.getByText(/Choose what to do with Sam/i)).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: /Reassign records and remove/i }))
        expect(remove.mutate).toHaveBeenCalledWith({ profileId: 'sam', outcome: { outcome: 'reassign', target_profile_id: 'owner' } }, expect.any(Object))
    })
})
