import { expect, it } from 'vitest'

import { albumLabelValue } from './labelCode'

it('uses a media-specific opaque Shade payload for albums', () => {
    expect(albumLabelValue('album-id')).toBe('shade:v1:album:album-id')
})
