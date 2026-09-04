import { describe, expect, it } from 'vitest'

import { validateBorrower } from './borrowerEditModel'

describe('validateBorrower', () => {
    it('requires a nonblank borrower', () => {
        expect(validateBorrower('   ')).toEqual({
            borrower: 'Enter a borrower name.',
        })
    })

    it('limits borrowers to 255 characters', () => {
        expect(validateBorrower('a'.repeat(256))).toEqual({
            borrower: 'Borrower must be 255 characters or fewer.',
        })
    })

    it('accepts a valid borrower', () => {
        expect(validateBorrower('Corrected Name')).toEqual({})
    })
})
