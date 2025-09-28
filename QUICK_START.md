# 🚀 Permoney Quick Start Guide

Panduan cepat untuk menjalankan aplikasi Permoney di sistem Anda.

## 📋 Persyaratan Sistem

- **Node.js** v18+ 
- **PostgreSQL** 14+
- **npm** atau **yarn**
- **Git**

## 🎯 Setup Cepat (3 Langkah)

### Langkah 1: Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/yourusername/v0-permoney.git
cd v0-permoney

# Install dependencies
npm install
```

### Langkah 2: Konfigurasi Environment

```bash
# Edit file .env di root project (sudah ada)
nano .env

# Konfigurasi database dan authentication:
# - Database: Sesuaikan DB_PASSWORD dengan password PostgreSQL Anda
# - Clerk: Dapatkan keys dari https://dashboard.clerk.com/
# - Lihat README.md untuk detail lengkap

# Setup database otomatis
npm run db:setup
```

### Langkah 3: Jalankan Aplikasi

```bash
# Jalankan aplikasi (frontend + backend)
npm run dev

# Atau gunakan script start yang lebih lengkap
./scripts/start-app.sh
```

Aplikasi akan berjalan di:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api

## 🔧 Konfigurasi Minimal

### 🏠 Single Source of Truth

**PENTING**: Project ini menggunakan **konfigurasi environment terpusat**. Semua variabel environment didefinisikan di **file `.env` di root project** saja.

**📄 Struktur Konfigurasi:**
```
📁 v0-permoney/
├── .env                    # 🟢 Single source of truth
├── .env.backup            # 🟢 Backup file
├── backend/               # ❌ Tidak ada .env files di sini
├── frontend/              # ❌ Tidak ada .env files di sini
└── [direktori lain]       # ❌ Tidak ada .env files di sini
```

### ⚙️ Konfigurasi Yang Diperlukan

Edit file `.env` di root project:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/permoney"
DB_PASSWORD=your_postgres_password  # <-- Ganti dengan password PostgreSQL Anda

# Clerk Authentication (dapatkan dari https://dashboard.clerk.com/)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your-clerk-key"
CLERK_SECRET_KEY="sk_test_your-clerk-secret"
```

**🚫 JANGAN:**
- ❌ Buat file `.env` di `backend/`, `frontend/`, atau subdirektori
- ❌ Duplikat variabel environment di multiple files
- ✅ Hanya modifikasi file `.env` di root project

## 📝 Perintah Penting

| Perintah | Deskripsi |
|----------|-----------|
| `npm run db:setup` | Setup database (create, migrate) |
| `npm run db:seed` | Isi database dengan data contoh |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |
| `npm run dev` | Jalankan aplikasi (frontend + backend) |
| `npm run build` | Build untuk production |

## 🆘 Troubleshooting

### Error: "PostgreSQL is not running"
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows
net start postgresql-x64-14
```

### Error: "FATAL: role postgres does not exist"
```bash
# Buat role postgres
createuser -s postgres
```

### Error: "Invalid or expired token"
```bash
# Clear browser cache/localStorage
# Atau buka browser console dan jalankan:
localStorage.clear()
# Lalu refresh halaman
```

### Port sudah digunakan
```bash
# Kill process di port 3000 atau 3001
lsof -ti:3000,3001 | xargs kill -9
```

## 🐳 Docker Support (Opsional)

Untuk yang lebih suka Docker:

```bash
# Jalankan dengan docker-compose
docker-compose up -d

# Database akan otomatis ter-setup
```

## 📚 Dokumentasi Lengkap

- [Setup Development](./DEVELOPMENT_SETUP_MAC_M1.md)
- [Database Setup](./backend/README-DATABASE-SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)

## 💡 Tips untuk Self-Hoster

1. **Backup Database**: Selalu backup database sebelum update
2. **Environment Variables**: Jangan commit file `.env` ke repository
3. **SSL/HTTPS**: Gunakan reverse proxy (nginx/caddy) untuk production
4. **Monitoring**: Setup monitoring untuk production (optional)

## 🎉 Selamat! 

Aplikasi Permoney Anda sudah siap digunakan. Buka http://localhost:3000 untuk mulai menggunakan aplikasi.