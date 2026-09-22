import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { Button } from '../../../components/Button'
import { createEpubApi, type EpubInvitation } from '../../../api/epubApi'
import { useAuth } from '../../auth/useAuth'

export function EpubLoanControls({ loanId }: { loanId: string }) {
    const { apiClient } = useAuth()
    const api = createEpubApi(apiClient)
    const cache = useQueryClient()
    const loan = useQuery({ queryKey: ['epub', 'loan', loanId], queryFn: () => api.getLoan(loanId), retry: false })
    const [invite, setInvite] = useState<EpubInvitation | null>(null)
    const [qr, setQr] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | null>(null)
    useEffect(() => {
        if (!invite) return
        let active = true
        void QRCode.toDataURL(invite.qr_payload, { width: 200 }).then((image) => { if (active) setQr(image) }).catch(() => { if (active) setQr(null) })
        return () => { active = false }
    }, [invite])
    async function reissue() {
        if (!window.confirm('Reissue this EPUB invitation? Previous reader links and browser sessions will stop working.')) return
        setBusy(true); setError(null); setInvite(null); setQr(null)
        try { const result = await api.reissue(loanId); setInvite(result); await cache.invalidateQueries({ queryKey: ['epub', 'loan', loanId] }) }
        catch { setError('The invitation could not be reissued.') }
        finally { setBusy(false) }
    }
    async function change(state: 'returned' | 'completed' | 'revoked') {
        if (!window.confirm(`Mark this EPUB loan ${state}? Reader access will end.`)) return
        setBusy(true); setError(null); setInvite(null); setQr(null)
        try { await api.setLoanState(loanId, state); await Promise.all([cache.invalidateQueries({ queryKey: ['epub', 'loan', loanId] }), cache.invalidateQueries({ queryKey: ['loans'] })]) }
        catch { setError('The loan state could not be changed.') }
        finally { setBusy(false) }
    }
    return <div className="epub-loan-controls">
        {loan.data ? <p>EPUB · {loan.data.state} · {loan.data.borrower_email} · {loan.data.progress.progress_percent === null || loan.data.progress.progress_percent === undefined ? 'Progress not yet recorded' : `${loan.data.progress.progress_percent}% read`}</p> : null}
        {loan.isError ? <p>EPUB loan details are unavailable.</p> : null}
        {loan.data?.state === 'active' ? <div className="pdf-library-actions"><Button type="button" disabled={busy} onClick={() => void reissue()}>Reissue link</Button><Button type="button" disabled={busy} onClick={() => void change('returned')}>Return</Button><Button type="button" disabled={busy} onClick={() => void change('completed')}>Complete</Button><Button type="button" disabled={busy} onClick={() => void change('revoked')}>Revoke</Button></div> : null}
        {error ? <p role="alert">{error}</p> : null}
        {invite ? <div role="status"><p>New private link. Previous invitations are invalid.</p><input readOnly aria-label="Reissued reader link" value={invite.reader_url} onFocus={(event) => event.currentTarget.select()} />{qr ? <img src={qr} alt="QR code for the reissued private reader link" /> : null}<Button type="button" onClick={() => { setInvite(null); setQr(null) }}>Dismiss</Button></div> : null}
    </div>
}
