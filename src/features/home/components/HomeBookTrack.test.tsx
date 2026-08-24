import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    describe,
    expect,
    it,
} from 'vitest'

import {
    HomeBookTrack,
} from './HomeBookTrack'

function renderTrack() {
    render(
        <HomeBookTrack ariaLabel="Staff Picks books">
            <div>First</div>
            <div>Second</div>
            <div>Third</div>
            <div>Fourth</div>
        </HomeBookTrack>,
    )
}

describe('HomeBookTrack', () => {
    it('moves forward and backward through the deck', () => {
        renderTrack()

        expect(
            screen.getByText('1 / 4'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Next Staff Picks books',
            }),
        )

        expect(
            screen.getByText('2 / 4'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previous Staff Picks books',
            }),
        )

        expect(
            screen.getByText('1 / 4'),
        ).toBeInTheDocument()
    })

    it('wraps in both directions', () => {
        renderTrack()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Previous Staff Picks books',
            }),
        )

        expect(
            screen.getByText('4 / 4'),
        ).toBeInTheDocument()

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Next Staff Picks books',
            }),
        )

        expect(
            screen.getByText('1 / 4'),
        ).toBeInTheDocument()
    })

    it('moves through the deck with horizontal swipes', () => {
        const { container } = render(
            <HomeBookTrack ariaLabel="Staff Picks books">
                <div>First</div>
                <div>Second</div>
                <div>Third</div>
            </HomeBookTrack>,
        )

        const stack = container.querySelector(
            '.home-book-deck__stack',
        )

        expect(stack).not.toBeNull()

        fireEvent.pointerDown(stack!, {
            clientX: 200,
        })

        fireEvent.pointerUp(stack!, {
            clientX: 100,
        })

        expect(
            screen.getByText('2 / 3'),
        ).toBeInTheDocument()

        fireEvent.pointerDown(stack!, {
            clientX: 100,
        })

        fireEvent.pointerUp(stack!, {
            clientX: 200,
        })

        expect(
            screen.getByText('1 / 3'),
        ).toBeInTheDocument()
    })

    it('ignores short gestures and cancelled gestures', () => {
        const { container } = render(
            <HomeBookTrack ariaLabel="Staff Picks books">
                <div>First</div>
                <div>Second</div>
            </HomeBookTrack>,
        )

        const stack = container.querySelector(
            '.home-book-deck__stack',
        )

        expect(stack).not.toBeNull()

        fireEvent.pointerDown(stack!, {
            clientX: 100,
        })

        fireEvent.pointerUp(stack!, {
            clientX: 80,
        })

        expect(
            screen.getByText('1 / 2'),
        ).toBeInTheDocument()

        fireEvent.pointerDown(stack!, {
            clientX: 100,
        })

        fireEvent.pointerCancel(stack!)

        fireEvent.pointerUp(stack!, {
            clientX: 0,
        })

        expect(
            screen.getByText('1 / 2'),
        ).toBeInTheDocument()
    })

    it('does not show navigation controls for one card', () => {
        render(
            <HomeBookTrack ariaLabel="Staff Picks books">
                <div>Only pick</div>
            </HomeBookTrack>,
        )

        expect(
            screen.getByText('Only pick'),
        ).toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Next Staff Picks books',
            }),
        ).not.toBeInTheDocument()

        expect(
            screen.queryByRole('button', {
                name: 'Previous Staff Picks books',
            }),
        ).not.toBeInTheDocument()
    })
})
