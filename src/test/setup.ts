import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

afterEach(() => {
    cleanup()
})

function polyfillDialog() {
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
