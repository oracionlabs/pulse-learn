# Deployment Notes

Lessons learned getting Pulse live on Railway + Vercel.

---

## Known Gotchas

### uuid must stay on v9
`uuid@10+` is ESM-only. NestJS compiles to CommonJS, so `require('uuid')` at runtime throws `ERR_REQUIRE_ESM`. Pin to `uuid@^9.0.0` + `@types/uuid@^9`.

### MongoDB Atlas — URL-encode special chars in password
A password containing `@` (e.g. `lol@123`) must be encoded as `%40` in the connection string:
```
mongodb+srv://user:lol%40123@cluster.mongodb.net/db
```

### NestJS ConfigModule — use `__dirname` not relative paths
`envFilePath: '.env'` resolves from `process.cwd()`, which breaks when running from the monorepo root. Use:
```ts
envFilePath: join(__dirname, '..', '.env')
```

### Seed script — manually load dotenv
`ts-node` doesn't auto-load `.env`. Add at the top of `seed.ts`:
```ts
import { join } from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '../../.env') });
```

### Railway — use nixpacks, not Dockerfile
The Dockerfile approach requires Railway to pass the repo root as build context, which is unreliable. Nixpacks with explicit commands works cleanly:
```toml
[build]
builder = "nixpacks"
buildCommand = "pnpm install --frozen-lockfile && pnpm --filter api build"

[deploy]
startCommand = "node apps/api/dist/main"
```

### Railway — `railway.toml` location
Place `railway.toml` in `apps/api/`, not the repo root. Railway reads it from the service's configured root directory.

### Stripe — import via `require()`, not ESM
```ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');
```
`import Stripe from 'stripe'` causes issues with NestJS CJS compilation.

### compression middleware — same pattern
```ts
const compression = require('compression');
```

---

## Stack Versions (pinned)

| Package | Version | Why pinned |
|---------|---------|------------|
| `uuid` | `^9.0.0` | v10+ ESM-only, breaks NestJS CJS |
| `stripe` | via require | ESM import issues |

---

## Environment Variables

See `apps/api/.env.example` and `apps/web/.env.example` for the full list.

**Railway (API):** paste all vars from `apps/api/.env.example`
**Vercel (Web):** paste all vars from `apps/web/.env.example`

After both are deployed:
- Update `FRONTEND_URL` in Railway to your Vercel URL
- Update `NEXT_PUBLIC_API_URL` + `API_URL` in Vercel to your Railway URL
- Add Stripe webhook endpoint: `https://<railway-url>/billing/webhook`
