import {
    isDateOnlyString,
} from '../../api/dateTime'

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
