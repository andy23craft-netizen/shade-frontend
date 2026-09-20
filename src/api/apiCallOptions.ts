/* apiCallOptions.ts */

export interface ApiCallOptions {
    signal?: AbortSignal
    /** A denied optional status read must not discard a working admin session. */
    preserveAuthOnUnauthorized?: boolean
}
