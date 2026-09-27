# 🏛️ PublicCare: Lalitpur Municipal Civic Intelligence & Hygiene Platform

> **Comprehensive Project Analysis & Architecture Guide**  
> *A modern full-stack civic-tech solution connecting citizens, municipal authorities, local contractors, and NGOs for rapid urban issue resolution.*

---

## 📋 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Core Architecture & Tech Stack](#-core-architecture--tech-stack)
3. [User Roles & Access Control (POLP)](#-user-roles--access-control-polp)
4. [Key Features & Functional Modules](#-key-features--functional-modules)
   - [1. Geotagged Civic Issue Reporting & Map](#1-geotagged-civic-issue-reporting--map)
   - [2. Community Upvoting & Auto-Escalation Engine](#2-community-upvoting--auto-escalation-engine)
   - [3. Hyperlocal Geo-Partitioned WebSocket Chat](#3-hyperlocal-geo-partitioned-websocket-chat)
   - [4. Vendor Tendering & Contracting Marketplace](#4-vendor-tendering--contracting-marketplace)
   - [5. Hyperlocal Business Advertising Engine](#5-hyperlocal-business-advertising-engine)
   - [6. Municipal Dispatch, Analytics & PDF Reports](#6-municipal-dispatch-analytics--pdf-reports)
   - [7. NGO Open Data & API Monetization](#7-ngo-open-data--api-monetization)
5. [Database Schema & Data Models](#-database-schema--data-models)
6. [System Flow & Architecture Diagram](#-system-flow--architecture-diagram)
7. [API Routes & WebSocket Endpoints](#-api-routes--websocket-endpoints)
8. [Folder & File Directory Map](#-folder--file-directory-map)
9. [Getting Started & Local Execution](#-getting-started--local-execution)
10. [Test Suite & System Verification](#-test-suite--system-verification)

---

## 🌟 Executive Summary

**PublicCare** (initially developed under NextTech) is an end-to-end civic engagement and urban hygiene management platform tailored for **Lalitpur Metropolitan City, Nepal** (and scalable to any municipality). 

It bridges the communication gap between citizens reporting public health hazards (e.g. solid waste heaps, sewage overflows, drinking water leaks) and the municipal administration tasked with dispatching sanitation teams and contracting private vendors.

### The Core Problem It Solves:
* **Delayed Municipal Action**: Traditional complaints get lost in bureaucracy. PublicCare provides real-time tracking with transparency.
* **Lack of Evidence & Exact Location**: Citizens can upload photos via Cloudinary CDN and pin exact GPS coordinates on Leaflet maps.
* **Community Prioritization**: An automated upvoting algorithm escalates complaints to **CRITICAL** status when 3+ citizens verify the problem.
* **Resource Constraints**: Municipalities can outsource cleanup and repairs to registered local contractors through an integrated **Tendering System**.

---

## 🛠️ Core Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) | Modern React Server Components, server actions, and API routes |
| **Frontend UI** | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) | Responsive, mobile-first design with high-performance CSS styling |
| **Animations & Icons**| [Framer Motion](https://www.framer.com/motion) + [Lucide React](https://lucide.dev) | Smooth UI transitions, modals, interactive badges, and vector icons |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com) + [React-Leaflet](https://react-leaflet.js.org) | OpenStreetMap integration, geo-markers, radius filtering, location pickers |
| **Real-time Server** | [ws](https://github.com/websockets/ws) (Node.js WebSocket Server on `:3001`) | Hyperlocal citizen chat partitioned by IP subnet and GPS coordinates |
| **Database & ORM** | [Prisma 6.4](https://www.prisma.io) + [Neon Serverless PostgreSQL](https://neon.tech) | Strongly-typed relational schema with ACID-compliant transactions |
| **Media Storage** | [Cloudinary](https://cloudinary.com) | Cloud image upload and CDN hosting for civic issue photographic evidence |
| **Reporting & PDF** | [jsPDF](https://github.com/parallax/jsPDF) + [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable) | Client-side and server-side PDF and CSV report generation |
| **Analytics Charts** | [Recharts](https://recharts.org) | Interactive bar charts, status distribution pie charts, and monthly trends |
| **Authentication** | Custom JWT + HTTP-only Cookies | Secure session cookies with Role-Based Access Control (RBAC) |

---

## 👥 User Roles & Access Control (POLP)

PublicCare strictly follows the **Principle of Least Privilege (POLP)** with 5 distinct user roles:

```
                  ┌──────────────────────┐
                  │      SUPERADMIN      │  (Global system & user administration)
                  └──────────┬───────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐      ┌──────────────┐
│ MUNICIPALITY │     │    VENDOR    │      │     NGO      │
│    ADMIN     │     │ (Contractor) │      │ (Researcher) │
└──────┬───────┘     └──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│   CITIZEN    │ (General Public / Community User)
└──────────────┘
```

1. **Citizen (`user` / `citizen`)**:
   - Report issues with title, category, description, photo upload, and map pinpointing.
   - Upvote / verify neighboring issues.
   - Participate in anonymous or named hyperlocal real-time neighborhood chat.
2. **Municipality Admin (`municipality_admin`)**:
   - Access the municipal dispatch portal (`/admin`).
   - Triage issues: change statuses (`REPORTED` ➔ `IN_PROGRESS` ➔ `RESOLVED`).
   - Assign resolution notes and view registered vendors within radius.
   - Accept or reject vendor tenders for infrastructure fixes.
   - Export official municipal intelligence reports (PDF/CSV).
3. **Vendor / Local Contractor (`vendor`)**:
   - Manage business profile (e.g., plumbing, sanitation, waste management, construction).
   - View nearby civic issues requiring contractor intervention.
   - Submit **Tenders** with estimated cost in Nepali Rupees (NPR) and completion timeline.
   - Create and track promotional **Advertisements** (feed/banner ads) shown to local citizens.
4. **NGO / Development Partner (`ngo`)**:
   - Monitor environmental trends and recurring hazard hot-spots (`/ngo-portal`).
   - Obtain enterprise API keys for programmatic data access.
   - Export sanitized analytics for public health studies.
5. **Superadmin (`superadmin`)**:
   - Platform-wide oversight (`/superadmin`).
   - Manage user roles, approve new vendors, oversee advertisements, and audit system logs.

---

## ⚡ Key Features & Functional Modules

### 1. Geotagged Civic Issue Reporting & Map
* **Interactive Map Picker**: Users can click directly on the interactive Leaflet map or use browser GPS geolocation to set coordinates.
* **Categories**:
  * 🗑️ `GARBAGE_DUMP`
  * 🚰 `SEWAGE_OVERFLOW`
  * 💧 `WATER_CONTAMINATION`
  * 🏗️ `ILLEGAL_DUMPING`
  * 🚻 `PUBLIC_TOILET`
  * 🐾 `DEAD_ANIMAL`
  * ⚠️ `OTHER`
* **Evidence Upload**: Direct multipart upload to Cloudinary CDN returning secure HTTPS URLs.

### 2. Community Upvoting & Auto-Escalation Engine
* Enforces single-vote-per-user integrity using Prisma compound keys (`issueId_userId`).
* **Critical Threshold Algorithm**: When an issue receives **3 or more upvotes**, the server automatically escalates the status to `CRITICAL` and timestamps `escalatedAt`, triggering priority visual alerts on municipal dashboards.

### 3. Hyperlocal Geo-Partitioned WebSocket Chat
* Located in `server/ws-server.ts` running on port `3001`.
* **Dynamic Room Partitioning**:
  * If GPS is permitted: Rooms are clustered using a spatial grid: `room:geo_{latGrid}_{lngGrid}` (rounded to ~1km precision).
  * If GPS is denied: Rooms fallback to IP Subnet grouping: `room:net_{ipSubnet}`.
* **Persistence & History**: Chat messages are asynchronously persisted into the PostgreSQL `chat_messages` table via Prisma, returning recent 50 messages upon joining.
* **Privacy Toggle**: Citizens can toggle between their verified name or stay anonymous (`Anon Citizen #abcd`).

### 4. Vendor Tendering & Contracting Marketplace
* Connects local private sanitation and construction businesses directly to civic repairs.
* Vendors submit proposals with:
  * Description of work
  * Estimated cost in NPR (Nepali Rupees)
  * Estimated completion timeline in days
* Municipal admins review tenders side-by-side and accept proposals, updating status to `ACCEPTED`.

### 5. Hyperlocal Business Advertising Engine
* Vendors can create targeted advertisements with title, description, creative banner, and link.
* Supported placements: `FEED`, `SIDEBAR`, `BANNER`.
* Automatic tracking of ad impressions and click-through counts.
* Requires admin approval before going live to prevent spam.

### 6. Municipal Dispatch, Analytics & PDF Reports
* Built-in visual analytics using **Recharts**:
  * Issues by Category (Bar Chart)
  * Resolution Status Distribution (Donut / Pie Chart)
  * Monthly Trend Analysis
* **Instant PDF & CSV Exports**: One-click download of official municipal reports formatted with headers, summary metrics, and issue logs via `jsPDF` and `jspdf-autotable`.

### 7. NGO Open Data & API Monetization
* Tiered API Key system (`COMMUNITY` vs `ENTERPRISE`).
* Configurable rate limits and subscription fees in NPR.
* Provides structured JSON feeds of public health and civic hazard data.

---

## 🗄️ Database Schema & Data Models

The relational schema is configured in [prisma/schema.prisma](file:///c:/Users/97798/OneDrive/Desktop/vibecode/prisma/schema.prisma):

```
┌─────────────────────────────────────────────────────────────┐
│                            User                             │
│ ─────────────────────────────────────────────────────────── │
│ id, name, email, passwordHash, role, organizationName, ...  │
└──────┬─────────────────┬──────────────────┬───────────┬─────┘
       │                 │                  │           │
       │ 1:N             │ 1:N              │ 1:N       │ 1:1
       ▼                 ▼                  ▼           ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Issue     │  │  IssueVote   │  │ ChatMessage  │  │    Vendor    │
└──────┬───────┘  └──────────────┘  └──────────────┘  └──────┬───────┘
       │                                                     │
       │ 1:N                                             1:N │
       ▼                                                     ▼
┌──────────────┐                                      ┌──────────────┐
│    Tender    │◄─────────────────────────────────────┤      Ad      │
└──────────────┘                                      └──────────────┘
```

### Main Models:
* **`User`**: Stores credentials, role (`user`, `municipality_admin`, `vendor`, `ngo`, `superadmin`), organization and registration numbers.
* **`Issue`**: Stores civic problems with title, description, category, status (`REPORTED`, `CRITICAL`, `IN_PROGRESS`, `RESOLVED`), coordinates, image URL, and net upvotes.
* **`IssueVote`**: Compound unique constraint `@@unique([issueId, userId])` preventing double-voting.
* **`ChatMessage`**: Persists neighborhood chat messages tied to `roomKey`, `ipSubnet`, and optional user reference.
* **`Vendor`**: Contractor profile containing business type, service radius (km), lat/lng, and approval flag.
* **`Tender`**: Vendor bidding proposal for a specific `Issue` with cost in NPR, estimated days, and status (`SUBMITTED`, `ACCEPTED`, `REJECTED`, `COMPLETED`).
* **`Ad`**: Vendor promotional banner with approval state, placement, impressions, and clicks.
* **`NgoApiKey`**: Managed API keys, rate limits, and tiers (`COMMUNITY`, `ENTERPRISE`).

---

## 🔄 System Flow & Architecture Diagram

```mermaid
flowchart TD
    subgraph Citizens["Citizens & Public"]
        C1[Citizen Browser] -->|1. Report Issue + Photo| API_ISSUE["/api/v1/issues"]
        C1 -->|2. Upvote Issue| API_VOTE["/api/v1/upvote"]
        C1 -->|3. Hyperlocal Chat| WS_CHAT["ws://localhost:3001"]
    end

    subgraph CDN_DB["Cloud & Persistence Layer"]
        API_ISSUE -->|Upload Image| CLOUD[Cloudinary CDN]
        API_ISSUE -->|Save Issue| PG[(Neon PostgreSQL DB)]
        API_VOTE -->|Transaction Upvote| PG
        WS_CHAT -->|Persist Messages| PG
    end

    subgraph Automated_Escalation["Escalation Engine"]
        API_VOTE -->|When Upvotes >= 3| CRIT[Auto-Escalate to CRITICAL]
        CRIT --> PG
    end

    subgraph Municipal_Office["Municipality Administration"]
        ADMIN[Admin Dashboard /admin] -->|4. View & Triage| PG
        ADMIN -->|5. Update Status| STATUS_API["/api/v1/admin/status"]
        ADMIN -->|6. Generate PDF| PDF[jsPDF Report Generator]
        ADMIN -->|7. Review Tenders| TENDER_API["/api/v1/tenders"]
    end

    subgraph Local_Contractors["Vendors & Contractors"]
        VEND[Vendor Portal /vendor] -->|8. Browse Nearby Issues| PG
        VEND -->|9. Submit Bids & Tenders| TENDER_API
        VEND -->|10. Create Local Ads| AD_API["/api/v1/ads"]
    end
```

---

## 📡 API Routes & WebSocket Endpoints

### 🔐 Authentication & Accounts
* `POST /api/auth` - Login user and issue HTTP-only JWT cookie.
* `GET /api/auth` - Verify current session and retrieve user profile.
* `DELETE /api/auth` - Logout and clear cookie.
* `POST /api/register` - Register standard citizen account.
* `POST /api/register/vendor` - Register contractor account with business information.
* `POST /api/register/ngo` - Register NGO account with organization details.

### 📍 Civic Issues
* `GET /api/v1/issues` - Retrieve issues with filters (`status`, `category`, `query`, `lat`, `lng`, `radius`).
* `POST /api/v1/issues` - Report a new civic hazard with GPS coordinates and image.
* `GET /api/v1/issues/[id]` - Retrieve detailed issue record with attached vendor tenders.
* `POST /api/v1/upvote` - Cast upvote on an issue; checks and triggers auto-escalation.
* `POST /api/v1/upload` - Cloudinary image upload endpoint for camera/photo attachments.

### 🏛️ Municipal Administration
* `PATCH /api/v1/admin/status` - Transition issue status (`IN_PROGRESS`, `RESOLVED`) and add resolution notes.
* `GET /api/v1/export` - Export issues in CSV/JSON format for reporting.
* `GET /api/admin/users` & `POST /api/admin/users` - Admin user role management.

### 🛠️ Vendors, Tenders & Ads
* `GET /api/v1/vendors` - List registered and approved vendors.
* `GET /api/v1/vendors/nearby?lat=...&lng=...&radius=...` - Geospatial query for vendors within service range.
* `GET /api/v1/tenders` & `POST /api/v1/tenders` - Submit and list contractor repair bids.
* `PATCH /api/v1/tenders/[id]` - Accept or reject a vendor tender proposal.
* `GET /api/v1/ads` & `POST /api/v1/ads` - Fetch active ads or create a new promotional campaign.

### 💬 Real-Time WebSocket (`ws://localhost:3001`)
* `JOIN`: Payload `{ type: 'JOIN', userId, userName, isAnonymous, lat, lng }`  
  Calculates room key, sends last 50 historical messages, broadcasts online count.
* `MESSAGE`: Payload `{ type: 'MESSAGE', text, isAnonymous }`  
  Persists message to Neon PostgreSQL and broadcasts to all room peers.

---

## 📁 Folder & File Directory Map

```text
├── server/
│   └── ws-server.ts            # Standalone Node.js WebSocket chat server
├── prisma/
│   ├── schema.prisma           # Prisma PostgreSQL data models
│   ├── seed.ts                 # Database seeder (Lalitpur test data)
│   └── migrations/             # SQL schema migrations
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root HTML layout with providers
│   │   ├── page.tsx            # Citizen Homepage & Civic Map
│   │   ├── login/              # Login interface
│   │   ├── register/           # Registration pages (Citizen, Vendor, NGO)
│   │   ├── raise-issue/        # Form to report issue with map & photo
│   │   ├── issue/[id]/         # Issue detail, timeline & tender proposals
│   │   ├── admin/              # Municipal admin dispatch & analytics
│   │   ├── vendor/             # Contractor portal (bids, ads, profile)
│   │   ├── ngo-portal/         # NGO analytics & API key generator
│   │   ├── superadmin/         # Master system administration
│   │   └── api/                # Next.js Serverless API endpoints
│   ├── components/             # Reusable UI components
│   │   ├── Navbar.tsx          # Global navigation bar with role badges
│   │   ├── CivicMap.tsx        # Dynamic Leaflet map with colored issue markers
│   │   ├── InteractiveMapPicker.tsx # Clickable map to choose issue location
│   │   ├── NearbyChatWidget.tsx # Floating real-time neighborhood chat
│   │   ├── NearbyVendorsPanel.tsx # Panel showing contractors within range
│   │   ├── ExportButton.tsx    # jsPDF and CSV report generator
│   │   ├── IssueCard.tsx       # Issue list card with category tags & votes
│   │   └── AdCard.tsx          # Vendor advertisement widget
│   ├── lib/                    # Shared libraries, ORM & services
│   │   ├── prisma.ts           # Prisma client singleton instance
│   │   ├── auth.ts             # Auth session facade
│   │   ├── jwt.ts              # JWT signing & verification
│   │   └── services/           # Business logic & authentication services
│   └── types/                  # TypeScript interfaces and type definitions
├── test/                       # Automated test scripts
│   ├── run-all-tests.ts        # Comprehensive test runner
│   ├── test-prisma.ts          # Database schema & connection test
│   ├── test-cloudinary.ts      # Cloudinary CDN upload test
│   └── test-websocket.ts       # WebSocket connection & messaging test
├── package.json                # Dependencies and npm scripts
└── next.config.ts              # Next.js configuration
```

---

## 🚀 Getting Started & Local Execution

### 1. Prerequisites
* **Node.js**: v18.17+ or v20+
* **npm** or **pnpm**
* A **PostgreSQL** database (e.g., free serverless instance on [Neon.tech](https://neon.tech))

### 2. Environment Variables (`.env`)
Create a `.env` file in the project root with the following configuration:

```env
# Database Connection (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Cloudinary CDN (Image uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# JWT Secret for Session Authentication
JWT_SECRET="PublicCare_lalitpur_secure_jwt_secret_key_2026"

# Next.js Environment
NODE_ENV="development"
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seed
Push the Prisma schema to your PostgreSQL database and seed sample Lalitpur municipal data:
```bash
npx prisma db push
npm run db:seed
```

### 5. Start the Development Environment
Run both the Next.js web application and the WebSocket server simultaneously:
```bash
npm run dev
```
* **Web Application**: Accessible at `http://localhost:3000`
* **WebSocket Chat Server**: Active at `ws://localhost:3001`

### 6. Default Demo Accounts (From Seed)
| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@lalitpur.gov.np` | `pass123` | Aayush Shrestha (Ward 16, Patan) |
| **Municipality Admin** | `officer@lalitpur.gov.np` | `admin123` | Er. Rajesh Maharjan (Environment Dept) |
| **NGO Partner** | `ngo@cleanworld.org` | `ngo123` | Sujata Thapa (Himalayan Climate Alliance) |
| **Vendor Contractor** | `vendor@cleanlalitpur.com` | *(Register via `/register/vendor`)* | Clean Lalitpur Pvt Ltd |
| **Superadmin** | `superadmin@PublicCare.np` | `admin123` | System Administrator |

---

## 🧪 Test Suite & System Verification

The repository includes an automated integration test suite in [test/run-all-tests.ts](file:///c:/Users/97798/OneDrive/Desktop/vibecode/test/run-all-tests.ts).

To run all system tests:
```bash
npm test
```

This script automatically:
1. Spawns the background WebSocket server on port `3001`.
2. Validates connection to the Prisma Neon PostgreSQL database.
3. Tests Cloudinary image uploading and CDN HTTPS generation.
4. Simulates a client connecting to WebSocket, joining a geo-partitioned room, persisting a chat message to PostgreSQL, and verifying message delivery.
