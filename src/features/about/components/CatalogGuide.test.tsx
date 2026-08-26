import {
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
} from 'vitest'

import { CatalogGuide } from './CatalogGuide'
import { MemoryRouter } from 'react-router-dom'

function renderCatalogGuide() {
    return render(
        <MemoryRouter>
            <CatalogGuide />
        </MemoryRouter>,
    )
}

describe('CatalogGuide', () => {
    it('opens the catalog guide as a dialog', async () => {
        renderCatalogGuide()

        const openButton = screen.getByRole(
            'button',
            {
                name: 'How to Use This Library',
            },
        )

        fireEvent.click(openButton)

        const dialog = await screen.findByRole(
            'dialog',
        )

        expect(dialog).toHaveAttribute(
            'open',
        )

        expect(
            screen.getByRole('heading', {
                level: 2,
                name: 'How to Use This Library',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Return Card',
            }),
        ).toHaveFocus()
    })

    it('returns focus to the catalog drawer when the card is returned', async () => {
        renderCatalogGuide()

        const openButton = screen.getByRole(
            'button',
            {
                name: 'How to Use This Library',
            },
        )

        fireEvent.click(openButton)

        const returnButton =
            await screen.findByRole(
                'button',
                {
                    name: 'Return Card',
                },
            )

        fireEvent.click(returnButton)

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog'),
            ).not.toBeInTheDocument()

            expect(openButton).toHaveFocus()
        })
    })

    it('closes when the native dialog cancel event fires', async () => {
        renderCatalogGuide()

        const openButton = screen.getByRole(
            'button',
            {
                name: 'How to Use This Library',
            },
        )

        fireEvent.click(openButton)

        const dialog =
            await screen.findByRole('dialog')

        fireEvent(
            dialog,
            new Event('cancel', {
                bubbles: false,
                cancelable: true,
            }),
        )

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog'),
            ).not.toBeInTheDocument()

            expect(openButton).toHaveFocus()
        })
    })

    it('closes when the backdrop is clicked', async () => {
        renderCatalogGuide()

        const openButton = screen.getByRole(
            'button',
            {
                name: 'How to Use This Library',
            },
        )

        fireEvent.click(openButton)

        const dialog =
            await screen.findByRole('dialog')

        fireEvent.click(dialog)

        await waitFor(() => {
            expect(
                screen.queryByRole('dialog'),
            ).not.toBeInTheDocument()

            expect(openButton).toHaveFocus()
        })
    })

    it('links administration guidance to Manage Collection', async () => {
        renderCatalogGuide()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'How to Use This Library',
            }),
        )

        const dialog =
            await screen.findByRole('dialog')

        expect(
            dialog.querySelector(
                'a[href="/collection/manage"]',
            ),
        ).toHaveTextContent(
            'Manage Collection',
        )
    })

    it('wraps focus from the first dialog control on Shift+Tab', async () => {
        renderCatalogGuide()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'How to Use This Library',
            }),
        )

        const dialog =
            await screen.findByRole('dialog')

        const firstLink =
            screen.getByRole('link', {
                name: 'Browse the collection',
            })

        firstLink.focus()

        fireEvent.keyDown(dialog, {
            key: 'Tab',
            shiftKey: true,
        })

        expect(
            screen.getByRole('button', {
                name: 'Return Card',
            }),
        ).toHaveFocus()
    })

    it('wraps focus from the last dialog control on Tab', async () => {
        renderCatalogGuide()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'How to Use This Library',
            }),
        )

        const dialog =
            await screen.findByRole('dialog')

        const returnButton =
            screen.getByRole('button', {
                name: 'Return Card',
            })

        returnButton.focus()

        fireEvent.keyDown(dialog, {
            key: 'Tab',
        })

        expect(
            screen.getByRole('link', {
                name: 'Browse the collection',
            }),
        ).toHaveFocus()
    })
})
