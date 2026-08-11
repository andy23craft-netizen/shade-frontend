export interface EnumDisplayValue {
    value: string
    known: boolean
}

export function enumDisplayValue<T extends string>(
    value: string,
    knownValues: readonly T[],
): EnumDisplayValue {
    return {
        value,
        known: knownValues.includes(value as T),
    }
}
