import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AppLink } from '../../../components/AppLink'
import { createEpubApi, type EpubProgress } from '../../../api/epubApi'
import { useAuth } from '../../auth/useAuth'
import { useActiveHouseholdProfile } from '../../library/useActiveHouseholdProfile'
import { EpubReader } from '../components/EpubReader'
import { Button } from '../../../components/Button'
import { markReadFormDefaults, validateMarkReadFormValues } from '../../books/routes/markReadModel'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../api/queryKeys'

export function AdminReaderPage() {
    const { bookId = '' } = useParams()
    const [searchParams] = useSearchParams()
    const [profileId] = useState(() => searchParams.get('profile_id') ?? '')
    const [data, setData] = useState<{ bytes: ArrayBuffer; progress: EpubProgress } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [finished, setFinished] = useState(false)
    const [completion, setCompletion] = useState(markReadFormDefaults)
    const [completionError, setCompletionError] = useState<string | null>(null)
    const [completing, setCompleting] = useState(false)
    const [complete, setComplete] = useState(false)
    const cache = useQueryClient()
    const { apiClient } = useAuth()
    const household = useActiveHouseholdProfile()
    const api = useMemo(() => createEpubApi(apiClient), [apiClient])
    const profile = household.profiles.find((item) => item.profile_id === profileId)

    async function recordCompletion(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const errors = validateMarkReadFormValues(completion)
        if (errors.rating) { setCompletionError(errors.rating); return }
        if (!window.confirm(`Mark this book read for ${profile?.display_name ?? 'the selected reader'}?`)) return
        setCompleting(true)
        setCompletionError(null)
        try {
            await api.complete(bookId, profileId, completion.rating ? Number(completion.rating) : null, completion.review.trim() || null)
            setComplete(true)
            await Promise.all([
                cache.invalidateQueries({ queryKey: queryKeys.books.all }),
                cache.invalidateQueries({ queryKey: ['dashboard'] }),
                cache.invalidateQueries({ queryKey: ['epub'] }),
            ])
        } catch { setCompletionError('Reading completion could not be recorded. Check the selected reader and retry.') }
        finally { setCompleting(false) }
    }

    useEffect(() => {
        if (!profileId) return
        let active = true
        async function load() {
            try {
                const launch = await api.launch(bookId, profileId)
                if (launch.profile_id !== profileId) throw new Error('Reader profile mismatch')
                const bytes = await api.adminContent(launch.content_url)
                if (active) setData({ bytes, progress: launch.progress })
            } catch { if (active) setError('The EPUB could not be opened. Please retry from Book Details.') }
        }
        void load()
        return () => { active = false }
    }, [bookId, profileId, api])

    return <main className="admin-reader-page">
        <AppLink to={`/books/${bookId}`} variant="secondary">← Book Details</AppLink>
        <h1>Read EPUB</h1>
        <p>Reading as {profile?.display_name ?? 'selected household reader'}. This selection stays fixed for this session.</p>
        {!profileId ? <p role="alert">Choose a reader from Book Details before opening the EPUB.</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {profileId && !data && !error ? <p role="status">Opening book…</p> : null}
        {data ? <EpubReader bytes={data.bytes} initial={data.progress} save={(value) => api.saveAdminProgress(bookId, profileId, value)} refresh={async () => (await api.launch(bookId, profileId)).progress} onNaturalEnd={() => setFinished(true)} /> : null}
        {finished && !complete ? <form className="epub-reader__completion" onSubmit={(event) => void recordCompletion(event)}>
            <h2>Record reading completion</h2>
            <p>This records completion for {profile?.display_name ?? 'the selected reader'} only.</p>
            <label>Rating <select value={completion.rating} onChange={(event) => setCompletion({ ...completion, rating: event.target.value })}><option value="">No rating</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            <label>Review <textarea value={completion.review} onChange={(event) => setCompletion({ ...completion, review: event.target.value })} /></label>
            {completionError ? <p role="alert">{completionError}</p> : null}
            <Button type="submit" disabled={completing} mutating>{completing ? 'Recording…' : 'Mark read'}</Button>
        </form> : null}
        {complete ? <p role="status">Reading completion recorded for {profile?.display_name ?? 'the selected reader'}.</p> : null}
    </main>
}
