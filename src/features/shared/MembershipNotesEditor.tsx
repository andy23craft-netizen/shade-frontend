import { useState, type FormEvent } from 'react'

import { Alert, Button, Field } from '../../components'
import { isApiError } from '../../api/apiErrors'

interface MembershipNotesEditorProps {
    label: string
    notes: string | null | undefined
    onSave: (notes: string | null) => Promise<unknown>
}

export function MembershipNotesEditor({
    label,
    notes,
    onSave,
}: MembershipNotesEditorProps) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(notes ?? '')
    const [pending, setPending] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (pending) return
        setPending(true)
        setError(null)
        const trimmed = draft.trim()
        try {
            await onSave(trimmed === '' ? null : trimmed)
            setEditing(false)
        } catch (saveError) {
            setError(
                isApiError(saveError)
                    ? saveError.detail ?? saveError.message
                    : saveError instanceof Error
                        ? saveError.message
                        : 'The contextual description could not be saved.',
            )
        } finally {
            setPending(false)
        }
    }

    if (!editing) {
        return (
            <Button
                type="button"
                variant="secondary"
                onClick={() => {
                    setDraft(notes ?? '')
                    setError(null)
                    setEditing(true)
                }}
            >
                Edit Description
            </Button>
        )
    }

    return (
        <form className="membership-notes-editor" onSubmit={handleSubmit}>
            {error ? <Alert variant="error">{error}</Alert> : null}
            <Field label={label} helpText="This description applies only in this list and does not change the book record.">
                <textarea
                    value={draft}
                    rows={3}
                    disabled={pending}
                    onChange={(event) => setDraft(event.target.value)}
                />
            </Field>
            <div className="membership-notes-editor__actions">
                <Button type="submit" variant="primary" disabled={pending}>
                    {pending ? 'Saving…' : 'Save Description'}
                </Button>
                <Button type="button" variant="secondary" disabled={pending} onClick={() => setEditing(false)}>
                    Cancel
                </Button>
            </div>
        </form>
    )
}
