import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BorrowerName } from './BorrowerName'

describe('BorrowerName', () => {
    it('renders the name once as selectable semantic text', () => {
        const { container } = render(
            <BorrowerName>A Very Long Borrower Name</BorrowerName>,
        )

        const name = screen.getByText('A Very Long Borrower Name')

        expect(name).toHaveClass(
            'circulation-record-card__borrower-name',
        )
        expect(name).not.toHaveAttribute('aria-label')
        expect(name).not.toHaveAttribute('aria-hidden')
        expect(container).toHaveTextContent(
            'A Very Long Borrower Name',
        )
        expect(container.querySelectorAll('span')).toHaveLength(1)
    })
})
