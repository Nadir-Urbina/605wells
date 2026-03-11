# Firestore Security Refactoring Summary

## What Changed

The team member portal has been refactored to use **client-side Firestore queries** with **security rules enforcement** instead of server-side Admin SDK queries. This provides **defense in depth** security.

## Changes Made

### 1. New Context Provider
**File:** `src/contexts/TeamMemberContext.tsx`
- Provides authenticated Firebase user and Sanity team member ID to all team member components
- Automatically redirects to login if not authenticated

### 2. Updated Components

#### TeamMemberGuard (`src/components/team/TeamMemberGuard.tsx`)
- Now wraps children with `TeamMemberProvider`
- Provides auth context to all protected routes

#### Dashboard (`src/app/team/dashboard/page.tsx`)
- ✅ Fetches bookings **directly from Firestore** (client-side)
- ❌ Removed API call to `/api/team/sessions`
- Security: Can only read bookings where `teamMemberId` matches their Sanity ID (enforced by rules)

#### Availability (`src/app/team/availability/page.tsx`)
- ✅ Reads availability **directly from Firestore** (client-side)
- ✅ Writes availability **directly to Firestore** (client-side)
- ❌ Removed API calls to `/api/team/availability`
- Security: Can only read/write their own availability documents (enforced by rules)

#### Session Detail (`src/app/team/sessions/[sessionId]/page.tsx`)
- ✅ Fetches booking **directly from Firestore** (client-side)
- ❌ Removed API call to `/api/team/sessions/[sessionId]`
- ✅ Client-side verification that booking belongs to authenticated team member
- Security: Double-checked (client-side AND Firestore rules)

### 3. What Still Uses Admin SDK (Server-Side)

These operations continue to use Admin SDK and bypass rules (as intended):

- **Admin Operations:**
  - Creating team members (`/api/admin/team-members/create`)
  - Assigning queue entries (`/api/admin/queue/assign`)
  - Fetching all bookings (`/api/admin/bookings`)
  - Managing queue (`/api/admin/queue`)

- **Team Member Authentication:**
  - Login (`/api/team/login`) - Creates session cookie
  - Verify session (`/api/team/verify-session`) - Returns sanity team member ID
  - Fetching Sanity profile data (`/api/team/profile`)

## Security Model

### Before (Insecure)
```
Team Member → API Route → Admin SDK → Firestore (no rules enforced)
                ↑
          Single point of failure
```

### After (Secure - Defense in Depth)
```
Team Member → Client SDK → Firestore Rules → Firestore Data
                              ↑
                    Security enforced at database level
```

Even if there's a bug in client code, **Firestore rules prevent unauthorized access**.

## Firestore Security Rules

The security rules enforce:

1. **Team Member Auth** (`teamMemberAuth` collection)
   - Team members can only read their own auth record
   - Only server can write (Admin SDK)

2. **Bookings** (`bookings` collection)
   - Team members can only read bookings where they are assigned
   - Only server can create/update (Admin SDK for admin operations)

3. **Availability** (`availability` collection)
   - Team members can read/write ONLY their own availability
   - Cannot access other team members' availability

4. **Queue Entries** (`queueEntries` collection)
   - Team members cannot access (admin only via Admin SDK)

## How to Apply Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules` and paste them
5. Click **Publish**

## Testing the Security

After applying the rules, test that:

1. ✅ Team member can view their own bookings
2. ✅ Team member can manage their own availability
3. ❌ Team member CANNOT query other team members' data
4. ✅ Admin operations still work (using Admin SDK)

## Benefits

✅ **Defense in depth** - Security enforced at multiple layers
✅ **Database-level security** - Even bugs in code can't bypass rules
✅ **Principle of least privilege** - Users can only access their own data
✅ **Firebase best practices** - Client SDK for user data, Admin SDK for privileged operations
✅ **Simpler architecture** - No need for API endpoints for every read/write

## What You Asked For

> "I would rather prefer to have each team member to only read their own data, like their own scheduling and so on"

✅ **Achieved!** Firestore rules now enforce that:
- Team members can ONLY read their own bookings
- Team members can ONLY read/write their own availability
- No team member can access another's data, even if they try

The Admin SDK is now only used for truly privileged operations (admin dashboard, creating users, etc.), not for regular team member data access.
