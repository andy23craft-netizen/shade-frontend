interface RoutePlaceholderProps {
    heading: string
}

export function RoutePlaceholder({
                                     heading,
                                 }: RoutePlaceholderProps) {
    return <h1 tabIndex={-1}>{heading}</h1>
}
