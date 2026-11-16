# Orbit Trade

A Bitcoin broker web app with ID-verified accounts and copy trading. **Front end only for now.** Everything runs on mock data in the browser, so no backend or database is needed.

## Run it

```bash
pnpm install
pnpm dev        # starts both apps
```

| Open | What |
|---|---|
| http://localhost:3000 | User site: landing, sign-up, dashboard |
| http://localhost:3000/admin | Admin console (the `apps/admin` app, forwarded through port 3000) |

The admin console is its own app in `apps/admin` and runs on port 3001. The user site forwards `/admin` to it, so both share one browser origin and one set of mock data. Open the user site and the admin console in two tabs and changes show up in both.

## Try the full flow

1. **Create the first admin.** Go to `/admin/sign-up`, then scan the QR code with Google Authenticator, Authy or 1Password. The first admin becomes the super admin.
2. **Sign up as a user.** Go to `/sign-up`. The 6-digit email code is shown on screen, since no email service is connected.
3. **Verify ID.** Go to `/verify-id`, upload an ID and take a camera selfie.
4. **Approve the user.** In the admin console, open **KYC queue** and choose **Approve user**. The user's dashboard unlocks.
5. **Change the balance.** In the console, open **Users**, then the user, then **Adjust balance**. Enter the amount in the user's currency (e.g. ₦50,000) or in BTC, and it's converted to BTC. Choose *Deposit credit* to count it as "Amount deposited".
6. **Profit.** The user copies a trader. In the console, open **Traders** and choose **Log trade**. Each copier's profit is calculated, converted to BTC at the exit price and posted automatically. The user's **Profit** tile updates.
7. **More admins.** Others sign up at `/admin/sign-up` and wait in **Admins** until a super admin approves them.

To wipe the mock data, clear the site's storage in the browser (DevTools → Application → Clear storage).

## Layout

```
apps/
  web/      Next.js user site                        → :3000
  admin/    Next.js admin console (basePath /admin)  → :3001, reached via :3000/admin
  api/      NestJS scaffold (empty, not used yet)
packages/
  ui/       Shared design system, theme, types, API client
            lib/mock/  ← the mock data layer (browser "server" on localStorage)
  db/       Prisma schema (design reference for the future backend)
  shared/   Roles, permissions, KYC statuses, validation
```

## How the mock data works

- **One client:** every screen calls `api()` in `packages/ui/lib/api.ts`. With `NEXT_PUBLIC_API_MODE` unset (mock), requests are answered by `packages/ui/lib/mock/server.ts` using localStorage.
- **Switching later:** when a real API exists, set `NEXT_PUBLIC_API_MODE=live` and `NEXT_PUBLIC_API_URL`. The screens don't change.
- **Rules the mock follows, from the PRD:**
  - **Balances:** a balance is always the sum of ledger entries.
  - **Adjust balance:** the only way an admin changes a balance. It posts a ledger entry with a reason and a note the user sees. Amounts above 0.05 BTC need a different super admin to approve.
  - **Profit:** comes only from logged trader trades, mirrored to copiers in proportion to their allocation.
  - **KYC gate:** deposits, the wallet address, copy trading and withdrawals are blocked until the ID is approved.
  - **Audit log:** every admin action is recorded.
- **What's mocked:** email codes appear on screen, the market feed and news are simulated, the KYC vendor check isn't connected, visitor locations are placeholders, and the BTC price comes from `NEXT_PUBLIC_BTC_USD_PRICE`.
- **Admin sign-in:** uses real authenticator codes (TOTP), checked in the browser for this demo.

## Design tokens

These come from the reference product's stylesheet and live in `packages/ui/styles/theme.css`:

- Brand: primary `#5501ff`, night `#0d0020`
- Accents: cyan `#00ffbb`, magenta `#ff00a6`
- Surfaces: background `#f6f6fa`, border `#e7e7ef`
- Status: success `#12a150`, danger `#e5383b`
- Type: Inter
