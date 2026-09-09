export interface HomeCategoryBucket {
    key: string
    count: number
}

export interface HomeCategory {
    categoryId: string
    name: string
    slug: string
    count: number
}

export interface HomeCategoryDefinition {
    category_id: string
    name: string
    slug: string
}

export function topHomeCategories(
    buckets: readonly HomeCategoryBucket[],
    categories: readonly HomeCategoryDefinition[],
    limit = 5,
): HomeCategory[] {
    const categoryByName = new Map(
        categories.map((category) => [
            category.name,
            category,
        ]),
    )

    return [...buckets]
        .filter((bucket) => bucket.count > 0)
        .sort(
            (left, right) =>
                right.count - left.count ||
                left.key.localeCompare(right.key),
        )
        .flatMap((bucket) => {
            const category =
                categoryByName.get(bucket.key)

            if (category === undefined) {
                return []
            }

            return [
                {
                    categoryId:
                    category.category_id,
                    name: category.name,
                    slug: category.slug,
                    count: bucket.count,
                },
            ]
        })
        .slice(0, limit)
}

export function homeCategoryHref(
    slug: string,
): string {
    return `/books/category/${encodeURIComponent(slug)}`
}
