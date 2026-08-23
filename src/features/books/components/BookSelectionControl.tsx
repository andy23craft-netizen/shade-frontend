interface BookSelectionControlProps {
    bookTitle: string
    checked: boolean
    onChange: () => void
}

export function BookSelectionControl({
                                         bookTitle,
                                         checked,
                                         onChange,
                                     }: BookSelectionControlProps) {
    return (
        <label className="book-selection-control">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                aria-label={`Select ${bookTitle}`}
            />

            <span aria-hidden="true">
                Select
            </span>
        </label>
    )
}
