import { useMemo, useState } from 'react'

import { Alert } from '../../../components/Alert'
import { Button } from '../../../components/Button'
import { LoadingState } from '../../../components/LoadingState'
import { useInfiniteBookBorrowerReviews, usePutLoanFeedback } from '../../../api/loansQueries'
import type { LoanFeedbackRead } from '../../../api/apiTypes'

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean)
    return parts.length === 0 ? 'Borrower' : parts.map((part) => `${part[0]?.toUpperCase() ?? ''}.`).join(' ')
}

function Review({ feedback }: { feedback: LoanFeedbackRead }) {
    const feedbackMutation = usePutLoanFeedback()
    const [editing, setEditing] = useState(false)
    const [rating, setRating] = useState(String(feedback.rating))
    const [review, setReview] = useState(feedback.review ?? '')
    const [error, setError] = useState<string | null>(null)

    function save(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const parsedRating = Number(rating)
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            setError('Choose a rating from 1 to 5.')
            return
        }
        setError(null)
        feedbackMutation.mutate({
            id: feedback.loan_id,
            feedback: { rating: parsedRating, review: review.trim() || null },
        }, {
            onSuccess: () => setEditing(false),
            onError: (cause) => setError(cause instanceof Error ? cause.message : 'Unable to save borrower feedback.'),
        })
    }

    return (
        <article>
            <header>
                <strong>{initials(feedback.borrower_display_name)}</strong>
                <span> rated it {feedback.rating} / 5</span>
            </header>
            {feedback.review?.trim() ? <p>{feedback.review}</p> : null}
            {editing ? (
                <form onSubmit={save} noValidate>
                    <label>Rating <select aria-label="Borrower rating" value={rating} onChange={(event) => setRating(event.target.value)}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
                    <label>Review <textarea value={review} onChange={(event) => setReview(event.target.value)} /></label>
                    {error ? <p role="alert">{error}</p> : null}
                    <Button type="submit" disabled={feedbackMutation.isPending}>{feedbackMutation.isPending ? 'Saving…' : 'Save feedback'}</Button>
                    <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={feedbackMutation.isPending}>Cancel</Button>
                </form>
            ) : <Button variant="secondary" onClick={() => setEditing(true)}>Edit feedback</Button>}
        </article>
    )
}

export function BorrowerReviews({ bookId }: { bookId: string }) {
    const query = useInfiniteBookBorrowerReviews(bookId)
    const feedback = useMemo(
        () => query.data?.pages.flatMap((page) => page.items) ?? [],
        [query.data],
    )
    const total = query.data?.pages[0]?.total ?? 0

    return (
        <section className="book-details-panel">
            <h2>Borrower reviews</h2>
            {query.isPending ? <LoadingState label="Loading borrower reviews…" /> : null}
            {query.isError ? <Alert variant="error">Unable to load borrower reviews. <Button onClick={() => void query.refetch()}>Retry</Button></Alert> : null}
            {!query.isPending && !query.isError && total === 0 ? <p>No borrower reviews yet.</p> : null}
            {feedback.length > 0 ? <ol className="borrower-review-list">{feedback.map((item) => <li key={item.feedback_id}><Review feedback={item} /></li>)}</ol> : null}
            {query.hasNextPage ? <Button variant="secondary" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading reviews…' : 'Load more reviews'}</Button> : null}
        </section>
    )
}
