# Book optional metadata policy

This is the frontend omission audit for the OpenAPI 1.2.6 `BookCreate`, `BookUpdate`, `BookRead`, and lookup-draft shapes.

| Fields | Create | Explicit update clear | Display when absent |
| --- | --- | --- | --- |
| `isbn13` | trimmed string or `null` | `null` | omit; show “ISBN not applicable” only when `isbn_not_applicable` is true |
| `publisher`, `publication_date`, `acquisition_source`, `purchase_date`, `notes` | trimmed string or `null` | `null` | omit |
| `pages`, `purchase_price` | parsed number or `null` | `null` | omit |
| `tags` | normalized array or `null` | `null` | omit |
| `category_ids` | array, including empty | `[]` | omit category row when empty; never send `null` |
| `author_ids` | required ordered non-empty array | ordered non-empty array | required; never send `null` or `[]` |
| `editor_ids`, `illustrator_ids`, `translator_ids` | omit when empty, otherwise ordered IDs | `[]` | omit role row when empty; never send `null` |
| `shelf_name` | required valid shelf for ordinary create | omit to preserve; valid name to replace | show placement state; never send `null` on update |
| reading fields (`completion_date`, `rating`, `review`) | lifecycle endpoints own these | lifecycle endpoints own clears | omit absent rows; Read/Unread itself remains visible |
| `borrower_rating` | read-only | n/a | omit when count is zero |

Whitespace-only strings are absent. Lookup values are treated as untrusted optional data: malformed or blank values do not replace valid owner input. Required missing-data prompts remain visible. Cards, lists, Collections, Wishlists, and cleanup surfaces only render the compact fields they own and must not interpolate nullish values or punctuation for an absent optional field.
