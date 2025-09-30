# 🤖 AI Agents Documentation

## Overview
This document provides comprehensive guidelines for AI agents working on the Permoney project. It covers architecture, patterns, constraints, and best practices.

## 🏗️ Project Architecture

### Tech Stack
- **Framework**: Next.js 15.2.4 (Fullstack)
- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk (primary), JWT (fallback)
- **Caching**: Redis
- **Data Fetching**: TanStack Query v5

### Project Structure (Fullstack Next.js)
```
v0-permoney/
├── src/                    # Main application source
│   ├── app/               # Next.js App Router
│   │   ├── (app)/        # Protected pages (dashboard, accounts, budgets, etc)
│   │   ├── (public)/     # Public pages (landing, sign-in/up)
│   │   ├── (onboarding)/ # Onboarding flow
│   │   ├── api/          # API Routes (replaces NestJS backend)
│   │   ├── analytics/    # Analytics pages
│   │   ├── goals/        # Goals pages
│   │   └── gratitude/    # Gratitude pages
│   ├── components/        # React components (UI, forms, modals, etc)
│   ├── services/         # Business logic services (accounts, transactions, etc)
│   ├── hooks/            # Custom React hooks (TanStack Query hooks)
│   ├── lib/              # Utilities (API client, Prisma, Redis, etc)
│   ├── types/            # TypeScript type definitions
│   ├── contexts/         # React contexts
│   ├── data/             # Static data (countries, currencies)
│   └── middleware.ts     # Clerk authentication middleware
├── prisma/               # Database schema & migrations
├── public/               # Static assets
├── scripts/              # Utility scripts
└── docs/                 # Documentation
```

## 🎯 Core Features

### Implemented Features
1. **Authentication System**
   - JWT-based authentication
   - User registration and login
   - Protected routes

2. **Household Management**
   - Multi-user household support
   - User roles and permissions

3. **Account Management**
   - Multiple account types (checking, savings, credit, etc.)
   - Account balance tracking
   - Multi-currency support

4. **Transaction Management**
   - CRUD operations for transactions
   - Transaction categorization
   - Multi-currency transactions
   - Account transfers

5. **Budget Management**
   - Budget creation and tracking
   - Category-based budgeting
   - Budget progress monitoring

6. **Debt Management**
   - Debt tracking and management
   - Payment scheduling

7. **Exchange Rates**
   - Real-time exchange rate updates
   - Multi-currency support

## 🚫 What NOT to Do

### ❌ Forbidden Actions
1. **DO NOT** create separate frontend/backend folders (we use fullstack Next.js)
2. **DO NOT** create new frontend frameworks (no Astro, Vue, etc.)
3. **DO NOT** add complex features like:
   - AI/ML integrations
   - OCR functionality
   - Islamic finance modules
   - Wishlist features
   - Gratitude journaling
   - Advanced analytics
   - Monitoring systems
   - Security audit systems
   - GraphQL APIs
   - Real-time notifications
   - Caching systems
   - Health monitoring

3. **DO NOT** create multiple versions of the same module
4. **DO NOT** add workarounds or temporary solutions
5. **DO NOT** hardcode values or configurations
6. **DO NOT** create documentation for features that don't exist
7. **DO NOT** add dependencies without clear justification

### ❌ Removed Features (Do Not Recreate)
- Wishlist management
- Gratitude journaling
- OCR document processing
- Islamic finance compliance
- AI insights and recommendations
- Advanced analytics and reporting
- Security audit systems
- Real-time event processing
- GraphQL API layer
- Notification systems
- Caching infrastructure
- Health monitoring
- Performance monitoring

## ✅ What TO Do

### 🎯 Core Development Principles
1. **Keep It Simple**: Focus on core financial management features
2. **Maintainable Code**: Write clean, readable, and well-documented code
3. **Type Safety**: Use TypeScript strictly, avoid `any` types
4. **Consistent Patterns**: Follow established patterns in the codebase
5. **Error Handling**: Implement proper error handling and validation
6. **Testing**: Write tests for new features and bug fixes

### 🏗️ Architecture Patterns

#### Frontend Patterns
```typescript
// Component Structure
interface ComponentProps {
  // Define props with TypeScript
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Use React hooks for state management
  const [state, setState] = useState<StateType>(initialState);
  
  // Use custom hooks for data fetching
  const { data, loading, error } = useCustomHook();
  
  // Return JSX with proper TypeScript
  return (
    <div className="tailwind-classes">
      {/* Component content */}
    </div>
  );
}
```

#### Backend Patterns (Next.js API Routes)
```typescript
// Service Structure (src/services/entity.service.ts)
import { BaseService } from './base.service';
import { prisma } from '@/lib/prisma';

class EntityService extends BaseService {
  async create(householdId: string, data: CreateEntityDto): Promise<Entity> {
    try {
      const entity = await prisma.entity.create({
        data: {
          ...data,
          householdId,
        },
      });
      
      await this.invalidateCache(`household:${householdId}:entities`);
      return entity;
    } catch (error) {
      this.logError('Failed to create entity', error);
      throw error;
    }
  }
}

export const entityService = new EntityService();
```

#### API Route Patterns
```typescript
// Route Structure (src/app/api/entities/route.ts)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { entityService } from '@/services/entity.service';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const entity = await entityService.create(userId, body);
    
    return NextResponse.json(entity);
  } catch (error) {
    console.error('Entity creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create entity' },
      { status: 500 }
    );
  }
}
```

### 🎨 Design System

#### Color Palette
- **Primary**: Green (#16a34a) - Financial success, positive values
- **Secondary**: Blue (#3b82f6) - Trust, stability
- **Accent**: Purple (#8b5cf6) - Premium features
- **Danger**: Red (#ef4444) - Warnings, negative values
- **Warning**: Yellow (#f59e0b) - Alerts, attention
- **Success**: Green (#10b981) - Success states
- **Info**: Blue (#06b6d4) - Information

#### Typography
- **Font Family**: Inter (system font fallback)
- **Headings**: Font weight 600-700
- **Body**: Font weight 400-500
- **Small Text**: Font weight 400, smaller size

#### Spacing
- **Base Unit**: 4px (0.25rem)
- **Common Spacing**: 4, 8, 12, 16, 24, 32, 48, 64px
- **Component Padding**: 16-24px
- **Section Margins**: 32-48px

#### Component Guidelines
1. **Use shadcn/ui components** as base
2. **Extend components** rather than creating new ones
3. **Maintain consistent spacing** and typography
4. **Use semantic colors** for different states
5. **Implement proper loading states** and error handling
6. **Ensure accessibility** with proper ARIA labels

### 🔧 Development Guidelines

#### Code Quality
1. **TypeScript Strict Mode**: Enable strict type checking
2. **ESLint Rules**: Follow project ESLint configuration
3. **Prettier Formatting**: Use consistent code formatting
4. **Import Organization**: Group imports logically
5. **Comment Guidelines**: Document complex logic, not obvious code

#### File Organization
```
src/
├── app/                 # Next.js App Router
│   ├── (app)/          # Protected route group (dashboard, accounts, etc)
│   ├── (public)/       # Public route group (landing, auth)
│   ├── (onboarding)/   # Onboarding route group
│   ├── api/            # API Routes (backend endpoints)
│   └── layout.tsx      # Root layout
├── components/         # Reusable components
│   ├── ui/            # Base UI components (shadcn/ui)
│   ├── forms/         # Form components
│   ├── dashboard/     # Dashboard components
│   └── layout/        # Layout components
├── services/          # Business logic services
├── hooks/             # Custom React hooks (TanStack Query)
├── lib/               # Utilities (API client, Prisma, Redis)
├── types/             # TypeScript type definitions
└── middleware.ts      # Clerk authentication
```

#### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserData`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

### 🧪 Testing Guidelines

#### Frontend Testing
```typescript
// Component Testing
import { render, screen } from '@testing-library/react';
import { Component } from './component';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component prop1="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

#### Backend Testing
```typescript
// Service Testing
describe('EntityService', () => {
  let service: EntityService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [EntityService, PrismaService],
    }).compile();

    service = module.get<EntityService>(EntityService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create entity', async () => {
    const createDto = { name: 'Test Entity' };
    const result = await service.create(createDto);
    expect(result.name).toBe('Test Entity');
  });
});
```

### 🔒 Security Guidelines

#### Authentication
- **JWT Tokens**: Use for session management
- **Protected Routes**: Implement proper route guards
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use Prisma ORM to prevent SQL injection
- **XSS Protection**: Sanitize user inputs

#### Data Protection
- **Sensitive Data**: Never log sensitive information
- **Environment Variables**: Use for configuration
- **Database Security**: Use connection pooling and proper indexing
- **API Security**: Implement rate limiting and CORS

### 📊 Performance Guidelines

#### Frontend Performance
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Bundle Size**: Monitor and optimize bundle size
- **Caching**: Implement proper caching strategies
- **Lazy Loading**: Load components and data on demand

#### Backend Performance
- **Database Queries**: Optimize queries and use proper indexing
- **Connection Pooling**: Use database connection pooling
- **Caching**: Implement appropriate caching strategies
- **Error Handling**: Handle errors gracefully without performance impact

### 🚀 Deployment Guidelines

#### 🏠 Centralized Environment Configuration

**IMPORTANT**: This project uses a **single source of truth** for environment configuration. All environment variables are defined in the **root `.env` file** only.

**🚫 Forbidden Actions:**
- ❌ **Do not create** `.env` files in `backend/`, `frontend/`, or any subdirectories
- ❌ **Do not duplicate** environment variables across multiple files
- ❌ **Do not modify** `.env.local` or other variant files
- ✅ **Only modify** the root `.env` file for configuration changes

**📄 Configuration Structure:**
```
📁 v0-permoney/
├── .env                    # 🟢 Single source of truth
├── .env.backup            # 🟢 Backup file
├── backend/               # ❌ No .env files here
├── frontend/              # ❌ No .env files here
└── [other directories]    # ❌ No .env files here
```

#### Environment Configuration
```env
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL="postgresql://user:password@localhost:5432/permoney"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=user
DB_PASSWORD=password
DB_NAME=permoney

# ============================================================================
# CLERK AUTHENTICATION (Recommended)
# ============================================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# ============================================================================
# BACKEND AUTHENTICATION (Fallback)
# ============================================================================
JWT_SECRET="your-super-secret-jwt-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
PORT="3001"
NODE_ENV="development"
API_PREFIX="api"
CORS_ORIGINS="http://localhost:3000,http://localhost:3002"
```

#### Build Process
1. **Frontend**: `npm run build` in frontend directory
2. **Backend**: `npm run build` in backend directory
3. **Database**: Run Prisma migrations
4. **Start**: Use production start scripts

### 📝 Documentation Standards

#### Code Documentation
- **JSDoc Comments**: Document public functions and classes
- **README Files**: Update when adding new features
- **Type Definitions**: Document complex types and interfaces
- **API Documentation**: Document new endpoints and changes

#### Commit Messages
```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

### 🔄 Workflow Guidelines

#### Development Process
1. **Create Feature Branch**: `git checkout -b feature/feature-name`
2. **Implement Changes**: Follow coding standards
3. **Write Tests**: Add tests for new functionality
4. **Update Documentation**: Update relevant documentation
5. **Create Pull Request**: Include description and testing notes
6. **Code Review**: Address review feedback
7. **Merge**: Merge to main branch

#### Code Review Checklist
- [ ] Code follows project patterns and conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No hardcoded values or workarounds
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

## 🎯 Current Project Status

### ✅ Completed Features
- User authentication and authorization
- Household management
- Account management
- Transaction management
- Budget management
- Debt management
- Exchange rate management
- Database schema and migrations
- API endpoints for all core features
- Frontend pages and components
- Responsive design
- Error handling and validation

### 🚧 Areas for Improvement
- Enhanced error messages and user feedback
- Better loading states and skeletons
- Improved form validation and UX
- Performance optimizations
- Additional test coverage
- Better mobile responsiveness
- Enhanced accessibility features

### 🔮 Future Considerations
- Multi-language support
- Advanced reporting features
- Export/import functionality
- Mobile app development
- Third-party integrations
- Advanced security features

## 📞 Support and Resources

### Key Files to Reference
- `README.md` - Project overview and setup
- `QUICK_START.md` - Quick setup guide
- `DEVELOPMENT_SETUP_MAC_M1.md` - Development environment setup
- `backend/README-DATABASE-SETUP.md` - Database setup guide
- `docs/ARCHITECTURE.md` - System architecture

### Important Commands
```bash
# Development
npm run dev                    # Start development servers
npm run build                  # Build for production
npm run test                   # Run tests
npm run lint                   # Run linter
npm run db:setup              # Setup database
npm run db:seed               # Seed database
npm run db:studio             # Open Prisma Studio

# Backend specific
cd backend && npm run start:dev    # Start backend dev server
cd backend && npm run db:generate  # Generate Prisma client
cd backend && npm run db:migrate   # Run database migrations

# Frontend specific
cd frontend && npm run dev         # Start frontend dev server
cd frontend && npm run build       # Build frontend
cd frontend && npm run start       # Start production server
```

---

**Remember**: This project focuses on core financial management features. Keep implementations simple, maintainable, and aligned with the established patterns. Avoid adding complex features that aren't essential to the core functionality.
