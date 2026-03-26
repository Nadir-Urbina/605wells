# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run email:test` - Test correction email sending
- `npm run email:send` - Send correction emails

## Architecture Overview

This is a **Next.js 15** application for 605 Wells, a ministry organization in Jacksonville, FL. The app covers event management, registrations, donations, content delivery, a virtual ministry hub, and a team member portal.

### Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4
- **CMS**: Sanity headless CMS (studio at `/studio`)
- **Payments**: Stripe
- **Analytics**: Vercel Analytics
- **Real-time DB**: Firebase Realtime Database (livestream chat) + Firestore (virtual hub bookings, team data)
- **Video Meetings**: Daily.co (virtual ministry sessions)
- **Email**: Resend
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion

### Key Modules

#### 1. Event Management
- **Registration types**: `internal` (paid Stripe), `internal-free`, `hybrid` (in-person + livestream), `external` (redirect), `none` (display only)
- **Hybrid events**: Dual registration paths — in-person via `register-hybrid`, online via `register-hybrid-online`
- **Promo codes**: Kingdom Builder discount system validated at `/api/events/validate-promo`
- **Livestream**: Firebase Realtime Database for chat; token-based access control in `SanityLivestreamAccess`
- **Past events**: Purchasable recorded events (`pastEvent` Sanity type), Vimeo-embedded, with their own payment/token flow at `/past-events/[slug]`
- **Visibility**: Events have a `visibility` field (`both`, `calendar-only`, `events-page-only`) controlling where they appear

#### 2. Virtual Hub (`/virtual-hub`)
A multi-step system for scheduling virtual ministry sessions with team members.
- Flow: ministry type selection → team member selection → booking/calendar → intake form → video session
- Two access types: paid (Stripe) or free queue (`/api/virtual-hub/join-queue`)
- Video rooms created via Daily.co (`src/lib/daily.ts`); room data stored in Firestore `bookings` collection
- Admin views: `/admin/bookings`, `/admin/queue`

#### 3. Team Member Portal (`/team`)
- Separate auth from admin: Firebase Auth + `team-member-session` cookie
- Team members log in at `/team/login`, manage availability and sessions
- `TeamMemberGuard` (in `src/components/team/`) protects routes; duplicate at `src/components/TeamMemberGuard.tsx`
- Session management, availability, and booking APIs under `/api/team/`

#### 4. Admin Dashboard (`/admin`)
- Simple credential-based auth (`ADMIN_USER`/`ADMIN_PASSWORD` env vars); session stored as base64-encoded cookie `admin-session`
- `AdminGuard` component protects all `/admin/*` pages
- Manage events, registrations, volunteers, team members, bookings, ministry session queue

#### 5. Content (Sanity CMS)
- `event`, `pastEvent`, `eventRegistration`, `livestreamAccess`, `teamMember`, `ministryType`, `ministryCategory`, `volunteer` schemas in `sanity/schemaTypes/`
- Two Sanity clients in `src/lib/sanity.ts`: read-only `client` (CDN in prod) and `writeClient` (uses `SANITY_API_TOKEN`)
- All GROQ queries and TypeScript interfaces for Sanity documents are centralized in `src/lib/sanity.ts`

#### 6. Data Storage Split
- **Sanity**: Events, registrations, past events, livestream access tokens, team member profiles, ministry types
- **Firestore**: Virtual hub bookings, queue entries, team member availability (`src/lib/firestore.ts`, `src/lib/firestore-admin.ts`)
- **Firebase RTDB**: Livestream chat messages (`src/lib/firebase.ts`)

### Environment Variables Required
- `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Firebase config variables (client + Admin SDK)
- `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`
- `DAILY_API_KEY` - Daily.co API key for video room creation

### API Route Map

| Route | Purpose |
|---|---|
| `/api/events/register` | Paid event registration |
| `/api/events/register-free` | Free event registration |
| `/api/events/register-hybrid` | Hybrid in-person registration |
| `/api/events/register-hybrid-online` | Hybrid online/livestream registration |
| `/api/events/validate-promo` | Promo code validation |
| `/api/past-events/*` | Past event purchase, token, payment |
| `/api/virtual-hub/*` | Booking, queue, intake, availability, payment |
| `/api/team/*` | Team member auth, sessions, availability |
| `/api/admin/*` | Admin auth, events, registrations, queue |
| `/api/webhooks/stripe` | Stripe payment webhooks |
| `/api/webhooks/daily` | Daily.co recording webhooks |
| `/api/create-payment-intent` | Generic Stripe payment intent |
| `/api/mailchimp-subscribe` | Mailchimp list subscription |
| `/api/contact` | Contact form submission |
| `/api/ministry-session-request` | Ministry session request form |
