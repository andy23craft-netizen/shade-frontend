import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { Button } from '../../../components/Button'
import { ConfirmationDialog } from '../../../components/ConfirmationDialog'
import { createEpubApi, type EpubInvitation } from '../../../api/epubApi'
import { useAuth } from '../../auth/useAuth'
import { useActiveHouseholdProfile } from '../../library/useActiveHouseholdProfile'

export function EpubBookPanel({ bookId }: { bookId: string }) {
    const { apiClient } = useAuth()
    const api = createEpubApi(apiClient)
    const household = useActiveHouseholdProfile()
    const cache = useQueryClient()
    const asset = useQuery({ queryKey: ['epub', 'asset', bookId], queryFn: () => api.getAsset(bookId), retry: false })
    const [identifier, setIdentifier] = useState('')
    const [borrower, setBorrower] = useState('')
    const [email, setEmail] = useState('')
    const [notes, setNotes] = useState('')
    const [profileId, setProfileId] = useState('')
    const [launchOpen, setLaunchOpen] = useState(false)
    const [invite, setInvite] = useState<EpubInvitation | null>(null)
    const [qr, setQr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!invite) return
        let active = true
        void QRCode.toDataURL(invite.qr_payload, { margin: 1, width: 220 }).then((image) => { if (active) setQr(image) }).catch(() => { if (active) setQr(null) })
        return () => { active = false }
    }, [invite])

    async function putAsset(event: React.FormEvent) {
        event.preventDefault()
        setBusy(true); setError(null)
        try { await api.putAsset(bookId, identifier.trim()); setIdentifier(''); await cache.invalidateQueries({ queryKey: ['epub', 'asset', bookId] }) }
        catch { setError('The EPUB asset could not be saved. Check its provider identifier and try again.') }
        finally { setBusy(false) }
    }
    async function createLoan(event: React.FormEvent) {
        event.preventDefault()
        setBusy(true); setError(null); setInvite(null); setQr(null)
        try {
            const result = await api.createLoan(bookId, borrower.trim(), email.trim(), notes.trim())
            setQr(null)
            setInvite(result)
            setBorrower(''); setEmail(''); setNotes('')
            await cache.invalidateQueries({ queryKey: ['loans'] })
        } catch { setError('The EPUB loan could not be created. Check the borrower details and try again.') }
        finally { setBusy(false) }
    }

    const selectedProfile = household.profiles.find((item) => item.profile_id === profileId)
    return <section className="book-details-panel epub-book-panel" aria-labelledby="epub-book-title">
        <h2 id="epub-book-title">EPUB</h2>
        {asset.isPending ? <p>Checking EPUB availability…</p> : null}
        {asset.isError ? <p role="status">{typeof asset.error === 'object' && asset.error !== null && 'status' in asset.error && asset.error.status === 503 ? 'EPUB storage is temporarily unavailable. Retry after the provider recovers.' : 'No EPUB asset is currently available. An administrator can associate one below.'} <button type="button" onClick={() => void asset.refetch()}>Retry</button></p> : null}
        {asset.data ? <p>{asset.data.available ? 'EPUB available to read and lend.' : 'EPUB associated, but the storage provider is unavailable.'}</p> : null}
        <form onSubmit={(event) => void putAsset(event)}>
            <label>Provider storage identifier <input required maxLength={1024} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="relative-file.epub" /></label>
            <Button type="submit" mutating disabled={busy || !identifier.trim()}>{asset.data ? 'Replace EPUB asset' : 'Associate EPUB asset'}</Button>
        </form>
        {asset.data?.available ? <>
            <div className="epub-book-panel__read">
                <label>Read as <select value={profileId} onChange={(event) => setProfileId(event.target.value)}><option value="">Choose a household reader</option>{household.profiles.map((profile) => <option key={profile.profile_id} value={profile.profile_id}>{profile.display_name}{profile.is_owner ? ' (Owner)' : ''}</option>)}</select></label>
                <Button type="button" variant="secondary" disabled={!selectedProfile} onClick={() => setLaunchOpen(true)}>Read EPUB</Button>
            </div>
            <form onSubmit={(event) => void createLoan(event)}>
                <h3>Lend EPUB</h3><p>Digital lending is independent of the physical copy.</p>
                <label>Borrower name <input required maxLength={255} value={borrower} onChange={(event) => setBorrower(event.target.value)} /></label>
                <label>Borrower email <input required type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} /></label>
                <label>Notes <textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                <Button type="submit" mutating disabled={busy}>Create EPUB loan</Button>
            </form>
        </> : null}
        {error ? <p role="alert">{error}</p> : null}
        {invite ? <div className="epub-invitation" role="status"><h3>Reader invitation</h3><p>Copy this link now. It will disappear when dismissed.</p><a href={invite.reader_url} referrerPolicy="no-referrer" target="_blank" rel="noreferrer">Open reader link</a><div><input aria-label="Reader invitation link" readOnly value={invite.reader_url} onFocus={(event) => event.currentTarget.select()} /></div>{qr ? <img src={qr} alt="QR code for the private reader invitation" /> : null}<div><Button type="button" onClick={() => { setInvite(null); setQr(null) }}>Dismiss invitation</Button></div></div> : null}
        <ConfirmationDialog open={launchOpen} title="Open EPUB reader?" confirmLabel="Open reader" onCancel={() => setLaunchOpen(false)} onConfirm={() => { if (!selectedProfile) return; window.open(`/books/${bookId}/read-epub?profile_id=${encodeURIComponent(selectedProfile.profile_id)}`, '_blank', 'noopener,noreferrer'); setLaunchOpen(false) }}>
            Reading as {selectedProfile?.display_name ?? 'the selected reader'}. Progress belongs to this person for the entire reader session.
        </ConfirmationDialog>
    </section>
}
