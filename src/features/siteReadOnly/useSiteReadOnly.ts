import { useContext } from 'react'
import { SiteReadOnlyContext } from './SiteReadOnlyContext'

export function useSiteReadOnly() {
    return useContext(SiteReadOnlyContext)
}
