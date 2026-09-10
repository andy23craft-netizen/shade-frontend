import type { Options, TypeNumber } from 'qr-code-styling'

import type { LibraryId } from '../../config/libraryContext'
import stylingOptions from './labelQrOptions.json'

const configuredOptions = stylingOptions as typeof stylingOptions & {
    qrOptions: typeof stylingOptions.qrOptions & { typeNumber: string }
}

interface LabelQrPalette {
    dotStart: string
    dotEnd: string
    finder: string
}

const LABEL_QR_PALETTES: Readonly<Record<LibraryId, LabelQrPalette>> = {
    andy: { dotStart: '#5b0000', dotEnd: '#006200', finder: '#000000' },
    dalmo: { dotStart: '#65164e', dotEnd: '#003642', finder: '#002f39' },
    jamie: { dotStart: '#672006', dotEnd: '#e85d18', finder: '#672006' },
}

function getBookLabelQrPalette(libraryId: LibraryId | null): LabelQrPalette {
    return LABEL_QR_PALETTES[libraryId ?? 'andy']
}

/**
 * The visual settings exported from qr-code-styling. The data field is
 * deliberately replaced for each copy: labels must encode a Shade book value,
 * never a public site URL.
 */
export function getBookLabelQrCenterImage(libraryId: LibraryId | null): string {
    switch (libraryId) {
        case 'dalmo':
            return '/favicon-dalmo.png'
        case 'jamie':
            return '/favicon-jamie.png'
        case 'andy':
        default:
            return '/favicon-shade.png'
    }
}

export function createBookLabelQrOptions(
    data: string,
    libraryId: LibraryId | null,
): Options {
    const palette = getBookLabelQrPalette(libraryId)
    const dotsOptions = configuredOptions.dotsOptions as NonNullable<Options['dotsOptions']>
    const cornersSquareOptions = configuredOptions.cornersSquareOptions as NonNullable<Options['cornersSquareOptions']>
    const cornersDotOptions = configuredOptions.cornersDotOptions as NonNullable<Options['cornersDotOptions']>

    return {
        type: configuredOptions.type as Options['type'],
        shape: configuredOptions.shape as Options['shape'],
        width: configuredOptions.width,
        height: configuredOptions.height,
        margin: configuredOptions.margin,
        data,
        image: getBookLabelQrCenterImage(libraryId),
        qrOptions: {
            typeNumber: Number(configuredOptions.qrOptions.typeNumber) as TypeNumber,
            mode: configuredOptions.qrOptions.mode as NonNullable<Options['qrOptions']>['mode'],
            errorCorrectionLevel: configuredOptions.qrOptions.errorCorrectionLevel as NonNullable<Options['qrOptions']>['errorCorrectionLevel'],
        },
        imageOptions: configuredOptions.imageOptions,
        dotsOptions: {
            ...dotsOptions,
            color: palette.dotStart,
            gradient: {
                type: 'radial',
                rotation: 0,
                colorStops: [
                    { offset: 0, color: palette.dotStart },
                    { offset: 1, color: palette.dotEnd },
                ],
            },
        },
        cornersSquareOptions: {
            ...cornersSquareOptions,
            color: palette.finder,
        },
        cornersDotOptions: {
            ...cornersDotOptions,
            color: palette.finder,
        },
        backgroundOptions: configuredOptions.backgroundOptions,
    }
}
