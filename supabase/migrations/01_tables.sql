/*
  # Core Tables and Structures

  ## Summary
  Creates all database tables for the document library system including:
  - Core document and category management
  - Versioning and collaboration features
  - Security and audit logging
  - Timestamp and Merkle tree proof systems
  - Performance monitoring
  - Sharing and access control

  ## 1. Core Tables

  ### `categories`
  Hierarchical category structure for organizing documents

  ### `documents`
  Main document storage with metadata, tags, and search capabilities

  ## 2. Collaboration Tables

  ### `document_versions`
  Version history tracking for documents

  ### `document_shares`
  Share link management with expiration and access control

  ### `document_annotations`
  User annotations on documents (highlights, comments, notes)

  ### `audit_logs`
  Comprehensive audit trail for all system actions

  ### `user_roles`
  Role-based access control for users

  ## 3. Security Tables

  ### `share_access_attempts`
  Logs all share link access attempts for security monitoring

  ### `rate_limit_blocks`
  IP-based rate limiting to prevent abuse

  ## 4. Proof System Tables

  ### `timestamp_proofs`
  Cryptographic timestamp proofs for document integrity

  ### `proof_verification_logs`
  Logs of all proof verifications

  ### `merkle_tree_batches`
  Batch Merkle tree proofs for efficient verification

  ### `merkle_tree_leaves`
  Individual document leaves in Merkle trees

  ### `batch_verification_logs`
  Logs of batch proof verifications

  ## 5. Monitoring Tables

  ### `performance_metrics`
  Performance tracking for optimization
*/

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT 'folder',
  parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  color text DEFAULT '#3B82F6',
  is_pinned boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  file_path text NOT NULL,
  file_hash text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  uploaded_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  thumbnail_url text,
  is_favorite boolean DEFAULT false,
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  ocr_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_soft_copy_template boolean DEFAULT false,
  is_downloadable_only boolean DEFAULT false,
  is_quarantined boolean DEFAULT false,
  scan_status text DEFAULT 'pending',
  security_flags jsonb DEFAULT '{}'::jsonb
);

-- Add constraints to documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documents_file_size_limit'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_file_size_limit
      CHECK (file_size > 0 AND file_size <= 524288000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'documents_scan_status_check'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_scan_status_check
      CHECK (scan_status IN ('pending', 'scanning', 'clean', 'infected', 'error'));
  END IF;
END $$;

-- Add column comments
COMMENT ON COLUMN documents.is_soft_copy_template IS 'Marks document as an editable soft copy template (e.g., Word, Excel files meant for downloading and editing)';
COMMENT ON COLUMN documents.is_downloadable_only IS 'Prevents inline preview and forces download (used for editable templates)';

-- ============================================================================
-- COLLABORATION TABLES
-- ============================================================================

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  version_number integer NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_hash text NOT NULL,
  changes_description text DEFAULT '',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version_number)
);

-- Document sharing table
CREATE TABLE IF NOT EXISTS document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  share_token text NOT NULL UNIQUE,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_email text,
  access_type text NOT NULL CHECK (access_type IN ('view', 'download')),
  expires_at timestamptz,
  password text,
  password_hash text,
  access_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Document annotations table
CREATE TABLE IF NOT EXISTS document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  page_number integer,
  annotation_type text NOT NULL CHECK (annotation_type IN ('highlight', 'comment', 'note', 'drawing')),
  content text NOT NULL,
  position jsonb DEFAULT '{}'::jsonb,
  color text DEFAULT '#FFEB3B',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  severity text DEFAULT 'info',
  security_event boolean DEFAULT false,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Add constraint to audit_logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'audit_logs_severity_check'
  ) THEN
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_severity_check
      CHECK (severity IN ('info', 'warning', 'critical'));
  END IF;
END $$;

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SECURITY TABLES
-- ============================================================================

-- Share access attempts table
CREATE TABLE IF NOT EXISTS share_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_token text NOT NULL,
  ip_address text NOT NULL,
  success boolean DEFAULT false,
  attempt_timestamp timestamptz DEFAULT now(),
  user_agent text,
  password_provided boolean DEFAULT false
);

-- Rate limit blocks table
CREATE TABLE IF NOT EXISTS rate_limit_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  reason text NOT NULL,
  blocked_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PROOF SYSTEM TABLES
-- ============================================================================

-- Timestamp proofs table
CREATE TABLE IF NOT EXISTS timestamp_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  proof_hash text NOT NULL,
  proof_timestamp timestamptz DEFAULT now() NOT NULL,
  hmac_signature text NOT NULL,
  previous_proof_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Proof verification logs table
CREATE TABLE IF NOT EXISTS proof_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp_proof_id uuid REFERENCES timestamp_proofs(id) ON DELETE CASCADE NOT NULL,
  verified_at timestamptz DEFAULT now() NOT NULL,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_result boolean NOT NULL,
  verification_method text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

-- Merkle tree batches table
CREATE TABLE IF NOT EXISTS merkle_tree_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_timestamp timestamptz DEFAULT now() NOT NULL,
  root_hash text NOT NULL,
  leaf_count integer NOT NULL CHECK (leaf_count > 0),
  tree_height integer NOT NULL CHECK (tree_height >= 0),
  batch_signature text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Merkle tree leaves table
CREATE TABLE IF NOT EXISTS merkle_tree_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES merkle_tree_batches(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
  leaf_hash text NOT NULL,
  leaf_index integer NOT NULL CHECK (leaf_index >= 0),
  proof_path jsonb NOT NULL DEFAULT '[]'::jsonb,
  timestamp_proof_id uuid REFERENCES timestamp_proofs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(batch_id, document_id),
  UNIQUE(batch_id, leaf_index)
);

-- Batch verification logs table
CREATE TABLE IF NOT EXISTS batch_verification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES merkle_tree_batches(id) ON DELETE CASCADE NOT NULL,
  verified_at timestamptz DEFAULT now() NOT NULL,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_result boolean NOT NULL,
  documents_verified integer NOT NULL CHECK (documents_verified >= 0),
  verification_method text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- MONITORING TABLES
-- ============================================================================

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_unit text NOT NULL DEFAULT 'ms',
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE performance_metrics IS 'Stores client-side and server-side performance metrics for monitoring and analysis';

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  104857600,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/tiff',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;
