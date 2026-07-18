# Human page smoke test

Run against the local gateway and Docker database. Never complete an external payment in a smoke environment.

## Viewports

- Mobile: 390 × 844
- Tablet: 768 × 1024
- Desktop: 1440 × 900

At each viewport verify there is no horizontal page overflow, controls are reachable by keyboard, focus is visible, and text is not clipped.

## Public pages

Visit `/`, `/features`, `/pricing`, `/about`, `/testimonials`, `/faq`, `/blogs`, `/contact`, `/complaint-data`, `/compliance-audit`, `/grievance-redressal`, `/investor-charter`, `/dos-donts`, `/disclaimer`, `/privacy-policy`, `/refund-policy`, and `/terms-conditions`.

For every page: use the header links, open and close the mobile menu, scroll to the footer, and confirm the current page content is visible.

## Research account

1. Open `/login`, request an OTP, enter it, and confirm the user reaches `/research`.
2. Search for a company and change every market-cap filter.
3. As a user without Research, confirm paid reports show **View plans** and cannot be opened.
4. Open `/research/plans`; change all durations, try an invalid coupon, and verify payment cannot begin until risk consent is checked.
5. Do not finish a payment. Confirm the gateway page is Cashfree sandbox/test before proceeding in a controlled payment test.
6. Open `/research/purchases`; view an owned receipt and use Print/Save. Confirm another user's receipt URL returns 404.
7. Log out and confirm `/research`, `/research/plans`, and `/research/purchases` redirect to login.

## API security companion

Run `RM_SMOKE_MOBILE=<local-test-mobile> ./scripts/smoke-local-payments.sh` from the backend directory. It verifies authorization, receipt ownership, paid-product free-flow rejection, and webhook signature enforcement without creating a payment.
