# LMS Frontend

Next.js frontend for the Learning Management System, supporting Students, Instructors, Parents, and Admins.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Icons | Lucide React |
| Payments | Stripe (`@stripe/react-stripe-js`) |
| Date Utilities | date-fns |
| Package Manager | pnpm |

---

## Prerequisites

- [Node.js v18+](https://nodejs.org/) — check with `node -v`
- [pnpm](https://pnpm.io/installation) — install with `npm install -g pnpm`
- The **LMS Backend** running locally on `http://localhost:5000` (see [lms-backend README](../../lms-backend/README.md))
- A [Stripe account](https://dashboard.stripe.com/register) — needed for payment UI

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/alphagit88-lab/lms-frontend.git
cd lms-frontend/lms-next-frontend
git checkout dev
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env.local` file in the `lms-next-frontend/` directory:

```env
# URL of the running backend API
NEXT_PUBLIC_API_URL=http://localhost:5000

# Stripe publishable key — get from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> **Note:** Only `NEXT_PUBLIC_*` variables are exposed to the browser. Never put secret keys here.

### 4. Start the development server

```bash
pnpm dev
```

Open **http://localhost:3000** in your browser.

---

## Available Scripts

```bash
pnpm dev      # Start local development server (hot reload)
pnpm build    # Build for production
pnpm start    # Start the production server (after build)
pnpm lint     # Run ESLint
```

---

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (public)/         # Publicly accessible pages
│   ├── admin/            # Admin dashboard
│   ├── instructor/       # Instructor pages (courses, bookings, earnings)
│   ├── student/          # Student pages (my courses)
│   ├── parent/           # Parent pages
│   ├── payments/         # Billing / checkout pages
│   └── profile/          # User profile
├── components/           # Shared React components
│   ├── layout/           # AppLayout, navigation
│   ├── payment/          # Stripe payment components
│   ├── recording/        # Video recording viewer
│   └── ...               # Other feature components
├── contexts/             # React context providers (AuthContext, etc.)
├── hooks/                # Custom React hooks
└── lib/
    └── api/              # API client functions (auth, courses, payments, etc.)
```

---

## User Roles

| Role | Access |
|------|--------|
| `student` | Browse courses, book sessions, view recordings, make payments |
| `instructor` | Manage courses & sessions, view bookings, see earnings & payouts |
| `parent` | View enrolled children, manage bookings |
| `admin` | Full system management via admin dashboard |

Route access is controlled by `ProtectedRoute` — it redirects unauthenticated users to `/login` and unauthorised roles to `/dashboard`.

---

## Branching Strategy

| Branch | Purpose |
|--------|--------|
| `main` | Production-ready releases |
| `dev` | Active integration branch — PRs target here |
| `feature/*` | Individual feature branches (e.g. `feature/new`) |

Always branch off `dev` and open a PR back to `dev` when your feature is complete.

---

## Common Issues

**API requests failing / CORS errors** — Make sure the backend is running and `NEXT_PUBLIC_API_URL` in `.env.local` matches exactly (no trailing slash).

**Stripe UI not loading** — Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set and is a valid `pk_test_...` or `pk_live_...` key.

**`next/image` warnings** — Profile picture URLs from external domains need to be added to `next.config.ts` under `images.remotePatterns`.
