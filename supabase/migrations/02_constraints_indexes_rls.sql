/*
  # Constraints, Indexes, and Row Level Security

  ## Summary
  Defines all database constraints, performance indexes, and RLS policies for security.

  ## 1. Indexes
  - Performance optimization for common queries
  - Full-text search indexes
  - Trigram indexes for fuzzy matching
  - Composite indexes for filtered searches

  ## 2. Row Level Security (RLS)
  - Categories: Shared workspace (all authenticated users)
  - Documents: User-owned access model
  - Versions, shares, annotations: Document ownership-based
  - Audit logs: User-specific or admin access
  - Proof systems: Document ownership-based
  - Performance metrics: User-specific access

  ## 3. Security Policies
  - Authenticated user policies
  - Anonymous access for public shares
  - Service role access for system operations
  - Admin-only policies for sensitive operations
*/

-- ============================================================================
-- INDEXES FOR CORE TABLES
-- ============================================================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text ON documents USING gin(to_tsvector('english', COALESCE(ocr_text, '')));
CREATE INDEX IF NOT EXISTS idx_documents_title_tsvector ON documents USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_documents_description_tsvector ON documents USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_documents_filename_trigram ON documents USING gin(file_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_title_trigram ON documents USING gin(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_documents_category_date ON documents(category_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_favorite_date ON documents(is_favorite, uploaded_at DESC) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_documents_type_date ON documents(file_type, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_is_soft_copy_template ON documents(is_soft_copy_template);
CREATE INDEX IF NOT EXISTS idx_documents_is_downloadable_only ON documents(is_downloadable_only);
CREATE INDEX IF NOT EXISTS idx_documents_quarantined ON documents(is_quarantined) WHERE is_quarantined = true;
CREATE INDEX IF NOT EXISTS idx_documents_scan_status ON documents(scan_status);

-- Add index comments
COMMENT ON INDEX idx_documents_title_tsvector IS 'Full-text search index for document titles';
COMMENT ON INDEX idx_documents_description_tsvector IS 'Full-text search index for descriptions';
COMMENT ON INDEX idx_documents_filename_trigram IS 'Trigram index for fuzzy file name matching';
COMMENT ON INDEX idx_documents_category_date IS 'Composite index for category-filtered date sorting';

-- ============================================================================
-- INDEXES FOR COLLABORATION TABLES
-- ============================================================================

-- Document versions indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

-- Document shares indexes
CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);

-- Document annotations indexes
CREATE INDEX IF NOT EXISTS idx_document_annotations_document_id ON document_annotations(document_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events ON audit_logs(security_event) WHERE security_event = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session ON audit_logs(session_id);

-- User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- ============================================================================
-- INDEXES FOR SECURITY TABLES
-- ============================================================================

-- Share access attempts indexes
CREATE INDEX IF NOT EXISTS idx_share_access_token ON share_access_attempts(share_token);
CREATE INDEX IF NOT EXISTS idx_share_access_ip ON share_access_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_share_access_timestamp ON share_access_attempts(attempt_timestamp DESC);

-- Rate limit blocks indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_blocks(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_expires ON rate_limit_blocks(blocked_until);

-- ============================================================================
-- INDEXES FOR PROOF SYSTEM TABLES
-- ============================================================================

-- Timestamp proofs indexes
CREATE INDEX IF NOT EXISTS idx_timestamp_proofs_document_id ON timestamp_proofs(document_id);
CREATE INDEX IF NOT EXISTS idx_timestamp_proofs_timestamp ON timestamp_proofs(proof_timestamp DESC);

-- Proof verification logs indexes
CREATE INDEX IF NOT EXISTS idx_proof_verification_logs_proof_id ON proof_verification_logs(timestamp_proof_id);
CREATE INDEX IF NOT EXISTS idx_proof_verification_logs_verified_at ON proof_verification_logs(verified_at DESC);

-- Merkle tree batches indexes
CREATE INDEX IF NOT EXISTS idx_merkle_batches_timestamp ON merkle_tree_batches(batch_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_merkle_batches_leaf_count ON merkle_tree_batches(leaf_count);

-- Merkle tree leaves indexes
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_batch_id ON merkle_tree_leaves(batch_id);
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_document_id ON merkle_tree_leaves(document_id);
CREATE INDEX IF NOT EXISTS idx_merkle_leaves_leaf_index ON merkle_tree_leaves(batch_id, leaf_index);

-- Batch verification logs indexes
CREATE INDEX IF NOT EXISTS idx_batch_verification_logs_batch_id ON batch_verification_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_verification_logs_verified_at ON batch_verification_logs(verified_at DESC);

-- ============================================================================
-- INDEXES FOR MONITORING TABLES
-- ============================================================================

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON performance_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metadata ON performance_metrics USING gin(metadata);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Core tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Collaboration tables
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Security tables
ALTER TABLE share_access_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;

-- Proof system tables
ALTER TABLE timestamp_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE proof_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_tree_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE merkle_tree_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_verification_logs ENABLE ROW LEVEL SECURITY;

-- Monitoring tables
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES FOR CORE TABLES
-- ============================================================================

-- Categories policies: shared workspace
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- Documents policies: user ownership with quarantine check
CREATE POLICY "Users can view own non-quarantined documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND
    (is_quarantined = false OR is_quarantined IS NULL)
  );

CREATE POLICY "Users can insert their own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON documents FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Anonymous access to documents via valid share
DROP POLICY IF EXISTS "Anonymous can view documents via valid share" ON documents;
CREATE POLICY "Anonymous can view documents via valid share"
  ON documents FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_shares.document_id = documents.id
        AND (document_shares.expires_at IS NULL OR document_shares.expires_at > now())
    )
  );

-- ============================================================================
-- RLS POLICIES FOR COLLABORATION TABLES
-- ============================================================================

-- Document versions policies
CREATE POLICY "Users can view versions of their documents"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_versions.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can create versions of their documents"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Document shares policies
CREATE POLICY "Users can view shares of their documents"
  ON document_shares FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_shares.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can create shares for their documents"
  ON document_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their shares"
  ON document_shares FOR UPDATE
  TO authenticated
  USING (shared_by = auth.uid())
  WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete their shares"
  ON document_shares FOR DELETE
  TO authenticated
  USING (shared_by = auth.uid());

-- Anonymous access to shares by token
DROP POLICY IF EXISTS "Anonymous can view shares by token" ON document_shares;
CREATE POLICY "Anonymous can view shares by token"
  ON document_shares FOR SELECT
  TO anon
  USING (
    expires_at IS NULL OR expires_at > now()
  );

-- Document annotations policies
CREATE POLICY "Users can view annotations on their documents"
  ON document_annotations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_annotations.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can create annotations on their documents"
  ON document_annotations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their own annotations"
  ON document_annotations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own annotations"
  ON document_annotations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User roles policies
CREATE POLICY "Users can view their own role"
  ON user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS POLICIES FOR SECURITY TABLES
-- ============================================================================

-- Share access attempts policies
CREATE POLICY "Service role can manage access attempts"
  ON share_access_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Rate limit blocks policies
CREATE POLICY "Service role can manage rate limits"
  ON rate_limit_blocks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR PROOF SYSTEM TABLES
-- ============================================================================

-- Timestamp proofs policies
CREATE POLICY "Users can view proofs for their documents"
  ON timestamp_proofs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = timestamp_proofs.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "System can insert timestamp proofs"
  ON timestamp_proofs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = timestamp_proofs.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Proof verification logs policies
CREATE POLICY "Anyone can view verification logs"
  ON proof_verification_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert verification logs"
  ON proof_verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Merkle batches policies
CREATE POLICY "Users can view batches with their documents"
  ON merkle_tree_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merkle_tree_leaves
      JOIN documents ON documents.id = merkle_tree_leaves.document_id
      WHERE merkle_tree_leaves.batch_id = merkle_tree_batches.id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "System can insert merkle batches"
  ON merkle_tree_batches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Merkle leaves policies
CREATE POLICY "Users can view leaves for their documents"
  ON merkle_tree_leaves FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = merkle_tree_leaves.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

CREATE POLICY "System can insert merkle leaves"
  ON merkle_tree_leaves FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = merkle_tree_leaves.document_id
      AND documents.uploaded_by = auth.uid()
    )
  );

-- Batch verification logs policies
CREATE POLICY "Anyone can view batch verification logs"
  ON batch_verification_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert batch verification logs"
  ON batch_verification_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- RLS POLICIES FOR MONITORING TABLES
-- ============================================================================

-- Performance metrics policies
CREATE POLICY "Users can insert their own performance metrics"
  ON performance_metrics FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can read their own performance metrics"
  ON performance_metrics FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anonymous users can insert performance metrics"
  ON performance_metrics FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- ============================================================================
-- STORAGE RLS POLICIES
-- ============================================================================

-- Storage policies: users can manage their own files
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anonymous access to shared documents in storage
DROP POLICY IF EXISTS "Anonymous can read shared documents" ON storage.objects;
CREATE POLICY "Anonymous can read shared documents"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'documents' AND
    EXISTS (
      SELECT 1
      FROM documents d
      JOIN document_shares ds ON ds.document_id = d.id
      WHERE d.file_path = name
        AND (ds.expires_at IS NULL OR ds.expires_at > now())
    )
  );

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable real-time for documents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE documents;
  END IF;
END $$;

-- Enable real-time for categories table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'categories'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  END IF;
END $$;
