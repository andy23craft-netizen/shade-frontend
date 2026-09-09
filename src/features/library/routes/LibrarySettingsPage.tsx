import { useState, type FormEvent } from 'react'
import { Alert, Button, Field, LoadingState, QueryErrorState } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import type { LibrarySettingsRead, LibrarySettingsUpdate } from '../../../api/apiTypes'
import { useLibrarySettings, useUpdateLibrarySettings } from '../../../api/libraryQueries'
import { useShelves } from '../../../api/shelvesQueries'
import { canDeleteShelf, formatShelfCommonNameForDisplay } from '../../shelves/shelfDisplay'

function equalIds(left: readonly string[], right: readonly string[]) {
    return left.length === right.length && [...left].sort().every((id, index) => id === [...right].sort()[index])
}

export function LibrarySettingsPage() {
    const settings = useLibrarySettings()
    const shelves = useShelves()
    if (settings.isPending || shelves.isPending) return <section className="route-page library-settings-page"><LoadingState label="Loading library settings…" /></section>
    if (settings.isError) return <section className="route-page library-settings-page"><QueryErrorState title="Unable to load library settings" error={settings.error} onRetry={() => void settings.refetch()} /></section>
    if (shelves.isError) return <section className="route-page library-settings-page"><QueryErrorState title="Unable to load shelves" error={shelves.error} onRetry={() => void shelves.refetch()} /></section>

    return <SettingsForm key={JSON.stringify(settings.data)} confirmed={settings.data} shelves={shelves.data ?? []} />
}

function SettingsForm({ confirmed, shelves }: { confirmed: LibrarySettingsRead, shelves: NonNullable<ReturnType<typeof useShelves>['data']> }) {
    const save = useUpdateLibrarySettings()
    const [draft, setDraft] = useState(confirmed)
    const [clientError, setClientError] = useState<string | null>(null)
    const [tbrPickerOpen, setTbrPickerOpen] = useState(false)
    const eligibleShelves = shelves.filter(canDeleteShelf)
    const fieldError = (field: string) => isApiError(save.error) ? save.error.fieldErrors.find((error) => error.field === field)?.message : undefined

    function submit(event: FormEvent) {
        event.preventDefault()
        setClientError(null)
        save.reset()
        if (draft.reserved_shelf_id && draft.book_tbr_shelf_ids.includes(draft.reserved_shelf_id)) {
            setClientError('The Reserved shelf must be separate from every To Be Read shelf.')
            return
        }
        const update: LibrarySettingsUpdate = {}
        if (draft.enable_loans !== confirmed.enable_loans) update.enable_loans = draft.enable_loans
        if (!equalIds(draft.book_tbr_shelf_ids, confirmed.book_tbr_shelf_ids)) update.book_tbr_shelf_ids = draft.book_tbr_shelf_ids
        if (draft.reserved_shelf_id !== confirmed.reserved_shelf_id) update.reserved_shelf_id = draft.reserved_shelf_id
        if (Object.keys(update).length === 0) return
        save.mutate(update)
    }

    return (
        <section className="route-page library-settings-page">
            <header><p className="page-eyebrow">Manage Collection</p><h1 tabIndex={-1}>Library Settings</h1><p>Choose how this library handles circulation and special-purpose shelves.</p></header>
            <form className="library-settings-form" onSubmit={submit}>
                <fieldset className="library-settings-form__circulation" aria-describedby="circulation-help">
                    <legend>Circulation</legend>
                    <p id="circulation-help" className="field__help">This is one library-wide setting for books and albums. Turning it off prevents new loan actions; it does not delete loan history.</p>
                    <label className="library-settings-form__switch-label">
                        <input
                            type="checkbox"
                            role="switch"
                            checked={draft.enable_loans}
                            onChange={(event) => setDraft({ ...draft, enable_loans: event.target.checked })}
                        />
                        <span className="library-settings-form__switch" aria-hidden="true"><span /></span>
                        <span>{draft.enable_loans ? 'Loans on' : 'Loans off'}</span>
                    </label>
                    {fieldError('enable_loans') ? <p className="field__error">{fieldError('enable_loans')}</p> : null}
                </fieldset>
                <fieldset className="library-settings-form__shelves" aria-describedby="tbr-help">
                    <legend>To Be Read shelves</legend>
                    <p id="tbr-help" className="field__help">Select any number of book shelves. Shelf identity is preserved if a shelf is renamed.</p>
                    <div className="library-settings-form__shelf-picker">
                        <Button
                            type="button"
                            variant="secondary"
                            aria-expanded={tbrPickerOpen}
                            aria-controls="tbr-shelf-picker"
                            onClick={() => setTbrPickerOpen((open) => !open)}
                        >
                            {tbrPickerOpen ? 'Close shelves' : draft.book_tbr_shelf_ids.length ? `Select shelves (${draft.book_tbr_shelf_ids.length})` : 'Select shelves'}
                        </Button>
                        {tbrPickerOpen ? <div id="tbr-shelf-picker" className="library-settings-form__shelf-dropdown">
                            {eligibleShelves.map((shelf) => <label key={shelf.shelf_id}><input type="checkbox" checked={draft.book_tbr_shelf_ids.includes(shelf.shelf_id)} disabled={draft.reserved_shelf_id === shelf.shelf_id} onChange={(event) => setDraft({ ...draft, book_tbr_shelf_ids: event.target.checked ? [...draft.book_tbr_shelf_ids, shelf.shelf_id] : draft.book_tbr_shelf_ids.filter((id) => id !== shelf.shelf_id) })} /> {formatShelfCommonNameForDisplay(shelf.common_name)}</label>)}
                        </div> : null}
                    </div>
                    {fieldError('book_tbr_shelf_ids') ? <p className="field__error">{fieldError('book_tbr_shelf_ids')}</p> : null}
                </fieldset>
                <Field label="Reserved / will-call shelf" helpText="Optional. This shelf cannot also be a To Be Read shelf." error={fieldError('reserved_shelf_id') ?? clientError}>
                    <select value={draft.reserved_shelf_id ?? ''} onChange={(event) => setDraft({ ...draft, reserved_shelf_id: event.target.value || null })}>
                        <option value="">No Reserved shelf</option>
                        {eligibleShelves.filter((shelf) => !draft.book_tbr_shelf_ids.includes(shelf.shelf_id)).map((shelf) => <option key={shelf.shelf_id} value={shelf.shelf_id}>{formatShelfCommonNameForDisplay(shelf.common_name)}</option>)}
                    </select>
                </Field>
                {save.isError && !isApiError(save.error) ? <Alert variant="error" title="Settings were not saved">An unexpected error occurred. Your last confirmed settings are unchanged.</Alert> : null}
                {save.isError && isApiError(save.error) && save.error.fieldErrors.length === 0 ? <Alert variant="error" title="Settings were not saved">{save.error.message} Your last confirmed settings are unchanged.</Alert> : null}
                {save.isSuccess ? <Alert variant="success">Library settings saved.</Alert> : null}
                <div className="library-settings-form__actions"><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save settings'}</Button><Button variant="secondary" disabled={save.isPending} onClick={() => { setDraft(confirmed); setClientError(null); save.reset() }}>Reset</Button></div>
            </form>
        </section>
    )
}
