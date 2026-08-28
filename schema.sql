create table if not exists approved_cases (
  case_id text primary key check (case_id = 'CASE-NDC-001'),
  record jsonb not null,
  approved_at timestamptz not null default now()
);
