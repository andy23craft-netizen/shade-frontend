import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'

vi.stubEnv('VITE_API_SECRET_KEY', 'test-api-token')

afterEach(() => {
    cleanup()
})

function polyfillDialog() {
    if (typeof HTMLDialogElement === 'undefined') {
        return
    }

    const DialogPrototype = HTMLDialogElement.prototype as HTMLDialogElement & {
        showModal?: () => void
        close?: () => void
    }

    if (typeof DialogPrototype.showModal === 'function') {
        return
    }

    DialogPrototype.showModal = function showModal(this: HTMLDialogElement) {
        this.setAttribute('open', '')
    }

    DialogPrototype.close = function close(this: HTMLDialogElement) {
        this.removeAttribute('open')
        this.dispatchEvent(new Event('close'))
    }
}

polyfillDialog()
