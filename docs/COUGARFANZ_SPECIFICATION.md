# CougarFanz Platform Specification

**Version:** 1.0
**Last Updated:** 2025-11-28
**Status:** Production Ready

> "Where experience isn't just welcomed — it's worshipped."

---

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Data Models](#2-data-models)
3. [API Endpoints](#3-api-endpoints)
4. [UX & UI Design Specification](#4-ux--ui-design-specification)
5. [Branding Guide](#5-branding-guide)
6. [Category & Tag Taxonomy](#6-category--tag-taxonomy)
7. [Safety, Privacy & Compliance](#7-safety-privacy--compliance)
8. [Competitive Differentiators](#8-competitive-differentiators)

---

## 1. System Architecture Overview

### 1.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript + Vite | SPA with hot reload |
| **Styling** | TailwindCSS 3.4 + CSS Variables | Theme-aware design system |
| **Routing** | Wouter | Lightweight client routing |
| **State** | React Query + Context | Server state + UI state |
| **Backend** | Express 4.21 + Node.js | RESTful API server |
| **Database** | PostgreSQL (Supabase) | Primary data store |
| **ORM** | Drizzle ORM 0.44 | Type-safe queries |
| **Auth** | Passport.js + JWT | Session + token auth |
| **File Storage** | Google Cloud Storage | Media assets |
| **Real-time** | WebSocket | Live features |
| **Components** | Radix UI | Accessible primitives |

### 1.2 Multi-Tenant Architecture

CougarFanz operates as a tenant within the unified FANZ ecosystem:

```
┌─────────────────────────────────────────────────────────────┐
│                    FANZ ECOSYSTEM                            │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│  GirlFanz   │   PupFanz   │  DaddyFanz  │    CougarFanz      │
│  (girly)    │   (pups)    │  (daddies)  │    (cougars)       │
├─────────────┴─────────────┴─────────────┴─────────────────────┤
│                 SHARED INFRASTRUCTURE                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │  Auth   │ │ Content │ │ Wallet  │ │  Live   │            │
│  │ Service │ │   CDN   │ │ Ledger  │ │ Stream  │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
├──────────────────────────────────────────────────────────────┤
│                    PostgreSQL + Redis                        │
└──────────────────────────────────────────────────────────────┘
```

### 1.3 Service Architecture

```
┌────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite) - CougarFanz Themed                │  │
│  │  - Landing Page (Gold/Black Luxury)                  │  │
│  │  - Explore (Archetype Filters)                       │  │
│  │  - Creator Profiles (Glam Hero Layout)               │  │
│  │  - Creator Studio (Elegance Dashboard)               │  │
│  │  - Messaging / Live / Wallet                         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      API GATEWAY                           │
│  Express.js + Passport.js + Rate Limiting                  │
│  /api/auth, /api/creators, /api/content, /api/payments     │
└────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   CORE SERVICES │  │   AI SERVICES   │  │  MEDIA SERVICES │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ - User/Profile  │  │ - Persona Coach │  │ - Upload Queue  │
│ - Subscriptions │  │ - Caption Gen   │  │ - Transcoding   │
│ - Tips/Wallet   │  │ - Discovery AI  │  │ - CDN Delivery  │
│ - Messaging     │  │ - Safety Guard  │  │ - Thumbnails    │
│ - Live Streams  │  │ - Tag Suggest   │  │ - Watermarking  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      DATA LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  PostgreSQL  │  │    Redis     │  │     GCS      │     │
│  │  (Supabase)  │  │   (Cache)    │  │   (Media)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────────────────────────────────────────┘
```

### 1.4 Request Flow

```
User Request → CDN → Load Balancer → Express API
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Auth Middleware      Rate Limiter          Tenant Router
                    │                     │                     │
                    └─────────────────────┼─────────────────────┘
                                          ▼
                                    Route Handler
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
              Drizzle ORM           Redis Cache          Queue Worker
                    │                     │                     │
                    ▼                     ▼                     ▼
               PostgreSQL              Memory              Background Jobs
```

---

## 2. Data Models

### 2.1 CougarFanz Schema Extensions

The following tables extend the base FANZ schema for CougarFanz-specific features:

#### 2.1.1 Creator Archetypes

```typescript
// CougarFanz Creator Archetypes
export const creatorArchetypes = pgTable("creator_archetypes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  archetype: varchar("archetype", {
    enum: [
      'alpha',        // The Alpha - Dominant, powerful presence
      'maneater',     // The Maneater - Confident, captivating
      'siren',        // The Siren - Alluring, mysterious
      'vixen',        // The Vixen - Playful, flirty
      'matriarch',    // The Matriarch - Nurturing authority
      'seductress',   // The Seductress - Personality-based charm
      'boss',         // The Boss - Corporate power energy
      'enchantress',  // The Enchantress - Magical, captivating
      'wildcard'      // The Wildcard - Unpredictable, fun
    ]
  }).notNull(),
  isPrimary: boolean("is_primary").default(false),
  confidenceScore: integer("confidence_score").default(50), // 0-100
  brandingGuide: jsonb("branding_guide").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_archetype_user").on(table.userId),
  index("idx_archetype_type").on(table.archetype),
]);
```

#### 2.1.2 Age Era Badges

```typescript
// Age Era Identity Badges (Non-explicit, identity affirmation)
export const ageEraBadges = pgTable("age_era_badges", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  eraTag: varchar("era_tag", {
    enum: [
      '30_plus_crew',    // 30+ Crew
      '40_plus_fierce',  // 40+ Fierce
      '50_plus_fine',    // 50+ Fine
      '60_plus_timeless' // 60+ Timeless
    ]
  }).notNull(),
  verifiedAt: timestamp("verified_at"),
  displayOnProfile: boolean("display_on_profile").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_era_user").on(table.userId),
  uniqueIndex("idx_era_unique").on(table.userId, table.eraTag),
]);
```

#### 2.1.3 Vibe Tags

```typescript
// CougarFanz Vibe/Personality Tags
export const vibeTags = pgTable("vibe_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  category: varchar("category", {
    enum: ['personality', 'aesthetic', 'lifestyle', 'setting']
  }).notNull(),
  displayName: varchar("display_name").notNull(),
  description: text("description"),
  iconEmoji: varchar("icon_emoji"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Creator-Vibe Tag Associations
export const creatorVibeTags = pgTable("creator_vibe_tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  vibeTagId: varchar("vibe_tag_id").references(() => vibeTags.id).notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_creator_vibe_unique").on(table.userId, table.vibeTagId),
  index("idx_creator_vibes").on(table.userId),
]);
```

#### 2.1.4 Fan Archetypes

```typescript
// Fan/Admirer Archetypes
export const fanArchetypes = pgTable("fan_archetypes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  archetype: varchar("archetype", {
    enum: [
      'admirer',     // Classic appreciator
      'cub',         // Younger admirer (non-explicit term)
      'enthusiast',  // Passionate fan
      'vip_follower' // Premium supporter
    ]
  }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_fan_archetype_unique").on(table.userId),
]);
```

#### 2.1.5 Confidence Meter

```typescript
// Creator Confidence Meter (Personality-based metric)
export const confidenceMetrics = pgTable("confidence_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  overallScore: integer("overall_score").default(50), // 0-100

  // Component scores
  profileCompleteness: integer("profile_completeness").default(0),
  contentConsistency: integer("content_consistency").default(0),
  engagementRate: integer("engagement_rate").default(0),
  brandingStrength: integer("branding_strength").default(0),
  communityPresence: integer("community_presence").default(0),

  // Display settings
  showOnProfile: boolean("show_on_profile").default(true),
  lastCalculatedAt: timestamp("last_calculated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_confidence_user").on(table.userId),
]);
```

#### 2.1.6 Extended Profile Fields

```typescript
// CougarFanz Extended Profile
export const cougarProfiles = pgTable("cougar_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),

  // Signature branding
  signatureTagline: varchar("signature_tagline", { length: 200 }),
  glamBio: text("glam_bio"),

  // Visual settings
  profileFrameStyle: varchar("profile_frame_style", {
    enum: ['gold_classic', 'rose_gold', 'champagne', 'bronze', 'platinum']
  }).default('gold_classic'),

  bannerOverlayStyle: varchar("banner_overlay_style", {
    enum: ['none', 'velvet', 'leopard_subtle', 'gold_foil', 'gradient']
  }).default('none'),

  // Boundaries & preferences (for respectful messaging)
  boundariesDescription: text("boundaries_description"),
  preferredTerms: jsonb("preferred_terms").default([]), // How they like to be addressed
  blockedTerms: jsonb("blocked_terms").default([]), // Auto-filtered from messages

  // Subscription tiers naming
  tierNaming: jsonb("tier_naming").default({
    basic: "Admirer",
    premium: "VIP",
    vip: "Inner Circle"
  }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_cougar_profile_user").on(table.userId),
]);
```

### 2.2 Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────────┐
│     users       │───────│   cougar_profiles    │
│  (base FANZ)    │   1:1 │  (extended profile)  │
└────────┬────────┘       └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌──────────────────────┐
│creator_archetypes│      │   confidence_metrics │
│  (Alpha, Siren) │       │   (personality score)│
└─────────────────┘       └──────────────────────┘
         │
         │ N:M
         ▼
┌─────────────────┐       ┌──────────────────────┐
│creator_vibe_tags│◄──────│     vibe_tags        │
│  (associations) │       │ (tag definitions)    │
└─────────────────┘       └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌──────────────────────┐
│  age_era_badges │       │   fan_archetypes     │
│ (30+, 40+, etc) │       │ (Admirer, Cub, etc)  │
└─────────────────┘       └──────────────────────┘
```

### 2.3 Tenant Configuration

```typescript
// CougarFanz Tenant Entry
{
  id: "cougarfanz-uuid",
  slug: "cougars",
  name: "CougarFanz",
  settings: {
    theme: "cougar_glam",
    brandColors: {
      primary: "#D4AF37",      // Luxury Gold
      secondary: "#722F37",    // Wine Ruby
      accent: "#C41E3A",       // Cardinal Red
      background: "#1A1A1A",   // Deep Satin Black
      surface: "#2D2D2D"       // Rich Espresso
    },
    features: {
      archetypesEnabled: true,
      ageEraBadgesEnabled: true,
      confidenceMeterEnabled: true,
      glamProfilesEnabled: true
    },
    copywriting: {
      heroTagline: "Where Experience Reigns Supreme",
      ctaPrimary: "Enter the Den",
      ctaSecondary: "Become a Queen"
    }
  }
}
```

---

## 3. API Endpoints

### 3.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Email/password login |
| GET | `/api/auth/callback` | OAuth callback |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/user` | Get current user |
| POST | `/api/auth/refresh` | Refresh JWT token |

### 3.2 Creator Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/creators` | List creators (paginated, filtered) |
| GET | `/api/creators/:id` | Get creator profile |
| PUT | `/api/creators/:id` | Update creator profile |
| GET | `/api/creators/:id/content` | Get creator's content |
| GET | `/api/creators/:id/archetypes` | Get creator archetypes |
| PUT | `/api/creators/:id/archetypes` | Update archetypes |
| GET | `/api/creators/:id/vibes` | Get vibe tags |
| PUT | `/api/creators/:id/vibes` | Update vibe tags |
| GET | `/api/creators/:id/confidence` | Get confidence meter |

### 3.3 Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/content` | List content (feed) |
| POST | `/api/content` | Create new content |
| GET | `/api/content/:id` | Get content details |
| PUT | `/api/content/:id` | Update content |
| DELETE | `/api/content/:id` | Delete content |
| POST | `/api/content/:id/like` | Like content |
| POST | `/api/content/:id/unlock` | Purchase PPV content |

### 3.4 Discovery & Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discover` | Discover creators |
| GET | `/api/discover/featured` | Featured Cougars |
| GET | `/api/discover/rising` | Rising Queens |
| GET | `/api/discover/archetypes/:type` | By archetype |
| GET | `/api/discover/vibes/:vibe` | By vibe tag |
| GET | `/api/discover/era/:era` | By age era |
| GET | `/api/search` | Full-text search |

### 3.5 Subscriptions & Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | User's subscriptions |
| POST | `/api/subscriptions` | Create subscription |
| DELETE | `/api/subscriptions/:id` | Cancel subscription |
| POST | `/api/tips` | Send tip |
| GET | `/api/wallet` | Get wallet balance |
| POST | `/api/wallet/deposit` | Add funds |
| POST | `/api/wallet/withdraw` | Request payout |

### 3.6 Messaging

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/:conversationId` | Get messages |
| POST | `/api/messages` | Send message |
| PUT | `/api/messages/:id/read` | Mark as read |

### 3.7 Live Streaming

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/live` | List active streams |
| POST | `/api/live` | Start stream |
| PUT | `/api/live/:id` | Update stream |
| DELETE | `/api/live/:id` | End stream |
| GET | `/api/live/:id/viewers` | Get viewers |

### 3.8 Tags & Taxonomy

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tags/vibes` | All vibe tags |
| GET | `/api/tags/archetypes` | All archetypes |
| GET | `/api/tags/eras` | All age eras |
| GET | `/api/tags/aesthetics` | Aesthetic tags |

### 3.9 AI Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/persona-coach` | Get archetype suggestions |
| POST | `/api/ai/caption` | Generate glam caption |
| POST | `/api/ai/bio` | Generate bio suggestions |
| POST | `/api/ai/tags` | Suggest tags |
| POST | `/api/ai/safety-check` | Content safety scan |

---

## 4. UX & UI Design Specification

### 4.1 Landing Page

**Purpose:** First impression, brand establishment, conversion

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Logo | Explore | Become a Queen | Sign In         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HERO SECTION                            │   │
│  │  ┌───────────────────┐  ┌─────────────────────────┐ │   │
│  │  │                   │  │    "Where Experience    │ │   │
│  │  │   Glam Creator    │  │    Reigns Supreme"      │ │   │
│  │  │      Image        │  │                         │ │   │
│  │  │   (Silhouette)    │  │  [Enter the Den]        │ │   │
│  │  │                   │  │  [Become a Queen]       │ │   │
│  │  └───────────────────┘  └─────────────────────────┘ │   │
│  │                                                      │   │
│  │  Badges: [18+ Verified] [Safe Space] [VIP Energy]   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                   FEATURED COUGARS                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Card   │ │  Card   │ │  Card   │ │  Card   │           │
│  │ Avatar  │ │ Avatar  │ │ Avatar  │ │ Avatar  │           │
│  │ Alpha   │ │ Siren   │ │ Vixen   │ │  Boss   │           │
│  │ 40+Fine │ │ 30+Crew │ │ 50+Fine │ │ 40+Fierce│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
├─────────────────────────────────────────────────────────────┤
│                   VALUE PROPOSITIONS                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Glam      │ │  Confident  │ │   Premium   │           │
│  │   Content   │ │  Community  │ │   Earnings  │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│                      FOOTER                                 │
└─────────────────────────────────────────────────────────────┘
```

**Visual Specifications:**
- Background: Deep satin black with gold gradient accents
- Hero: Radial gold glow emanating from center
- Typography: Luxury serif for headlines, sleek sans for body
- Animations: Subtle gold shimmer on hover, velvet-smooth transitions

### 4.2 Explore/Discovery Page

**Purpose:** Creator discovery with archetype and vibe filtering

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                            │
├─────────────────────────────────────────────────────────────┤
│  FILTER BAR                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [All] [Alpha] [Siren] [Vixen] [Boss] [Enchantress]  │   │
│  │                                                      │   │
│  │ Vibes: [Elegant] [Bold] [Playful] [Glam] [Wild]     │   │
│  │                                                      │   │
│  │ Era: [30+] [40+] [50+] [60+]  |  Sort: [Trending ▼] │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  CREATOR GRID                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │           │
│  │ │     │ │ │ │     │ │ │ │     │ │ │ │     │ │           │
│  │ │ Img │ │ │ │ Img │ │ │ │ Img │ │ │ │ Img │ │           │
│  │ │     │ │ │ │     │ │ │ │     │ │ │ │     │ │           │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │           │
│  │ Name    │ │ Name    │ │ Name    │ │ Name    │           │
│  │ @handle │ │ @handle │ │ @handle │ │ @handle │           │
│  │ [Alpha] │ │ [Siren] │ │ [Vixen] │ │ [Boss]  │           │
│  │ 40+Fierce│ │ 30+Crew │ │ 50+Fine │ │40+Fierce│          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  ...    │ │  ...    │ │  ...    │ │  ...    │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│                    [Load More]                              │
└─────────────────────────────────────────────────────────────┘
```

**Interaction Specifications:**
- Filter chips: Gold border on active, subtle glow
- Cards: Warm gold glow on hover, lift animation
- Infinite scroll with skeleton loaders
- Quick-subscribe button on hover

### 4.3 Creator Profile Page

**Purpose:** Creator brand showcase, subscription conversion

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 HERO BANNER                          │   │
│  │         (Glam lighting, velvet overlay)              │   │
│  │                                                      │   │
│  │    ┌─────────────┐                                   │   │
│  │    │   AVATAR    │  ← Gold frame border              │   │
│  │    │  (Glam shot)│                                   │   │
│  │    └─────────────┘                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CREATOR INFO                                        │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ Queen Victoria                                 │  │   │
│  │  │ @queenvictoria                                 │  │   │
│  │  │                                                │  │   │
│  │  │ [Alpha] [40+ Fierce]                          │  │   │
│  │  │ [Elegant] [Boss Energy] [Luxury Goddess]      │  │   │
│  │  │                                                │  │   │
│  │  │ "Where confidence meets charisma."            │  │   │
│  │  │                                                │  │   │
│  │  │ ┌──────────────────────────────────────────┐  │  │   │
│  │  │ │     CONFIDENCE METER: ████████░░ 82%     │  │  │   │
│  │  │ └──────────────────────────────────────────┘  │  │   │
│  │  │                                                │  │   │
│  │  │ 12.4K Admirers | 847 Posts | 4.9★ Rating     │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  │                                                      │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐       │   │
│  │  │ Subscribe  │ │    Tip     │ │  Message   │       │   │
│  │  │  $14.99/mo │ │   💎 Send  │ │  ✉️ Chat   │       │   │
│  │  └────────────┘ └────────────┘ └────────────┘       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CONTENT TABS: [Posts] [Media] [Streams] [About]    │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  CONTENT GRID                                        │   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐            │   │
│  │  │       │ │       │ │       │ │       │            │   │
│  │  │  Img  │ │  Img  │ │  Img  │ │  Img  │            │   │
│  │  │       │ │       │ │       │ │       │            │   │
│  │  │ 🔒PPV │ │       │ │       │ │ 🔒PPV │            │   │
│  │  └───────┘ └───────┘ └───────┘ └───────┘            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Visual Specifications:**
- Avatar: Warm gold circular frame with subtle glow
- Banner: Supports velvet/leopard overlay options
- Archetype badges: Styled per archetype color scheme
- Confidence meter: Animated gold fill bar
- Content cards: Luxury typography, warm hover glow

### 4.4 Creator Studio Dashboard

**Purpose:** Creator analytics, content management, earnings

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  CREATOR STUDIO HEADER                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👑 Queen Victoria's Studio      [Upload] [Go Live]  │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                │
│  │ SIDEBAR │  ┌─────────────────────────────────────────┐  │
│  │         │  │  DASHBOARD OVERVIEW                      │  │
│  │ Overview│  │                                          │  │
│  │ Content │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐    │  │
│  │ Messages│  │  │ Monthly │ │  Active │ │   Top   │    │  │
│  │ Analytics│ │  │Elegance │ │   Cubs  │ │Supporters│   │  │
│  │ Earnings│  │  │Earnings │ │         │ │         │    │  │
│  │ Settings│  │  │ $4,247  │ │  1,247  │ │   VIPs  │    │  │
│  │ AI Coach│  │  │  ↑ 12%  │ │  ↑ 8%   │ │    23   │    │  │
│  │         │  │  └─────────┘ └─────────┘ └─────────┘    │  │
│  │         │  │                                          │  │
│  │         │  │  ┌─────────────────────────────────────┐│  │
│  │         │  │  │     YOUR GLAM IMPACT                ││  │
│  │         │  │  │     (Engagement Chart)              ││  │
│  │         │  │  │     📈 ─────────────────            ││  │
│  │         │  │  └─────────────────────────────────────┘│  │
│  │         │  │                                          │  │
│  │         │  │  ┌─────────────────────────────────────┐│  │
│  │         │  │  │     AI COACHING TIPS                ││  │
│  │         │  │  │  💡 Your Siren archetype content    ││  │
│  │         │  │  │     performs 23% better on Fridays  ││  │
│  │         │  │  │  💡 Try the "Luxury Goddess" vibe   ││  │
│  │         │  │  └─────────────────────────────────────┘│  │
│  └─────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Feed Page

**Purpose:** Content consumption, engagement

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐          │
│  │  FEED FILTERS: [Following] [For You] [Live]  │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CONTENT CARD                                        │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ 👤 Queen Victoria  @queenvictoria  [Alpha]    │  │   │
│  │  │ 2 hours ago                                    │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │                                                │  │   │
│  │  │              CONTENT MEDIA                     │  │   │
│  │  │         (Glam photo/video preview)             │  │   │
│  │  │                                                │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │ "Evening elegance never goes out of style. 💫" │  │   │
│  │  │                                                │  │   │
│  │  │ ❤️ 234  💬 45  💎 12 Tips  📤 Share           │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CONTENT CARD (PPV)                                  │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │ 👤 Velvet Vixen  @velvetvixen  [Vixen]        │  │   │
│  │  │ 5 hours ago                                    │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │      ┌─────────────────────────────────┐       │  │   │
│  │  │      │         🔒 LOCKED               │       │  │   │
│  │  │      │     Unlock for $9.99            │       │  │   │
│  │  │      │        [Unlock Now]             │       │  │   │
│  │  │      └─────────────────────────────────┘       │  │   │
│  │  ├───────────────────────────────────────────────┤  │   │
│  │  │ "Something special for my Inner Circle... 🌹"  │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Load More...]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 Messages Page

**Purpose:** Direct creator-fan communication

**Visual Specifications:**
- Clean, modern chat interface
- Creator messages: Gold accent bubble
- Fan messages: Neutral dark bubble
- Tip notifications: Champagne highlight
- Media sharing with blur preview for PPV

### 4.7 Live Streaming Page

**Purpose:** Real-time creator broadcasts

**Visual Specifications:**
- Spotlight lighting effect on stream preview
- Gold-trimmed viewer count display
- Tip rain animation (golden sparkles)
- Chat overlay with VIP highlighting
- Co-star verification badge display

### 4.8 Wallet Page

**Purpose:** Financial management

**Visual Specifications:**
- Champagne gold balance display
- Transaction history with icons
- Earnings breakdown by source
- Payout scheduling interface
- Premium metallic card design

---

## 5. Branding Guide

### 5.1 Color System

#### Primary Palette

| Token | HSL | Hex | Usage |
|-------|-----|-----|-------|
| `cfz-gold` | 43, 74%, 51% | #D4AF37 | Primary accent, CTAs, highlights |
| `cfz-wine` | 355, 45%, 33% | #722F37 | Secondary accent, depth |
| `cfz-cardinal` | 350, 74%, 40% | #C41E3A | Alerts, emphasis, passion |
| `cfz-satin-black` | 0, 0%, 10% | #1A1A1A | Background |
| `cfz-espresso` | 0, 0%, 18% | #2D2D2D | Surface, cards |
| `cfz-champagne` | 39, 77%, 83% | #F7E7CE | Highlights, glow |
| `cfz-bronze` | 30, 67%, 40% | #A97142 | Metallic accents |

#### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `cfz-success` | #10B981 | Emerald - VIP energy, success states |
| `cfz-warning` | #F59E0B | Amber - Caution, pending states |
| `cfz-danger` | #DC2626 | Crimson - Errors, destructive actions |
| `cfz-border` | #3D3D3D | Matte warm gray borders |

### 5.2 Typography

#### Font Stack

```css
--cfz-font-display: 'Playfair Display', 'Times New Roman', serif;
--cfz-font-sans: 'Inter', 'Helvetica Neue', sans-serif;
--cfz-font-accent: 'Cormorant Garamond', Georgia, serif;
```

#### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 72px | 700 | Hero headlines |
| H1 | 48px | 700 | Page titles |
| H2 | 36px | 600 | Section headers |
| H3 | 24px | 600 | Card titles |
| H4 | 20px | 500 | Subsections |
| Body | 16px | 400 | Paragraphs |
| Small | 14px | 400 | Captions, metadata |
| Micro | 12px | 500 | Badges, labels |

### 5.3 Visual Motifs

#### Patterns & Textures
- **Leopard Print:** Subtle, low-opacity background accents
- **Velvet Texture:** Overlay on hero banners
- **Gold Foil:** Accent borders and dividers
- **Gradient Mesh:** Warm black-to-espresso backgrounds

#### Iconography
- **Style:** Outlined, 2px stroke, rounded caps
- **Accent:** Gold fill on active/hover states
- **Custom Icons:** Crown (👑), Diamond (💎), Flame (🔥), Wine glass

### 5.4 Component Styling

#### Buttons

```css
/* Primary CTA */
.btn-cfz-primary {
  background: linear-gradient(135deg, #D4AF37, #A97142);
  color: #1A1A1A;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(212, 175, 55, 0.3);
  font-weight: 600;
  letter-spacing: 0.05em;
}

.btn-cfz-primary:hover {
  background: linear-gradient(135deg, #F7E7CE, #D4AF37);
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

/* Secondary */
.btn-cfz-secondary {
  background: transparent;
  border: 2px solid #D4AF37;
  color: #D4AF37;
}
```

#### Cards

```css
.card-cfz {
  background: #2D2D2D;
  border: 1px solid #3D3D3D;
  border-radius: 16px;
  transition: all 0.3s ease;
}

.card-cfz:hover {
  border-color: rgba(212, 175, 55, 0.3);
  box-shadow: 0 0 30px rgba(212, 175, 55, 0.1);
}
```

#### Avatar Frames

```css
.avatar-frame-gold {
  border: 3px solid #D4AF37;
  border-radius: 50%;
  box-shadow: 0 0 20px rgba(212, 175, 55, 0.3);
}

.avatar-frame-rose-gold {
  border: 3px solid #E8B4B8;
  border-radius: 50%;
}

.avatar-frame-champagne {
  border: 3px solid #F7E7CE;
  border-radius: 50%;
}
```

### 5.5 Archetype Color Coding

| Archetype | Primary | Accent | Badge Style |
|-----------|---------|--------|-------------|
| Alpha | Gold #D4AF37 | Black | Solid gold |
| Maneater | Cardinal #C41E3A | Gold | Red gradient |
| Siren | Deep Purple #4A235A | Silver | Purple glow |
| Vixen | Hot Pink #FF69B4 | Gold | Pink gradient |
| Matriarch | Navy #1B2838 | Gold | Navy solid |
| Seductress | Wine #722F37 | Rose | Wine gradient |
| Boss | Slate #475569 | Gold | Metallic |
| Enchantress | Emerald #047857 | Gold | Green shimmer |
| Wildcard | Rainbow | Gold | Gradient shift |

---

## 6. Category & Tag Taxonomy

### 6.1 Identity Categories

```yaml
mature_identity:
  - mature_women
  - glamorous_women
  - confident_femmes
  - dominant_women      # Lifestyle-level, non-explicit
  - elegant_women
  - playful_muses
  - boss_energy
```

### 6.2 Vibe & Personality Tags

```yaml
personality_vibes:
  - alpha_femme
  - vixen_charm
  - luxury_goddess
  - sweet_and_spicy
  - seductive_energy
  - wild_and_free
  - power_and_grace
  - flirty_chaos
  - classy_rebel
  - velvet_energy
  - mysterious_aura
  - fierce_queen
  - sultry_elegance
  - playful_tease
  - regal_presence
```

### 6.3 Aesthetic/Style Tags

```yaml
aesthetic_tags:
  - high_fashion
  - business_chic
  - wine_and_velvet
  - leopard_print
  - lingerie_fashion    # Fashion-focused, non-explicit
  - red_lip_aesthetic
  - salon_perfect_hair
  - glam_jewelry
  - heels_aesthetic     # Fashion appreciation
  - designer_lifestyle
  - vintage_glamour
  - modern_elegance
  - bold_colors
  - monochrome_chic
```

### 6.4 Lifestyle Themes

```yaml
lifestyle_themes:
  - glam_nights_out
  - boss_office_vibes
  - girls_night_energy
  - luxury_travel
  - self_care_rituals
  - mature_romance_energy
  - spoil_me_persona     # Playful personality
  - sugar_kitten_vibe    # Personality only
  - wine_o_clock
  - brunch_queen
  - fitness_over_forty
  - culinary_adventures
  - book_club_luxe
```

### 6.5 Age Era Pins

```yaml
age_era_pins:
  30_plus_crew:
    display: "30+ Crew"
    emoji: "💃"
    description: "The confident thirties"

  40_plus_fierce:
    display: "40+ Fierce"
    emoji: "🔥"
    description: "Fierce and fabulous forties"

  50_plus_fine:
    display: "50+ Fine"
    emoji: "👑"
    description: "Fine like wine fifties"

  60_plus_timeless:
    display: "60+ Timeless"
    emoji: "✨"
    description: "Timeless elegance"
```

### 6.6 Setting/Backdrop Tags

```yaml
setting_tags:
  - luxe_bedroom
  - high_rise_apartment
  - candlelit_lounge
  - gold_accented_studio
  - red_velvet_room
  - perfume_vanity_setup
  - sunset_balcony
  - rooftop_terrace
  - spa_retreat
  - wine_cellar
  - private_library
  - designer_closet
```

---

## 7. Safety, Privacy & Compliance

### 7.1 Identity & Age Verification

#### KYC Requirements
```yaml
kyc_verification:
  required_documents:
    - government_issued_id
    - selfie_with_id
    - liveness_check

  age_verification:
    minimum_age: 18
    double_verification: true  # Extra check for CougarFanz
    verified_age_badge: true   # "30+ Verified Creator"

  providers:
    - verifymy
    - jumio
    - onfido
```

#### Age Era Badge Verification
```yaml
age_era_verification:
  process:
    1: Submit ID with birthdate visible
    2: System calculates age range
    3: Assign appropriate era badge
    4: Optional: display on profile

  privacy:
    - Exact age never shown
    - Only era range displayed
    - Creator controls visibility
```

### 7.2 Anti-Harassment System

```yaml
harassment_protection:
  auto_block_triggers:
    - ageist_slurs
    - demeaning_age_comments
    - predatory_language
    - unsolicited_explicit_requests

  creator_tools:
    - custom_blocked_terms
    - message_approval_mode
    - fan_verification_required
    - tip_minimum_to_message

  reporting:
    - one_click_report
    - harassment_categories
    - escalation_to_moderation
    - ban_recommendations
```

### 7.3 Consent Framework

```yaml
consent_management:
  profile_boundaries:
    - creator_sets_boundaries_description
    - preferred_terms_list
    - blocked_terms_auto_filter
    - communication_preferences

  messaging_prompts:
    - respect_reminder_on_first_message
    - boundaries_visible_in_chat
    - consent_acknowledgment_required

  content_consent:
    - co_star_verification_system
    - release_forms_digital
    - consent_records_table
```

### 7.4 Privacy Controls

```yaml
privacy_features:
  visibility:
    - region_ip_blocking
    - profile_visibility_settings
    - content_visibility_per_item
    - search_engine_exclusion

  identity_protection:
    - optional_face_blur
    - background_blur_ai
    - metadata_stripping
    - watermarking

  data_protection:
    - encrypted_messages
    - secure_file_storage
    - gdpr_compliance
    - data_export_request
    - account_deletion
```

### 7.5 AI Safety Guardian

```yaml
ai_safety_features:
  content_scanning:
    - background_document_detection
    - identifying_info_detection
    - unsafe_object_detection
    - deepfake_detection

  recommendations:
    - auto_blur_suggestions
    - safer_angle_recommendations
    - privacy_risk_warnings

  moderation_assist:
    - content_safety_scoring
    - flag_for_review
    - auto_rejection_rules
```

### 7.6 Compliance

```yaml
legal_compliance:
  records_2257:
    - document_storage
    - age_verification_records
    - co_star_verification
    - audit_trail

  content_policies:
    - prohibited_content_list
    - community_guidelines
    - dmca_process
    - appeals_process

  financial:
    - payment_processor_compliance
    - tax_documentation
    - payout_verification
```

---

## 8. Competitive Differentiators

### 8.1 vs OnlyFans

| Feature | OnlyFans | CougarFanz |
|---------|----------|------------|
| **Target Audience** | General adult | Mature, confident creators |
| **Brand Identity** | Generic | Luxury, empowered |
| **Creator Archetypes** | None | 9 distinct archetypes |
| **Age Positivity** | Neutral | Celebrated (Era Badges) |
| **Discovery** | Basic search | Archetype + vibe filtering |
| **AI Features** | None | Persona Coach, Caption Gen |
| **Confidence Metrics** | None | Personality-based scoring |
| **Community** | Individual creators | Pack-based communities |
| **Revenue Share** | 80/20 | 80/20 (matching) |
| **Harassment Protection** | Basic | Age-focused filters |

### 8.2 vs Fansly

| Feature | Fansly | CougarFanz |
|---------|--------|------------|
| **Theming** | Cyberpunk/neon | Luxury/glam |
| **Creator Identity** | Generic tiers | Archetypes + vibes |
| **Age Representation** | Neutral | Positive affirmation |
| **Branding Tools** | Basic | Glam palette, AI coach |
| **Analytics** | Standard | Archetype-based insights |
| **Live Features** | Basic | Spotlight styling, co-stars |
| **Safety Focus** | Standard | Age-harassment specific |

### 8.3 Unique Value Propositions

#### For Creators
1. **Identity Empowerment:** Archetypes that celebrate confidence, not just content
2. **Age-Positive Branding:** Era badges as identity affirmation
3. **AI Persona Coach:** Build your brand with intelligent suggestions
4. **Premium Aesthetics:** Luxury visual identity elevates perceived value
5. **Targeted Audience:** Fans who specifically appreciate mature creators
6. **Enhanced Safety:** Age-harassment protections built-in

#### For Fans
1. **Curated Discovery:** Find creators by personality, not just appearance
2. **Quality Community:** Respectful, mature audience
3. **Authentic Connections:** Personality-first creator profiles
4. **Premium Experience:** Luxury interface and interactions
5. **VIP Treatment:** Inner Circle tiers with exclusive perks

### 8.4 Market Positioning

```
                    EXPLICIT CONTENT
                          ↑
                          │
           OnlyFans ●     │     ● Fansly
                          │
    ──────────────────────┼──────────────────────
    GENERAL               │            NICHE
    AUDIENCE              │            AUDIENCE
                          │
                          │     ● CougarFanz
                          │     (Mature, Confident)
                          │
                          ↓
                  PERSONALITY-FOCUSED
```

### 8.5 Growth Strategy

1. **Creator Acquisition:** Target established mature creators on other platforms
2. **Brand Partnerships:** Luxury lifestyle brands, wine, fashion
3. **Influencer Marketing:** Age-positive influencers, lifestyle bloggers
4. **SEO/Content:** "Mature creator platform" keyword ownership
5. **Community Building:** Ambassador program, creator councils
6. **Cross-Platform:** Integration with existing FANZ tenants

---

## Appendix A: CSS Variable Reference

```css
:root {
  /* CougarFanz Brand Colors */
  --cfz-gold: hsl(43, 74%, 51%);
  --cfz-wine: hsl(355, 45%, 33%);
  --cfz-cardinal: hsl(350, 74%, 40%);
  --cfz-satin-black: hsl(0, 0%, 10%);
  --cfz-espresso: hsl(0, 0%, 18%);
  --cfz-champagne: hsl(39, 77%, 83%);
  --cfz-bronze: hsl(30, 67%, 40%);
  --cfz-matte-gray: hsl(0, 0%, 24%);

  /* Semantic */
  --cfz-success: hsl(160, 84%, 39%);
  --cfz-warning: hsl(38, 92%, 50%);
  --cfz-danger: hsl(0, 72%, 51%);

  /* Theme Mapping */
  --background: var(--cfz-satin-black);
  --foreground: var(--cfz-champagne);
  --card: var(--cfz-espresso);
  --primary: var(--cfz-gold);
  --secondary: var(--cfz-wine);
  --accent: var(--cfz-cardinal);
  --border: var(--cfz-matte-gray);

  /* Effects */
  --shadow-gold-glow: 0 0 20px rgba(212, 175, 55, 0.2);
  --shadow-gold-strong: 0 0 40px rgba(212, 175, 55, 0.4);
  --gradient-luxe: linear-gradient(135deg, var(--cfz-gold), var(--cfz-bronze));
  --gradient-velvet: linear-gradient(180deg, var(--cfz-espresso), var(--cfz-satin-black));
}
```

---

## Appendix B: Database Migration

```sql
-- CougarFanz Schema Extensions Migration
-- Run after base FANZ schema

-- Create CougarFanz tenant
INSERT INTO tenants (slug, name, settings) VALUES (
  'cougars',
  'CougarFanz',
  '{
    "theme": "cougar_glam",
    "features": {
      "archetypesEnabled": true,
      "ageEraBadgesEnabled": true,
      "confidenceMeterEnabled": true
    }
  }'::jsonb
);

-- Creator Archetypes table
CREATE TABLE creator_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  archetype VARCHAR(20) NOT NULL CHECK (archetype IN (
    'alpha', 'maneater', 'siren', 'vixen', 'matriarch',
    'seductress', 'boss', 'enchantress', 'wildcard'
  )),
  is_primary BOOLEAN DEFAULT FALSE,
  confidence_score INTEGER DEFAULT 50 CHECK (confidence_score BETWEEN 0 AND 100),
  branding_guide JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_archetype_user ON creator_archetypes(user_id);
CREATE INDEX idx_archetype_type ON creator_archetypes(archetype);

-- Age Era Badges table
CREATE TABLE age_era_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  era_tag VARCHAR(20) NOT NULL CHECK (era_tag IN (
    '30_plus_crew', '40_plus_fierce', '50_plus_fine', '60_plus_timeless'
  )),
  verified_at TIMESTAMPTZ,
  display_on_profile BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_era_user ON age_era_badges(user_id);
CREATE UNIQUE INDEX idx_era_unique ON age_era_badges(user_id, era_tag);

-- Vibe Tags lookup table
CREATE TABLE vibe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN (
    'personality', 'aesthetic', 'lifestyle', 'setting'
  )),
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator Vibe Tags associations
CREATE TABLE creator_vibe_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  vibe_tag_id UUID REFERENCES vibe_tags(id) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_creator_vibe_unique ON creator_vibe_tags(user_id, vibe_tag_id);
CREATE INDEX idx_creator_vibes ON creator_vibe_tags(user_id);

-- Confidence Metrics table
CREATE TABLE confidence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  overall_score INTEGER DEFAULT 50 CHECK (overall_score BETWEEN 0 AND 100),
  profile_completeness INTEGER DEFAULT 0,
  content_consistency INTEGER DEFAULT 0,
  engagement_rate INTEGER DEFAULT 0,
  branding_strength INTEGER DEFAULT 0,
  community_presence INTEGER DEFAULT 0,
  show_on_profile BOOLEAN DEFAULT TRUE,
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CougarFanz Extended Profiles
CREATE TABLE cougar_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL UNIQUE,
  signature_tagline VARCHAR(200),
  glam_bio TEXT,
  profile_frame_style VARCHAR(20) DEFAULT 'gold_classic',
  banner_overlay_style VARCHAR(20) DEFAULT 'none',
  boundaries_description TEXT,
  preferred_terms JSONB DEFAULT '[]',
  blocked_terms JSONB DEFAULT '[]',
  tier_naming JSONB DEFAULT '{"basic": "Admirer", "premium": "VIP", "vip": "Inner Circle"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial vibe tags
INSERT INTO vibe_tags (name, category, display_name, icon_emoji) VALUES
  ('alpha_femme', 'personality', 'Alpha Femme', '👑'),
  ('vixen_charm', 'personality', 'Vixen Charm', '🦊'),
  ('luxury_goddess', 'personality', 'Luxury Goddess', '💎'),
  ('sweet_and_spicy', 'personality', 'Sweet & Spicy', '🌶️'),
  ('seductive_energy', 'personality', 'Seductive Energy', '🔥'),
  ('wild_and_free', 'personality', 'Wild & Free', '🦁'),
  ('power_and_grace', 'personality', 'Power & Grace', '⚡'),
  ('classy_rebel', 'personality', 'Classy Rebel', '🖤'),
  ('velvet_energy', 'personality', 'Velvet Energy', '🍷'),
  ('high_fashion', 'aesthetic', 'High Fashion', '👠'),
  ('business_chic', 'aesthetic', 'Business Chic', '💼'),
  ('wine_and_velvet', 'aesthetic', 'Wine & Velvet', '🍷'),
  ('leopard_print', 'aesthetic', 'Leopard Print', '🐆'),
  ('red_lip_aesthetic', 'aesthetic', 'Red Lip Aesthetic', '💄'),
  ('glam_jewelry', 'aesthetic', 'Glam Jewelry', '💍'),
  ('glam_nights_out', 'lifestyle', 'Glam Nights Out', '🌙'),
  ('boss_office_vibes', 'lifestyle', 'Boss Office Vibes', '💼'),
  ('luxury_travel', 'lifestyle', 'Luxury Travel', '✈️'),
  ('self_care_rituals', 'lifestyle', 'Self-Care Rituals', '🛁'),
  ('luxe_bedroom', 'setting', 'Luxe Bedroom', '🛏️'),
  ('candlelit_lounge', 'setting', 'Candlelit Lounge', '🕯️'),
  ('sunset_balcony', 'setting', 'Sunset Balcony', '🌅');
```

---

*End of CougarFanz Platform Specification v1.0*
