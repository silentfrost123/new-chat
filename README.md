# Vellum

**Meet characters worth talking to.**

Vellum is a full-stack, browser-first AI character chat website. Discover, create, and chat with AI personalities — all through normal web URLs.

## Stack

- **Next.js 14** (App Router) + React + TypeScript
- **Tailwind CSS** + Radix UI
- **Drizzle ORM** + SQLite (local) / PostgreSQL-ready schema
- **NextAuth** (credentials + OAuth-ready)
- **SSE streaming** AI responses (OpenAI / Anthropic / Mock)
- **Stripe-ready** subscriptions

## Quick start

```bash
npm install
cp .env.example .env
npm run db:setup   # migrate + seed demo data
npm run dev        # http://localhost:3000
```

### Demo accounts

| Role    | Email              | Password       |
|---------|--------------------|----------------|
| Admin   | admin@vellum.app   | admin123456    |
| Demo    | demo@vellum.app    | demo123456     |
| Creator | creator@vellum.app | creator123456  |

## Key routes

| URL | Description |
|-----|-------------|
| `/` | Landing page |
| `/discover` | Character discovery |
| `/character/[slug]` | Character profile |
| `/chat/[id]` | Streaming chat |
| `/create` | Character creator |
| `/chats` | Conversation history |
| `/pricing` | Plans |
| `/admin` | Admin dashboard |
| `/login` `/register` | Auth |

## Environment

See `.env.example`. Set `MOCK_AI=true` for local streaming without API keys.

## Scripts

- `npm run dev` — development server (0.0.0.0:3000)
- `npm run build` / `npm start` — production
- `npm run db:setup` — migrate + seed
