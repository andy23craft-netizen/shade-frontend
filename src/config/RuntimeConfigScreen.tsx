import { useState } from 'react'
import { Button } from '../components/Button'

interface RuntimeConfigScreenProps {
    onRetry: () => void
}

export function RuntimeConfigScreen({
                                        onRetry,
                                    }: RuntimeConfigScreenProps) {
    const [isRetrying, setIsRetrying] = useState(false)

    const handleRetry = () => {
        setIsRetrying(true)

        try {
            onRetry()
        } finally {
            setIsRetrying(false)
        }
    }

    return (
        <main id="main-content">
            <h1 tabIndex={-1}>Configuration unavailable</h1>

            <p>
                Shade could not load its runtime configuration. Check the
                application configuration and try again.
            </p>

            <Button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
            >
                Try again
            </Button>
        </main>
    )
}