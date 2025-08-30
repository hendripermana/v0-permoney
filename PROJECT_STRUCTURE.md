# Permoney Project Structure

## Monorepo Organization

Permoney follows a modern monorepo architecture using Nx workspace management with clear separation of concerns and shared resources.

\`\`\`
permoney/
├── frontend/           # Next.js React application (@permoney/frontend)
├── backend/            # NestJS API server (@permoney/backend)
├── frontend-e2e/       # End-to-end tests
├── packages/           # Shared packages
├── shared/             # Shared types and schemas
├── prisma/             # Database schema and migrations
├── scripts/            # Build and utility scripts
├── docs/               # Project documentation
└── .kiro/              # Kiro AI assistant configuration
\`\`\`

## Project Naming Convention

All projects follow a consistent scoped naming pattern:
- **Frontend**: `@permoney/frontend` (Next.js application)
- **Backend**: `@permoney/backend` (NestJS API server)
- **Shared**: `shared` (Common utilities and types)
- **E2E Tests**: `frontend-e2e` (Playwright tests)

## Frontend Structure (`frontend/`)

### Next.js App Router Architecture
\`\`\`
frontend/src/
├── app/                # Next.js App Router
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── globals.css     # Global styles
│   ├── budgets/        # Budget & Goal Management
│   │   └── page.tsx    # Budget management page
│   ├── transactions/   # Transaction management
│   ├── dashboard/      # Dashboard pages
│   ├── gratitude/      # Gratitude features
│   └── wishlist/       # Wishlist features
├── components/         # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── budgets/        # Budget-specific components
│   ├── transactions/   # Transaction components
│   ├── dashboard/      # Dashboard components
│   ├── gratitude/      # Gratitude components
│   ├── household/      # Household management
│   ├── wishlist/       # Wishlist components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
│   └── api/            # API integration layer
└── types/              # Frontend-specific types
\`\`\`

### Component Organization Principles
- **UI Components**: Located in `components/ui/` (shadcn/ui based)
- **Feature Components**: Business logic components in feature-specific folders
- **Page Components**: Route-specific components in `app/` directory
- **Shared Hooks**: Reusable logic in `hooks/`
- **Utilities**: Helper functions in `lib/`

## Backend Structure (`backend/`)

### NestJS Modular Architecture
\`\`\`
backend/src/
├── app/                # Application module
├── auth/               # Authentication module
├── accounts/           # Account management
├── transactions/       # Transaction handling
├── budgets/            # Budget & Goal management
│   ├── domain/         # Domain models and aggregates
│   ├── dto/            # Data transfer objects
│   ├── events/         # Domain events
│   ├── services/       # Business logic services
│   ├── validators/     # Input validation
│   └── schedulers/     # Background tasks
├── household/          # Family/household features
├── health/             # Health checks
├── common/             # Shared utilities
├── config/             # Configuration management
├── prisma/             # Database service
└── main.ts             # Application entry point
\`\`\`

### Module Organization Principles
- **Feature Modules**: Each business domain has its own module
- **Shared Services**: Common functionality in `common/`
- **Configuration**: Environment and app config in `config/`
- **Database**: Prisma service and schemas in `prisma/`
- **Guards & Middleware**: Authentication and validation logic

## Shared Resources

### Shared Package (`shared/`)
\`\`\`
shared/
├── src/
│   ├── types/          # TypeScript interfaces
│   ├── schemas/        # Zod validation schemas
│   ├── constants/      # Shared constants
│   └── utils/          # Shared utilities
└── index.ts            # Package exports
\`\`\`

### Database Schema (`prisma/`)
\`\`\`
prisma/
├── schema.prisma       # Prisma database schema
├── migrations/         # Database migrations
└── seed.ts             # Database seeding
\`\`\`

## Import Path Conventions

### Path Mapping Configuration
\`\`\`typescript
// tsconfig.base.json paths
{
  "@permoney/shared": ["shared/src/index.ts"],
  "@permoney/shared/*": ["shared/src/*"]
}
\`\`\`

### Import Examples
\`\`\`typescript
// Shared types and schemas
import { User, Transaction } from '@permoney/shared';
import { userSchema } from '@permoney/shared/schemas';

// Frontend components (Next.js)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// Backend modules (NestJS)
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
\`\`\`

## File Naming Conventions

### Frontend (Next.js)
- **Components**: PascalCase (`UserProfile.tsx`)
- **Pages**: lowercase with hyphens (`user-profile/page.tsx`)
- **Hooks**: camelCase with `use` prefix (`useAuth.ts`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase with `.types.ts` suffix

### Backend (NestJS)
- **Controllers**: PascalCase with `.controller.ts` suffix
- **Services**: PascalCase with `.service.ts` suffix
- **Modules**: PascalCase with `.module.ts` suffix
- **DTOs**: PascalCase with `.dto.ts` suffix
- **Entities**: PascalCase with `.entity.ts` suffix

## Configuration Files Location

### Root Level Configuration
- `package.json` - Main package configuration
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - Base TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `drizzle.config.ts` - Database configuration

### Project-Specific Configuration
- `frontend/next.config.js` - Next.js configuration
- `frontend/tailwind.config.js` - Frontend Tailwind config
- `backend/webpack.config.js` - Backend build configuration

## Development Workflow Structure

### Feature Development Pattern
1. **Backend First**: Create NestJS module with controller, service, DTOs
2. **Shared Types**: Define interfaces and schemas in `shared/`
3. **Frontend Integration**: Create Next.js pages and components
4. **Testing**: Add unit tests and E2E tests
5. **Documentation**: Update relevant docs

### Code Organization Rules
- **Single Responsibility**: Each file has one clear purpose
- **Feature Grouping**: Related functionality grouped in modules
- **Shared Resources**: Common code in shared packages
- **Type Safety**: Strict TypeScript throughout
- **Import Organization**: Consistent import patterns

## Asset Management

### Static Assets
- `frontend/public/` - Public assets (images, icons, manifests)
- `attached_assets/` - Project documentation assets
- `docs/` - Technical documentation and guides

### Generated Assets
- `dist/` - Build output (gitignored)
- `node_modules/` - Dependencies (gitignored)
- `coverage/` - Test coverage reports (gitignored)

## Environment Configuration

### Environment Files
- `.env` - Local development environment
- `.env.example` - Environment template
- `.env.test` - Test environment configuration

### Configuration Management
- Backend uses NestJS ConfigModule for environment variables
- Frontend uses Next.js environment variable handling
- Shared configuration through workspace-level environment files

## Recent Updates (v2.2.0)

### Budget & Goal Management System
- **Complete Budget Management**: Full CRUD operations with category allocations
- **Envelope Visualization**: Visual budget tracking with color-coded progress
- **Goal Setting & Tracking**: Comprehensive goal management with analytics
- **Interactive Charts**: Recharts integration for data visualization
- **Real-time Alerts**: Budget notifications and overspending warnings
- **Mobile-first Design**: Responsive interface with glassmorphism styling

### Technical Improvements
- **Project Naming**: Fixed Nx project naming consistency (`@permoney/frontend`, `@permoney/backend`)
- **Type Safety**: Comprehensive TypeScript types for budget and goal management
- **API Integration**: RESTful endpoints with React Query integration
- **Component Architecture**: Modular, reusable component structure
- **Performance**: Optimized bundle splitting and lazy loading

## Best Practices

### Code Organization
- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Implement proper error boundaries and error handling
- Follow consistent naming conventions across the codebase

### Import Management
- Use absolute imports with path mapping
- Group imports: external libraries, internal modules, relative imports
- Avoid circular dependencies between modules
- Use barrel exports (`index.ts`) for clean imports

### File Structure
- Group related files together
- Keep directory depth reasonable (max 3-4 levels)
- Use descriptive file and folder names
- Separate concerns clearly between frontend and backend

## Development Commands

### Monorepo Commands
\`\`\`bash
# Start both frontend and backend
npm run dev

# Start individual services
npm run dev:frontend    # Next.js dev server
npm run dev:backend     # NestJS dev server

# Build all projects
npm run build

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
\`\`\`

### Project-Specific Commands
\`\`\`bash
# Frontend only
cd frontend && npm run dev
cd frontend && npm run build
cd frontend && npm run type-check

# Backend only
cd backend && npm run serve
cd backend && npm run build
cd backend && npm run test
\`\`\`
