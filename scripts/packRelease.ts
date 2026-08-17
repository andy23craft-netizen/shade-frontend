import { execFileSync } from 'node:child_process'
import {
    createHash,
} from 'node:crypto'
import {
    mkdir,
    readdir,
    readFile,
    stat,
    writeFile,
} from 'node:fs/promises'
import path from 'node:path'
import {
    fileURLToPath,
    pathToFileURL,
} from 'node:url'
import {
    gzipSync,
    gunzipSync,
} from 'node:zlib'

export const ARTIFACTS_DIRECTORY = 'ci/artifacts'
export const ARTIFACT_NAME_PREFIX = 'shade-frontend'

const TAR_BLOCK_SIZE = 512
const SOURCE_DATE_EPOCH = 0
const FILE_MODE = 0o644

const forbiddenBasenamePattern =
    /^(?:\.env(?:\..*)?|Containerfile|Dockerfile)$/iu

const forbiddenDirectoryPattern =
    /(?:^|\/)(?:node_modules|coverage|\.vite|playwright-report|test-results|\.git|src)(?:\/|$)/u

const forbiddenExtensionPattern =
    /\.(?:sql|db|sqlite|sqlite3)$/iu

export interface PackedFile {
    name: string
    content: Buffer
}

export interface RuntimeConfigShape {
    apiBaseUrl: string
    diagnostics: {
        enabled: string
        endpoint: string
    }
}

export interface ReleaseManifest {
    name: string
    version: string
    appVersion: string
    commit: string
    buildTime: string
    artifact: string
    checksumSha256: string
    runtimeConfig: {
        templateFile: string
        replacedByHost: boolean
        shape: RuntimeConfigShape
    }
    hosting: {
        spaFallback: string
        revalidateIndexAndConfig: string
        immutableHashedAssets: string
        httpsAndCspOwnedByHost: string
        networkRestrictionBecauseSharedToken: string
        atomicInstallRollbackSupervisionHealthOwnedByHost: string
        retainChecksumAndManifest: string
    }
}

export interface PackReleaseOptions {
    repositoryRoot: string
    distDirectory?: string
    outputDirectory?: string
    version?: string
    commit?: string
    buildTime?: string
}

export interface PackReleaseResult {
    version: string
    commit: string
    artifactPath: string
    checksumPath: string
    manifestPath: string
    checksumSha256: string
    manifest: ReleaseManifest
    archive: Buffer
}

export function artifactBasename(
    version: string,
): string {
    return `${ARTIFACT_NAME_PREFIX}-${version}.tar.gz`
}

export function checksumBasename(
    version: string,
): string {
    return `${artifactBasename(version)}.sha256`
}

export function manifestBasename(
    version: string,
): string {
    return `${ARTIFACT_NAME_PREFIX}-${version}.manifest.json`
}

export function entryIsForbidden(
    relativePath: string,
): boolean {
    const normalized = relativePath.replaceAll(
        '\\',
        '/',
    ).replace(
        /^\.\//u,
        '',
    )

    const baseName = normalized.split('/').at(-1) ?? normalized

    return (
        forbiddenBasenamePattern.test(baseName) ||
        forbiddenDirectoryPattern.test(normalized) ||
        forbiddenExtensionPattern.test(normalized)
    )
}

export async function readPackageVersion(
    repositoryRoot: string,
): Promise<string> {
    const packageJsonPath = path.join(
        repositoryRoot,
        'package.json',
    )

    const source = await readFile(
        packageJsonPath,
        'utf8',
    )

    const parsed = JSON.parse(
        source,
    ) as {
        version?: unknown
    }

    const version =
        typeof parsed.version === 'string'
            ? parsed.version.trim()
            : ''

    if (version === '') {
        throw new Error(
            'package.json is missing a valid version.',
        )
    }

    return version
}

export function readGitCommit(
    repositoryRoot: string,
): string {
    try {
        const commit = execFileSync(
            'git',
            [
                'rev-parse',
                'HEAD',
            ],
            {
                cwd: repositoryRoot,
                encoding: 'utf8',
                stdio: [
                    'ignore',
                    'pipe',
                    'ignore',
                ],
            },
        ).trim()

        return commit === ''
            ? 'unknown'
            : commit
    } catch {
        return 'unknown'
    }
}

export function sha256Hex(
    content: Buffer,
): string {
    return createHash(
        'sha256',
    ).update(
        content,
    ).digest(
        'hex',
    )
}

export function formatSha256Sum(
    hash: string,
    fileName: string,
): string {
    return `${hash}  ${fileName}\n`
}

export function gzipDeterministic(
    input: Buffer,
): Buffer {
    const gzipped = gzipSync(
        input,
        {
            level: 9,
        },
    )

    gzipped.writeUInt32LE(
        0,
        4,
    )
    gzipped[9] = 255

    return gzipped
}

function octalField(
    value: number,
    length: number,
): string {
    const octal = value.toString(8)
    const padded = octal.padStart(
        length - 1,
        '0',
    )

    return `${padded}\0`
}

function splitTarName(
    relativePath: string,
): {
    name: string
    prefix: string
} {
    if (relativePath.length <= 100) {
        return {
            name: relativePath,
            prefix: '',
        }
    }

    const separatorIndex = relativePath.lastIndexOf(
        '/',
        155,
    )

    if (separatorIndex <= 0) {
        throw new Error(
            `Archive member path is too long for ustar: ${relativePath}`,
        )
    }

    const prefix = relativePath.slice(
        0,
        separatorIndex,
    )
    const name = relativePath.slice(
        separatorIndex + 1,
    )

    if (prefix.length > 155 || name.length > 100) {
        throw new Error(
            `Archive member path is too long for ustar: ${relativePath}`,
        )
    }

    return {
        name,
        prefix,
    }
}

function createTarHeader(
    relativePath: string,
    size: number,
): Buffer {
    const header = Buffer.alloc(
        TAR_BLOCK_SIZE,
    )
    const { name, prefix } = splitTarName(
        relativePath,
    )

    header.write(
        name,
        0,
        100,
        'utf8',
    )
    header.write(
        octalField(
            FILE_MODE,
            8,
        ),
        100,
        8,
        'utf8',
    )
    header.write(
        octalField(
            0,
            8,
        ),
        108,
        8,
        'utf8',
    )
    header.write(
        octalField(
            0,
            8,
        ),
        116,
        8,
        'utf8',
    )
    header.write(
        octalField(
            size,
            12,
        ),
        124,
        12,
        'utf8',
    )
    header.write(
        octalField(
            SOURCE_DATE_EPOCH,
            12,
        ),
        136,
        12,
        'utf8',
    )
    header.write(
        ' '.repeat(8),
        148,
        8,
        'utf8',
    )
    header.write(
        '0',
        156,
        1,
        'utf8',
    )
    header.write(
        'ustar\0',
        257,
        6,
        'utf8',
    )
    header.write(
        '00',
        263,
        2,
        'utf8',
    )
    header.write(
        prefix,
        345,
        155,
        'utf8',
    )

    let checksum = 0

    for (const byte of header) {
        checksum += byte
    }

    const checksumField = `${checksum.toString(8).padStart(6, '0')}\0 `

    header.write(
        checksumField,
        148,
        8,
        'utf8',
    )

    return header
}

function padToBlock(
    size: number,
): number {
    const remainder = size % TAR_BLOCK_SIZE

    return remainder === 0
        ? 0
        : TAR_BLOCK_SIZE - remainder
}

export function createTarArchive(
    files: PackedFile[],
): Buffer {
    const sorted = [...files].sort(
        (left, right) =>
            left.name < right.name
                ? -1
                : left.name > right.name
                    ? 1
                    : 0,
    )

    const chunks: Buffer[] = []

    for (const file of sorted) {
        const name = file.name.replaceAll(
            '\\',
            '/',
        ).replace(
            /^\.\//u,
            '',
        )

        if (name === '' || name.endsWith('/')) {
            throw new Error(
                `Refusing to pack invalid archive member: ${file.name}`,
            )
        }

        chunks.push(
            createTarHeader(
                name,
                file.content.length,
            ),
        )
        chunks.push(
            file.content,
        )

        const padding = padToBlock(
            file.content.length,
        )

        if (padding > 0) {
            chunks.push(
                Buffer.alloc(padding),
            )
        }
    }

    chunks.push(
        Buffer.alloc(TAR_BLOCK_SIZE),
    )
    chunks.push(
        Buffer.alloc(TAR_BLOCK_SIZE),
    )

    return Buffer.concat(chunks)
}

function readOctal(
    header: Buffer,
    start: number,
    length: number,
): number {
    const raw = header.subarray(
        start,
        start + length,
    ).toString(
        'utf8',
    ).replaceAll(
        '\0',
        '',
    ).trim()

    if (raw === '') {
        return 0
    }

    return Number.parseInt(
        raw,
        8,
    )
}

function isZeroBlock(
    block: Buffer,
): boolean {
    return block.every(
        (byte) => byte === 0,
    )
}

export function listTarEntries(
    tar: Buffer,
): PackedFile[] {
    const files: PackedFile[] = []
    let offset = 0

    while (offset + TAR_BLOCK_SIZE <= tar.length) {
        const header = tar.subarray(
            offset,
            offset + TAR_BLOCK_SIZE,
        )

        offset += TAR_BLOCK_SIZE

        if (isZeroBlock(header)) {
            break
        }

        const size = readOctal(
            header,
            124,
            12,
        )
        const prefix = header.subarray(
            345,
            500,
        ).toString(
            'utf8',
        ).replaceAll(
            '\0',
            '',
        )
        const name = header.subarray(
            0,
            100,
        ).toString(
            'utf8',
        ).replaceAll(
            '\0',
            '',
        )
        const relativePath = prefix === ''
            ? name
            : `${prefix}/${name}`
        const content = Buffer.from(
            tar.subarray(
                offset,
                offset + size,
            ),
        )

        files.push({
            name: relativePath,
            content,
        })

        offset += size + padToBlock(size)
    }

    return files
}

export function listGzipTarEntries(
    archive: Buffer,
): PackedFile[] {
    return listTarEntries(
        gunzipSync(archive),
    )
}

export async function collectDistFiles(
    distDirectory: string,
): Promise<PackedFile[]> {
    const files: PackedFile[] = []
    const absoluteRoot = path.resolve(
        distDirectory,
    )

    async function walk(
        directory: string,
    ): Promise<void> {
        const entries = await readdir(
            directory,
            {
                withFileTypes: true,
            },
        )

        for (const entry of entries) {
            const fullPath = path.join(
                directory,
                entry.name,
            )
            const relativePath = path.relative(
                absoluteRoot,
                fullPath,
            ).replaceAll(
                '\\',
                '/',
            )

            if (entry.isSymbolicLink()) {
                throw new Error(
                    `Refusing to pack symlink: ${relativePath}`,
                )
            }

            if (entryIsForbidden(relativePath)) {
                throw new Error(
                    `Refusing to pack non-deployable file: ${relativePath}`,
                )
            }

            if (entry.isDirectory()) {
                await walk(fullPath)
                continue
            }

            if (!entry.isFile()) {
                throw new Error(
                    `Refusing to pack unsupported file type: ${relativePath}`,
                )
            }

            files.push({
                name: relativePath,
                content: await readFile(fullPath),
            })
        }
    }

    await walk(absoluteRoot)

    return files
}

export function createReleaseManifest(
    options: {
        version: string
        commit: string
        buildTime: string
        artifact: string
        checksumSha256: string
    },
): ReleaseManifest {
    return {
        name: ARTIFACT_NAME_PREFIX,
        version: options.version,
        appVersion: options.version,
        commit: options.commit,
        buildTime: options.buildTime,
        artifact: options.artifact,
        checksumSha256: options.checksumSha256,
        runtimeConfig: {
            templateFile: 'config.js',
            replacedByHost: true,
            shape: {
                apiBaseUrl:
                    'HTTP or HTTPS URL the browser uses to reach the API',
                diagnostics: {
                    enabled:
                        'optional boolean; omitted defaults to false',
                    endpoint:
                        'optional HTTP(S) URL or null; required when enabled is true',
                },
            },
        },
        hosting: {
            spaFallback:
                'Unknown client paths must fall back to index.html so direct navigation and refresh work.',
            revalidateIndexAndConfig:
                'index.html and config.js must use Cache-Control: no-cache or equivalent revalidation.',
            immutableHashedAssets:
                'Hashed /assets/ may use long-lived immutable caching (for example max-age=31536000, immutable).',
            httpsAndCspOwnedByHost:
                'HTTPS, TLS, CSP, and other browser security headers are owned by the deployment host.',
            networkRestrictionBecauseSharedToken:
                'Restrict network access because the baked browser Bearer token is a shared secret.',
            atomicInstallRollbackSupervisionHealthOwnedByHost:
                'Atomic install, rollback, process supervision, and health checks are owned by the deployment repository.',
            retainChecksumAndManifest:
                'Retain and verify the tarball SHA-256 checksum and release manifest before and after transfer.',
        },
    }
}

export function createDeterministicArchive(
    files: PackedFile[],
): Buffer {
    return gzipDeterministic(
        createTarArchive(files),
    )
}

export async function packRelease(
    options: PackReleaseOptions,
): Promise<PackReleaseResult> {
    const distDirectory = options.distDirectory ??
        path.join(
            options.repositoryRoot,
            'dist',
        )
    const outputDirectory = options.outputDirectory ??
        path.join(
            options.repositoryRoot,
            ARTIFACTS_DIRECTORY,
        )
    const version = options.version ??
        await readPackageVersion(
            options.repositoryRoot,
        )
    const commit = options.commit ??
        readGitCommit(
            options.repositoryRoot,
        )
    const buildTime = options.buildTime ??
        new Date().toISOString()

    let distStat

    try {
        distStat = await stat(distDirectory)
    } catch (error) {
        throw new Error(
            `No deployable files found in ${distDirectory}. Run make build first.`,
            {
                cause: error,
            },
        )
    }

    if (!distStat.isDirectory()) {
        throw new Error(
            `No deployable files found in ${distDirectory}. Run make build first.`,
        )
    }

    const files = await collectDistFiles(
        distDirectory,
    )

    if (files.length === 0) {
        throw new Error(
            `No deployable files found in ${distDirectory}. Run make build first.`,
        )
    }

    const hasIndex = files.some(
        (file) => file.name === 'index.html',
    )
    const hasConfig = files.some(
        (file) => file.name === 'config.js',
    )

    if (!hasIndex || !hasConfig) {
        throw new Error(
            'dist/ must include index.html and the public runtime-config template config.js.',
        )
    }

    const archive = createDeterministicArchive(
        files,
    )
    const checksumSha256 = sha256Hex(
        archive,
    )
    const artifactName = artifactBasename(
        version,
    )
    const checksumName = checksumBasename(
        version,
    )
    const manifestName = manifestBasename(
        version,
    )
    const manifest = createReleaseManifest({
        version,
        commit,
        buildTime,
        artifact: artifactName,
        checksumSha256,
    })

    await mkdir(
        outputDirectory,
        {
            recursive: true,
        },
    )

    const artifactPath = path.join(
        outputDirectory,
        artifactName,
    )
    const checksumPath = path.join(
        outputDirectory,
        checksumName,
    )
    const manifestPath = path.join(
        outputDirectory,
        manifestName,
    )

    await writeFile(
        artifactPath,
        archive,
    )
    await writeFile(
        checksumPath,
        formatSha256Sum(
            checksumSha256,
            artifactName,
        ),
        'utf8',
    )
    await writeFile(
        manifestPath,
        `${JSON.stringify(manifest, null, 4)}\n`,
        'utf8',
    )

    return {
        version,
        commit,
        artifactPath,
        checksumPath,
        manifestPath,
        checksumSha256,
        manifest,
        archive,
    }
}

async function runCli(): Promise<void> {
    const repositoryRoot = path.resolve(
        path.dirname(
            fileURLToPath(import.meta.url),
        ),
        '..',
    )

    const result = await packRelease({
        repositoryRoot,
    })

    process.stdout.write(
        `Packed ${result.manifest.artifact}\n`,
    )
    process.stdout.write(
        `Version: ${result.version}\n`,
    )
    process.stdout.write(
        `Commit: ${result.commit}\n`,
    )
    process.stdout.write(
        `SHA-256: ${result.checksumSha256}\n`,
    )
    process.stdout.write(
        `Artifact: ${result.artifactPath}\n`,
    )
}

const invokedAsCli =
    process.argv[1] !== undefined &&
    import.meta.url === pathToFileURL(
        path.resolve(process.argv[1]),
    ).href

if (invokedAsCli) {
    await runCli()
}
