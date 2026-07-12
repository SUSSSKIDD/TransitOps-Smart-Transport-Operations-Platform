# TransitOps

A full-stack, enterprise-grade transport operations platform built for a 7-hour hackathon.

## Architecture & Tech Stack

**Backend (Server)**
- Node.js + Express
- Prisma ORM + SQLite (transactions used heavily for business logic)
- Zod for Validation
- Winston (JSON logs in prod)
- JWT (httpOnly cookie based)
- Fully typed with TypeScript

**Frontend (Client)**
- Next.js 14 (App Router)
- Tailwind CSS v4 + class-variance-authority (Shadcn-like components)
- Zustand for Global Auth State
- Axios (configured for `withCredentials: true`)
- React Hot Toast for UI notifications

## 10 Business Rules Implemented
1. All changes to data must be atomic using `prisma.$transaction`.
2. Vehicles cannot be dispatched if they are in maintenance (`IN_SHOP`).
3. Cargo weight must not exceed `maxLoadCapacityKg`.
4. Drivers cannot be dispatched if they have an active trip (`ON_TRIP`).
5. Drivers cannot be dispatched if their `licenseExpiryDate` has passed.
6. Dispatching a trip sets vehicle and driver to `ON_TRIP`.
7. Completing a trip updates the vehicle's `odometer` by `actualDistance` and sets vehicle/driver to `AVAILABLE`.
8. Cancelling a `DISPATCHED` trip reverts vehicle/driver to `AVAILABLE`.
9. Opening a maintenance log immediately sets vehicle status to `IN_SHOP`.
10. Closing a maintenance log sets vehicle status back to `AVAILABLE` (unless `RETIRED`).

## Getting Started

### 1. Database Setup
```bash
cd server
npm install
npm run db:reset
```

*This will wipe the SQLite database, run the schema push, and re-seed the initial hackathon data.*

### 2. Start the Backend
```bash
cd server
npm run dev
```
*Server runs on port 4000.*

### 3. Start the Frontend
```bash
cd client
npm run dev
```
*Client runs on port 3000.*

## Demo Credentials
All users share the password: `Password123!`
- `fleetmanager@transitops.com` (Has full mutation rights)
- `driver@transitops.com` (Can dispatch/complete own trips)
- `safety@transitops.com`
- `finance@transitops.com`
