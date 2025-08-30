# PerMoney - Personal Finance Management System

A comprehensive, production-ready personal finance management application built with modern technologies and best practices.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+

### Installation
\`\`\`bash
git clone <repository-url>
cd permoneydeploy
npm install
cp .env.example .env
npm run db:migrate
npm run dev
\`\`\`

## 🏗️ Architecture

This is a monorepo built with Nx, featuring:
- **Backend**: NestJS API with TypeScript, PostgreSQL, Redis
- **Frontend**: React with Vite, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Caching**: Redis for session management and caching

## 📚 Documentation

### Core Documentation
- [📖 **User Guide**](./docs/USER_GUIDE.md) - Complete user manual and feature guide
- [🏗️ **Architecture Guide**](./docs/ARCHITECTURE.md) - System architecture and technical design
- [🔧 **Developer Guide**](./docs/DEVELOPER_GUIDE.md) - Development setup and contribution guide
- [🚀 **Deployment Guide**](./docs/DEPLOYMENT.md) - Production deployment and operations

### Feature Documentation
- [🔐 **Authentication System**](./docs/features/AUTHENTICATION.md) - Auth implementation and security
- [💰 **Financial Management**](./docs/features/FINANCIAL_MANAGEMENT.md) - Core financial features
- [🕌 **Islamic Finance**](./docs/features/ISLAMIC_FINANCE.md) - Sharia-compliant financial tools
- [📊 **Analytics & Reporting**](./docs/features/ANALYTICS.md) - Data insights and reporting

### Technical Documentation
- [🗄️ **Database Schema**](./docs/technical/DATABASE.md) - Database design and implementation
- [🔌 **API Reference**](./docs/technical/API.md) - Complete API documentation
- [🧪 **Testing Guide**](./docs/technical/TESTING.md) - Testing strategies and implementation
- [🔒 **Security Guide**](./docs/technical/SECURITY.md) - Security implementation and best practices

## 🎯 Features

- **Multi-User Support**: Household-based financial management
- **Comprehensive Tracking**: Accounts, transactions, budgets, debts, and goals
- **Advanced Analytics**: AI-powered insights and spending pattern analysis
- **Islamic Finance**: Sharia-compliant financial tracking and reporting
- **Security First**: Enterprise-grade security with encryption and audit trails
- **Real-time Monitoring**: Performance monitoring and health checks
- **PWA Support**: Offline-capable progressive web application

## 🤝 Contributing

Please read our [Developer Guide](./docs/DEVELOPER_GUIDE.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions for help and ideas
