# Restaurant Staffing Platform - Implementation Plan v2.0

## Project Overview

**Platform Name:** ShiftMatch (Restaurant Temporary Staffing Platform)

**Goal:** Build a two-sided marketplace platform connecting restaurants with waiters for short-term job opportunities (1-2 days shifts).

**Value Proposition:** Restaurants can quickly find staff for busy periods, events, or emergencies. Waiters can find flexible, short-term work opportunities.

**Last Updated:** April 24, 2026  
**Version:** 2.0 (Updated with Agent Reviews)

---

## Architecture & Tech Stack

### Frontend
- **Framework:** Next.js 14+ (React) with App Router
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** **BOTH** TanStack Query (server state) + Zustand (client state)
- **Forms:** React Hook Form + Zod validation
- **Date Handling:** date-fns
- **Notifications:** sonner (toast notifications)
- **Component Architecture:** Atomic Design with Server/Client Component strategy

### Backend
- **Runtime:** Node.js with Next.js API routes
- **Database:** PostgreSQL (Neon recommended)
- **ORM:** Prisma with proper indexes and relations
- **Authentication:** **Auth.js v5** (NextAuth.js v4 is deprecated)
- **File Storage:** UploadThing
- **Validation:** Zod schemas (shared between client/server)
- **Error Handling:** Standardized API error responses

### Infrastructure
- **Hosting:** Vercel (frontend + API)
- **Database Hosting:** Neon (PostgreSQL with SSL)
- **Image Storage:** UploadThing
- **Monitoring:** Sentry + Vercel Analytics
- **CI/CD:** GitHub Actions with security gates

### Testing
- **Unit/Integration:** Jest + @testing-library/react
- **E2E:** Playwright (NOT Cypress - better Next.js support)
- **Accessibility:** jest-axe + axe-core
- **Performance:** Lighthouse CI
- **Coverage Targets:** 90% domain, 85% API, 70% components, 100% critical paths

---

## Database Schema Design (Updated)

### Core Entities (Prisma Schema v2)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum Role {
  WAITER
  RESTAURANT
}

enum PayType {
  HOURLY
  FIXED
}

enum JobStatus {
  ACTIVE
  CLOSED
  DRAFT
  COMPLETED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
  COMPLETED
}

// ==================== MODELS ====================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String    @map("password_hash")
  role              Role
  mfaEnabled        Boolean   @default(false)
  mfaSecret         String?   // TOTP secret (encrypted)
  lastLogin         DateTime?
  failedLoginAttempts Int     @default(0)
  lockedUntil       DateTime? // Brute force protection
  deletedAt         DateTime? // Soft delete (GDPR)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  // Relations
  waiterProfile     WaiterProfile?
  restaurantProfile RestaurantProfile?
  accounts          Account[]
  sessions          Session[]
  
  // Indexes
  @@index([role])
  @@index([email])
  @@map("users")
}

// NextAuth.js v5 Prisma Adapter Models
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?  @db.Text
  access_token      String?  @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?  @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ==================== PROFILES ====================

model WaiterProfile {
  id             String        @id @default(cuid())
  userId         String        @unique
  name           String
  phone          String?
  bio            String?
  experience     String?
  skills         String[]      // ["serving", "bartending", "cleaning"]
  photo          String?       // URL to profile photo (encrypted storage)
  averageRating  Float?        @default(0)
  totalReviews   Int           @default(0)
  deletedAt      DateTime?     // Soft delete
  
  applications   Application[]
  availabilities WaiterAvailability[]
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("waiter_profiles")
}

model WaiterAvailability {
  id        String   @id @default(cuid())
  waiterId  String
  date      DateTime
  startTime String   // Format: "18:00"
  endTime   String   // Format: "23:00"
  waiter    WaiterProfile @relation(fields: [waiterId], references: [id], onDelete: Cascade)
  
  @@index([waiterId, date])
  @@map("waiter_availabilities")
}

model RestaurantProfile {
  id             String        @id @default(cuid())
  userId         String        @unique
  name           String
  address        String
  latitude       Float?
  longitude      Float?
  description    String?
  logo           String?
  phone          String?
  averageRating  Float?        @default(0)
  totalReviews   Int           @default(0)
  deletedAt      DateTime?     // Soft delete
  
  jobs           Job[]
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("restaurant_profiles")
}

// ==================== JOBS & APPLICATIONS ====================

model Job {
  id             String        @id @default(cuid())
  restaurantId   String
  title          String        // "Waiter needed for Saturday dinner"
  description    String
  date           DateTime      // Specific date for the shift
  startTime      String        // "18:00" (consider Int for minutes from midnight)
  endTime        String        // "23:00"
  position       String        // "Waiter", "Bartender", etc.
  payRate        Float         // Per hour or per shift
  payType        PayType       @default(HOURLY)
  requirements   String[]      // ["experience", "english"]
  status         JobStatus     @default(ACTIVE)
  maxApplicants  Int?          @default(5)
  deletedAt      DateTime?     // Soft delete
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  // Check constraints (Prisma doesn't support directly, enforce in business logic)
  // @@check(payRate > 0)
  
  applications   Application[]
  restaurant     RestaurantProfile @relation(fields: [restaurantId], references: [id], onDelete: Cascade)
  
  // Indexes for performance
  @@index([restaurantId, status, date])
  @@index([status, date])
  @@index([restaurantId])
  @@map("jobs")
}

model Application {
  id             String           @id @default(cuid())
  jobId          String
  waiterId       String
  status         ApplicationStatus @default(PENDING)
  message        String?          // Cover message from waiter
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  
  job            Job              @relation(fields: [jobId], references: [id], onDelete: Cascade)
  waiter         WaiterProfile    @relation(fields: [waiterId], references: [id], onDelete: Cascade)
  
  // Prevent duplicate applications
  @@unique([jobId, waiterId])
  
  // Indexes for performance
  @@index([jobId, status])
  @@index([waiterId, status])
  @@map("applications")
}

// ==================== REVIEWS ====================

model Review {
  id             String    @id @default(cuid())
  rating         Int       // 1-5 (enforce in business logic)
  comment        String?
  fromUserId     String    // Who wrote the review
  toUserId       String    // Who received the review
  jobId          String?   // Related job (optional)
  createdAt      DateTime  @default(now())
  
  // Relations (fixed from agent feedback)
  fromUser User @relation("ReviewsFrom", fields: [fromUserId], references: [id])
  toUser   User @relation("ReviewsTo", fields: [toUserId], references: [id])
  job      Job  @relation(fields: [jobId], references: [id], onDelete: SetNull)
  
  @@index([toUserId])
  @@index([fromUserId])
  @@map("reviews")
}

// ==================== NOTIFICATIONS ====================

model Notification {
  id          String   @id @default(cuid())
  userId      String
  type        String   // "APPLICATION_RECEIVED", "APPLICATION_ACCEPTED", etc.
  title       String
  message     String
  read        Boolean  @default(false)
  entityId    String?  // Related job/application ID
  createdAt   DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, read])
  @@map("notifications")
}

// ==================== AUDIT LOG ====================

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String   // CREATE, READ, UPDATE, DELETE
  entity    String   // User, Job, Application
  entityId  String
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@map("audit_logs")
}
```

---

## API Endpoint Structure

### Authentication
```
POST /api/auth/register          → Create user + role-specific profile
GET  /api/auth/session          → Get current session
POST /api/auth/signout          → Logout
```

### Jobs
```
GET    /api/jobs                 → List jobs with filters, pagination, sorting
GET    /api/jobs/[id]           → Job details
POST   /api/jobs                → Create job (restaurant only)
PATCH  /api/jobs/[id]          → Update job (owner only)
DELETE /api/jobs/[id]          → Soft delete job (owner only)
GET    /api/jobs/[id]/applications → List applicants (owner only)
```

### Applications
```
POST   /api/jobs/[id]/applications → Apply to job (waiter only, duplicate check)
GET    /api/applications        → List my applications (waiter) or applicants for my jobs (restaurant)
PATCH  /api/applications/[id]/status → Update status (accept/reject - owner only)
DELETE /api/applications/[id]   → Withdraw application (applicant only)
```

### Profiles
```
GET    /api/profiles/me         → Get current user's profile
PATCH  /api/profiles/me         → Update own profile
GET    /api/profiles/[id]       → Get public profile (waiter/restaurant)
POST   /api/profiles/me/photo   → Upload profile photo
```

### Reviews
```
POST   /api/reviews             → Create review (both roles, post-shift)
GET    /api/reviews             → List reviews by user/job
```

### Notifications
```
GET    /api/notifications       → List notifications
PATCH  /api/notifications/[id]/read → Mark as read
POST   /api/notifications/mark-all-read → Mark all as read
```

### GDPR Compliance
```
GET    /api/user/export         → Export all user data (GDPR)
DELETE /api/user               → Delete user data (GDPR - right to erasure)
```

---

## Error Handling Strategy

### Standard API Error Response
```typescript
// lib/errors/api-errors.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
  }
}

export const ERRORS = {
  UNAUTHORIZED: new ApiError(401, "UNAUTHORIZED", "Authentication required"),
  FORBIDDEN: new ApiError(403, "FORBIDDEN", "Insufficient permissions"),
  NOT_FOUND: new ApiError(404, "NOT_FOUND", "Resource not found"),
  VALIDATION_ERROR: (details: any) => 
    new ApiError(400, "VALIDATION_ERROR", "Invalid input", details),
  DUPLICATE_APPLICATION: new ApiError(409, "DUPLICATE", "Already applied to this job"),
  RATE_LIMITED: new ApiError(429, "RATE_LIMITED", "Too many requests"),
};

// Wrapper for API routes
export function withErrorHandler(handler: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(
          { error: error.code, message: error.message, details: error.details },
          { status: error.statusCode }
        );
      }
      // Log unexpected errors (Sentry)
      console.error("Unexpected error:", error);
      return Response.json(
        { error: "INTERNAL_ERROR", message: "Something went wrong" },
        { status: 500 }
      );
    }
  };
}
```

---

## Implementation Phases (Updated)

### Phase 1: Foundation (P0 - Must Have)
**Estimated Time:** 1-2 weeks  
**Effort:** ~40 hours

- [ ] **Project Setup**
  - Initialize Next.js 14+ with TypeScript, Tailwind CSS, App Router
  - Configure ESLint, Prettier, absolute imports
  - Set up folder structure following Clean Architecture
  - Create `.env*.local` in `.gitignore` (CRITICAL - DevSecOps feedback)
  - Install dependencies: Prisma, NextAuth v5, Zod, React Hook Form, TanStack Query, Zustand, sonner
  - **Effort:** 4 hours

- [ ] **Database Schema Implementation (Updated)**
  - Set up PostgreSQL database (Neon recommended)
  - Apply updated Prisma schema with all indexes and relations
  - Run Prisma migrations
  - Create seed data for testing
  - **Effort:** 6 hours

- [ ] **Authentication System (Auth.js v5)**
  - Install and configure Auth.js v5 (NOT NextAuth v4 - deprecated!)
  - Create registration flow with role selection (Waiter/Restaurant)
  - Implement login/logout functionality
  - Add RBAC middleware for route protection (CRITICAL - DevSecOps)
  - Configure JWT with encryption
  - Add rate limiting for auth endpoints (Arcjet or Upstash)
  - **Effort:** 10 hours

- [ ] **Testing Infrastructure Setup (QA Feedback - NOT Optional!)**
  - Configure Jest + Testing Library
  - Set up Playwright with CI matrix
  - Create test database seeding scripts
  - Add GitHub Actions workflow (lint → test → build)
  - Set up coverage thresholds (90% domain, 85% API)
  - **Effort:** 8 hours

- [ ] **Basic Layout & Navigation**
  - Create responsive layout with Server/Client Component strategy
  - Implement navbar with conditional rendering (based on auth state)
  - Create footer component
  - Set up routing structure with loading.tsx and error.tsx files
  - **Effort:** 4 hours

- [ ] **CI/CD Pipeline (DevSecOps - CRITICAL)**
  - Create GitHub Actions workflow with security gates
  - Add Snyk (dependency scanning)
  - Add Semgrep (SAST - static analysis)
  - Add TruffleHog (secret detection)
  - Configure branch protection rules
  - **Effort:** 8 hours

---

### Phase 2: Core Features - Waiter Side (P0)
**Estimated Time:** 2-3 weeks  
**Effort:** ~60 hours

- [ ] **Waiter Profile Creation**
  - Multi-step form with React Hook Form + Zod validation
  - Personal info (name, phone, bio)
  - Skills selection (checkboxes with domain-specific options)
  - Experience description
  - Photo upload with UploadThing integration
  - **Effort:** 12 hours
  - **Tests:** Unit tests for validation, E2E test for complete flow

- [ ] **Waiter Profile Management**
  - View profile page (Server Component)
  - Edit profile information (Client Component)
  - Update skills and availability (WaiterAvailability table)
  - Change profile photo with preview
  - **Effort:** 10 hours
  - **Tests:** Integration tests for API routes

- [ ] **Job Browsing**
  - Job listing page with cards (Server Component for SEO)
  - Display job details (date, time, pay, position)
  - Pagination with TanStack Query (cursor-based for 1000+ records)
  - **Effort:** 10 hours
  - **Tests:** Performance test for 1000+ jobs listing

- [ ] **Job Search & Filtering**
  - Search by location, job title
  - Filter by date, pay rate, position type
  - Sort options (date, pay, relevance)
  - Save search preferences to Zustand store
  - **Effort:** 12 hours
  - **Tests:** E2E test for search/filter flow

- [ ] **Job Application**
  - Apply button on job details (conditional rendering)
  - Cover message textarea with character count
  - Confirmation with optimistic updates (TanStack Query)
  - Prevent duplicate applications (DB constraint + UI)
  - **Effort:** 6 hours
  - **Tests:** Race condition test (simultaneous applications)

- [ ] **My Applications**
  - Dashboard showing all applications (TanStack Query)
  - Status indicators with JobStatusBadge component
  - Withdraw application option (with confirmation dialog)
  - **Effort:** 6 hours
  - **Tests:** E2E test for application flow

- [ ] **Testing for Phase 2**
  - Unit tests for all business logic
  - Integration tests for API routes
  - E2E test for complete waiter journey
  - **Effort:** 14 hours (30% of feature effort as per QA)

---

### Phase 3: Core Features - Restaurant Side (P0)
**Estimated Time:** 2-3 weeks  
**Effort:** ~68 hours

- [ ] **Restaurant Profile**
  - Registration form with Zod validation
  - Address with map integration (optional - P1)
  - Contact information
  - Logo upload with UploadThing
  - Description/bio with rich text (optional)
  - **Effort:** 10 hours

- [ ] **Job Posting Creation**
  - Multi-step form with React Hook Form + Zod
  - Date picker (future dates only validation)
  - Time inputs with validation (start < end)
  - Position selection (enum-based)
  - Pay rate input with currency formatting
  - Requirements checkboxes
  - **Effort:** 14 hours

- [ ] **Job Management**
  - List of all job posts with status filters
  - Edit existing job posts (owner only check)
  - Close job postings (prevent new applications)
  - Duplicate job post (template feature)
  - **Effort:** 12 hours

- [ ] **View Applicants**
  - See list of applicants for each job
  - View waiter profiles (public view)
  - Accept/Reject buttons with confirmation
  - Filter applicants by status
  - Auto-reject others when accepting (business rule)
  - **Effort:** 14 hours

- [ ] **My Job Posts**
  - Dashboard with job statistics (TanStack Query)
  - Active jobs (open for applications)
  - Completed jobs with rating prompts
  - Draft jobs (save for later)
  - **Effort:** 6 hours

- [ ] **Testing for Phase 3**
  - Unit tests for job posting logic
  - Integration tests for all API routes
  - E2E test for complete restaurant journey
  - **Effort:** 12 hours (30% of feature effort)

---

### Phase 4: Interaction & Matching (P0)
**Estimated Time:** 1-2 weeks  
**Effort:** ~38 hours

- [ ] **Application Status Workflow**
  - Pending → Accepted → Completed flow
  - Automated status updates via use cases
  - Email notifications via Resend
  - In-app notifications (Notification model)
  - **Effort:** 10 hours

- [ ] **Notification System**
  - In-app notification bell with unread count
  - Mark as read functionality
  - Notification preferences (email/in-app/both)
  - Real-time updates (polling or WebSockets - P1)
  - **Effort:** 12 hours

- [ ] **Job Details Page**
  - Full job description (Server Component)
  - Restaurant information with public profile link
  - Apply button (conditional rendering based on role/auth)
  - Share job link (copy to clipboard)
  - **Effort:** 6 hours

- [ ] **Rating & Review System (Moved from P1)**
  - Restaurants can rate waiters after shift completion
  - Waiters can rate restaurants
  - Display average ratings on profiles
  - Update averageRating automatically via use case
  - **Effort:** 10 hours

- [ ] **Testing for Phase 4**
  - E2E tests for notification flows
  - Integration tests for status transitions
  - **Effort:** 10 hours (30% of feature effort)

---

### Phase 5: Enhancement Features (P1 - Should Have)
**Estimated Time:** 3-4 weeks  
**Effort:** ~40-48 hours

- [ ] **Availability Calendar**
  - Visual calendar for waiter availability (react-big-calendar)
  - Select multiple dates with recurring patterns
  - Sync with job recommendations (matching algorithm)
  - **Effort:** 12 hours

- [ ] **Job Matching Algorithm**
  - Suggest jobs based on skills match (cosine similarity or simple scoring)
  - Location proximity matching (Haversine formula)
  - Availability alignment (WaiterAvailability table)
  - Past rating consideration
  - **Effort:** 16 hours

- [ ] **Messaging System**
  - In-app chat between restaurant and waiter
  - Real-time updates (WebSockets with Pusher or Ably)
  - Message history with pagination
  - File attachment support (images, PDFs)
  - **Effort:** 20 hours

- [ ] **Map Integration**
  - Show job locations on map (Google Maps/Mapbox)
  - Distance calculation from waiter location (Geolocation API)
  - Filter jobs by distance radius
  - **Effort:** 10 hours

---

### Phase 6: Advanced Features (P2 - Nice to Have)
**Estimated Time:** 4-6 weeks  
**Effort:** ~30-36 hours

- [ ] **Payment Integration**
  - Stripe Connect or Mercado Pago integration
  - Handle payments from restaurants to waiters
  - Transaction history with receipts
  - Invoice generation (nota fiscal for Brazil)
  - **Effort:** 20 hours

- [ ] **Mobile App**
  - React Native version for iOS/Android
  - Shared business logic with web app (monorepo)
  - Push notifications (Expo or Firebase)
  - **Effort:** 40+ hours

- [ ] **Background Check Integration**
  - Verify waiter credentials (Checkr or Certn API)
  - ID verification with document upload
  - Display "Verified" badge on profiles
  - **Effort:** 10 hours

- [ ] **Analytics Dashboard**
  - Insights for restaurants (applications, hires, spend)
  - Insights for waiters (applications, earnings, hours)
  - Charts and graphs (Recharts)
  - **Effort:** 10 hours

- [ ] **Multi-language Support**
  - i18n setup with next-intl
  - English/Portuguese/Spanish translations
  - Language switcher in navbar
  - **Effort:** 8 hours

---

## Project Structure (Clean Architecture - Updated)

```
mathjobs/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                    # Route group - unauthenticated
│   │   │   ├── login/
│   │   │   │   ├── page.tsx          # Server Component
│   │   │   │   └── LoginForm.tsx     # Client Component
│   │   │   └── register/
│   │   │       ├── page.tsx
│   │   │       └── RegisterForm.tsx
│   │   │
│   │   ├── (dashboard)/               # Route group - protected
│   │   │   ├── layout.tsx            # Auth check + role redirect
│   │   │   ├── waiter/
│   │   │   │   ├── layout.tsx         # Waiter sidebar
│   │   │   │   ├── page.tsx           # Dashboard (Server Component)
│   │   │   │   ├── profile/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── ProfileForm.tsx
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx       # Job listing (Server Component)
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx  # Job details
│   │   │   │   │   └── JobList.tsx   # Client Component
│   │   │   │   └── applications/
│   │   │   │       ├── page.tsx
│   │   │   │       └── ApplicationList.tsx
│   │   │   │
│   │   └── restaurant/
│   │   │       ├── layout.tsx         # Restaurant sidebar
│   │   │       ├── page.tsx
│   │   │       ├── profile/
│   │   │       ├── jobs/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   │   ├── page.tsx
│   │   │       │   │   └── JobPostingForm.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx
│   │   │       │       └── ApplicantsList.tsx
│   │   │       └── applicants/
│   │   │
│   │   ├── api/                       # API Routes (Route Handlers)
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts       # Auth.js v5 handler
│   │   │   ├── jobs/
│   │   │   │   ├── route.ts           # GET (list) + POST (create)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts       # GET + PATCH + DELETE
│   │   │   │       └── applications/
│   │   │   │           └── route.ts   # POST (apply)
│   │   │   ├── applications/
│   │   │   │   ├── route.ts           # GET (list my apps)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # PATCH (status)
│   │   │   ├── profiles/
│   │   │   │   └── me/
│   │   │   │       └── route.ts       # GET + PATCH
│   │   │   └── notifications/
│   │   │       ├── route.ts           # GET + PATCH
│   │   │       └── [id]/
│   │   │           └── read/
│   │   │               └── route.ts
│   │   │
│   │   ├── layout.tsx                  # Root layout (fonts, providers)
│   │   ├── page.tsx                    # Landing page
│   │   ├── loading.tsx                 # Global loading UI
│   │   └── error.tsx                   # Global error UI
│   │
│   ├── components/                    # Reusable UI components
│   │   ├── ui/                        # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── calendar.tsx
│   │   │   └── toast.tsx              # sonner integration
│   │   │
│   │   ├── forms/                     # Form-specific components
│   │   │   ├── JobPostingForm.tsx
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── ApplicationForm.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   └── FormStepper.tsx
│   │   │
│   │   ├── jobs/                      # Job domain components
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobFilters.tsx
│   │   │   ├── JobDetails.tsx
│   │   │   ├── JobStatusBadge.tsx
│   │   │   └── JobMap.tsx             # P1 feature
│   │   │
│   │   ├── applications/              # Application components
│   │   │   ├── ApplicationCard.tsx
│   │   │   ├── ApplicationList.tsx
│   │   │   ├── ApplicationStatus.tsx
│   │   │   └── ApplicantCard.tsx
│   │   │
│   │   ├── profiles/                  # Profile components
│   │   │   ├── WaiterProfileCard.tsx
│   │   │   ├── RestaurantProfileCard.tsx
│   │   │   ├── SkillsSelector.tsx
│   │   │   ├── AvailabilityCalendar.tsx
│   │   │   └── RatingDisplay.tsx
│   │   │
│   │   ├── layout/                    # Layout components
│   │   │   ├── Navbar.tsx             # Conditional auth rendering
│   │   │   ├── Sidebar.tsx            # Dashboard sidebar
│   │   │   ├── Footer.tsx
│   │   │   └── Breadcrumbs.tsx
│   │   │
│   │   └── shared/                    # Shared utilities
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── InfiniteScroll.tsx
│   │       └── Pagination.tsx
│   │
│   ├── domain/                        # Domain layer (business logic)
│   │   ├── entities/                  # Domain entities
│   │   │   ├── Job.ts
│   │   │   ├── Application.ts
│   │   │   └── User.ts
│   │   │
│   │   ├── use-cases/                # Use cases (application logic)
│   │   │   ├── job/
│   │   │   │   ├── CreateJobUseCase.ts
│   │   │   │   ├── UpdateJobUseCase.ts
│   │   │   │   └── ListJobsUseCase.ts
│   │   │   ├── application/
│   │   │   │   ├── ApplyToJobUseCase.ts
│   │   │   │   ├── UpdateApplicationStatusUseCase.ts
│   │   │   │   └── WithdrawApplicationUseCase.ts
│   │   │   ├── notification/
│   │   │   │   └── CreateNotificationUseCase.ts
│   │   │   └── review/
│   │   │       └── CreateReviewUseCase.ts
│   │   │
│   │   └── services/                  # Domain services
│   │       ├── JobMatchingService.ts
│   │       └── RatingService.ts
│   │
│   ├── infrastructure/                # Infrastructure layer
│   │   ├── auth/                      # Auth.js v5 configuration
│   │   │   ├── options.ts
│   │   │   └── middleware.ts          # RBAC middleware
│   │   │
│   │   ├── database/                  # Prisma client
│   │   │   ├── client.ts
│   │   │   └── seed.ts
│   │   │
│   │   ├── storage/                   # File upload services
│   │   │   └── uploadthing.ts
│   │   │
│   │   ├── email/                     # Email services
│   │   │   └── resend.ts
│   │   │
│   │   └── security/                  # Security utilities
│   │       ├── rate-limit.ts
│   │       └── encryption.ts
│   │
│   ├── lib/                           # Shared utilities
│   │   ├── validators/                # Zod schemas (shared client/server)
│   │   │   ├── jobSchema.ts
│   │   │   ├── applicationSchema.ts
│   │   │   ├── profileSchema.ts
│   │   │   └── reviewSchema.ts
│   │   │
│   │   ├── helpers/                   # Helper functions
│   │   │   ├── date-utils.ts
│   │   │   └── format-utils.ts
│   │   │
│   │   ├── constants/                 # Constants and enums
│   │   │   ├── roles.ts
│   │   │   └── job-status.ts
│   │   │
│   │   └── errors/                   # Error handling
│   │       └── api-errors.ts
│   │
│   ├── hooks/                         # Custom React hooks
│   │   ├── useJobs.ts                 # TanStack Query hooks
│   │   ├── useApplications.ts
│   │   ├── useNotifications.ts
│   │   └── useAuth.ts
│   │
│   └── stores/                        # Zustand stores (client state)
│       ├── uiStore.ts                 # UI state (sidebar, filters)
│       └── authStore.ts              # Auth state (if needed)
│
├── prisma/
│   ├── schema.prisma                  # Database schema (updated)
│   ├── migrations/                    # Database migrations
│   └── seed.ts                       # Seed data
│
├── public/                            # Static assets
│   ├── images/
│   └── fonts/
│
├── tests/                             # Test files
│   ├── unit/                          # Unit tests
│   │   └── domain/
│   ├── integration/                   # Integration tests
│   │   └── api/
│   ├── e2e/                          # E2E tests (Playwright)
│   │   ├── auth.spec.ts
│   │   ├── waiter-journey.spec.ts
│   │   └── restaurant-journey.spec.ts
│   └── __mocks__/                    # Mock data
│       ├── jobs.ts
│       └── users.ts
│
├── .github/
│   └── workflows/                    # GitHub Actions
│       ├── ci.yml                     # Main CI pipeline
│       └── security-pipeline.yml      # Security scans
│
├── .env.local.example                 # Example env file
├── .env.development
├── .env.staging
├── .env.production
├── .gitignore                         # INCLUDES .env*.local!
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.js
├── playwright.config.ts
└── package.json
```

---

## Dependencies & Installation (Updated)

### Core Dependencies
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0",  // Auth.js v5 (NOT v4!)
    "@auth/prisma-adapter": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "react-hook-form": "^7.48.0",
    "@hookform/resolvers": "^3.3.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "sonner": "^1.0.0",
    "date-fns": "^2.30.0",
    "uploadthing": "^6.0.0",
    "resend": "^2.0.0",
    "next-themes": "^0.2.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    // Testing
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0",
    "msw": "^2.0.0",
    "supertest": "^6.3.0",
    "jest-axe": "^8.0.0",
    "axe-core": "^4.8.0",
    // Security
    "snyk": "^1.0.0"
  }
}
```

---

## Environment Variables (Updated)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mathjobs?schema=public"

# Auth.js v5
AUTH_SECRET="your-32-byte-minimum-secret-here"  # Minimum 32 characters!
AUTH_URL="http://localhost:3000"

# File Upload (UploadThing)
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-app-id"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"

# Optional: Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Optional: Payment
STRIPE_SECRET_KEY="your-stripe-secret-key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"

# Security (Production)
ARCJET_KEY="your-arcjet-key"  # Rate limiting + bot protection
```

**⚠️ CRITICAL:** Add `.env*.local` and `.env*.production` to `.gitignore`!

---

## GitHub Configuration

### .gitignore (Updated)
```
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage
/playwright-report
/test-results

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env*.production

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# prisma
db.sqlite
```

### Branch Protection Rules (Recommended)
- Protect `main` branch
- Require pull request reviews (1+)
- Require status checks to pass (CI pipeline)
- Require branches to be up to date before merging
- Include administrators (optional)

---

## CI/CD Pipeline (GitHub Actions - Updated)

### Main CI Pipeline (`.github/workflows/ci.yml`)
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: mathjobs_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Type check
        run: npm run type-check
      
      - name: Run unit/integration tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/mathjobs_test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
  
  security:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      # Dependency scanning
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      # SAST - Static Analysis
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten
            p/react
            p/typescript
      
      # Secret detection
      - name: TruffleHog OSS
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
```

---

## Testing Strategy (Updated - QA Feedback)

### Testing Pyramid
```
          /---\
         / E2E \     10-15% (Playwright - NOT OPTIONAL!)
        /-------\
       /---------\
      / Integration\  25-30% (Jest + Supertest)
     /-------------\
    /---------------\
   /  Unit Tests     \  55-65% (Jest + RTL)
  /_________________\
```

### Coverage Targets (Enforced in CI)
| Layer | Coverage Target | Critical Files |
|-------|----------------|----------------|
| Domain/Use Cases | **90%+** | All business logic |
| API Routes | **85%+** | All endpoints |
| Utilities/Validators | **95%+** | Zod schemas, helpers |
| Components | **70%+** | Critical UI components |
| E2E Critical Paths | **100%** | All P0 user flows |

### Critical E2E Test Scenarios (NOT Optional!)
1. **Waiter Registration & Job Application Flow**
   - Register as Waiter → Create Profile → Browse Jobs → Apply → Check Status
   - Edge: Duplicate application prevented
   - Edge: Cannot apply to closed jobs

2. **Restaurant Job Posting & Applicant Management**
   - Register as Restaurant → Create Profile → Post Job → View Applicants → Accept/Reject
   - Edge: Job validation (past date, invalid times)
   - Edge: Only owner can edit/delete

3. **Authentication & Authorization**
   - Login/Logout flows
   - Unauthorized access redirects
   - Role-based route protection (waiter can't access /restaurant/*)
   - Session persistence across page refreshes

4. **Race Conditions**
   - Two waiters apply simultaneously at maxApplicants
   - Two restaurants editing same job

### Test Tools Configuration

**Jest (`jest.config.js`):**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/domain/**/*.{ts,tsx}',
    'src/infrastructure/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    'src/domain/use-cases/**/*.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts']
};
```

**Playwright (`playwright.config.ts`):**
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    // Mobile
    { name: 'Mobile Chrome', use: { ...devices['Pixel 7'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 14'] } }
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

---

## Security Checklist (DevSecOps Feedback)

### OWASP Top 10 Mitigations
- [x] **A01 Broken Access Control** → RBAC middleware on all API routes
- [x] **A02 Cryptographic Failures** → TLS 1.3, encrypt PII fields, bcrypt 12+ rounds
- [x] **A03 Injection** → Prisma ORM (parameterized queries)
- [x] **A04 Insecure Design** → Rate limiting (Arcjet), account lockout
- [x] **A05 Security Misconfiguration** → Security headers, no debug in prod
- [x] **A06 Vulnerable Components** → Snyk scanning in CI
- [x] **A07 Auth Failures** → Auth.js v5, MFA ready, session management
- [x] **A08 Data Integrity Failures** → CSRF protection (built-in Next.js)
- [x] **A09 Logging Failures** → AuditLog model, Sentry integration
- [x] **A10 SSRF** → Validate file upload URLs, restrict outbound requests

### Security Headers (`next.config.js`)
```javascript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.uploadthing.com; font-src 'self';"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## GDPR/LGPD Compliance Checklist

- [ ] **Consent**: Cookie banner + privacy policy acceptance on register
- [ ] **Right to Access**: `GET /api/user/export` - return all user data JSON
- [ ] **Right to Erasure**: `DELETE /api/user` - cascade delete/anonymize
- [ ] **Data Portability**: Export in machine-readable format (JSON)
- [ ] **Data Minimization**: Only collect necessary fields
- [ ] **Retention Policy**: Auto-delete inactive accounts after 2 years
- [ ] **Privacy Policy**: Required before user registration
- [ ] **Cookie Policy**: List all cookies used
- [ ] **Breach Notification**: Process for 72-hour notification

---

## Performance Budgets

| Metric | Target | Test Method |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse CI |
| FCP (First Contentful Paint) | < 1.8s | Lighthouse CI |
| TTI (Time to Interactive) | < 3s | Lighthouse CI |
| Bundle size (initial JS) | < 250KB | @next/bundle-analyzer |
| API p95 response | < 200ms | k6 load testing |
| Job listing (1000+ records) | < 2s | Playwright timing |

---

## Success Metrics (KPIs - Updated)

### For MVP (First 3 Months)
- User registration rate: **50+ users** (25+ waiters, 25+ restaurants)
- Job posting rate: **20+ jobs posted**
- Application rate: **3+ applications per job**
- Successful hires: **10+ completed shifts**
- Test coverage: **85%+ overall**

### Post-MVP (6+ Months)
- Monthly active users: **500+**
- Job fill rate: **70%+** (jobs that get filled)
- User retention rate: **60%+** (return within 30 days)
- Average time to fill: **< 48 hours**
- Revenue (if payment processing added)

---

## Risks & Mitigation (Updated)

### Identified Risks
1. **Low initial adoption** - Both sides need critical mass
   - **Mitigation:** Focus on one neighborhood/city first, partner with restaurant associations, offer launch incentives

2. **Trust and safety concerns** - Restaurants worried about waiter quality
   - **Mitigation:** Implement rating system, ID verification, background checks (Phase 6), "Verified" badges

3. **Payment disputes** - Issues with payment after shift
   - **Mitigation:** Integrate payment escrow system (Stripe Connect), clear terms of service, dispute resolution process

4. **Legal compliance** - Labor law compliance for short-term work
   - **Mitigation:** Consult with legal expert, clear contractor classification, generate invoices/receipts

5. **Data breaches** - PII exposure risks
   - **Mitigation:** Encrypt sensitive fields, GDPR compliance, regular security audits, Sentry monitoring

6. **Race conditions** - Concurrent applications at maxApplicants
   - **Mitigation:** Database constraints, use cases with proper locking, E2E tests for race conditions

---

## Next Steps (Immediate Actions)

### This Week (Phase 1 Kickoff)
1. ✅ Set up GitHub repository with CI/CD pipeline
2. ✅ Initialize Next.js project with TypeScript and Tailwind
3. ✅ Configure Prisma with PostgreSQL (updated schema)
4. ✅ Implement Auth.js v5 with RBAC middleware
5. ✅ Set up testing infrastructure (Jest + Playwright)
6. ✅ Configure security tools in CI (Snyk, Semgrep, TruffleHog)

### Week 2-4 (Phase 2 & 3)
1. Build waiter profile and job browsing features
2. Build restaurant profile and job posting features
3. Implement application system with notifications
4. Test complete user flows (E2E - NOT optional!)

### Month 2 (Phase 4 & Polish)
1. Add notifications and status workflows
2. Implement rating & review system
3. Polish UI/UX (mobile-first!)
4. Beta testing with real users (50+ users)
5. Deploy to production (Vercel + Neon)

---

## Resources & References

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Auth.js v5 Docs](https://authjs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Playwright Docs](https://playwright.dev/)

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth.js Security](https://authjs.dev/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

### Inspiration & Competitors
- [Instawork](https://www.instawork.com/)
- [Qwick](https://qwick.com/)
- [Poached Jobs](https://www.poachedjobs.com/)

---

## Agent Meeting Summary (April 24, 2026)

All 4 agents participated in the technical planning meeting:

✅ **Backend Agent**
- Fixed Prisma schema (added indexes, fixed Review relations, added NextAuth models)
- Recommended API endpoint structure with RBAC
- Standardized error handling strategy
- Estimated effort: ~82-98 hours (MVP)

✅ **Frontend Agent**
- Clarified state management: USE BOTH TanStack Query + Zustand
- Recommended Server/Client Component strategy
- Suggested component architecture (Atomic Design)
- Estimated effort: ~110 hours (MVP)

✅ **DevSecOps Agent**
- Identified critical security gaps (RBAC, CI/CD, secrets management)
- Recommended Auth.js v5 (NextAuth v4 deprecated!)
- Provided CI/CD pipeline with security scans
- GDPR/LGPD compliance checklist

✅ **QA Agent**
- **E2E tests are NOT optional for MVP!**
- Recommended Playwright over Cypress for Next.js
- Set coverage targets (90% domain, 85% API, 100% critical paths)
- Provided testing pyramid and critical test scenarios

**Decision:** Incorporate ALL feedback into v2.0 plan before starting implementation.

---

**Last Updated:** April 24, 2026  
**Version:** 2.0 (Major Update with Agent Feedback)  
**Author:** Tech Lead Agent  
**Contributors:** Backend Agent, Frontend Agent, DevSecOps Agent, QA Agent
