# Design Notes and Assumptions

## Assumptions
1. Every member has the same fixed weekly contribution.
2. Payouts follow the order members joined.
3. Partial payments are allowed, but total payment cannot exceed the weekly contribution.
4. A week closes only when every member has paid in full.
5. The pot is weekly contribution multiplied by member count.
6. A cycle completes after every member receives one payout.
7. Currency is Ghanaian cedis (GHS), with two decimal places.
8. Member names are unique regardless of capitalization.
9. The demo does not allow adding members after payouts begin.
10. Data is held in browser memory and resets on page reload; no real money is processed.

## Design choices
- A `SusuGroup` class keeps business rules separate from the UI.
- Plain HTML, CSS, and JavaScript avoid build tools.
- Node's built-in HTTP server serves the static app.
- Node's built-in test runner avoids extra dependencies.

## Limitations and possible improvements
- Persist data with SQLite or another database.
- Add authentication, authorization, and a server-side API for multi-user use.
- Add CSV exports, date-stamped reports, and audit logs.
- Add browser integration and accessibility tests.
- Obtain appropriate security, accounting, and legal review before real financial use.

## Manual acceptance checklist
- [ ] Create a group and set a weekly contribution.
- [ ] Add at least three members.
- [ ] Record a partial contribution and check the balance.
- [ ] Try closing a week while someone owes money.
- [ ] Complete all payments and close the week.
- [ ] Verify payout order.
- [ ] Complete the cycle and verify another payout is blocked.
