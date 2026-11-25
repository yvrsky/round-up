# RoundUp

Find safe, skill-matched local training partners for Muay Thai, BJJ (Gi/No-Gi), Boxing, and Running.
Expo (SDK 58) + Expo Router + NativeWind v4, with Supabase (Postgres + PostGIS, Auth, Realtime, RLS).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon key
npx expo start
```

In your Supabase project's Auth settings, add `round-up://**` (and your web origin) to the redirect
URLs so magic links open the app.

`react-native-maps` works in Expo Go on iOS. For Android store builds, add a Google Maps key via the
`react-native-maps` config plugin (`androidGoogleMapsApiKey`) and use a development build.

## Database

The schema, RLS policies, triggers, and RPCs live in `supabase/migrations/0001_init.sql`.

```bash
npx supabase start          # local stack: applies migrations + supabase/seed.sql (Kyiv gyms)
npx supabase db push        # apply migrations to the linked remote project
```

Local magic-link emails land in Mailpit at http://127.0.0.1:54324.

Privacy model: `users.email` and `users.base_location` are never granted to API roles. Select
profiles with `PUBLIC_PROFILE_COLUMNS` (`src/types/models.ts`), never `*`. Session status changes
(accept, cancel) go through RPCs, not direct updates.

### Tests and types (require Docker)

```bash
sh scripts/db-test/run.sh        # RLS / RPC / trigger tests against a throwaway PostGIS container
sh scripts/db-test/gen-types.sh  # regenerate src/types/database.types.ts from the migrations
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
