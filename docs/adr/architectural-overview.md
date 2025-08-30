# Architectural Overview - Permoney Enterprise Redesign

## Executive Summary

This document provides a high-level overview of the architectural decisions made for the Permoney
Enterprise Redesign project. The architecture is designed to support a world-class personal finance
application for Indonesian households, emphasizing security, scalability, and cultural relevance.

## Key Architectural Principles

### 1. Security First

- **Financial Data Protection**: All financial data is encrypted at rest and in transit
- **Modern Authentication**: WebAuthn/Passkey authentication with biometric support
- **Audit Trail**: Comprehensive logging and audit trails for all financial operations
- **Compliance**: Adherence to Indonesian financial regulations and international standards

### 2. Scalability and Performance

- **Monorepo Architecture**: Nx-powered monorepo for efficient development and deployment
- **Database Optimization**: PostgreSQL with TimescaleDB for time-series financial data
- **Caching Strategy**: Redis for high-performance caching and session management
- **API Efficiency**: GraphQL for flexible data fetching with REST for specific use cases

### 3. Cultural Relevance

- **Multi-User Households**: Support for Indonesian family financial management patterns
- **Islamic Finance**: Comprehensive support for Shariah-compliant financial products
- **Multi-Currency**: Essential support for international transactions and currencies
- **Local Integrations**: Support for Indonesian e-commerce and financial institutions

### 4. Developer Experience

- **Type Safety**: End-to-end TypeScript for reduced bugs and better maintainability
- **Modern Tooling**: Latest versions of Next.js, NestJS, and supporting technologies
- **Automated Testing**: Comprehensive testing strategy with CI/CD automation
- **Documentation**: Thorough documentation and architectural decision records

## Technology Stack Summary

### Frontend Architecture

\`\`\`
Next.js 14+ (App Router)
├── shadcn/ui + Tailwind CSS (Design System)
├── Tanstack Query (Server State)
├── Zustand (Client State)
├── Apollo Client (GraphQL)
├── Framer Motion (Animations)
└── Recharts (Data Visualization)
\`\`\`

### Backend Architecture

\`\`\`
NestJS (API Framework)
├── Prisma ORM (Database Access)
├── PostgreSQL + TimescaleDB (Database)
├── GraphQL + Apollo Server (API Layer)
├── Redis (Caching & Sessions)
├── BullMQ (Background Jobs)
└── WebAuthn (Authentication)
\`\`\`

### Infrastructure

\`\`\`
Docker Containers
├── Oracle Cloud VM (Initial Deployment)
├── GitHub Actions (CI/CD)
├── Cloud Storage (File Management)
├── Monitoring & Logging
└── SSL/TLS Security
\`\`\`

## Core Architectural Decisions

### [ADR-0001: Monorepo Architecture](0001-monorepo-architecture.md)

**Decision**: Use Nx-powered monorepo for frontend, backend, and shared libraries. **Rationale**:
Enables code sharing, consistent tooling, and efficient development workflows.

### [ADR-0002: Technology Stack](0002-technology-stack.md)

**Decision**: Next.js + NestJS with TypeScript throughout the stack. **Rationale**: Modern, scalable
technologies with excellent developer experience and strong ecosystem support.

### [ADR-0003: Database Design](0003-database-design.md)

**Decision**: PostgreSQL with TimescaleDB, Prisma ORM, and double-entry accounting. **Rationale**:
ACID compliance for financial data, time-series optimization, and industry-standard accounting
practices.

### [ADR-0004: Authentication Strategy](0004-authentication-strategy.md)

**Decision**: WebAuthn/Passkey authentication with JWT and comprehensive security measures.
**Rationale**: Modern, secure authentication suitable for financial applications with excellent user
experience.

### [ADR-0005: API Design](0005-api-design-approach.md)

**Decision**: Hybrid GraphQL + REST API approach. **Rationale**: GraphQL for flexible data fetching,
REST for specific use cases like file uploads and webhooks.

### [ADR-0006: Data Modeling](0006-data-modeling-strategy.md)

**Decision**: Domain-driven design with double-entry accounting and multi-currency support.
**Rationale**: Accurate financial modeling with strong data integrity and comprehensive audit
trails.

### [ADR-0007: Frontend Architecture](0007-frontend-architecture.md)

**Decision**: Next.js with shadcn/ui, Tanstack Query, and modern React patterns. **Rationale**:
Excellent performance, developer experience, and user experience across devices.

### [ADR-0008: Deployment Strategy](0008-deployment-strategy.md)

**Decision**: Containerized deployment with Docker and GitHub Actions CI/CD. **Rationale**:
Consistent environments, automated deployments, and scalable infrastructure.

## System Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js Web App<br/>shadcn/ui + Tailwind]
        PWA[Progressive Web App<br/>Mobile Optimized]
    end

    subgraph "API Gateway"
        GATEWAY[NestJS API Gateway<br/>GraphQL + REST]
        AUTH[WebAuthn Authentication<br/>JWT + Sessions]
    end

    subgraph "Business Logic"
        HOUSEHOLD[Household Management<br/>Multi-user Support]
        FINANCIAL[Financial Engine<br/>Double-entry Accounting]
        AI[AI Insights<br/>Pattern Analysis]
        ISLAMIC[Islamic Finance<br/>Zakat & Shariah Compliance]
    end

    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>TimescaleDB Extension)]
        REDIS[(Redis<br/>Caching & Sessions)]
        STORAGE[Cloud Storage<br/>Files & Backups]
    end

    subgraph "External Services"
        EXCHANGE[Exchange Rate APIs]
        ECOMMERCE[E-commerce Integration]
        OCR[OCR Processing]
        NOTIFICATIONS[Email & Push Notifications]
    end

    WEB --> GATEWAY
    PWA --> GATEWAY
    GATEWAY --> AUTH
    GATEWAY --> HOUSEHOLD
    GATEWAY --> FINANCIAL
    GATEWAY --> AI
    GATEWAY --> ISLAMIC

    HOUSEHOLD --> POSTGRES
    FINANCIAL --> POSTGRES
    AI --> REDIS
    ISLAMIC --> POSTGRES

    FINANCIAL --> EXCHANGE
    AI --> ECOMMERCE
    HOUSEHOLD --> OCR
    AUTH --> NOTIFICATIONS
\`\`\`

## Data Flow Architecture

### Transaction Processing Flow

1. **User Input**: Transaction entered via web/mobile interface
2. **Validation**: Input validation and business rule checking
3. **Authentication**: User authorization and permission verification
4. **Processing**: Double-entry ledger creation and balance updates
5. **Storage**: Atomic database transaction with audit logging
6. **Notification**: Real-time updates to connected clients
7. **Analytics**: Event sourcing for AI insights and pattern analysis

### Multi-Currency Handling

1. **Original Transaction**: Store original amount and currency
2. **Exchange Rate**: Fetch historical exchange rate for transaction date
3. **Conversion**: Calculate base currency equivalent
4. **Storage**: Store both original and converted amounts
5. **Reporting**: Support both currency-specific and consolidated views

### Real-time Updates

1. **GraphQL Subscriptions**: Real-time data updates for connected clients
2. **Redis Pub/Sub**: Event broadcasting across application instances
3. **WebSocket Connections**: Persistent connections for live updates
4. **Optimistic Updates**: Immediate UI updates with server confirmation

## Security Architecture

### Authentication Flow

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Database
    participant WebAuthn

    User->>Frontend: Login Request
    Frontend->>WebAuthn: Biometric Challenge
    WebAuthn->>User: Biometric Prompt
    User->>WebAuthn: Biometric Response
    WebAuthn->>Frontend: Authentication Result
    Frontend->>API: Login with Credential
    API->>Database: Verify Credential
    Database->>API: User Data
    API->>Frontend: JWT + Session
    Frontend->>User: Authenticated State
\`\`\`

### Data Protection Layers

1. **Transport Security**: HTTPS/TLS 1.3 for all communications
2. **Authentication**: WebAuthn with biometric verification
3. **Authorization**: Role-based access control (RBAC)
4. **Data Encryption**: AES-256 encryption for sensitive data at rest
5. **Session Management**: Secure session handling with Redis
6. **Audit Logging**: Comprehensive audit trails for all operations

## Performance Considerations

### Database Optimization

- **Indexing Strategy**: Optimized indexes for common query patterns
- **Time-series Data**: TimescaleDB for efficient financial time-series storage
- **Materialized Views**: Pre-computed aggregations for dashboard queries
- **Connection Pooling**: Efficient database connection management

### Caching Strategy

- **Redis Caching**: Frequently accessed data cached in Redis
- **GraphQL Caching**: Apollo Client caching for frontend performance
- **CDN Integration**: Static asset delivery via CDN
- **Browser Caching**: Optimized caching headers for client-side performance

### Scalability Planning

- **Horizontal Scaling**: Architecture supports horizontal scaling
- **Load Balancing**: Ready for load balancer integration
- **Database Sharding**: Prepared for database sharding by household
- **Microservices Migration**: Modular design enables microservices migration

## Compliance and Governance

### Financial Regulations

- **Data Protection**: Compliance with Indonesian data protection laws
- **Financial Reporting**: Support for required financial reporting formats
- **Audit Requirements**: Comprehensive audit trails and data retention
- **Security Standards**: Adherence to financial industry security standards

### Development Governance

- **Code Quality**: Automated code quality checks and reviews
- **Security Scanning**: Regular security vulnerability scanning
- **Dependency Management**: Automated dependency updates and security patches
- **Documentation**: Comprehensive documentation and architectural records

## Migration and Evolution Strategy

### Phase 1: Foundation (Current)

- Core infrastructure and basic financial features
- Authentication and security implementation
- Database design and initial data migration

### Phase 2: Advanced Features

- AI insights and analytics implementation
- Islamic finance features and compliance
- Advanced visualization and reporting

### Phase 3: Scale and Optimize

- Performance optimization and scaling
- Advanced integrations and API ecosystem
- Mobile application development

### Phase 4: Innovation

- Machine learning and predictive analytics
- Advanced automation and AI features
- Ecosystem expansion and partnerships

## Success Metrics

### Technical Metrics

- **Performance**: API response times < 200ms (95th percentile)
- **Reliability**: 99.9% uptime for critical services
- **Security**: Zero security incidents and data breaches
- **Quality**: < 1% error rate for financial operations

### Business Metrics

- **User Experience**: High user satisfaction and engagement
- **Feature Adoption**: Strong adoption of key features
- **Data Accuracy**: 100% accuracy in financial calculations
- **Compliance**: Full compliance with regulatory requirements

## Conclusion

The Permoney Enterprise Redesign architecture provides a solid foundation for a world-class personal
finance application. The decisions documented in this ADR collection prioritize security,
scalability, and user experience while maintaining cultural relevance for Indonesian users.

The architecture is designed to evolve with the application's needs, supporting future enhancements
and scaling requirements. Regular review and updates of these architectural decisions will ensure
the system continues to meet user needs and industry standards.

For detailed information about specific architectural decisions, please refer to the individual ADR
documents linked throughout this overview.
