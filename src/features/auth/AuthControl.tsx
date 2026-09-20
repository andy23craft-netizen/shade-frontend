import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ModalDialog } from '../../components/ModalDialog'
import { isApiError } from '../../api/apiErrors'
import { useAuth } from './useAuth'

export function AuthControl() {
    const { isAdmin, signIn, signOut } = useAuth()
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    async function submit(event: FormEvent) {
        event.preventDefault()
        setPending(true)
        setError(null)
        try {
            await signIn(password)
            setPassword('')
            setOpen(false)
        } catch (cause) {
            setPassword('')
            setError(isApiError(cause) && cause.status === 429
                ? 'Too many sign-in attempts. Please wait and try again.'
                : 'The administrator password was not accepted.')
        } finally {
            setPending(false)
        }
    }

    if (isAdmin) {
        return <Button className="app-auth-control" variant="secondary" type="button" onClick={() => { void signOut(); navigate('/', { replace: true }) }}>Log out</Button>
    }

    return <>
        <Button className="app-auth-control" variant="secondary" type="button" onClick={() => { setError(null); setOpen(true) }}>Log in</Button>
        {open ? <ModalDialog open title="Administrator sign in" onClose={() => { setPassword(''); setError(null); setOpen(false) }}>
            <form onSubmit={(event) => void submit(event)}>
                <label className="field"><span className="field__label">Administrator password</span><input autoFocus autoComplete="current-password" maxLength={1024} name="password" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
                {error ? <p className="field__error" role="alert">{error}</p> : null}
                <div className="form-actions"><Button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Log in'}</Button><Button type="button" variant="secondary" onClick={() => { setPassword(''); setError(null); setOpen(false) }}>Cancel</Button></div>
            </form>
        </ModalDialog> : null}
    </>
}
