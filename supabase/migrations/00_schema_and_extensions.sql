/*
  # Schema Setup and Extensions

  ## Summary
  Initializes PostgreSQL extensions required for the document library system.

  ## Extensions
  - `pg_trgm` - Trigram similarity for fuzzy text search
  - `pgcrypto` - Cryptographic functions (implicitly available in Supabase)

  ## Notes
  - Extensions are required before creating tables that use them
  - All extensions are idempotent (safe to run multiple times)
*/

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
