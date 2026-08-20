import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import {
    IsbnScannerParser,
} from './isbnScannerParser'

describe('IsbnScannerParser', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    function scan(
        parser: IsbnScannerParser,
        value: string,
        start = 0,
    ) {
        let now = start

        for (const character of value) {
            parser.handleKey(
                character,
                now,
            )

            now += 10
        }

        return parser.handleKey(
            'Enter',
            now,
        )
    }

    it('captures a valid ISBN-13', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '9780441172719',
        )

        expect(result).toEqual({
            isbn: '9780441172719',
            consumed: true,
        })
    })

    it('captures a valid ISBN-10', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '0441172717',
        )

        expect(result).toEqual({
            isbn: '0441172717',
            consumed: true,
        })
    })

    it('captures a valid ISBN-10 with X as the check digit', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '080442957X',
        )

        expect(result).toEqual({
            isbn: '080442957X',
            consumed: true,
        })
    })


    it('preserves spaces and hyphens', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '978-0-441-17271-9',
        )

        expect(result).toEqual({
            isbn: '978-0-441-17271-9',
            consumed: true,
        })
    })

    it('rejects an invalid ISBN', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '0441172718',
        )

        expect(result).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('does not emit until Enter terminates the scan', () => {
        const parser =
            new IsbnScannerParser()

        for (const character of
            '9780441172719') {
            const result =
                parser.handleKey(character)

            expect(result).toEqual({
                isbn: null,
                consumed: true,
            })
        }

        const result =
            parser.handleKey('Enter')

        expect(result).toEqual({
            isbn: '9780441172719',
            consumed: true,
        })
    })

    it('ignores repeated Enter after a successful scan', () => {
        const parser =
            new IsbnScannerParser()

        const first = scan(
            parser,
            '9780441172719',
        )

        const second =
            parser.handleKey('Enter')

        const third =
            parser.handleKey('Enter')

        expect(first).toEqual({
            isbn: '9780441172719',
            consumed: true,
        })

        expect(second).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(third).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('cancels a partial scan', () => {
        const parser =
            new IsbnScannerParser()

        for (const character of
            '978044') {
            parser.handleKey(character)
        }

        parser.cancel()

        const result = scan(
            parser,
            '1172719',
        )

        expect(result).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('discards a partial scan after timeout', () => {
        const parser =
            new IsbnScannerParser({
                timeoutMs: 100,
            })

        parser.handleKey('9', 0)
        parser.handleKey('7', 10)
        parser.handleKey('8', 20)

        vi.advanceTimersByTime(101)

        const result = scan(
            parser,
            '0441172719',
            200,
        )

        expect(result).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('discards a candidate when input timing exceeds the threshold', () => {
        const parser =
            new IsbnScannerParser({
                timeoutMs: 100,
            })

        parser.handleKey('9', 0)
        parser.handleKey('7', 10)
        parser.handleKey('8', 20)

        parser.handleKey('0', 200)

        const result = scan(
            parser,
            '441172719',
            210,
        )

        expect(result).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('ignores unsupported characters', () => {
        const parser =
            new IsbnScannerParser()

        parser.handleKey('a', 0)
        parser.handleKey('!', 10)

        const result = scan(
            parser,
            '9780441172719',
            20,
        )

        expect(result).toEqual({
            isbn: '9780441172719',
            consumed: true,
        })
    })

    it('does not repair duplicate characters', () => {
        const parser =
            new IsbnScannerParser()

        const result = scan(
            parser,
            '97804411727199',
        )

        expect(result).toEqual({
            isbn: null,
            consumed: true,
        })
    })

    it('resets cleanly between scans', () => {
        const parser =
            new IsbnScannerParser()

        const first = scan(
            parser,
            '9780441172719',
        )

        const second = scan(
            parser,
            '9780743273565',
            500,
        )

        expect(first).toEqual({
            isbn: '9780441172719',
            consumed: true,
        })

        expect(second).toEqual({
            isbn: '9780743273565',
            consumed: true,
        })
    })

    it('reports whether each key was consumed', () => {
        const parser =
            new IsbnScannerParser()

        expect(
            parser.handleKey('9', 0),
        ).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(
            parser.handleKey('X', 10),
        ).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(
            parser.handleKey('-', 20),
        ).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(
            parser.handleKey(' ', 30),
        ).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(
            parser.handleKey('a', 40),
        ).toEqual({
            isbn: null,
            consumed: false,
        })

        expect(
            parser.handleKey('Tab', 50),
        ).toEqual({
            isbn: null,
            consumed: false,
        })
    })

    it('consumes Enter even when the candidate is invalid or empty', () => {
        const parser =
            new IsbnScannerParser()

        parser.handleKey('1', 0)

        expect(
            parser.handleKey('Enter', 10),
        ).toEqual({
            isbn: null,
            consumed: true,
        })

        expect(
            parser.handleKey('Enter', 20),
        ).toEqual({
            isbn: null,
            consumed: true,
        })
    })
})
