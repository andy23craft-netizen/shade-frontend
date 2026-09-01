import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { MembershipNotesEditor } from './MembershipNotesEditor'

describe('MembershipNotesEditor', () => {
    it('saves trimmed contextual notes', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)
        render(<MembershipNotesEditor label="Collection description" notes="Old" onSave={onSave} />)
        fireEvent.click(screen.getByRole('button', { name: 'Edit Description' }))
        fireEvent.change(screen.getByLabelText('Collection description'), { target: { value: '  New context  ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save Description' }))
        await waitFor(() => expect(onSave).toHaveBeenCalledWith('New context'))
    })

    it('sends null when clearing notes and can cancel without saving', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined)
        render(<MembershipNotesEditor label="Wishlist description" notes="Old" onSave={onSave} />)
        fireEvent.click(screen.getByRole('button', { name: 'Edit Description' }))
        fireEvent.change(screen.getByLabelText('Wishlist description'), { target: { value: '   ' } })
        fireEvent.click(screen.getByRole('button', { name: 'Save Description' }))
        await waitFor(() => expect(onSave).toHaveBeenCalledWith(null))

        fireEvent.click(screen.getByRole('button', { name: 'Edit Description' }))
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
        expect(onSave).toHaveBeenCalledTimes(1)
    })
})
