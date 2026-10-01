-- Rate-limit counters for the garage-photo visualizer.
--
-- NOT YET APPLIED. Apply this before setting FLOOR_VIZ_API_KEY: until the
-- table exists the limiter fails closed, so photo previews are refused rather
-- than running unmetered. That ordering is deliberate — the dangerous state is
-- a configured provider with no ceiling, not a missing table.
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
