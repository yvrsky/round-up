#!/bin/sh
# Regenerates src/types/database.types.ts from supabase/migrations using the local test DB.
#   sh scripts/db-test/gen-types.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$DIR/../.."
sh "$DIR/run.sh" >/dev/null
OUT="$ROOT/src/types/database.types.ts"
TMP="$(mktemp)"
npx --yes supabase@latest gen types typescript \
  --db-url "postgresql://postgres:postgres@localhost:54329/roundup_test" --schema public > "$TMP"
{
  echo "// Generated from supabase/migrations by \`supabase gen types typescript\`. Do not edit by hand."
  echo "// Regenerate: sh scripts/db-test/gen-types.sh"
  cat "$TMP"
} > "$OUT"
rm "$TMP"
echo "Wrote $OUT"
