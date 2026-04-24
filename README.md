# MathJobs - Restaurant Staffing Platform

A modern full-stack application connecting restaurants with qualified waiting staff. Find opportunities in the hospitality industry.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL + Prisma 7 |
| **Auth** | Auth.js v5 (Beta) |
| **Styling** | Tailwind CSS 4 |
| **Testing** | Jest + Testing Library |
| **Package Manager** | pnpm |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- PostgreSQL (local or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/alv3sg/mathjobs.git
cd mathjobs

# Install dependencies
pnpm install

# Generate Prisma client
pnpm db:generate

# Set up environment
cp .env.example .env.local
# Edit .env.local with your database URL

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mathjobs"
AUTH_SECRET="your-secret-here"
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # Auth.js endpoints
│   └── page.tsx           # Home page
├── auth.ts                # Auth.js configuration
├── components/            # React components
├── lib/                  # Utility functions
└── types/                # TypeScript types

prisma/
└── schema.prisma          # Database schema

tests/                    # Test files
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Prisma Studio |

---

## Features

- User authentication (OAuth + Credentials)
- Job listings and applications
- Restaurant profiles
- Review system
- User preferences
- Role-based access (Admin, Manager, Waiter, Backoffice)

---

## Database Models

- **User** - Waiters, managers, admins
- **Restaurant** - Restaurant profiles
- **Job** - Job listings
- **Application** - Job applications
- **Review** - Restaurant reviews
- **UserPreference** - User job preferences
- **Account/Session** - Auth.js models

---

## License

MIT

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.