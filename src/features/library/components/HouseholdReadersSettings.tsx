import { useState } from 'react'
import { Alert, Button, ConfirmationDialog, Field, LoadingState, QueryErrorState } from '../../../components'
import { isApiError } from '../../../api/apiErrors'
import type { HouseholdProfileRead } from '../../../api/apiTypes'
import { useCreateHouseholdProfile, useHouseholdProfiles, useRemoveHouseholdProfile, useUpdateHouseholdProfile } from '../../../api/householdProfilesQueries'

function normalizedName(name: string) { return name.trim().toLocaleLowerCase() }

function mutationError(error: unknown, fallback: string) {
    return isApiError(error) ? error.message : fallback
}

export function HouseholdReadersSettings() {
    const profiles = useHouseholdProfiles()
    if (profiles.isPending) return <section className="library-settings-form__household" aria-labelledby="household-readers-heading"><h2 id="household-readers-heading">Household readers</h2><LoadingState label="Loading household readers…" /></section>
    if (profiles.isError) return <section className="library-settings-form__household" aria-labelledby="household-readers-heading"><h2 id="household-readers-heading">Household readers</h2><QueryErrorState title="Unable to load household readers" error={profiles.error} onRetry={() => void profiles.refetch()} /></section>
    return <HouseholdReadersForm profiles={profiles.data?.items ?? []} />
}

function HouseholdReadersForm({ profiles }: { profiles: HouseholdProfileRead[] }) {
    const create = useCreateHouseholdProfile()
    const update = useUpdateHouseholdProfile()
    const remove = useRemoveHouseholdProfile()
    const [newName, setNewName] = useState('')
    const [addingError, setAddingError] = useState<string | null>(null)
    const [editing, setEditing] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editError, setEditError] = useState<string | null>(null)
    const [removing, setRemoving] = useState<HouseholdProfileRead | null>(null)
    const [outcome, setOutcome] = useState<'reassign' | 'delete'>('reassign')
    const [targetProfileId, setTargetProfileId] = useState('')

    const hasDuplicate = (name: string, exceptId?: string) => profiles.some((profile) => profile.profile_id !== exceptId && normalizedName(profile.display_name) === normalizedName(name))
    const possibleTargets = profiles.filter((profile) => profile.profile_id !== removing?.profile_id)

    function add() {
        setAddingError(null); create.reset()
        const displayName = newName.trim()
        if (!displayName) { setAddingError('Enter a household reader name.'); return }
        if (hasDuplicate(displayName)) { setAddingError('Household reader names must be unique, ignoring letter case.'); return }
        create.mutate({ display_name: displayName }, { onSuccess: () => setNewName('') })
    }
    function saveEdit(profile: HouseholdProfileRead) {
        const displayName = editName.trim(); setEditError(null); update.reset()
        if (!displayName) { setEditError('Enter a household reader name.'); return }
        if (hasDuplicate(displayName, profile.profile_id)) { setEditError('Household reader names must be unique, ignoring letter case.'); return }
        update.mutate({ profileId: profile.profile_id, profile: { display_name: displayName } }, { onSuccess: () => setEditing(null) })
    }
    function openRemoval(profile: HouseholdProfileRead) { setRemoving(profile); setOutcome('reassign'); setTargetProfileId(profiles.find((item) => item.profile_id !== profile.profile_id)?.profile_id ?? ''); remove.reset() }
    function confirmRemoval() {
        if (!removing || (outcome === 'reassign' && !targetProfileId)) return
        remove.mutate({ profileId: removing.profile_id, outcome: outcome === 'reassign' ? { outcome, target_profile_id: targetProfileId } : { outcome } }, { onSuccess: () => setRemoving(null) })
    }

    return <section className="library-settings-form__household" aria-labelledby="household-readers-heading">
        <h2 id="household-readers-heading">Household readers</h2>
        <p className="field__help">Household reading is optional. Add people here to keep their reading and listening history separate.</p>
        {profiles.length === 1 ? <p className="library-settings-form__empty">This library is currently set up for one reader. Add a household reader to opt in.</p> : null}
        <ul className="library-settings-form__profile-list" aria-label="Household readers">
            {profiles.map((profile) => <li key={profile.profile_id}>
                {editing === profile.profile_id ? <div className="library-settings-form__profile-edit"><Field label={profile.is_owner ? 'Owner name' : 'Reader name'} error={editError}><input value={editName} maxLength={255} onChange={(event) => setEditName(event.target.value)} /></Field><div className="button-row"><Button type="button" mutating disabled={update.isPending} onClick={() => saveEdit(profile)}>{update.isPending ? 'Saving…' : 'Save name'}</Button><Button type="button" variant="secondary" disabled={update.isPending} onClick={() => { setEditing(null); setEditError(null); update.reset() }}>Cancel</Button></div></div> : <><span><strong>{profile.display_name}</strong>{profile.is_owner ? ' (Owner)' : ''}</span><div className="button-row"><Button type="button" variant="secondary" disabled={update.isPending || remove.isPending} onClick={() => { setEditing(profile.profile_id); setEditName(profile.display_name); setEditError(null); update.reset() }}>Rename</Button>{!profile.is_owner ? <Button type="button" variant="danger" mutating disabled={update.isPending || remove.isPending} onClick={() => openRemoval(profile)}>Remove</Button> : null}</div></>}
            </li>)}
        </ul>
        <div className="library-settings-form__add-reader">
            <Field label="Add household reader" helpText="Names must be unique within this household, ignoring letter case." error={addingError ?? (create.isError ? mutationError(create.error, 'Unable to add household reader.') : undefined)}><input value={newName} maxLength={255} onChange={(event) => setNewName(event.target.value)} /></Field>
            <Button type="button" mutating onClick={add} disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add reader'}</Button>
        </div>
        {update.isError && !editError ? <Alert variant="error" title="Name was not saved">{mutationError(update.error, 'Unable to save household reader name.')} Your existing name is unchanged.</Alert> : null}
        <ConfirmationDialog open={removing !== null} title="Remove household reader?" confirmLabel={outcome === 'delete' ? 'Delete personal records' : 'Reassign records and remove'} confirmVariant="danger" mutating confirmDisabled={remove.isPending || (outcome === 'reassign' && !targetProfileId)} onCancel={() => { if (!remove.isPending) setRemoving(null) }} onConfirm={confirmRemoval}>
            <p>Choose what to do with {removing?.display_name}'s personal reading and listening records. This does not affect shared catalog or loan records.</p>
            <fieldset className="library-settings-form__remove-options" disabled={remove.isPending}><legend>Personal records</legend><label><input type="radio" name="removal-outcome" checked={outcome === 'reassign'} onChange={() => setOutcome('reassign')} /> Reassign to another reader</label>{outcome === 'reassign' ? <label>Reassign to <select value={targetProfileId} onChange={(event) => setTargetProfileId(event.target.value)}><option value="">Choose a reader</option>{possibleTargets.map((profile) => <option key={profile.profile_id} value={profile.profile_id}>{profile.display_name}{profile.is_owner ? ' (Owner)' : ''}</option>)}</select></label> : null}<label><input type="radio" name="removal-outcome" checked={outcome === 'delete'} onChange={() => setOutcome('delete')} /> Permanently delete personal records</label></fieldset>
            {remove.isError ? <Alert variant="error" title="Reader was not removed">{mutationError(remove.error, 'Unable to remove household reader.')} No changes were made.</Alert> : null}
        </ConfirmationDialog>
    </section>
}
