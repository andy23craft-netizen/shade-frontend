interface BorrowerNameProps {
    children: string
}

export function BorrowerName({ children }: BorrowerNameProps) {
    return (
        <span className="circulation-record-card__borrower-name">
            {children}
        </span>
    )
}
