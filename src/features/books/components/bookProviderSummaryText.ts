/** Convert provider Markdown-ish summaries into safe, readable plain text. */
export function normalizeProviderSummary(summary: string): string[] {
    const plainText = summary
        // Provider summaries occasionally contain Markdown links. Keep the
        // human-readable label but never turn provider URLs into page links.
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
        // Treat horizontal rules as a paragraph boundary rather than prose.
        .replace(/^\s*[-*_]{3,}\s*$/gmu, '\n\n')
        .replace(/\r\n?/gu, '\n')

    return plainText
        .split(/\n\s*\n+/u)
        .map((paragraph) => paragraph.replace(/\s*\n\s*/gu, ' ').replace(/\s{2,}/gu, ' ').trim())
        .filter(Boolean)
}
