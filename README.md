# Aamodha Elma Sync Application

A comprehensive operations portal for managing sales, orders, receivables, factory payables, and more.

## 🚀 Features

- **Sales Management**: Track sales transactions and payments
- **Order Management**: Manage customer orders and delivery schedules
- **Receivables Tracking**: Monitor outstanding customer payments
- **Factory Payables**: Track factory production and payments
- **Label Management**: Manage label purchases and payments
- **Transport Expenses**: Track transportation costs
- **Reports & Analytics**: Comprehensive reporting and dashboard
- **User Management**: Role-based access control

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: TanStack React Query
- **Backend**: Supabase (PostgreSQL)
- **Caching**: Browser-based cache (localStorage) with Redis support
- **Deployment**: Vercel

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_REDIS_HOST=localhost
VITE_REDIS_PORT=6379
```

## 🗄️ Database Setup

1. Run database migrations:
   ```bash
   supabase migration up
   ```

2. Or apply migrations via Supabase Dashboard SQL Editor

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 📚 Documentation

- `PERFORMANCE_IMPROVEMENT_PLAN.md` - Performance optimization guide
- `MIGRATION_GUIDE.md` - Database migration instructions
- `REDIS_SETUP_GUIDE.md` - Redis caching setup
- `SETUP_COMPLETE.md` - Setup verification

## 🏗️ Project Structure

```
src/
├── components/       # React components
├── contexts/         # React contexts (Auth, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Utilities and services
├── pages/            # Page components
├── types/            # TypeScript type definitions
└── integrations/     # External service integrations
```

## 📝 License

Private - All rights reserved

## 👥 Support

For issues or questions, please contact the development team.

