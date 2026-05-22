# whatelz.ai

Personal site of Edmund Lin Zhenming — AI Engineer.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript (strict)
- Tailwind CSS v4
- Supabase (data layer — projects, channels, career, hackathons, blog)
- Inngest (background jobs)
- Groq (AI assistant)
- Clerk (auth)
- Vercel (hosting)

## Development

```bash
npm install
npm run dev      # http://localhost:3100
npm run build
npm run lint
```

## Branches

- **main** → [whatelz.vercel.app](https://whatelz.vercel.app)

## Environment

Copy `.env.example` to `.env.local` and fill in the required values.

## Layout

```
app/          Next.js routes (App Router)
components/   Shared UI and section components
lib/          Data access layer (Supabase-backed modules)
supabase/     SQL migrations
public/       Static assets
```
