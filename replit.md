# Overview

PupFanz is a creator-focused adult content platform emphasizing safety, consent management, and community. It provides a modern full-stack architecture with dual authentication, comprehensive content management, real-time messaging, and robust safety features like age verification. The platform aims to foster authentic connections within the adult content creator ecosystem.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
- **Design Theme**: Dark-first with custom PupFanz brand colors (Volt lime, Cobalt blue, Tangerine orange).
- **Typography**: Space Grotesk/Sora for display, Inter/Outfit for body text.
- **UI Components**: Radix UI primitives for accessible, headless components.
- **Styling**: Tailwind CSS for utility-first styling.
- **Mobile-First Responsive Design**: Adaptive layouts, touch-optimized UI, responsive navigation (hamburger menu, bottom nav), and iOS safe area support.

## Technical Implementations
- **Frontend**: React 18+ with TypeScript, Vite for bundling, Wouter for routing, TanStack React Query for state management.
- **Backend**: Node.js with TypeScript and ES modules, Express.js for the framework, WebSocket server for real-time communication.
- **Authentication**: Dual system with Replit OAuth and local JWT-based authentication, PostgreSQL-backed session management, CSRF protection.
- **Data Storage**: PostgreSQL with Neon serverless hosting, Drizzle ORM for type-safe operations. Google Cloud Storage for media assets with custom ACLs.
- **Safety & Compliance**: KYC age verification, granular consent management, content moderation with a reporting system, GDPR-compliant data handling.
- **Content Management**: Uppy-based media upload, sophisticated ACL system for access control, tag-based categorization.
- **Messaging**: Real-time chat with WebSocket, media sharing, integrated tipping system.
- **AI Features & Innovations (13 GROUNDBREAKING SYSTEMS - ALL COMPLETE)**:
    - **Recommendation Engine**: ML-driven personalized content recommendations based on user interaction, engagement scoring, and collaborative filtering.
    - **Content Moderation**: Automated image, video, and text analysis for prohibited content with confidence scoring, auto-actions, and human review override.
    - **Content Processing**: Automated post-production pipeline for multi-aspect ratio conversion, asset generation (GIFs, trailers), and a job queue system.
    - **Marketing Automation**: Event-triggered campaigns (push, email, social) with fan segmentation, behavioral targeting, and analytics.
    - **Blockchain Content Ownership**: NFT minting for exclusive content with on-chain royalty tracking, multi-chain support (Ethereum, Polygon, Solana), smart contract integration, marketplace analytics, and creator earnings dashboard.
    - **AI Voice Cloning**: Personalized voice message generation at scale with creator voice models, fan DM automation, voice sample training, quality scoring, and usage analytics.
    - **Holographic Streaming Infrastructure**: VR/AR streaming support with spatial audio, 3D avatar integration, viewer management, peak viewer tracking, and immersive co-star experiences.
    - **Dynamic Pricing AI**: Real-time price optimization engine with 6 strategies (surge, demand curve, time decay, engagement-based, auction simulation, personalized), AI-calculated demand scores, price elasticity, and confidence scoring.
    - **Fan-to-Creator Microlending**: Peer-to-peer lending system for equipment/production funding with collateral management, repayment tracking, late fee enforcement, credit scoring algorithm, and compound interest calculations.
    - **Deepfake Detection System**: AI-powered content authenticity verification with multi-method detection (facial analysis, voice detection, metadata checking, GAN artifact detection), cryptographic signatures (SHA-256), biometric watermarking, verification code system, and user reporting with moderation workflow.
    - **Emotional AI Engine**: Real-time sentiment analysis for fan engagement optimization with multi-emotion detection (9 emotions), mood tracking with 50-entry emotional journey, churn prediction, AI-generated empathetic response recommendations, toxicity detection, engagement level classification (disengaged → super_fan), and effectiveness tracking.
- **Creator Tools**: 
    - **Analytics Dashboard**: Real-time metrics and performance tracking.
    - **Creator Control Dashboard** (NEW): Comprehensive one-tap publishing interface at `/creator-control` with manual override capabilities for aspect ratios (9:16, 16:9, 1:1), platform selection, caption customization, auto-edit controls, GIF generation, and scheduled publishing. Orchestrates content processing and multi-platform distribution services.
    - **Free Access Toggle**: Control content visibility and access.
    - **Advanced Gating**: Subscriber-only content, pay-per-view options.
    - **Gamification**: Achievement badges, creator/fan tiers, leaderboards, points system.
- **Notification System**: Real-time WebSocket push notifications, user-configurable preferences, quiet hours, and notification history.
- **Dual Onboarding**: Role-based flows for Creators (5 steps) and Fanz (4 steps) with progress tracking and upgrade paths.
- **Co-Star Verification**: Token-based invitation system for collaborative content, integrated with KYC.
- **Multi-Platform Distribution**: Social media integration for auto-distribution, scheduled publishing, QR code generation, and trackable smart links.
- **Live Stream Infrastructure**: Database foundation for RTMP/WebRTC streaming, co-star verification gates, participant tracking, real-time tipping, auto-recording, and AI highlight generation.

## System Design Choices
- **API Design**: RESTful endpoints.
- **Security**: Comprehensive middleware for security, validation, and rate limiting; bcrypt for password hashing, jsonwebtoken for JWTs.
- **Scalability**: Serverless database, cloud storage.
- **Maintainability**: TypeScript for type safety, Drizzle ORM.

# External Dependencies

## Cloud Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Cloud Storage**: Object storage for media assets.
- **Replit Infrastructure**: Deployment platform with OAuth integration.

## Payment Processing
- **Adult-Friendly Payment Processors**: Integration points for specialized payment systems supporting adult content transactions (Stripe/PayPal explicitly excluded).
- **VerifyMy**: ID verification and compliance system for age verification/KYC.

## Development Tools
- **Vite**: Frontend build tool.
- **Drizzle Kit**: Database migration and schema management.
- **ESBuild**: Backend bundling.

## UI/UX Libraries
- **Radix UI**: Accessible component primitives.
- **TanStack React Query**: Server state management and caching.
- **Uppy**: File upload handling.
- **Wouter**: Lightweight routing solution.

## Security and Validation
- **Zod**: Runtime type validation.
- **bcrypt**: Password hashing.
- **jsonwebtoken**: JWT token generation and validation.
- **Express middleware**: Rate limiting, CORS, security headers.