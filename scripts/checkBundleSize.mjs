import { gzipSync } from 'node:zlib'
import {
    readFileSync,
    readdirSync,
} from 'node:fs'
import { join } from 'node:path'

const assetsDirectory = join(
    process.cwd(),
    'dist',
    'assets',
)

const mainEntryPattern = /^index-.*\.js$/

const mainEntries = readdirSync(
    assetsDirectory,
).filter((fileName) =>
    mainEntryPattern.test(fileName),
)

if (mainEntries.length !== 1) {
    console.error(
        `Expected exactly one main JavaScript entry matching dist/assets/index-*.js, found ${mainEntries.length}.`,
    )

    if (mainEntries.length > 0) {
        console.error(
            `Matches: ${mainEntries.join(', ')}`,
        )
    }

    process.exit(1)
}

const mainEntry = mainEntries[0]

const mainEntryPath = join(
    assetsDirectory,
    mainEntry,
)

const source = readFileSync(mainEntryPath)

const gzipSizeBytes = gzipSync(
    source,
).length

const bytesPerKilobyte = 1000

const gzipSizeKilobytes =
    gzipSizeBytes / bytesPerKilobyte

const softWarningKilobytes = 120
const hardFailureKilobytes = 150

const formatKilobytes = (value) =>
    `${value.toFixed(2)} kB`

console.log(
    `Main JS entry: ${mainEntry}`,
)

console.log(
    `Measured gzip size: ${formatKilobytes(gzipSizeKilobytes)}`,
)

console.log(
    `Soft warning budget: ${formatKilobytes(softWarningKilobytes)}`,
)

console.log(
    `Hard failure budget: ${formatKilobytes(hardFailureKilobytes)}`,
)

if (
    gzipSizeKilobytes >
    hardFailureKilobytes
) {
    console.error(
        `Bundle size failure: the main JS entry exceeds the ${formatKilobytes(hardFailureKilobytes)} gzip hard limit.`,
    )

    process.exit(1)
}

if (
    gzipSizeKilobytes >
    softWarningKilobytes
) {
    console.warn(
        `Bundle size warning: the main JS entry exceeds the ${formatKilobytes(softWarningKilobytes)} gzip soft budget.`,
    )
}

console.log(
    'Bundle size check passed.',
)
