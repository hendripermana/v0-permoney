# 💰 Permoney - Personal Finance Management System

A comprehensive personal finance management system built with modern web technologies.

## 🏗️ Architecture

```
permoney/
├── frontend/          # Next.js 15 + React 19 + TypeScript
│   ├── src/
│   │   ├── app/       # Next.js App Router pages
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utilities and configurations
│   │   └── types/     # TypeScript type definitions
│   └── package.json
├── backend/           # NestJS + Prisma + PostgreSQL
│   ├── src/           # Backend source code
│   ├── prisma/        # Database schema and migrations
│   └── package.json
└── package.json       # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd permoney
npm install
```

2. **Setup environment variables:**
```bash
# Backend (.env)
DATABASE_URL="postgresql://username:password@localhost:5432/permoney"
JWT_SECRET="your-jwt-secret"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Optional overrides
# NEXT_PUBLIC_CF_WORKER_URL="https://your-worker.permana.icu"
# NEXT_PUBLIC_ORACLE_API_URL="https://api.permana.icu"
```

### Environment configuration

- `frontend/src/lib/config.ts` resolves the API base URL in the following order:
  1. `NEXT_PUBLIC_API_URL`
  2. `NEXT_PUBLIC_CF_WORKER_URL`
  3. `NEXT_PUBLIC_ORACLE_API_URL`
  4. `API_URL`
  5. Fallback to `/api` (leverages the Next.js dev rewrite to `http://localhost:3001/api`).
- Call `apiClient.setBaseURL(...)` during app bootstrap if you need to override the base dynamically (e.g. tenant-specific endpoints).

#### MacBook M1 Pro tips
- Use an ARM build of Node 18+ (`arch -arm64 node -v`) to avoid native module issues.
- Install dependencies from the repository root (`npm install`) so the workspace installs both `frontend` and `backend` packages—commands such as `npm run lint` expect `next` to be available.
- If Rosetta tooling is required, force the architecture when installing: `arch -arm64 npm install`.

#### Oracle Cloud VM + Cloudflare DNS
- Set `NEXT_PUBLIC_ORACLE_API_URL` (or `NEXT_PUBLIC_API_URL`) to the public HTTPS endpoint that Cloudflare proxies to your Oracle VM (`https://api.permana.icu` recommended).
- For the free Cloudflare Worker tier, deploy a worker that forwards traffic to the Oracle API and expose it via `NEXT_PUBLIC_CF_WORKER_URL`; the `ApiClient` will automatically use it when present.
- Keep DNS records for `permana.icu` in Cloudflare so you can switch between direct VM traffic and the worker without code changes.

3. **Setup database:**
```bash
npm run db:migrate
npm run db:seed
```

4. **Start development servers:**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 🎯 Features

### ✅ Core Features
- **Multi-user Households** - Family finance management
- **Account Management** - Multiple bank accounts and institutions
- **Transaction Tracking** - Income, expenses, and transfers
- **Budget Planning** - Monthly/yearly budget allocation
- **Category Management** - Customizable transaction categories
- **Dashboard Analytics** - Financial insights and charts

### ✅ Advanced Features
- **Islamic Finance** - Zakat calculation and Sharia compliance
- **OCR Receipt Processing** - Automatic transaction extraction
- **AI Insights** - Smart financial recommendations
- **Notification System** - Budget alerts and reminders
- **Multi-currency Support** - International transactions
- **Data Import/Export** - Bank statement processing

### ✅ UI/UX Features
- **Modern Design** - Clean, responsive interface
- **Dark/Light Theme** - User preference support
- **Mobile Optimized** - PWA-ready responsive design
- **Accessibility** - WCAG compliant components

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend

# Building
npm run build            # Build both applications
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Database
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with initial data
npm run db:studio        # Open Prisma Studio

# Testing & Quality
npm run lint             # Lint both applications
npm run test             # Run all tests
```

### Project Structure

- **Frontend (Next.js 15)**
  - App Router with TypeScript
  - Tailwind CSS + shadcn/ui components
  - React Query for state management
  - React Hook Form for forms

- **Backend (NestJS)**
  - RESTful API with GraphQL support
  - Prisma ORM with PostgreSQL
  - JWT authentication
  - Bull queues for background jobs

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel**
2. **Set environment variables:**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`

3. **Deploy:**
```bash
npm run build
```

The project is configured for Vercel deployment with:
- Frontend: Static/SSR pages
- Backend: Serverless functions
- Database: PostgreSQL (Vercel Postgres recommended)

## 📊 Database Schema

The system uses a comprehensive PostgreSQL schema with:

- **Users & Households** - Multi-user family accounts
- **Financial Accounts** - Bank accounts, credit cards, investments
- **Transactions** - All financial movements with categorization
- **Budgets** - Planning and tracking spending limits
- **Islamic Finance** - Zakat calculations and Sharia compliance
- **Notifications** - System alerts and reminders

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
REDIS_URL="redis://localhost:6379"
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ for better financial management**
