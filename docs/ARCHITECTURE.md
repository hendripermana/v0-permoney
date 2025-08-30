# 🏗️ PerMoney System Architecture

## Overview

PerMoney is built as a modern, scalable personal finance management platform using a microservices architecture with clear separation of concerns and enterprise-grade security.

## System Architecture

### High-Level Architecture
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Apps    │    │  Third-party    │
│   (React/Vite)  │    │ (React Native)  │    │  Integrations   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      API Gateway          │
                    │   (Load Balancer/NGINX)   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │     Backend Services      │
                    │      (NestJS/Node.js)     │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐   ┌─────────┴─────────┐   ┌─────────┴─────────┐
│   PostgreSQL      │   │      Redis        │   │   External APIs   │
│   (Primary DB)    │   │    (Cache/Queue)  │   │  (Banks/Services) │
└───────────────────┘   └───────────────────┘   └───────────────────┘
\`\`\`

## Technology Stack

### Frontend Architecture
- **Framework**: React 18 with Vite
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: React Query + Zustand
- **Routing**: React Router v6
- **Charts**: Recharts for data visualization
- **PWA**: Service Worker for offline support

### Backend Architecture
- **Framework**: NestJS (Node.js)
- **Language**: TypeScript 5.0+
- **Database**: PostgreSQL 14+ with Drizzle ORM
- **Caching**: Redis for sessions and data caching
- **Authentication**: JWT with refresh tokens
- **API**: RESTful with GraphQL for complex queries
- **Queue**: Bull Queue for background jobs

### Infrastructure
- **Deployment**: Vercel (Frontend) + Railway/Heroku (Backend)
- **Database**: Neon PostgreSQL (managed)
- **Cache**: Upstash Redis (managed)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry for error tracking
- **Analytics**: Custom analytics with privacy focus

## Database Architecture

### Core Entities
\`\`\`sql
-- User Management
users (id, email, password_hash, profile_data)
households (id, name, settings, created_by)
household_members (household_id, user_id, role, permissions)

-- Financial Core
institutions (id, name, type, country, api_config)
accounts (id, household_id, institution_id, type, balance)
transactions (id, account_id, amount, category_id, date, description)
categories (id, name, type, parent_id, household_id)

-- Advanced Features
budgets (id, household_id, period, allocations)
goals (id, household_id, target_amount, current_amount, deadline)
debts (id, household_id, creditor, amount, interest_rate, type)
investments (id, account_id, symbol, quantity, purchase_price)

-- Islamic Finance
zakat_calculations (id, user_id, year, assets, debts, amount_due)
islamic_accounts (id, account_id, is_halal, compliance_notes)

-- Analytics & AI
spending_patterns (id, user_id, category_id, predicted_amount, confidence)
financial_insights (id, user_id, insight_type, data, generated_at)
\`\`\`

### Data Relationships
- **Hierarchical**: Users → Households → Accounts → Transactions
- **Many-to-Many**: Users ↔ Households (with roles)
- **Self-Referencing**: Categories (parent-child relationships)
- **Time-Series**: Transactions, balances, exchange rates

## API Architecture

### RESTful Endpoints
\`\`\`
Authentication:
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
DELETE /api/auth/logout

User Management:
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/households

Financial Core:
GET    /api/accounts
POST   /api/accounts
GET    /api/transactions
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id

Analytics:
GET    /api/analytics/dashboard
GET    /api/analytics/spending-patterns
GET    /api/analytics/budget-analysis
GET    /api/analytics/goal-progress

Islamic Finance:
GET    /api/islamic/zakat-calculation
POST   /api/islamic/zakat-payment
GET    /api/islamic/halal-investments
\`\`\`

### GraphQL Schema
```graphql
type User {
  id: ID!
  email: String!
  profile: UserProfile!
  households: [Household!]!
}

type Household {
  id: ID!
  name: String!
  members: [HouseholdMember!]!
  accounts: [Account!]!
  budgets: [Budget!]!
  goals: [Goal!]!
}

type Transaction {
  id: ID!
  account: Account!
  amount: Float!
  category: Category!
  date: DateTime!
  description: String
  tags: [String!]!
}

type Query {
  dashboard: DashboardData!
  transactions(filter: TransactionFilter): [Transaction!]!
  budgetAnalysis(period: Period!): BudgetAnalysis!
}
