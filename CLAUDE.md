# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a **Next.js 15** application for 605 Wells, a ministry organization in Jacksonville, FL. The app serves as a comprehensive platform for event management, registrations, donations, and content delivery.

### Tech Stack
- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS 4
- **CMS**: Sanity headless CMS
- **Payments**: Stripe integration
- **Analytics**: Vercel Analytics
- **Real-time**: Firebase Realtime Database (for livestream chat)
- **Email**: Resend
- **Forms**: React Hook Form with Zod validation
- **Animation**: Framer Motion

### Key Architecture Components

#### 1. Event Management System
- **Types**: Supports multiple registration types (`internal`, `internal-free`, `hybrid`, `external`, `none`)
- **Hybrid Events**: Unique dual-registration system supporting both in-person and livestream attendance
- **Registration Flow**: Multi-step forms with Stripe payment integration
- **Promo Codes**: Built-in discount system with Kingdom Builder benefits
- **Admin Dashboard**: Event management and registration tracking

#### 2. Content Management (Sanity)
- Events, news articles, and site content managed through Sanity CMS
- Custom GROQ queries for efficient data fetching
- Image optimization with Sanity's CDN
- Sanity Studio accessible at `/studio` route

#### 3. Authentication & Admin
- Simple Firebase-based admin authentication
- Protected admin routes with `AdminGuard` component
- Session management via cookies

#### 4. Payment Processing
- Stripe integration for event registrations and donations
- Webhook handling for payment confirmations
- Support for free events and discounted pricing

#### 5. Livestream Features
- Firebase Realtime Database for chat functionality
- Token-based access control for livestream events
- Embedded video players with custom controls

### Important File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── events/        # Event registration endpoints
│   │   ├── admin/         # Admin authentication & management
│   │   └── webhooks/      # Stripe webhooks
│   ├── events/[slug]/     # Dynamic event pages
│   ├── livestream/[slug]/ # Livestream pages
│   └── admin/             # Admin dashboard pages
├── components/            # React components
├── lib/                  # Utility libraries
│   ├── sanity.ts         # Sanity client & queries
│   ├── stripe.ts         # Stripe configuration
│   ├── firebase.ts       # Firebase setup
│   └── auth.ts           # Admin authentication
sanity/                   # Sanity CMS configuration
```

### Environment Variables Required
- `NEXT_PUBLIC_SANITY_PROJECT_ID`
- `NEXT_PUBLIC_SANITY_DATASET`
- `SANITY_API_TOKEN`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Firebase configuration variables
- `ADMIN_SECRET`
- `RESEND_API_KEY`

### Development Notes

#### Event Registration Types
- `internal`: Paid events with full Stripe integration
- `internal-free`: Free events, no payment required
- `hybrid`: Dual registration (in-person + online livestream)
- `external`: Redirect to external registration
- `none`: Display-only, no registration

#### Key Components
- `EventRegistrationForm`: Main registration form with multi-step flow
- `HybridEventRegistrationForm`: Specialized form for hybrid events
- `StripePaymentForm`: Payment processing component
- `AdminGuard`: Route protection for admin areas
- `LivestreamChat`: Real-time chat for livestream events

#### API Endpoints
- `/api/events/register` - Standard event registration
- `/api/events/register-free` - Free event registration
- `/api/events/register-hybrid` - Hybrid event registration
- `/api/admin/events` - Admin event management
- `/api/webhooks/stripe` - Stripe payment webhooks

### Testing & Quality
- Run `npm run lint` before committing changes
- Ensure all forms validate properly with Zod schemas
- Test payment flows in Stripe test mode
- Verify admin authentication is working correctly

### Deployment
- Deployed on Vercel
- Environment variables must be configured in Vercel dashboard
- Stripe webhooks need to be configured to point to production endpoint