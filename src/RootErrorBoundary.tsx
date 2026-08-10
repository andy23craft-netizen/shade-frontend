import { Component, type ReactNode } from 'react'
import { Button } from './components/Button'

interface RootErrorBoundaryProps {
    children: ReactNode
}

interface RootErrorBoundaryState {
    hasError: boolean
}

export class RootErrorBoundary extends Component<
    RootErrorBoundaryProps,
    RootErrorBoundaryState
> {
    state: RootErrorBoundaryState = {
        hasError: false,
    }

    static getDerivedStateFromError(): RootErrorBoundaryState {
        return {
            hasError: true,
        }
    }

    handleRetry = () => {
        this.setState({
            hasError: false,
        })
    }

    render() {
        if (this.state.hasError) {
            return (
                <main id="main-content">
                    <h1 tabIndex={-1}>Something went wrong</h1>

                    <p>
                        Shade could not display this page. You can try again or return
                        to the dashboard.
                    </p>

                    <div>
                        <Button type="button" onClick={this.handleRetry}>
                            Try again
                        </Button>

                        <a href="/">Return home</a>
                    </div>
                </main>
            )
        }

        return this.props.children
    }
}