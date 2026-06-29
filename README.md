# Employee Asset Management System

A modern, professional internal web application for managing employee assets. Built for IT and HR teams with secure one-time employee form links — no employee login required.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** Supabase PostgreSQL
- **Auth:** Supabase Auth (Admin, IT, HR roles only)
- **Deployment:** Vercel

## Features

- **Dashboard** — Real-time stats, recent activity, pending actions, notifications
- **Employee Management** — Full CRUD with asset history and form generation
- **Asset Master** — Complete asset registry with current holder tracking
- **Secure Form Links** — One-time, expiring links for employee actions (WhatsApp/email)
- **Four Action Types:** Onboarding, Exchange, Return, Verification
- **Digital Signatures** — Draw or type signature (DocuSign-style)
- **PDF Generation** — Auto-generated forms after submission
- **Reports** — Employee assets, history, verification, pending forms, returns
- **Search & Filters** — Across employees, assets, and forms
- **Dark Mode** — Light/dark theme support

## Getting Started

### 1. Clone and Install

```bash
cd Assets
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql` (optional demo data)
3. Copy your project URL and keys

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COMPANY_NAME=Your Company Name
NEXT_PUBLIC_FORM_LINK_EXPIRY_DAYS=7
```

### 4. Create Internal Users

In Supabase Dashboard → Authentication → Users, create users with metadata:

```json
{
  "full_name": "Admin User",
  "role": "admin"
}
```

Valid roles: `admin`, `it`, `hr`

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected internal pages
│   │   ├── dashboard/
│   │   ├── employees/
│   │   ├── assets/
│   │   ├── forms/
│   │   ├── reports/
│   │   └── settings/
│   ├── form/[token]/         # Public employee forms
│   ├── login/
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Sidebar, header
│   ├── dashboard/
│   ├── employees/
│   ├── assets/
│   ├── forms/
│   └── shared/               # SignaturePad, StatusBadge
├── lib/
│   ├── supabase/             # Client, server, admin, middleware
│   ├── actions/              # Form processing, asset actions
│   ├── queries/              # Dashboard queries
│   ├── auth.ts
│   ├── pdf.ts
│   └── utils.ts
└── types/
supabase/migrations/          # Database schema
```

## User Roles

| Role  | Permissions                                      |
|-------|--------------------------------------------------|
| Admin | Full access, user management, settings           |
| IT    | Assets, employees, forms, reports                |
| HR    | Employees, forms, reports                        |

Employees never login — they receive secure one-time form links.

## Employee Form Flow

1. IT/HR selects employee and action type
2. System generates secure link: `/form/{token}`
3. Link sent via WhatsApp or email
4. Employee opens link, reviews assets, signs, submits
5. System auto-assigns/updates assets, creates history, generates PDF

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables from `.env.example`
4. Deploy

## License

Private — Internal use only.
