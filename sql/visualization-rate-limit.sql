-- Rate-limit counters for the garage-photo visualizer.
--
-- APPLIED to the production database on 2026-10-01, reported by the owner.
-- Kept in the repository as the record of what was run, and because it is
-- idempotent — every statement is "if not exists", so re-running it against a
-- new environment is safe and is how this table should be created again.
--
-- The ordering it was written to enforce still stands for any new environment:
-- create the table BEFORE setting FLOOR_VIZ_API_KEY. Until the table exists
-- the limiter fails closed, so previews are refused rather than unmetered, and
-- the dangerous state is a configured provider with no ceiling.
--
-- Mirrors `visualizationRequests` in lib/db/schema.ts. If you change one,
-- change the other in the same commit.

create table if not exists visualization_requests (
  id          bigserial    primary key,
  created_at  timestamptz  not null default now(),
  -- Salted SHA-256 of the caller's IP, truncated to 32 hex characters.
  -- Deliberately not the address itself: the counter needs "same caller",
  -- not "which caller".
  ip_hash     text         not null
);

-- Per-IP window.
create index if not exists visualization_requests_ip_idx
  on visualization_requests (ip_hash, created_at desc);

-- Global window count, and the prune that keeps this table from growing.
create index if not exists visualization_requests_created_at_idx
  on visualization_requests (created_at desc);
