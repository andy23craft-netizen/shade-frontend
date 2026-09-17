# Feat-02 - Optional loan checkout email notifications (Frontend)

**Status:** Proposed  
**Owner:** Frontend  
**Dependencies:** Backend `Feat-02 - Optional loan checkout email notifications` is implemented, its OpenAPI contract is regenerated, and a backend environment can accept `borrower_email` on book checkout.

## Goal

Allow the librarian to optionally provide a borrower's email address while checking out a book, so the backend can make
its best-effort checkout-confirmation delivery. Checkout remains fully usable without an email address.

## Scope

- Regenerate `src/api/generated/openapi.ts` from the backend OpenAPI after `CheckoutRequest.borrower_email` is
  published, and retain the generated field in the frontend request type.
- Extend the existing book `CheckoutDialog` and its checkout form model with an optional email field. Use an
  email-appropriate input type and `autocomplete="email"`; make the label and helper copy clear that the address is
  optional and used only for this checkout confirmation.
- Submit a trimmed `borrower_email` only when the field contains a value. Do not send an empty string or a stored
  placeholder value.
- Add `borrower_email` to the documented checkout-request field allowlist so `booksApi.checkout()` transmits it.
- Preserve the existing required borrower name, notes, availability-override confirmation, focus handling, error
  mapping, and success behavior.
- Treat email as transient form data. Do not persist it in browser storage, URL parameters, React Query caches,
  loan-history presentation, diagnostics, console output, or client-side analytics.
- Present backend validation feedback beside the email field using the dialog's established field-error treatment.
  Frontend validation may catch a clearly malformed non-empty value for immediate feedback, but the backend remains
  the authority for normalization and validity.
- Keep this feature exclusive to book checkout. Do not add an email field to album checkout, returned-loan feedback,
  due-date reminders, or any borrower contact-management surface.
- Do not claim that an email was delivered. The backend contract makes delivery best-effort and does not expose a
  delivery result; a successful checkout remains a successful checkout whether SMTP is disabled or sending fails.

## Acceptance criteria

- A book can be checked out with the email input blank, and the checkout request omits `borrower_email`.
- A non-empty email is trimmed and included as `borrower_email` in the book checkout request alongside the existing
  checkout fields.
- A blank or malformed optional value is handled accessibly: the field has an associated label, suitable input type,
  and an understandable inline validation error when applicable.
- A backend validation error keyed to `borrower_email` is shown at the email input and does not erase the entered
  borrower, notes, or email values.
- The post-checkout UI confirms checkout only; it never states or implies that a notification was sent, received, or
  delivered.
- Existing book-checkout behavior is unchanged when no email is supplied, including availability overrides and error
  recovery.
- Album checkout has no email control and its request payload is unchanged.
- Tests cover omission, trimmed submission, client-side invalid input if implemented, backend field-error mapping,
  accessibility of the optional field, and regression coverage for the existing checkout request allowlist.

## Implementation notes

- Likely touchpoints are `src/features/loans/checkoutModel.ts`,
  `src/features/loans/components/CheckoutDialog.tsx`, `src/api/requestFields.ts`, and their existing tests.
- The generated OpenAPI contract is the source of request-field typing. Do not locally widen `CheckoutRequest` as a
  substitute for the backend contract update.
- The user-visible email is necessarily sent to the API as part of checkout, but it must not be retained by additional
  frontend mechanisms. Avoid including it in thrown error strings or diagnostic metadata.
- Reuse the existing checkout dialog instead of creating a second checkout flow.

## Out of scope

- Sending email from the browser, storing SMTP settings or credentials in the frontend, or rendering the email body.
- Any assertion of actual email delivery, a resend control, delivery-status UI, retry queue, or notification history.
- Persisting, displaying, or reusing borrower email addresses.
- Album checkout notifications, due-date reminders, return notices, marketing messages, or a borrower address book.
