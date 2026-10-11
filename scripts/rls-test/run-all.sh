#!/usr/bin/env bash
# Rebuilds covenant_test from a clean slate (auth stub + all real migrations
# under supabase/migrations/, unmodified) and runs the full RLS/guard-trigger
# test suite against it. Requires a local Postgres 16 instance reachable as
# the `postgres` superuser via `sudo -u postgres psql` (adjust the `as()`
# helper in run_rls_tests.sh if your local setup differs).
#
# Run from anywhere: bash scripts/rls-test/run-all.sh
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/../.."   # repo root

sudo -u postgres psql -c "DROP DATABASE IF EXISTS covenant_test;" >/dev/null
sudo -u postgres psql -c "CREATE DATABASE covenant_test OWNER postgres;" >/dev/null

sudo -u postgres psql -d covenant_test -v ON_ERROR_STOP=1 -f scripts/rls-test/000_auth_stub.sql >/dev/null

for f in supabase/migrations/*.sql; do
  echo "applying $f"
  sudo -u postgres psql -d covenant_test -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done

sudo -u postgres psql -d covenant_test -v ON_ERROR_STOP=1 -f scripts/rls-test/001_grants.sql >/dev/null
sudo -u postgres psql -d covenant_test -v ON_ERROR_STOP=1 -f scripts/rls-test/002_auth_grants.sql >/dev/null

bash scripts/rls-test/run_rls_tests.sh
