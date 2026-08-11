import { FormEvent, useState } from 'react'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Field } from '../../components/Field'
import { useConnection } from './useConnection'

export function ConnectionScreen() {
    const {
        status,
        apiBaseUrl,
        release,
        hasToken,
        errorMessage,
        connect,
        retry,
        forgetConnection,
    } = useConnection()

    const [token, setToken] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        setIsSubmitting(true)

        try {
            const connected = await connect(token)

            if (connected) {
                setToken('')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === 'checking') {
        return (
            <main id="main-content">
                <h1 tabIndex={-1}>Connecting to Shade</h1>
                <p>Checking the connection to the library API…</p>
            </main>
        )
    }

    return (
        <main id="main-content">
            <h1 tabIndex={-1}>Connect to Shade</h1>

            <p>
                Connect this browser to your Shade library API to access
                your books, loans, and library statistics.
            </p>

            <p>
                <strong>API:</strong> {apiBaseUrl}
            </p>

            <p>
                <strong>Release:</strong> {release}
            </p>

            {status === 'connected' && hasToken ? (
                <section aria-labelledby="connection-status">
                    <h2 id="connection-status">Connected</h2>

                    <p>
                        This browser is connected to the Shade API.
                    </p>

                    <div>
                        <Button
                            type="button"
                            onClick={() => void retry()}
                        >
                            Check connection
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={forgetConnection}
                        >
                            Forget connection
                        </Button>
                    </div>
                </section>
            ) : (
                <section aria-labelledby="connection-form-heading">
                    <h2 id="connection-form-heading">
                        API authentication
                    </h2>

                    {errorMessage ? (
                        <Alert variant="error">
                            {errorMessage}
                        </Alert>
                    ) : null}

                    {status === 'unauthorized' ? (
                        <p>
                            Enter a valid API token and try again.
                        </p>
                    ) : null}

                    {status === 'unreachable' ? (
                        <p>
                            Make sure the Shade API is running and
                            reachable, then try again.
                        </p>
                    ) : null}

                    <form onSubmit={handleSubmit}>
                        <Field label="API token">
                            <input
                                type="password"
                                value={token}
                                onChange={(event) => setToken(event.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </Field>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? 'Connecting…'
                                : 'Connect'}
                        </Button>

                        {status === 'unreachable' ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => void retry()}
                            >
                                Retry connection
                            </Button>
                        ) : null}
                    </form>
                </section>
            )}
        </main>
    )
}
