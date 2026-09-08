import { FormEvent, useState } from 'react'
import { Alert, AppLink, Button, ConfirmationDialog, LoadingState, QueryErrorState } from '../../../components'
import { useCreateQuote, useDeleteQuote, useQuotes, useReorderQuotes, useRestoreDefaultQuotes, useUpdateQuote } from '../../../api/quotesQueries'
import type { QuoteRead } from '../../../api/apiTypes'

type Draft = { text: string; author: string; context: string; enabled: boolean }
const emptyDraft: Draft = { text: '', author: '', context: '', enabled: true }

function payload(draft: Draft) {
    return { text: draft.text.trim(), author: draft.author.trim(), context: draft.context.trim() || null, enabled: draft.enabled }
}

export function QuoteLibraryPage() {
    const query = useQuotes()
    const create = useCreateQuote()
    const update = useUpdateQuote()
    const remove = useDeleteQuote()
    const reorder = useReorderQuotes()
    const restore = useRestoreDefaultQuotes()
    const [draft, setDraft] = useState(emptyDraft)
    const [editing, setEditing] = useState<string | null>(null)
    const [confirm, setConfirm] = useState<{ kind: 'delete'; quote: QuoteRead } | { kind: 'restore' } | null>(null)
    const [message, setMessage] = useState<string | null>(null)
    const items = query.data?.items ?? []
    const pending = create.isPending || update.isPending || remove.isPending || reorder.isPending || restore.isPending
    const error = create.error || update.error || remove.error || reorder.error || restore.error

    function startEdit(quote: QuoteRead) {
        setEditing(quote.quote_id)
        setDraft({ text: quote.text, author: quote.author, context: quote.context ?? '', enabled: quote.enabled })
    }

    async function save(event: FormEvent) {
        event.preventDefault()
        const clean = payload(draft)
        if (!clean.text || !clean.author) return
        if (editing) await update.mutateAsync({ quoteId: editing, quote: clean })
        else await create.mutateAsync(clean)
        setDraft(emptyDraft); setEditing(null); setMessage(editing ? 'Quote updated.' : 'Quote added.')
    }

    async function move(index: number, delta: number) {
        const next = [...items]
        const [item] = next.splice(index, 1)
        next.splice(index + delta, 0, item)
        await reorder.mutateAsync(next.map((quote) => quote.quote_id))
        setMessage('Quote order updated.')
    }

    return <section className="route-page quote-library-page">
        <header><p className="route-page__eyebrow">Collection</p><h1 tabIndex={-1}>Quote Library</h1><p>Choose the quotations that may appear on your library Home page.</p></header>
        <AppLink to="/collection/manage">Back to Manage Collection</AppLink>
        {message ? <Alert variant="success" title="Saved">{message}</Alert> : null}
        {error ? <Alert variant="error" title="Quote change failed">Nothing was replaced. Try the change again.</Alert> : null}
        <form className="quote-library-form" onSubmit={(event) => void save(event)}>
            <h2>{editing ? 'Edit quote' : 'Add a quote'}</h2>
            <label>Quote text<textarea required maxLength={1000} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>
            <label>Author<input required maxLength={255} value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} /></label>
            <label>Context (optional)<textarea maxLength={1000} value={draft.context} onChange={(e) => setDraft({ ...draft, context: e.target.value })} /></label>
            <label><input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} /> Enabled on Home</label>
            <div className="button-row"><Button type="submit" disabled={pending || !draft.text.trim() || !draft.author.trim()}>{editing ? 'Save Quote' : 'Add Quote'}</Button>{editing ? <Button type="button" variant="secondary" onClick={() => { setEditing(null); setDraft(emptyDraft) }}>Cancel</Button> : null}</div>
        </form>
        <section aria-labelledby="saved-quotes"><h2 id="saved-quotes">Saved quotes</h2>
            {query.isPending ? <LoadingState label="Loading quotes…" /> : null}
            {query.isError ? <QueryErrorState title="Quotes could not be loaded" error={query.error} onRetry={() => void query.refetch()} /> : null}
            {!query.isPending && !query.isError && items.length === 0 ? <p>No custom quotes are saved. Home will use its built-in quotations.</p> : null}
            <ol className="quote-library-list">{items.map((quote, index) => <li key={quote.quote_id}>
                <blockquote><p>{quote.text}</p><footer>— {quote.author}</footer>{quote.context ? <small>{quote.context}</small> : null}</blockquote>
                <p>{quote.enabled ? 'Enabled' : 'Disabled'}</p>
                <div className="button-row"><Button type="button" variant="secondary" disabled={pending || index === 0} onClick={() => void move(index, -1)}>Move Up</Button><Button type="button" variant="secondary" disabled={pending || index === items.length - 1} onClick={() => void move(index, 1)}>Move Down</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => startEdit(quote)}>Edit</Button><Button type="button" variant="secondary" disabled={pending} onClick={() => void update.mutateAsync({ quoteId: quote.quote_id, quote: { enabled: !quote.enabled } })}>{quote.enabled ? 'Disable' : 'Enable'}</Button><Button type="button" variant="danger" disabled={pending} onClick={() => setConfirm({ kind: 'delete', quote })}>Delete</Button></div>
            </li>)}</ol>
        </section>
        <section><h2>Restore defaults</h2><p>This replaces every custom quote with the library defaults.</p><Button type="button" variant="danger" disabled={pending} onClick={() => setConfirm({ kind: 'restore' })}>Restore Default Quotes</Button></section>
        <ConfirmationDialog open={confirm !== null} title={confirm?.kind === 'restore' ? 'Restore default quotes?' : 'Delete this quote?'} confirmLabel={confirm?.kind === 'restore' ? 'Replace Custom Quotes' : 'Delete Quote'} confirmVariant="danger" onCancel={() => setConfirm(null)} onConfirm={() => { const current = confirm; setConfirm(null); if (current?.kind === 'restore') void restore.mutateAsync().then(() => setMessage('Default quotes restored.')); else if (current) void remove.mutateAsync(current.quote.quote_id).then(() => setMessage('Quote deleted.')) }}><p>{confirm?.kind === 'restore' ? 'All custom quotes will be permanently replaced by the default set.' : 'This quote will be permanently removed.'}</p></ConfirmationDialog>
    </section>
}
