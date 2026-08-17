import {
    createServer,
    type IncomingMessage,
    type Server,
    type ServerResponse,
} from 'node:http'
import {
    readFile,
    stat,
} from 'node:fs/promises'
import path from 'node:path'
import type {
    AddressInfo,
} from 'node:net'

export interface StartedServer {
    url: string
    close: () => Promise<void>
}

export const NO_CACHE = 'no-cache'
export const IMMUTABLE_ASSETS =
    'public, max-age=31536000, immutable'

const MIME_TYPES: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.woff2': 'font/woff2',
}

function listen(
    server: Server,
): Promise<StartedServer> {
    return new Promise((resolve, reject) => {
        server.once(
            'error',
            reject,
        )
        server.listen(
            0,
            '127.0.0.1',
            () => {
                const address = server.address() as AddressInfo

                resolve({
                    url: `http://127.0.0.1:${address.port}`,
                    close: () =>
                        new Promise((closeResolve, closeReject) => {
                            server.close((error) => {
                                if (error) {
                                    closeReject(error)
                                    return
                                }

                                closeResolve()
                            })
                        }),
                })
            },
        )
    })
}

function contentTypeFor(
    filePath: string,
): string {
    const extension = path.extname(
        filePath,
    ).toLowerCase()

    return MIME_TYPES[extension] ??
        'application/octet-stream'
}

function cacheControlFor(
    urlPath: string,
): string {
    if (
        urlPath === '/index.html' ||
        urlPath === '/config.js' ||
        urlPath === '/'
    ) {
        return NO_CACHE
    }

    if (urlPath.startsWith('/assets/')) {
        return IMMUTABLE_ASSETS
    }

    return NO_CACHE
}

async function sendFile(
    response: ServerResponse,
    filePath: string,
    urlPath: string,
    status = 200,
): Promise<void> {
    const body = await readFile(filePath)

    response.writeHead(
        status,
        {
            'Content-Type': contentTypeFor(filePath),
            'Cache-Control': cacheControlFor(urlPath),
            'Content-Length': body.length,
        },
    )
    response.end(body)
}

export async function startStaticSpaServer(
    rootDirectory: string,
): Promise<StartedServer> {
    const root = path.resolve(
        rootDirectory,
    )

    const server = createServer(
        (request, response) => {
            void handleStaticRequest(
                root,
                request,
                response,
            )
        },
    )

    return listen(server)
}

async function handleStaticRequest(
    root: string,
    request: IncomingMessage,
    response: ServerResponse,
): Promise<void> {
    const method = request.method ?? 'GET'

    if (method !== 'GET' && method !== 'HEAD') {
        response.writeHead(405)
        response.end()
        return
    }

    const requestUrl = new URL(
        request.url ?? '/',
        'http://127.0.0.1',
    )
    const urlPath = decodeURIComponent(
        requestUrl.pathname,
    )
    const relativePath = urlPath === '/'
        ? 'index.html'
        : urlPath.replace(
            /^\/+/u,
            '',
        )
    const resolved = path.resolve(
        root,
        relativePath,
    )
    const rootWithSep = root.endsWith(path.sep)
        ? root
        : `${root}${path.sep}`

    if (resolved !== root && !resolved.startsWith(rootWithSep)) {
        response.writeHead(403)
        response.end()
        return
    }

    const indexPath = path.join(
        root,
        'index.html',
    )

    try {
        const fileStat = await stat(resolved)

        if (fileStat.isFile()) {
            const servedPath = urlPath === '/'
                ? '/index.html'
                : urlPath

            await sendFile(
                response,
                resolved,
                servedPath,
            )
            return
        }
    } catch {
        // Missing files fall through to SPA fallback or 404.
    }

    if (urlPath.startsWith('/assets/') || urlPath === '/config.js') {
        response.writeHead(404)
        response.end()
        return
    }

    await sendFile(
        response,
        indexPath,
        '/index.html',
    )
}

export interface MockApiOptions {
    allowedOrigin: string
    bearerToken: string
    backupBody?: Buffer
    backupFilename?: string
}

export async function startMockApiServer(
    options: MockApiOptions,
): Promise<StartedServer> {
    const backupBody = options.backupBody ??
        Buffer.from(
            '-- Shade library backup fixture\nSELECT 1;\n',
            'utf8',
        )
    const backupFilename = options.backupFilename ??
        'backup.sql'

    const server = createServer(
        (request, response) => {
            handleMockApiRequest(
                request,
                response,
                {
                    allowedOrigin: options.allowedOrigin,
                    bearerToken: options.bearerToken,
                    backupBody,
                    backupFilename,
                },
            )
        },
    )

    return listen(server)
}

function applyCors(
    response: ServerResponse,
    allowedOrigin: string,
): void {
    response.setHeader(
        'Access-Control-Allow-Origin',
        allowedOrigin,
    )
    response.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type',
    )
    response.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PATCH, DELETE, OPTIONS',
    )
    response.setHeader(
        'Access-Control-Expose-Headers',
        'Content-Disposition',
    )
    response.setHeader(
        'Vary',
        'Origin',
    )
}

function readBearerToken(
    request: IncomingMessage,
): string | null {
    const header = request.headers.authorization

    if (header === undefined) {
        return null
    }

    const match = header.match(
        /^Bearer\s+(.+)$/u,
    )

    return match?.[1]?.trim() ?? null
}

function handleMockApiRequest(
    request: IncomingMessage,
    response: ServerResponse,
    options: {
        allowedOrigin: string
        bearerToken: string
        backupBody: Buffer
        backupFilename: string
    },
): void {
    applyCors(
        response,
        options.allowedOrigin,
    )

    const method = request.method ?? 'GET'
    const requestUrl = new URL(
        request.url ?? '/',
        'http://127.0.0.1',
    )

    if (method === 'OPTIONS') {
        response.writeHead(204)
        response.end()
        return
    }

    if (requestUrl.pathname === '/health' && method === 'GET') {
        response.writeHead(
            200,
            {
                'Content-Type': 'application/json; charset=utf-8',
            },
        )
        response.end(
            JSON.stringify({
                status: 'ok',
            }),
        )
        return
    }

    const token = readBearerToken(request)

    if (token !== options.bearerToken) {
        response.writeHead(
            403,
            {
                'Content-Type': 'application/json; charset=utf-8',
            },
        )
        response.end(
            JSON.stringify({
                detail: 'API access was rejected',
            }),
        )
        return
    }

    if (requestUrl.pathname === '/books' && method === 'GET') {
        response.writeHead(
            200,
            {
                'Content-Type': 'application/json; charset=utf-8',
            },
        )
        response.end(
            JSON.stringify({
                items: [],
                total: 0,
            }),
        )
        return
    }

    if (requestUrl.pathname === '/backup' && method === 'GET') {
        const encodedName = encodeURIComponent(
            options.backupFilename,
        )

        response.writeHead(
            200,
            {
                'Content-Type': 'application/sql; charset=utf-8',
                'Content-Disposition':
                    `attachment; filename="${options.backupFilename}"; filename*=UTF-8''${encodedName}`,
                'Content-Length': options.backupBody.length,
            },
        )
        response.end(options.backupBody)
        return
    }

    response.writeHead(404)
    response.end()
}
