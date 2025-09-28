# 💰 Permoney - Personal Finance Management System

Aplikasi manajemen keuangan pribadi yang powerful, mudah di-setup, dan self-hostable. Fokus pada fitur inti manajemen keuangan dengan arsitektur yang bersih dan mudah dirawat.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black.svg)
![NestJS](https://img.shields.io/badge/NestJS-10.4.15-red.svg)

## ✨ Fitur Utama

- 📊 **Dashboard Analytics** - Visualisasi keuangan real-time
- 💳 **Multi-Account Management** - Kelola berbagai rekening & kartu
- 📈 **Expense Tracking** - Tracking pengeluaran otomatis dengan kategori
- 💵 **Multi-Currency** - Support berbagai mata uang
- 🎯 **Budget Planning** - Perencanaan & monitoring budget
- 🏠 **Household Management** - Kelola keuangan keluarga/rumah tangga
- 💸 **Debt Management** - Tracking dan manajemen hutang
- 📱 **Responsive Design** - Optimal di desktop & mobile
- 🔒 **Secure Authentication** - Clerk authentication with JWT fallback

## 🚀 Quick Start (3 Menit)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/yourusername/v0-permoney.git
cd v0-permoney

# 2. Install dependencies
npm run install:all

# 3. Setup environment
cp env.example .env
# Edit .env - cukup sesuaikan password PostgreSQL

# 4. Setup database (otomatis)
npm run db:setup

# 5. Jalankan aplikasi
npm run dev
```

### Clerk Authentication Setup (Recommended)

1. **Create Clerk Account**: [Sign up at Clerk.com](https://clerk.com)
2. **Create Application**: Choose "Next.js" as your framework
3. **Configure Environment**:
   ```bash
   # Add to your .env file
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-key"
   CLERK_SECRET_KEY="sk_test_your-key"
   ```
4. **That's it!** Clerk handles the rest - users can now sign up/in with social providers, email/password, etc.

**Benefits of Clerk:**
- 🔐 Multi-provider authentication (Google, GitHub, email/password)
- 📱 Passkey support
- 🔒 Security best practices built-in
- 📊 User management dashboard
- 🚀 Easy integration

**Fallback Support:** The app maintains backward compatibility with existing JWT authentication for users who prefer not to use Clerk.

Buka browser:
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **API**: http://localhost:3001/api

## 📖 Dokumentasi

- [Quick Start Guide](./QUICK_START.md) - Panduan setup cepat
- [Development Setup](./DEVELOPMENT_SETUP_MAC_M1.md) - Setup development lengkap
- [Database Setup](./backend/README-DATABASE-SETUP.md) - Konfigurasi database
- [Architecture](./docs/ARCHITECTURE.md) - Arsitektur aplikasi
- [Design System](./docs/DESIGN_SYSTEM.md) - Design system dan patterns
- [AI Agents Guide](./AGENTS.md) - Panduan untuk AI agents

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - UI components
- **React Query** - Data fetching
- **Recharts** - Data visualization

### Backend
- **NestJS** - Node.js framework
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication (fallback)
- **TypeScript** - Type safety

### Authentication
- **Clerk** - Modern authentication (recommended)
- **JWT** - Legacy authentication (fallback)

## 📝 Environment Variables

### 🏠 Single Source of Truth

**IMPORTANT**: This project uses a **centralized environment configuration**. All environment variables are defined in the **root `.env` file** only. Do not create additional `.env` files in subdirectories.

The root `.env` file serves as the single source of truth for:
- Database configuration
- Authentication (Clerk & JWT)
- API endpoints
- Security settings
- External services

### 📄 Configuration File Location

```
📁 v0-permoney/
├── .env                    # 🟢 Single source of truth
├── .env.backup            # 🟢 Backup file
├── backend/               # ❌ No .env files here
├── frontend/              # ❌ No .env files here
└── [other directories]    # ❌ No .env files here
```

### ⚙️ Required Environment Variables

```env
# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/permoney"
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=permoney

# ============================================================================
# CLERK AUTHENTICATION (Recommended)
# ============================================================================
# Get these from https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-publishable-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret-key"

# ============================================================================
# BACKEND AUTHENTICATION (Fallback)
# ============================================================================
JWT_SECRET="dev-jwt-secret-key"
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

### 🚫 Forbidden Actions

- ❌ **Do not create** `.env` files in `backend/`, `frontend/`, or any subdirectories
- ❌ **Do not duplicate** environment variables across multiple files
- ❌ **Do not modify** `.env.local` or other variant files
- ✅ **Only modify** the root `.env` file for configuration changes

## 🎯 Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development (frontend + backend) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:setup` | Setup database (create + migrate) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio (GUI) |
| `npm run test` | Run tests |

## 🏗️ Project Structure

```
permoney/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # React components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utilities and API clients
│   │   └── types/     # TypeScript type definitions
├── backend/           # NestJS application
│   ├── src/
│   │   ├── app/       # Main application module
│   │   ├── auth/      # Authentication module
│   │   ├── accounts/  # Account management
│   │   ├── transactions/ # Transaction management
│   │   ├── budgets/   # Budget management
│   │   ├── debts/     # Debt management
│   │   ├── household/ # Household management
│   │   ├── exchange-rates/ # Exchange rate management
│   │   └── prisma/    # Database service
├── docs/              # Documentation
└── scripts/           # Setup and utility scripts
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
- Follow the established patterns and conventions
- Maintain type safety with TypeScript
- Write tests for new features
- Update documentation when making changes
- Keep implementations simple and maintainable

### Pull Request Process
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Review Checklist
- [ ] Code follows project patterns and conventions
- [ ] TypeScript types are properly defined
- [ ] Error handling is implemented
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No hardcoded values or workarounds

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Jika mengalami masalah:

1. Cek [Troubleshooting Guide](./QUICK_START.md#-troubleshooting)
2. Buka [Issue](https://github.com/yourusername/v0-permoney/issues)
3. Join [Discord Community](https://discord.gg/permoney)

## 🎯 Current Status

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

## 🙏 Acknowledgments

- Tim Next.js & NestJS
- Komunitas open source
- Semua kontributor

---

Made with ❤️ by Permoney Team