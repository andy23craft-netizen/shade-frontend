import type {
    createApiClient,
} from './apiClient'
import type {
    ApiCallOptions,
} from './apiCallOptions'

export interface BackupResult {
    blob: Blob
    filename: string
}

function getBackupFilename(
    response: Response,
): string {
    const contentDisposition =
        response.headers.get(
            'Content-Disposition',
        )

    if (!contentDisposition) {
        return 'backup.sql'
    }

    const utf8Match =
        contentDisposition.match(
            /filename\*\s*=\s*UTF-8''([^;]+)/i,
        )

    const plainMatch =
        contentDisposition.match(
            /filename\s*=\s*"([^"]+)"/i,
        ) ??
        contentDisposition.match(
            /filename\s*=\s*([^;]+)/i,
        )

    const encodedFilename =
        utf8Match?.[1]?.trim()

    const plainFilename =
        plainMatch?.[1]?.trim()

    let filename =
        encodedFilename
            ? decodeURIComponent(
                encodedFilename,
            )
            : plainFilename

    if (!filename) {
        return 'backup.sql'
    }

    filename = filename
        .replace(
            /[\\/]/g,
            '_',
        )
        .trim()

    return filename || 'backup.sql'
}

export function createBackupApi(
    client: ReturnType<typeof createApiClient>,
) {
    return {
        async get(
            options: ApiCallOptions = {},
        ): Promise<BackupResult> {
            const response =
                options.signal === undefined
                    ? await client.get('/backup')
                    : await client.get('/backup', {
                        signal: options.signal,
                    })

            return {
                blob:
                    await response.blob(),
                filename:
                    getBackupFilename(
                        response,
                    ),
            }
        },
    }
}
