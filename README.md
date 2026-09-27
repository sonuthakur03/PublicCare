# 🏛️ PublicCare: Lalitpur Municipal Civic Intelligence & Hygiene Platform

> **Comprehensive Project Analysis & Architecture Guide**  
> *A modern full-stack civic-tech solution connecting citizens, municipal authorities, local contractors, and NGOs for rapid urban issue resolution.*

---

## 📋 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Core Architecture & Tech Stack](#-core-architecture--tech-stack)
3. [User Roles & Access Control (POLP)](#-user-roles--access-control-polp)
4. [Key Features & Functional Modules](#-key-features--functional-modules)
5. [Database Schema & Data Models](#-database-schema--data-models)
6. [System Flow & Architecture Diagram](#-system-flow--architecture-diagram)
7. [API Routes & WebSocket Endpoints](#-api-routes--websocket-endpoints)
8. [Folder & File Directory Map](#-folder--file-directory-map)
9. [Getting Started & Local Execution](#-getting-started--local-execution)
10. [Test Suite & System Verification](#-test-suite--system-verification)

For a detailed breakdown of the features, database schema, API endpoints, and system architecture, please see the [PROJECT_ANALYSIS.md](PROJECT_ANALYSIS.md) file.

---

## 🌟 Executive Summary

**PublicCare** is an end-to-end civic engagement and urban hygiene management platform tailored for **Lalitpur Metropolitan City, Nepal** (and scalable to any municipality). 

It bridges the communication gap between citizens reporting public health hazards (e.g. solid waste heaps, sewage overflows, drinking water leaks) and the municipal administration tasked with dispatching sanitation teams and contracting private vendors.

### The Core Problem It Solves:
* **Delayed Municipal Action**: Traditional complaints get lost in bureaucracy. PublicCare provides real-time tracking with transparency.
* **Lack of Evidence & Exact Location**: Citizens can upload photos via Cloudinary CDN and pin exact GPS coordinates on Leaflet maps.
* **Community Prioritization**: An automated upvoting algorithm escalates complaints to **CRITICAL** status when 3+ citizens verify the problem.
* **Resource Constraints**: Municipalities can outsource cleanup and repairs to registered local contractors through an integrated **Tendering System**.

---

## 🛠️ Core Architecture & Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org) (App Router) |
| **Frontend UI** | [React 19](https://react.dev) + [Tailwind CSS v4](https://tailwindcss.com) |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com) + [React-Leaflet](https://react-leaflet.js.org) |
| **Real-time Server** | [ws](https://github.com/websockets/ws) (Node.js WebSocket Server on `:3001`) |
| **Database & ORM** | [Prisma 6.4](https://www.prisma.io) + [Neon Serverless PostgreSQL](https://neon.tech) |
| **Media Storage** | [Cloudinary](https://cloudinary.com) |

---

## 🚀 Getting Started & Local Execution

### 1. Prerequisites
* **Node.js**: v18.17+ or v20+
* **npm** or **pnpm**
* A **PostgreSQL** database

### 2. Environment Variables (`.env`)
Create a `.env` file in the project root with the following configuration:

```env
# Database Connection
DATABASE_URL="postgresql://username:password@your-db-host/neondb?sslmode=require"

# Cloudinary CDN
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# JWT Secret
JWT_SECRET="your_secure_jwt_secret"

# Next.js Environment
NODE_ENV="development"
PORT=3000
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seed
Push the Prisma schema to your PostgreSQL database and seed sample data:
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
