import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../../api/apiErrors'

const mutate = vi.fn()
vi.mock('../../../api/catalogQueries', () => ({ useCatalogImageSearch: () => ({ mutate, isPending: false }) }))
import { CatalogImageSearchPage } from './CatalogImageSearchPage'

function renderPage() { return render(<MemoryRouter><CatalogImageSearchPage /></MemoryRouter>) }
function select(file: File) { fireEvent.change(screen.getByLabelText('Cover or artwork image'), { target: { files: [file] } }) }

describe('CatalogImageSearchPage', () => {
    beforeEach(() => mutate.mockClear())
    it('rejects a known unsupported local file before upload', () => {
        renderPage(); select(new File(['text'], 'cover.gif', { type: 'image/gif' }))
        expect(screen.getByRole('alert')).toHaveTextContent('Choose a JPEG, PNG, or WebP image.')
        expect(mutate).not.toHaveBeenCalled()
    })

    it('shows recognized context and routes typed candidates explicitly', async () => {
        renderPage(); select(new File(['image'], 'cover.png', { type: 'image/png' }))
        fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        const callbacks = mutate.mock.calls[0][1]
        callbacks.onSuccess({ recognized_text: [{ text: 'Pale Fire', confidence: 0.9 }], candidates: [
            { media_type: 'book', item_id: 'book-id', title: 'Pale Fire', matched_fields: ['title'], score: 99 },
            { media_type: 'album', item_id: 'album-id', title: 'Fire Music', matched_fields: ['artist'], score: 87 },
        ] })
        await waitFor(() => expect(screen.getByText('Pale Fire (90% recognition confidence)')).toBeInTheDocument())
        expect(screen.getByRole('link', { name: 'Pale Fire' })).toHaveAttribute('href', '/books/book-id')
        expect(screen.getByRole('link', { name: 'Fire Music' })).toHaveAttribute('href', '/albums/album-id')
    })

    it('distinguishes no usable text from no matching catalog item', async () => {
        renderPage(); select(new File(['image'], 'cover.png', { type: 'image/png' })); fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        mutate.mock.calls[0][1].onSuccess({ recognized_text: [], candidates: [] })
        await waitFor(() => expect(screen.getByText('No usable text was found')).toBeInTheDocument())
        select(new File(['image'], 'other.png', { type: 'image/png' })); fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        mutate.mock.calls[1][1].onSuccess({ recognized_text: [{ text: 'Unknown', confidence: null }], candidates: [] })
        await waitFor(() => expect(screen.getByText('No matches were found')).toBeInTheDocument())
    })

    it('clears a prior result when the image is replaced or cleared', async () => {
        renderPage(); select(new File(['image'], 'cover.png', { type: 'image/png' })); fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        mutate.mock.calls[0][1].onSuccess({ recognized_text: [{ text: 'Pale Fire', confidence: null }], candidates: [{ media_type: 'book', item_id: 'book-id', title: 'Pale Fire', matched_fields: ['title'], score: 99 }] })
        await waitFor(() => expect(screen.getByText('Already in your catalog')).toBeInTheDocument())
        select(new File(['image'], 'replacement.png', { type: 'image/png' }))
        expect(screen.queryByText('Already in your catalog')).not.toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Clear image' }))
        expect(screen.queryByAltText('Selected image: replacement.png')).not.toBeInTheDocument()
    })

    it('hands provider candidates to the explicit book and album lookup flows', async () => {
        renderPage(); select(new File(['image'], 'cover.png', { type: 'image/png' })); fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        mutate.mock.calls[0][1].onSuccess({ recognized_text: [{ text: 'Provider match', confidence: null }], candidates: [], external_book_candidates: [{ title: 'External Book', isbn_13: '9780679723427', authors: 'Vladimir Nabokov' }], external_album_candidates: [{ title: 'External Album', barcode: '602547888330', artist: 'An Artist' }, { title: 'Discogs album', discogs_release_id: '12345' }] })
        await waitFor(() => expect(screen.getByText('Book suggestions from Open Library')).toBeInTheDocument())
        expect(screen.getByRole('link', { name: 'Use this book suggestion' })).toHaveAttribute('href', '/books/new?isbn=9780679723427')
        const albumLinks = screen.getAllByRole('link', { name: 'Use this album suggestion' })
        expect(albumLinks[0]).toHaveAttribute('href', '/albums/new?barcode=602547888330')
        expect(albumLinks[1]).toHaveAttribute('href', '/albums/new?discogs_release_id=12345')
    })

    it.each([[422, 'Choose a JPEG'], [502, 'provider is unavailable'], [504, 'took too long']])('shows retry-safe %s failures', async (status, message) => {
        renderPage(); select(new File(['image'], 'cover.png', { type: 'image/png' })); fireEvent.click(screen.getByRole('button', { name: 'Search image' }))
        mutate.mock.calls.at(-1)?.[1].onError(new ApiError({ kind: status === 422 ? 'validation' : 'server', status, message: 'backend detail' }))
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(message))
    })
})
