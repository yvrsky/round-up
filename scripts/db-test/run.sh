#!/bin/sh
# Applies supabase/migrations to a throwaway PostGIS container (with a minimal Supabase
# auth/roles stub) and runs the RLS/RPC/trigger tests. Requires Docker.
#   sh scripts/db-test/run.sh
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$DIR/../.."
NAME=roundup-db-test

if ! docker ps --format '{{.Names}}' | grep -qx "$NAME"; then
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" -p 54329:5432 -e POSTGRES_PASSWORD=postgres postgis/postgis:15-3.4 >/dev/null
  # The image restarts Postgres once after first-boot init; wait for that to finish.
  until docker logs "$NAME" 2>&1 | grep -q "PostgreSQL init process complete"; do sleep 1; done
  until docker exec "$NAME" pg_isready -U postgres -q; do sleep 1; done
fi

docker exec "$NAME" psql -U postgres -q -c "drop database if exists roundup_test" 2>/dev/null -c "create database roundup_test template template0" >/dev/null
docker cp "$DIR/00_supabase_stub.sql" "$NAME:/tmp/stub.sql"
docker exec "$NAME" psql -U postgres -d roundup_test -v ON_ERROR_STOP=1 -q -f /tmp/stub.sql >/dev/null 2>&1
for f in "$ROOT"/supabase/migrations/*.sql; do
  docker cp "$f" "$NAME:/tmp/migration.sql"
  docker exec "$NAME" psql -U postgres -d roundup_test -v ON_ERROR_STOP=1 -q -f /tmp/migration.sql
done
docker cp "$ROOT/supabase/seed.sql" "$NAME:/tmp/seed.sql"
docker exec "$NAME" psql -U postgres -d roundup_test -v ON_ERROR_STOP=1 -q -f /tmp/seed.sql
docker cp "$DIR/10_tests.sql" "$NAME:/tmp/tests.sql"
OUT=$(docker exec "$NAME" psql -U postgres -d roundup_test -q -f /tmp/tests.sql 2>&1 || true)
echo "$OUT" | grep -oE "(PASS|FAIL)[^\[]*|ERROR.*|ALL_TESTS_PASSED"
echo "$OUT" | grep -q ALL_TESTS_PASSED
