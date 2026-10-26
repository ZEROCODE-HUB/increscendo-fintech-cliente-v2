Setup Supabase integration

1) Install the client dependency:

```bash
# npm
npm install @supabase/supabase-js

# or with bun/pnpm/yarn
# pnpm add @supabase/supabase-js
# yarn add @supabase/supabase-js
```

2) Add environment variables:
- Copy `.env.example` to `.env.local` (or set env vars in your hosting platform)
- Fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with values from your Supabase project settings.

3) Usage in the app:
- The client is available at `src/lib/supabase.ts` and exports `supabase`.
- Example sign-up / sign-in (using `@supabase/supabase-js`):

```ts
import { supabase } from '@/lib/supabase';

// sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'super-secure-password',
});

// sign in
const { data: session, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'super-secure-password',
});
```

4) Notes on secrets:
- Never commit your real keys. Use `.env.local` (ignored by Vite) or your deployment secrets.
- If you need server-side service role key, keep it only on server scripts or functions (DO NOT prefix with `VITE_`).

5) Optional: Wire up profile sync
- We added example triggers in `migrations/001_create_users_table.sql` to sync `auth.users` → `public.users`.
- If your Supabase project disallows creating triggers on the `auth` schema, prefer an Auth webhook or Edge Function that calls the upsert SQL via `supabase-js`.

If you want, I can:
- implement sign-up/sign-in calls in `src/pages/Auth.tsx` to use Supabase auth,
- add a small serverless webhook example (Node/TS) to receive Supabase Auth events and upsert profiles.
