import {
    afterEach,
    describe,
    expect,
    it,
} from 'vitest'
import {
    clearCurrentToken,
    getCurrentToken,
    setCurrentToken,
} from './connectionToken'

describe('connection token', () => {
    afterEach(() => {
        clearCurrentToken()
    })

    it('starts without a token', () => {
        expect(
            getCurrentToken(),
        ).toBeNull()
    })

    it('stores and returns the current token', () => {
        setCurrentToken('token-one')

        expect(
            getCurrentToken(),
        ).toBe('token-one')
    })

    it('replaces the current token', () => {
        setCurrentToken('token-one')
        setCurrentToken('token-two')

        expect(
            getCurrentToken(),
        ).toBe('token-two')
    })

    it('clears the current token', () => {
        setCurrentToken('token-one')
        clearCurrentToken()

        expect(
            getCurrentToken(),
        ).toBeNull()
    })
})
