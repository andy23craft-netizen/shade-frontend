import {
    formatDateOnly,
    isDateOnlyString,
} from '../../api/dateTime'

export type LoanDueState =
    | 'no_due_date'
    | 'due'
    | 'due_today'
    | 'overdue'
    | 'unknown'

export function displayLoanDate(
    value: string | null | undefined,
): string {
    if (!value) {
        return 'Not provided'
    }

    if (isDateOnlyString(value)) {
        const [
            year,
            month,
            day,
        ] = value.split('-').map(Number)

        const date = new Date(
            year,
            month - 1,
            day,
        )

        return new Intl.DateTimeFormat(
            undefined,
            {
                dateStyle: 'medium',
            },
        ).format(date)
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return `${value} (unrecognized date)`
    }

    return date.toLocaleString()
}

export function getLoanDueState(
    dueAt: string | null | undefined,
    now: Date = new Date(),
): LoanDueState {
    if (!dueAt) {
        return 'no_due_date'
    }

    if (isDateOnlyString(dueAt)) {
        const today =
            formatDateOnly(now)

        if (dueAt < today) {
            return 'overdue'
        }

        if (dueAt === today) {
            return 'due_today'
        }

        return 'due'
    }

    const dueDate = new Date(dueAt)

    if (Number.isNaN(dueDate.getTime())) {
        return 'unknown'
    }

    if (dueDate.getTime() < now.getTime()) {
        return 'overdue'
    }

    return 'due'
}
