# Deploy

## Architecture

- Frontend: Netlify
- Backend: Railway
- Database: Supabase

## Railway

Deploy the repo root, not just the backend folder, because the backend depends on shared workspace packages.

Required Railway environment variables:

```env
PORT=3013
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your-email@example.com
```

Railway uses:

- Build command: `corepack pnpm@9.0.0 install --frozen-lockfile && corepack pnpm@9.0.0 --filter @workspace/api-server run build`
- Start command: `corepack pnpm@9.0.0 --filter @workspace/api-server run start`

## Netlify

Deploy the repo root with `netlify.toml`.

Required Netlify environment variables:

```env
VITE_API_BASE_URL=https://your-backend.up.railway.app
VITE_VAPID_PUBLIC_KEY=
```

Optional if you need a custom base path:

```env
BASE_PATH=/
```

## Supabase

Run both SQL files in Supabase SQL editor:

- `supabase/schema.sql`
- `supabase/admin-upgrade.sql`
