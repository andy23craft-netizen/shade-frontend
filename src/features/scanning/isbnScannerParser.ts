import {
    isValidIsbn,
} from '../books/utils/isbn'

export interface IsbnScannerParserOptions {
    timeoutMs?: number
}

export interface IsbnScannerParserResult {
    isbn: string | null
}

const DEFAULT_TIMEOUT_MS = 100

const ISBN_CHARACTER_PATTERN =
    /^[0-9Xx -]$/

export class IsbnScannerParser {
    private readonly timeoutMs: number

    private buffer = ''

    private timeoutId:
        ReturnType<typeof setTimeout> | null =
        null

    private generation = 0

    private lastInputAt: number | null = null

    constructor(
        options: IsbnScannerParserOptions = {},
    ) {
        this.timeoutMs =
            options.timeoutMs ??
            DEFAULT_TIMEOUT_MS
    }

    handleKey(
        key: string,
        now: number = Date.now(),
    ): IsbnScannerParserResult {
        if (
            this.lastInputAt !== null &&
            now - this.lastInputAt >
            this.timeoutMs
        ) {
            this.resetBuffer()
        }

        this.lastInputAt = now

        if (key === 'Enter') {
            return this.finish()
        }

        if (
            key.length !== 1 ||
            !ISBN_CHARACTER_PATTERN.test(key)
        ) {
            return {
                isbn: null,
            }
        }

        this.buffer += key

        this.scheduleTimeout()

        return {
            isbn: null,
        }
    }

    cancel(): void {
        this.generation += 1
        this.resetBuffer()
    }

    reset(): void {
        this.generation += 1
        this.resetBuffer()
    }

    private finish(): IsbnScannerParserResult {
        const candidate = this.buffer.trim()

        this.resetBuffer()

        if (!candidate) {
            return {
                isbn: null,
            }
        }

        if (!isValidIsbn(candidate)) {
            return {
                isbn: null,
            }
        }

        return {
            isbn: candidate,
        }
    }

    private scheduleTimeout(): void {
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId)
        }

        const generation = this.generation

        this.timeoutId = setTimeout(() => {
            if (
                generation !== this.generation
            ) {
                return
            }

            this.resetBuffer()
        }, this.timeoutMs)
    }

    private resetBuffer(): void {
        this.buffer = ''
        this.lastInputAt = null

        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }
}
