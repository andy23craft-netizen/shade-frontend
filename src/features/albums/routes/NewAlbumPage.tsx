import { useNavigate } from 'react-router-dom'
import { useCreateAlbum } from '../../../api/albumsQueries'
import { AlbumForm } from '../components/AlbumForm'
export function NewAlbumPage() { const navigate = useNavigate(); const mutation = useCreateAlbum(); return <section className="page page--album-form"><header className="page-header"><p className="page-eyebrow">New arrival</p><h1>Add Album</h1></header><AlbumForm submitting={mutation.isPending} onCancel={() => navigate('/albums')} onSubmit={async value => { const created = await mutation.mutateAsync(value) as { album_id: string }; navigate(`/albums/${created.album_id}`) }} /></section> }
