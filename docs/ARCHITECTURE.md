# 🏗️ Permoney Architecture

## Overview

Permoney is a modern full-stack personal finance management system built with a clean separation between frontend and backend.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (NestJS)      │◄──►│ (PostgreSQL)    │
│                 │    │                 │    │                 │
│ • React 19      │    │ • REST API      │    │ • Prisma ORM    │
│ • TypeScript    │    │ • GraphQL       │    │ • Migrations    │
│ • Tailwind CSS  │    │ • JWT Auth      │    │ • Seed Data     │
│ • React Query   │    │ • Bull Queues   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Authentication**: NextAuth.js

### Backend
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport
- **API**: REST + GraphQL
- **Background Jobs**: Bull (Redis-based)
- **Validation**: class-validator + class-transformer

### Infrastructure
- **Deployment**: Vercel (Frontend + Serverless Backend)
- **Database**: Vercel Postgres or any PostgreSQL
- **File Storage**: Local/Cloud storage
- **Monitoring**: Built-in health checks

## Project Structure

```
permoney/
├── frontend/                 # Next.js application
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── (auth)/      # Auth pages (login, register)
│   │   │   ├── dashboard/   # Main dashboard
│   │   │   ├── accounts/    # Account management
│   │   │   ├── transactions/# Transaction management
│   │   │   ├── budgets/     # Budget planning
│   │   │   ├── analytics/   # Financial analytics
│   │   │   └── settings/    # User settings
│   │   ├── components/      # Reusable UI components
│   │   │   ├── ui/          # Base UI components (shadcn/ui)
│   │   │   ├── forms/       # Form components
│   │   │   ├── charts/      # Chart components
│   │   │   ├── modals/      # Modal dialogs
│   │   │   └── ...
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   │   ├── api.ts       # API client
│   │   │   ├── utils.ts     # Helper functions
│   │   │   └── ...
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── backend/                  # NestJS application
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── users/           # User management
│   │   ├── households/      # Household management
│   │   ├── accounts/        # Account management
│   │   ├── transactions/    # Transaction management
│   │   ├── budgets/         # Budget management
│   │   ├── categories/      # Category management
│   │   ├── analytics/       # Analytics and insights
│   │   ├── notifications/   # Notification system
│   │   ├── common/          # Shared utilities
│   │   └── main.ts          # Application entry point
│   ├── prisma/              # Database schema and migrations
│   │   ├── schema.prisma    # Database schema
│   │   ├── migrations/      # Database migrations
│   │   └── seed.ts          # Seed data
│   └── package.json
└── package.json              # Root workspace configuration
```

## Data Flow

### 1. Authentication Flow
```
User → Frontend → Backend → JWT Token → Frontend (stored in localStorage)
```

### 2. API Request Flow
```
Frontend Component → React Query → API Client → Backend Controller → Service → Prisma → Database
```

### 3. Real-time Updates
```
Backend Event → WebSocket/SSE → Frontend → React Query Cache Update → UI Re-render
```

## Key Design Decisions

### 1. **Monorepo Structure**
- Single repository with separate frontend and backend
- Shared TypeScript types and utilities
- Simplified deployment and development

### 2. **Database Design**
- Multi-tenant architecture with households
- Comprehensive financial data modeling
- Support for Islamic finance features
- Optimized for analytics queries

### 3. **API Design**
- RESTful endpoints for CRUD operations
- GraphQL for complex queries and real-time updates
- Consistent error handling and validation
- Proper HTTP status codes

### 4. **State Management**
- React Query for server state
- React Context for global UI state
- Local state for component-specific data
- Optimistic updates for better UX

### 5. **Security**
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS and security headers

## Development Workflow

### 1. **Local Development**
```bash
npm run dev  # Starts both frontend and backend
```

### 2. **Database Management**
```bash
npm run db:migrate  # Run migrations
npm run db:seed     # Seed initial data
npm run db:studio   # Open Prisma Studio
```

### 3. **Testing**
```bash
npm run test        # Run all tests
npm run lint        # Lint code
```

### 4. **Deployment**
```bash
npm run build       # Build for production
```

## Performance Considerations

### Frontend
- **Code Splitting**: Automatic with Next.js App Router
- **Image Optimization**: Next.js Image component
- **Caching**: React Query with stale-while-revalidate
- **Bundle Analysis**: Built-in Next.js analyzer

### Backend
- **Database Optimization**: Proper indexing and query optimization
- **Caching**: Redis for session and query caching
- **Background Jobs**: Bull queues for heavy operations
- **Connection Pooling**: Prisma connection pooling

### Database
- **Indexing**: Strategic indexes on frequently queried columns
- **Partitioning**: Time-based partitioning for large tables
- **Archiving**: Automated archiving of old data
- **Monitoring**: Query performance monitoring

## Scalability

### Horizontal Scaling
- **Frontend**: CDN distribution via Vercel
- **Backend**: Serverless functions auto-scale
- **Database**: Read replicas for analytics queries

### Vertical Scaling
- **Database**: Upgrade instance size as needed
- **Backend**: Increase memory/CPU for serverless functions
- **Caching**: Redis cluster for high availability

## Security

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based permissions
- Multi-factor authentication support
- Session management

### Data Protection
- Input validation and sanitization
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection
- Rate limiting

### Infrastructure Security
- HTTPS everywhere
- Security headers
- Environment variable protection
- Audit logging

## Monitoring & Observability

### Application Monitoring
- Health check endpoints
- Error tracking and logging
- Performance metrics
- User analytics

### Database Monitoring
- Query performance
- Connection pool status
- Storage usage
- Backup status

### Infrastructure Monitoring
- Server response times
- Memory and CPU usage
- Network latency
- Uptime monitoring