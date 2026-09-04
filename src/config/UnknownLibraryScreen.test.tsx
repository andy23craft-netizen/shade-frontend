import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { UnknownLibraryScreen } from './UnknownLibraryScreen'

describe('UnknownLibraryScreen', () => {
    it('renders a generic recovery message without a library switcher', () => {
        render(<UnknownLibraryScreen hostname="pat.example.test" />)

        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Library not found',
            }),
        ).toBeInTheDocument()
        expect(screen.getByText('Host: pat.example.test')).toBeInTheDocument()
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
})
