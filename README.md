# RevaBox Shot Studio — Next.js + Tailwind + Prisma + Paystack

A 3D box-shot maker with user authentication, PostgreSQL/Prisma persistence, Paystack subscriptions and PNG downloads.

## Features

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL + Prisma ORM
- Sign up
- Sign in
- Sign out
- Secure HTTP-only authentication cookie
- Six-face 3D box editor
- Front / back / left / right / top / bottom artwork
- Save projects
- PNG downloads
- Paystack recurring subscriptions
- Four packages:
  - ₦2,940 — 1 month
  - ₦7,000 — 3 months
  - ₦11,705 — 6 months
  - ₦19,280 — 1 year
- Paystack webhook handling
- Privacy Policy
- Terms of Service
- Refund Policy
- Legal links appear only in the footer

## 1. Install

```bash
npm install
```

## 2. Configure Prisma/PostgreSQL

Copy `.env.example` to `.env.local`.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
AUTH_SECRET="use-a-long-random-secret-at-least-32-characters"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### If you use Neon

Use your Neon pooled connection for `DATABASE_URL`.

Use the direct/unpooled Neon connection for `DIRECT_URL` if your Neon setup provides one.

The Prisma schema is already configured with:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 3. Generate Prisma client and database tables

```bash
npx prisma generate
npx prisma db push
```

Or, for migration-based development:

```bash
npx prisma migrate dev --name init
```

Open Prisma Studio with:

```bash
npx prisma studio
```

## 4. Configure Paystack

Add:

```env
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxx"
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxx"

PAYSTACK_PLAN_1M="PLN_xxxxxxxxx"
PAYSTACK_PLAN_3M="PLN_xxxxxxxxx"
PAYSTACK_PLAN_6M="PLN_xxxxxxxxx"
PAYSTACK_PLAN_1Y="PLN_xxxxxxxxx"
```

Create four recurring plans in your Paystack dashboard and put their plan codes in the variables above.

Recommended intervals:

| Package | Amount | Interval |
|---|---:|---|
| 1 Month | ₦2,940 | monthly |
| 3 Months | ₦7,000 | quarterly |
| 6 Months | ₦11,705 | biannually |
| 1 Year | ₦19,280 | annually |

## 5. Paystack webhook

After deploying, set this URL in Paystack:

```text
https://YOUR-DOMAIN.com/api/paystack/webhook
```

The server verifies the Paystack webhook signature before updating subscription state.

## 6. Start development

```bash
npm run dev
```

Then visit:

```text
http://localhost:3000
```

## Authentication routes

```text
/signup
/signin
```

API endpoints:

```text
POST /api/auth/signup
POST /api/auth/signin
POST /api/auth/signout
```

## Legal pages

```text
/privacy
/terms
/refunds
```

These are intentionally linked from the footer only.

## Production security

Never expose `PAYSTACK_SECRET_KEY` to the browser.

Set a strong production `AUTH_SECRET`.

Use HTTPS in production.

Replace the sample legal text with your final business/legal wording before launch.
