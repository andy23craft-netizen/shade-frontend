import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export async function expectNoSeriousAccessibilityViolations(
    page: Page,
) {
    const results = await new AxeBuilder({
        page,
    }).analyze()

    const seriousViolations = results.violations.filter(
        (violation) =>
            violation.impact === 'serious' ||
            violation.impact === 'critical',
    )

    expect(
        seriousViolations,
        seriousViolations
            .map(
                (violation) =>
                    `${violation.id}: ${violation.description}`,
            )
            .join('\n'),
    ).toEqual([])
}
