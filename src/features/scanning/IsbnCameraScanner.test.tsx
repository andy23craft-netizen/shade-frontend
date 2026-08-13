import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    BarcodeFormat,
} from '@zxing/browser'
import {
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest'

const {
    mockDecodeFromConstraints,
    mockStop,
    mockListVideoInputDevices,
    MockBrowserMultiFormatReader,
    cameraScanTimeoutMs,
} = vi.hoisted(() => {
    const mockDecodeFromConstraints = vi.fn()
    const mockStop = vi.fn()
    const mockListVideoInputDevices = vi.fn()
    const cameraScanTimeoutMs = 20

    const MockBrowserMultiFormatReader =
        vi.fn().mockImplementation(
            function BrowserMultiFormatReader(
                this: {
                    decodeFromConstraints: typeof mockDecodeFromConstraints
                },
            ) {
                this.decodeFromConstraints =
                    mockDecodeFromConstraints
            },
        )

    Object.assign(
        MockBrowserMultiFormatReader,
        {
            listVideoInputDevices:
                mockListVideoInputDevices,
        },
    )

    return {
        mockDecodeFromConstraints,
        mockStop,
        mockListVideoInputDevices,
        MockBrowserMultiFormatReader,
        cameraScanTimeoutMs,
    }
})

vi.mock('@zxing/browser', async () => {
    const actual = await vi.importActual<
        typeof import('@zxing/browser')
    >('@zxing/browser')

    return {
        ...actual,
        BrowserMultiFormatReader:
            MockBrowserMultiFormatReader,
    }
})

vi.mock('./isbnCameraCapture', async () => {
    const actual = await vi.importActual<
        typeof import('./isbnCameraCapture')
    >('./isbnCameraCapture')

    return {
        ...actual,
        CAMERA_SCAN_TIMEOUT_MS:
            cameraScanTimeoutMs,
    }
})

import { IsbnCameraScanner } from './IsbnCameraScanner'

function createMockMediaStream() {
    const track =
        new EventTarget() as MediaStreamTrack

    const stream = {
        getTracks: vi.fn(() => [track]),
    } as unknown as MediaStream

    return {
        stream,
        track,
    }
}

function createResult(
    text: string,
    format: BarcodeFormat = BarcodeFormat.EAN_13,
) {
    return {
        getText: () => text,
        getBarcodeFormat: () => format,
    }
}

beforeEach(() => {
    mockDecodeFromConstraints.mockReset()
    mockStop.mockReset()
    mockListVideoInputDevices.mockReset()
    MockBrowserMultiFormatReader.mockClear()
    mockListVideoInputDevices.mockResolvedValue(
        [],
    )

    Object.defineProperty(
        window,
        'isSecureContext',
        {
            configurable: true,
            value: true,
        },
    )

    Object.defineProperty(
        navigator,
        'mediaDevices',
        {
            configurable: true,
            value: {
                getUserMedia: vi.fn(),
            },
        },
    )
})

describe('IsbnCameraScanner', () => {
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

    it('starts the camera with ISBN-only decode hints and rear-facing constraints', async () => {
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

        expect(
            MockBrowserMultiFormatReader,
        ).toHaveBeenCalledOnce()

        const hints =
            MockBrowserMultiFormatReader.mock
                .calls[0]?.[0] as Map<
                unknown,
                unknown
            >

        expect(
            [...(hints?.values() ?? [])],
        ).toEqual([[BarcodeFormat.EAN_13]])

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

    it('shows live-scan guidance after the camera starts', async () => {
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

        expect(
            screen.getByText(
                'Starting camera…',
            ),
        ).toBeInTheDocument()

        expect(
            await screen.findByText(
                /Point the camera at the ISBN barcode/,
            ),
        ).toBeInTheDocument()

        expect(
            screen.queryByText(
                'Starting camera…',
            ),
        ).not.toBeInTheDocument()
    })

    it('passes a detected ISBN to onDetected', async () => {
        let decodeCallback:
            | ((result: {
                  getText: () => string
                  getBarcodeFormat: () => BarcodeFormat
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

        decodeCallback?.(
            createResult(
                '  978-0-441-17271-9  ',
            ),
        )

        expect(onDetected).toHaveBeenCalledOnce()
        expect(onDetected).toHaveBeenCalledWith(
            '978-0-441-17271-9',
        )
        expect(mockStop).toHaveBeenCalledOnce()
    })

    it('ignores non-ISBN symbologies such as UPC', async () => {
        let decodeCallback:
            | ((result: {
                  getText: () => string
                  getBarcodeFormat: () => BarcodeFormat
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

        decodeCallback?.(
            createResult(
                '9780441172719',
                BarcodeFormat.UPC_A,
            ),
        )

        expect(
            onDetected,
        ).not.toHaveBeenCalled()
        expect(mockStop).not.toHaveBeenCalled()
    })

    it('ignores an empty scan result', async () => {
        let decodeCallback:
            | ((result: {
                  getText: () => string
                  getBarcodeFormat: () => BarcodeFormat
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

        decodeCallback?.(
            createResult('   '),
        )

        expect(
            onDetected,
        ).not.toHaveBeenCalled()
    })

    it('only accepts the first detected barcode', async () => {
        let decodeCallback:
            | ((result: {
                  getText: () => string
                  getBarcodeFormat: () => BarcodeFormat
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

        decodeCallback?.(
            createResult('9780441172719'),
        )

        decodeCallback?.(
            createResult('9780743273565'),
        )

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

    it('explains an insecure context without starting the camera', () => {
        Object.defineProperty(
            window,
            'isSecureContext',
            {
                configurable: true,
                value: false,
            },
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'Camera scanning needs a secure connection',
        )
        expect(
            mockDecodeFromConstraints,
        ).not.toHaveBeenCalled()
    })

    it('explains an unsupported browser without starting the camera', () => {
        Object.defineProperty(
            navigator,
            'mediaDevices',
            {
                configurable: true,
                value: undefined,
            },
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        expect(
            screen.getByRole('alert'),
        ).toHaveTextContent(
            'This browser does not support camera scanning',
        )
        expect(
            mockDecodeFromConstraints,
        ).not.toHaveBeenCalled()
    })

    it('explains a scan timeout while keeping the camera available', async () => {
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

        expect(
            await screen.findByText(
                /Point the camera at the ISBN barcode/,
            ),
        ).toBeInTheDocument()

        expect(
            await screen.findByText(
                'No ISBN barcode found',
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByLabelText(
                'ISBN camera',
            ),
        ).toBeInTheDocument()
        expect(
            screen.getByRole('button', {
                name: 'Keep scanning',
            }),
        ).toBeInTheDocument()
    })

    it('lets the user switch cameras when multiple devices exist', async () => {
        mockDecodeFromConstraints.mockResolvedValue(
            {
                stop: mockStop,
            },
        )

        mockListVideoInputDevices.mockResolvedValue(
            [
                {
                    deviceId: 'front',
                    kind: 'videoinput',
                    label: 'Front camera',
                    groupId: 'a',
                    toJSON: () => ({}),
                },
                {
                    deviceId: 'rear',
                    kind: 'videoinput',
                    label: 'Rear camera',
                    groupId: 'b',
                    toJSON: () => ({}),
                },
            ] as MediaDeviceInfo[],
        )

        render(
            <IsbnCameraScanner
                onDetected={vi.fn()}
                onCancel={vi.fn()}
            />,
        )

        const cameraSelect =
            await screen.findByLabelText(
                'Camera',
            )

        expect(cameraSelect).toBeInTheDocument()

        fireEvent.change(cameraSelect, {
            target: {
                value: 'rear',
            },
        })

        await vi.waitFor(() => {
            expect(
                mockDecodeFromConstraints,
            ).toHaveBeenCalledTimes(2)
        })

        const [
            constraints,
        ] =
            mockDecodeFromConstraints.mock
                .calls[1]

        expect(constraints).toEqual({
            video: {
                deviceId: {
                    exact: 'rear',
                },
            },
            audio: false,
        })
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
