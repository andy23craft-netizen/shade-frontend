import { useNavigate, useParams } from 'react-router-dom'
import { useAlbum, useUpdateAlbum } from '../../../api/albumsQueries'
import { LoadingState, QueryErrorState } from '../../../components'
import { AlbumForm } from '../components/AlbumForm'
export function EditAlbumPage() { const id = useParams().albumId ?? ''; const navigate = useNavigate(); const query = useAlbum(id); const mutation = useUpdateAlbum(); if (query.isPending) return <LoadingState label="Loading album…" />; if (query.isError) return <QueryErrorState title="Unable to load album" error={query.error} />; return <section className="page page--album-form"><header className="page-header"><h1>Edit Album</h1></header><AlbumForm album={query.data} submitting={mutation.isPending} onCancel={() => navigate(`/albums/${id}`)} onSubmit={async value => { await mutation.mutateAsync({ id, album: value }); navigate(`/albums/${id}`) }} /></section> }
