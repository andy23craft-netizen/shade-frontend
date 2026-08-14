import {
    useMemo,
    useState,
} from 'react'

import {
    Alert,
    Button,
} from '../../../components'
import {
    isApiError,
} from '../../../api/apiErrors'
import {
    createBackupApi,
} from '../../../api/backupApi'
import {
    useConnection,
} from '../../connection/useConnection'

function downloadBlob(
    blob: Blob,
    filename: string,
) {
    const objectUrl =
        URL.createObjectURL(blob)

    const anchor =
        document.createElement('a')

    try {
        anchor.href = objectUrl
        anchor.download = filename
        anchor.style.display = 'none'

        document.body.appendChild(anchor)
        anchor.click()
    } finally {
        anchor.remove()
        URL.revokeObjectURL(objectUrl)
    }
}

export function BackupLibraryPage() {
    const {
        apiClient,
    } = useConnection()

    const backupApi = useMemo(
        () => createBackupApi(apiClient),
        [apiClient],
    )

    const [
        isDownloading,
        setIsDownloading,
    ] = useState(false)

    const [
        backupError,
        setBackupError,
    ] = useState<string | null>(null)

    async function handleDownload() {
        if (isDownloading) {
            return
        }

        setIsDownloading(true)
        setBackupError(null)

        try {
            const result =
                await backupApi.get()

            downloadBlob(
                result.blob,
                result.filename,
            )
        } catch (error) {
            if (
                isApiError(error) &&
                error.status === 403
            ) {
                setBackupError(
                    'The API rejected the backup request. Reconnect with a valid API key and try again.',
                )
                return
            }

            if (
                isApiError(error) &&
                error.status === 500
            ) {
                setBackupError(
                    error.detail ??
                    'The server could not generate the backup. No file was downloaded.',
                )
                return
            }

            if (
                isApiError(error) &&
                error.kind === 'timeout'
            ) {
                setBackupError(
                    'The backup request timed out. No file was downloaded.',
                )
                return
            }

            if (
                isApiError(error) &&
                error.kind === 'unreachable'
            ) {
                setBackupError(
                    'The connection was interrupted while requesting the backup. No file was downloaded.',
                )
                return
            }

            setBackupError(
                error instanceof Error
                    ? error.message
                    : 'The backup could not be downloaded.',
            )
        } finally {
            setIsDownloading(false)
        }
    }

    return (
        <section className="route-page">
            <h1 tabIndex={-1}>
                Backup Library
            </h1>

            <p>
                Download a SQL backup of the library
                database for offline storage and recovery.
            </p>

            <Alert
                variant="warning"
                title="This file contains your complete library history"
            >
                The backup includes active and deleted
                books together with complete loan history.
                Store the SQL file somewhere appropriate
                for a library backup.
            </Alert>

            {backupError ? (
                <Alert
                    variant="error"
                    title="Unable to download backup"
                >
                    {backupError}
                </Alert>
            ) : null}

            <div className="form-actions">
                <Button
                    type="button"
                    variant="primary"
                    onClick={() => {
                        void handleDownload()
                    }}
                    disabled={isDownloading}
                >
                    {isDownloading
                        ? 'Downloading…'
                        : 'Download Backup'}
                </Button>
            </div>
        </section>
    )
}
