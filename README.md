# Susu Group Tracker — JavaScript

A beginner-friendly web app for tracking members, weekly contributions, partial payments, balances, and payout order in a rotating savings group.

## Requirements
- Node.js 18 or newer
- A modern browser
- Git for commit history
- No third-party npm packages

## Run the app
1. Install Node.js from https://nodejs.org/ if needed.
2. Open a terminal in this folder.
3. Run `npm start`.
4. Open http://localhost:3000 in your browser.
5. Stop the server with Ctrl+C.

## Run tests
Run `npm test` to execute the automated tests. Run `npm run check` to check JavaScript syntax.

## Features
- Set group name and weekly contribution in GHS.
- Add members with unique names and join order.
- Record full or partial contributions.
- Reject invalid payments and overpayments.
- View paid amounts, balances owed, and payment progress.
- Block week closure until all members have paid in full.
- Pay the pot to the next member in join order.
- View payout history and cycle completion.

## Rules and limitations
- Everyone contributes the same fixed amount each week.
- Payout order follows member join order.
- The cycle ends after every member has received one payout.
- Amounts are in Ghanaian cedis and limited to two decimal places.
- This is a local demo: data resets on page reload.
- There is no login, database, or real payment processing.

## Files
- `src/susu.js`: core rules, imported by tests
- `public/`: browser interface and browser-compatible rules
- `tests/susu.test.js`: automated tests
- `server.js`: local static file server
- `NOTES.md`: assumptions and future improvements
