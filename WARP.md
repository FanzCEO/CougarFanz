# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

# PupFanz • WARP Guide

Speak human. Move fast. Creator-first.

## Quick Start

1) `nvm use` (if .nvmrc present, otherwise use Node 20+)
2) `pnpm install --frozen-lockfile`
3) Copy `env/.env.example` → `env/.env.local` and edit values
4) `pnpm db:push` (apply schema to database)
5) `pnpm dev` (starts both frontend and backend)
6) Open http://localhost:5000 (dev server)

## Common Commands

- `pnpm dev` - Start both frontend/backend in development
- `pnpm build` - Build frontend and backend for production
- `pnpm start` - Start production build
- `pnpm check` - TypeScript type checking
- `pnpm lint` - ESLint (if configured)
- `pnpm test` - Run tests (if configured)  
- `pnpm db:push` - Apply schema changes to database

## Architecture (High-level)

**Frontend**
- React 18 + TypeScript
- Vite (fast dev/build) 
- Wouter (lightweight routing)
- TanStack React Query (server state management)
- Radix UI + Tailwind CSS (accessible, themed components)
- Brand colors: Volt lime, Cobalt blue, Tangerine orange on dark theme

**Backend**
- Node.js (ESM) + TypeScript + Express.js
- RESTful API with comprehensive middleware (security, validation, rate limiting)
- WebSocket server for real-time messaging and notifications
- Google Cloud Storage integration for media assets

**Authentication**
- Dual authentication system:
  - Replit OIDC (currently implemented) - quick onboarding via `/api/login`
  - Local JWT authentication (available) - traditional email/password
- PostgreSQL-backed session storage (sessions table)
- CSRF protection, rate limiting, secure cookies

**Database**
- PostgreSQL (Neon serverless recommended)
- Drizzle ORM for type-safe operations and migrations
- Schema in `shared/schema.ts` covers: users, profiles, media, subscriptions, messaging, consent, KYC/2257 compliance, moderation, safety reports
- Multi-tenant support: tenants, content, content_tenant_map, subscription_plans

**Safety & Compliance**
- Age/KYC verification system with document upload
- Granular consent tracking for interactions and data usage
- Content moderation queue with AI confidence scoring
- GDPR-compliant data handling with explicit consent
- Adult industry compliance (18 U.S.C. §2257)
- WCAG 2.2 AA accessibility standards

## Environment Setup

**Tooling Requirements**
- Node.js 20+ (use .nvmrc if present)
- pnpm (only package manager supported)
- Environment files: `.env` for development (no `.env` folder structure currently)

**Required Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/pupfanz"

# Replit Authentication  
REPL_ID="your-replit-client-id"
REPLIT_DOMAINS="your-domain.com"
ISSUER_URL="https://replit.com/oidc"
SESSION_SECRET="your-session-secret-key"

# Local JWT Authentication
JWT_SECRET="your-jwt-secret-key-64-characters-minimum"

# Google Cloud Storage (optional)
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
# Or individual GCS environment variables

# Optional
NODE_ENV="development"
PORT="5000"
```

## Database & Migrations

- ORM: Drizzle with PostgreSQL
- Schema: `shared/schema.ts` includes sessions table for Replit Auth
- Configuration: `drizzle.config.ts`

**Key Commands:**
- `pnpm db:push` - Push schema changes to database
- Database includes sessions table for connect-pg-simple (Replit auth dependency)

**Important Tables:**
- `users` - Core user accounts with dual auth support (local/replit)
- `profiles` - Creator/fan profiles with KYC status, pack types, safety badges
- `media_assets` - Content with access levels (pack/premium/ppv), forensic signatures
- `sessions` - Required for Replit OIDC authentication
- `subscriptions`, `tips`, `messages` - Monetization and communication
- `kyc_verifications`, `records_2257` - Compliance and age verification
- `moderation_queue`, `safety_reports` - Content safety and community management

## Authentication Flows

**Replit OIDC (Currently Active)**
- `GET /api/login` - Initiates OIDC flow with scopes: openid, email, profile, offline_access
- `GET /api/callback` - OIDC callback handler (hostname-aware strategy)
- `GET /api/logout` - Ends session with OIDC end-session redirect
- Middleware: `isAuthenticated` - Validates session, refreshes expired tokens
- Session storage: connect-pg-simple with PostgreSQL sessions table (7-day TTL)

**Local JWT (Available)**
- `POST /api/auth/register` - Create account with email/password
- `POST /api/auth/login` - Authenticate with credentials  
- Uses bcrypt for password hashing, Zod for validation
- JWT tokens with configurable expiration

**Development Note:**
- Cookies default to `secure: true` - use HTTPS in development or modify for local development

## Media Storage & Content

- Google Cloud Storage for direct-to-cloud uploads via Uppy
- Custom ACL system supports pack/subscriber-only, premium, pay-per-view content
- Forensic watermarking and content fingerprinting for protection
- Object storage service with granular permission controls

**File Upload Flow:**
1. Client requests upload URL via `POST /api/objects/upload`
2. Direct upload to GCS with custom ACL policies
3. Media metadata stored in `media_assets` table
4. Access controlled via `GET /objects/:objectPath(*)` endpoint

## Multi-tenant Content Model

**Key Tables:**
- `tenants` - Platform instances (PupFanz, GirlFanz, etc.)
- `content` - Creator content with canonical tenant assignment
- `content_tenant_map` - Cross-platform publishing (published/scheduled/hidden)
- `subscription_plans` - Per-tenant creator subscription offerings

**Cross-posting Flow:**
- Content authored on canonical tenant
- Mapped to other tenants via content_tenant_map
- Status controls: published, scheduled, hidden

## Safety, Compliance & Accessibility

**Compliance Systems:**
- KYC verification via `kyc_verifications` table with document storage
- 18 U.S.C. §2257 record keeping in `records_2257`
- Granular consent tracking in `consent_records`
- Content moderation queue with AI confidence scoring
- Safety reporting system with investigation workflows

**Data Protection:**
- GDPR-compliant with explicit consent mechanisms
- No third-party data sharing without opt-in
- Right to deletion and data export capabilities

**Accessibility:**
- WCAG 2.2 AA compliance baseline
- Radix UI accessible component primitives
- Focus management, keyboard navigation, alt text requirements

**Legal Framework:**
- Policies and procedures: https://Fanz.Foundation/knowledge-base

## Payments & Monetization

**CRITICAL: Adult-Friendly Processors Only**
- Never use Stripe, PayPal, or Square (prohibited for adult content)
- Approved processors: CCBill, Segpay, Epoch, Vendo, Verotel, NetBilling, CommerceGate, RocketGate, CentroBill, Payze, Kolektiva
- Creator payouts: Paxum (industry standard), ePayService, Wise, crypto, ACH/SEPA
- FanzDash serves as super-admin layer for payment routing and risk management

**Tipping System:**
- Real-time tips via WebSocket with database persistence
- Integration with adult-friendly payment processors
- Transparent fee structure for creators

## Real-time Features

**WebSocket Server:**
- Real-time messaging system
- Live notifications and updates
- Connection on `/ws` path
- Message broadcasting to connected clients

**Messaging:**
- Direct messages between users with media sharing support
- Message types: text, image, tip, system
- Read receipts and conversation management

## Development Workflow

**Code Quality:**
- TypeScript strict mode enabled
- Zod validation for API inputs and form data
- ESLint configuration (if present)
- Pre-commit hooks for code quality

**Testing:**
- Unit tests for business logic
- Integration tests for API endpoints and authentication
- Database integration testing
- Load testing before major releases

**Performance:**
- API response time targets: P95 < 300ms
- Upload success rate > 99.9%
- Error rate monitoring and alerting
- Database connection pooling for production

## Security Considerations

**Transport & Storage:**
- TLS 1.3 for all connections
- AES-256 encryption at rest
- Zero-trust network architecture
- Least privilege access principles

**Application Security:**
- CSRF protection via double submit cookies
- Rate limiting per IP and user
- Input validation with Zod schemas
- XSS and injection attack prevention

**Session Management:**
- Secure cookie configuration
- Session expiration and refresh token rotation
- Multi-factor authentication support (admin)

## Observability

**Structured Logging:**
- Request correlation IDs
- User action tracking
- Error stack traces with context
- Security event logging

**Monitoring:**
- Health check endpoints for all services
- Database connection pool monitoring
- Error rate and response time metrics
- Active session tracking

**Incident Response:**
- SLA: Detection < 5 minutes, resolution < 30 minutes
- Post-mortem process within 48 hours
- Automated alerting for critical failures

## Platform Integration

**FanzDash Integration:**
- Central security control center
- Cross-platform policy enforcement
- Creator relationship management
- Financial transaction oversight

**Multi-platform Ecosystem:**
- Unified SSO across FANZ network
- Cross-platform content publishing
- Shared creator profiles and verification status
- Consolidated analytics and reporting

## Development Commands Reference

Based on current package.json scripts:
```bash
# Development
pnpm dev          # NODE_ENV=development tsx server/index.ts

# Production  
pnpm build        # vite build && esbuild bundle
pnpm start        # NODE_ENV=production node dist/index.js

# Database
pnpm db:push      # drizzle-kit push (apply schema)

# Quality
pnpm check        # TypeScript compilation check
```

## File Structure Notes

- `server/` - Express.js backend with routes, middleware, services
- `client/` - React frontend with Vite build system  
- `shared/` - Shared TypeScript types and database schema
- `components.json` - Radix UI configuration
- Tailwind configuration with custom PupFanz theming

## Environment-Specific Notes

**Development:**
- Uses tsx for TypeScript execution
- Hot reloading via Vite
- Database migrations applied directly via drizzle-kit push

**Production:**
- ESBuild bundling for server
- Vite production build for client
- Proper session security and HTTPS enforcement
- Connection pooling and performance optimization

**Deployment:**
- Built for serverless/container environments
- Health check endpoint available
- Graceful shutdown handling
- Static asset serving configuration