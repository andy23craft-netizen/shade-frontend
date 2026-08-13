import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

import { IsbnCameraScanner } from './IsbnCameraScanner'

const mockDecodeFromConstraints =
    vi.fn()

const mockStop = vi.fn()

function createMockMediaStream() {
    const track = new EventTarget() as MediaStreamTrack

    const stream = {
        getTracks: vi.fn(() => [track]),
    } as unknown as MediaStream

    return {
        stream,
        track,
    }
}

vi.mock('@zxing/browser', () => ({
    BrowserMultiFormatReader:
        class BrowserMultiFormatReader {
            decodeFromConstraints =
                mockDecodeFromConstraints
        },
}))

beforeEach(() => {
    mockDecodeFromConstraints.mockReset()
    mockStop.mockReset()
})

describe('IsbnScanner', () => {
    it('renders the scanner and cancel button', () => {
        mockDecodeFromConstraints.mockResolvedValue(
            {
                stop: mockStop,
            },
        )

        const onDetected = vi.fn()
        const onCancel = vi.fn()

        render(
            <IsbnCameraScanner
                onDetected={onDetected}
                onCancel={onCancel}
            />,
        )

        expect(
            screen.getByRole('heading', {
                name: 'Scan ISBN',
            }),
        ).toBeInTheDocument()

        expect(
            screen.getByLabelText(
                'ISBN camera',
            ),
        ).toBeInTheDocument()

        expect(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        ).toBeInTheDocument()
    })

    it('calls onCancel when Cancel is clicked', () => {
        mockDecodeFromConstraints.mockResolvedValue(
            {
                stop: mockStop,
            },
        )

        const onDetected = vi.fn()
        const onCancel = vi.fn()

        render(
            <IsbnCameraScanner
                onDetected={onDetected}
                onCancel={onCancel}
            />,
        )

        fireEvent.click(
            screen.getByRole('button', {
                name: 'Cancel',
            }),
        )

        expect(onCancel).toHaveBeenCalledOnce()
        expect(onDetected).not.toHaveBeenCalled()
    })

    it('starts the camera with the rear-facing constraint', async () => {
        mockDecodeFromConstraints.mockResolvedValue(
            {
                stop: mockStop,
            },
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                mockDecodeFromConstraints,
            ).toHaveBeenCalledOnce()
        })

        const [
            constraints,
            videoElement,
        ] =
            mockDecodeFromConstraints.mock
                .calls[0]

        expect(constraints).toEqual({
            video: {
                facingMode: {
                    ideal: 'environment',
                },
            },
            audio: false,
        })

        expect(videoElement).toBe(
            screen.getByLabelText(
                'ISBN camera',
            ),
        )
    })

    it('passes a detected ISBN to onDetected', async () => {
        let decodeCallback:
            | ((result: {
            getText: () => string
        } | null) => void)
            | undefined

        mockDecodeFromConstraints.mockImplementation(
            (
                _constraints,
                _video,
                callback,
            ) => {
                decodeCallback = callback

                return Promise.resolve({
                    stop: mockStop,
                })
            },
        )

        const onDetected = vi.fn()

        render(
            <IsbnCameraScanner
                onDetected={onDetected}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                decodeCallback,
            ).toBeDefined()
        })

        decodeCallback?.({
            getText: () =>
                '  978-0-441-17271-9  ',
        })

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '978-0-441-17271-9',
        )
        expect(mockStop).toHaveBeenCalledOnce()

    })

    it('ignores an empty scan result', async () => {
        let decodeCallback:
            | ((result: {
            getText: () => string
        } | null) => void)
            | undefined

        mockDecodeFromConstraints.mockImplementation(
            (
                _constraints,
                _video,
                callback,
            ) => {
                decodeCallback = callback

                return Promise.resolve({
                    stop: mockStop,
                })
            },
        )

        const onDetected = vi.fn()

        render(
            <IsbnCameraScanner
                onDetected={onDetected}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                decodeCallback,
            ).toBeDefined()
        })

        decodeCallback?.({
            getText: () => '   ',
        })

        expect(
            onDetected,
        ).not.toHaveBeenCalled()
    })

    it('only accepts the first detected barcode', async () => {
        let decodeCallback:
            | ((result: {
            getText: () => string
        } | null) => void)
            | undefined

        mockDecodeFromConstraints.mockImplementation(
            (
                _constraints,
                _video,
                callback,
            ) => {
                decodeCallback = callback

                return Promise.resolve({
                    stop: mockStop,
                })
            },
        )

        const onDetected = vi.fn()

        render(
            <IsbnCameraScanner
                onDetected={onDetected}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                decodeCallback,
            ).toBeDefined()
        })

        decodeCallback?.({
            getText: () =>
                '9780441172719',
        })

        decodeCallback?.({
            getText: () =>
                '9780743273565',
        })

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '9780441172719',
        )
    })

    it('shows a camera permission error', async () => {
        mockDecodeFromConstraints.mockRejectedValue(
            new DOMException(
                'Permission denied',
                'NotAllowedError',
            ),
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'Camera access was denied.',
        )
    })

    it('shows a no-camera error', async () => {
        mockDecodeFromConstraints.mockRejectedValue(
            new DOMException(
                'No camera',
                'NotFoundError',
            ),
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'No camera was found on this device.',
        )
    })

    it('shows a generic camera error', async () => {
        mockDecodeFromConstraints.mockRejectedValue(
            new Error('Camera failed'),
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            await screen.findByRole('alert'),
        ).toHaveTextContent(
            'The camera could not be started.',
        )
    })

    it('stops the scanner when unmounted', async () => {
        mockDecodeFromConstraints.mockResolvedValue(
            {
                stop: mockStop,
            },
        )

        const { unmount } = render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                mockDecodeFromConstraints,
            ).toHaveBeenCalledOnce()
        })

        unmount()

        expect(mockStop).toHaveBeenCalledOnce()
    })

    it('stops the scanner when the media track ends', async () => {
        const {
            stream,
            track,
        } = createMockMediaStream()

        mockDecodeFromConstraints.mockImplementation(
            async (
                _constraints,
                videoElement,
            ) => {
                ;(
                    videoElement as HTMLVideoElement
                ).srcObject = stream

                return {
                    stop: mockStop,
                }
            },
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        await vi.waitFor(() => {
            expect(
                mockDecodeFromConstraints,
            ).toHaveBeenCalledOnce()
        })

        track.dispatchEvent(
            new Event('ended'),
        )

        expect(mockStop).toHaveBeenCalledOnce()
    })
})
