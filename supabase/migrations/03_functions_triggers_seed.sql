/*
  # Functions, Triggers, and Seed Data

  ## Summary
  Defines all database functions, triggers, views, and initial seed data.

  ## 1. Utility Functions
  - update_updated_at_column: Auto-update timestamps
  - increment_view_count: Atomic view counter
  - increment_download_count: Atomic download counter

  ## 2. Security Functions
  - sanitize_text_input: XSS prevention
  - validate_file_metadata: File upload validation
  - hash_share_password: Password hashing
  - verify_share_password: Password verification
  - log_security_event: Security audit logging
  - detect_suspicious_activity: Anomaly detection
  - get_security_metrics: Security dashboard metrics

  ## 3. Sharing Functions
  - check_rate_limit: IP rate limiting check
  - record_share_access_attempt: Log share access
  - get_shared_document: Validate and retrieve shared docs
  - generate_share_token: Create share tokens
  - cleanup_share_security_data: Clean old logs

  ## 4. Audit Functions
  - create_audit_log: Create audit entries

  ## 5. Proof System Functions
  - generate_hmac_signature: HMAC signatures
  - create_timestamp_proof: Create timestamp proofs
  - verify_timestamp_proof: Verify proofs
  - get_proof_chain: Retrieve proof chains
  - calculate_merkle_root: Merkle tree root calculation
  - calculate_tree_height: Tree height calculation
  - generate_merkle_proof: Generate Merkle proofs
  - create_merkle_batch: Create batch proofs
  - verify_merkle_proof: Verify Merkle proofs
  - get_batch_documents: Retrieve batch documents
  - get_batch_statistics: Batch statistics

  ## 6. Triggers
  - Auto-update timestamps
  - Document validation before insert
  - Auto-create timestamp proofs

  ## 7. Views
  - user_security_summary: Security dashboard view

  ## 8. Seed Data
  - Default categories
*/

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atomic counter increment functions
CREATE OR REPLACE FUNCTION increment_view_count(document_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE documents
  SET view_count = view_count + 1
  WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_download_count(document_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE documents
  SET download_count = download_count + 1
  WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECURITY FUNCTIONS
-- ============================================================================

-- Create text sanitization function
CREATE OR REPLACE FUNCTION sanitize_text_input(input_text text)
RETURNS text AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN regexp_replace(
    input_text,
    '[^\w\s\.,\-_@#$%&\(\)\[\]\{\}:;"''\/\\\?!+=*]',
    '',
    'g'
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create file metadata validation function
CREATE OR REPLACE FUNCTION validate_file_metadata(
  p_file_size bigint,
  p_file_type text,
  p_file_name text
)
RETURNS jsonb AS $$
DECLARE
  v_max_file_size bigint := 524288000;
  v_allowed_types text[] := ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/tiff',
    'text/plain',
    'text/csv',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];
  v_dangerous_extensions text[] := ARRAY[
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js', 'jar',
    'msi', 'dll', 'sys', 'drv', 'app', 'deb', 'rpm', 'sh', 'ps1'
  ];
  v_file_extension text;
BEGIN
  IF p_file_size <= 0 THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'invalid_size',
      'message', 'File size must be greater than 0'
    );
  END IF;

  IF p_file_size > v_max_file_size THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'file_too_large',
      'message', format('File size exceeds maximum allowed size of %s MB', v_max_file_size / 1024 / 1024)
    );
  END IF;

  IF p_file_type IS NULL OR p_file_type = '' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'missing_type',
      'message', 'File type is required'
    );
  END IF;

  IF NOT (p_file_type = ANY(v_allowed_types)) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'invalid_type',
      'message', 'File type not allowed'
    );
  END IF;

  v_file_extension := lower(substring(p_file_name from '\.([^.]+)$'));

  IF v_file_extension = ANY(v_dangerous_extensions) THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'dangerous_extension',
      'message', 'File extension not allowed for security reasons'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Password hashing function for share passwords
CREATE OR REPLACE FUNCTION hash_share_password(p_password text)
RETURNS text AS $$
BEGIN
  IF p_password IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN encode(digest(p_password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Verify share password
CREATE OR REPLACE FUNCTION verify_share_password(p_password text, p_hash text)
RETURNS boolean AS $$
BEGIN
  IF p_password IS NULL OR p_hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN encode(digest(p_password, 'sha256'), 'hex') = p_hash;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action text,
  p_resource_type text,
  p_resource_id text,
  p_severity text DEFAULT 'warning',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_log_id uuid;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    metadata,
    severity,
    security_event
  ) VALUES (
    v_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    p_severity,
    true
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect suspicious activity patterns
CREATE OR REPLACE FUNCTION detect_suspicious_activity(
  p_user_id uuid,
  p_action text,
  p_time_window interval DEFAULT '1 hour'
)
RETURNS jsonb AS $$
DECLARE
  v_action_count integer;
  v_threshold integer;
  v_is_suspicious boolean := false;
  v_reason text;
BEGIN
  CASE p_action
    WHEN 'document.upload' THEN v_threshold := 50;
    WHEN 'document.download' THEN v_threshold := 100;
    WHEN 'document.delete' THEN v_threshold := 20;
    WHEN 'document.share' THEN v_threshold := 30;
    ELSE v_threshold := 100;
  END CASE;

  SELECT COUNT(*)
  INTO v_action_count
  FROM audit_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at > now() - p_time_window;

  IF v_action_count >= v_threshold THEN
    v_is_suspicious := true;
    v_reason := format('Exceeded %s threshold: %s actions in %s',
                       p_action, v_action_count, p_time_window);

    PERFORM log_security_event(
      'security.suspicious_activity',
      'user',
      p_user_id::text,
      'critical',
      jsonb_build_object(
        'action', p_action,
        'count', v_action_count,
        'threshold', v_threshold,
        'time_window', p_time_window::text
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'is_suspicious', v_is_suspicious,
    'action_count', v_action_count,
    'threshold', v_threshold,
    'reason', v_reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get security dashboard metrics
CREATE OR REPLACE FUNCTION get_security_metrics(
  p_time_window interval DEFAULT '24 hours'
)
RETURNS jsonb AS $$
DECLARE
  v_total_security_events integer;
  v_critical_events integer;
  v_quarantined_docs integer;
  v_failed_access_attempts integer;
  v_suspicious_users integer;
BEGIN
  SELECT COUNT(*)
  INTO v_total_security_events
  FROM audit_logs
  WHERE security_event = true
    AND created_at > now() - p_time_window;

  SELECT COUNT(*)
  INTO v_critical_events
  FROM audit_logs
  WHERE security_event = true
    AND severity = 'critical'
    AND created_at > now() - p_time_window;

  SELECT COUNT(*)
  INTO v_quarantined_docs
  FROM documents
  WHERE is_quarantined = true;

  SELECT COUNT(*)
  INTO v_failed_access_attempts
  FROM share_access_attempts
  WHERE success = false
    AND attempt_timestamp > now() - p_time_window;

  SELECT COUNT(DISTINCT user_id)
  INTO v_suspicious_users
  FROM audit_logs
  WHERE action = 'security.suspicious_activity'
    AND created_at > now() - p_time_window;

  RETURN jsonb_build_object(
    'time_window', p_time_window::text,
    'total_security_events', v_total_security_events,
    'critical_events', v_critical_events,
    'quarantined_documents', v_quarantined_docs,
    'failed_access_attempts', v_failed_access_attempts,
    'suspicious_users', v_suspicious_users,
    'generated_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SHARING FUNCTIONS
-- ============================================================================

-- Function to check if an IP is currently rate limited
CREATE OR REPLACE FUNCTION check_rate_limit(p_ip_address text)
RETURNS TABLE (
  is_blocked boolean,
  reason text,
  blocked_until timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true as is_blocked,
    b.reason,
    b.blocked_until
  FROM rate_limit_blocks b
  WHERE b.ip_address = p_ip_address
    AND b.blocked_until > now()
  ORDER BY b.blocked_until DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, null::text, null::timestamptz;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record share access attempt and enforce rate limiting
CREATE OR REPLACE FUNCTION record_share_access_attempt(
  p_share_token text,
  p_ip_address text,
  p_success boolean,
  p_user_agent text DEFAULT null,
  p_password_provided boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_failed_1h integer;
  v_failed_24h integer;
  v_block_reason text;
  v_block_until timestamptz;
  v_is_blocked boolean;
BEGIN
  SELECT is_blocked, reason, blocked_until
  INTO v_is_blocked, v_block_reason, v_block_until
  FROM check_rate_limit(p_ip_address);

  IF v_is_blocked THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'reason', v_block_reason,
      'blocked_until', v_block_until
    );
  END IF;

  INSERT INTO share_access_attempts (
    share_token,
    ip_address,
    success,
    user_agent,
    password_provided
  ) VALUES (
    p_share_token,
    p_ip_address,
    p_success,
    p_user_agent,
    p_password_provided
  );

  IF p_success THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'blocked', false
    );
  END IF;

  SELECT COUNT(*)
  INTO v_failed_1h
  FROM share_access_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND attempt_timestamp > now() - interval '1 hour';

  SELECT COUNT(*)
  INTO v_failed_24h
  FROM share_access_attempts
  WHERE ip_address = p_ip_address
    AND success = false
    AND attempt_timestamp > now() - interval '24 hours';

  IF v_failed_24h >= 50 THEN
    v_block_reason := 'Too many failed attempts (50+ in 24h)';
    v_block_until := now() + interval '24 hours';

    INSERT INTO rate_limit_blocks (ip_address, reason, blocked_until)
    VALUES (p_ip_address, v_block_reason, v_block_until);

    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'reason', v_block_reason,
      'blocked_until', v_block_until
    );
  ELSIF v_failed_1h >= 10 THEN
    v_block_reason := 'Too many failed attempts (10+ in 1h)';
    v_block_until := now() + interval '1 hour';

    INSERT INTO rate_limit_blocks (ip_address, reason, blocked_until)
    VALUES (p_ip_address, v_block_reason, v_block_until);

    RETURN jsonb_build_object(
      'allowed', false,
      'blocked', true,
      'reason', v_block_reason,
      'blocked_until', v_block_until
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'blocked', false,
    'failed_attempts_1h', v_failed_1h,
    'failed_attempts_24h', v_failed_24h
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate share access and return document (with rate limiting)
CREATE OR REPLACE FUNCTION get_shared_document(
  p_share_token text,
  p_password text DEFAULT null,
  p_ip_address text DEFAULT null,
  p_user_agent text DEFAULT null
)
RETURNS jsonb AS $$
DECLARE
  v_share record;
  v_document record;
  v_rate_limit_result jsonb;
BEGIN
  IF p_ip_address IS NOT NULL THEN
    SELECT * INTO v_rate_limit_result
    FROM record_share_access_attempt(
      p_share_token,
      p_ip_address,
      false,
      p_user_agent,
      p_password IS NOT NULL
    );

    IF (v_rate_limit_result->>'blocked')::boolean THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'rate_limited',
        'message', v_rate_limit_result->>'reason',
        'blocked_until', v_rate_limit_result->>'blocked_until'
      );
    END IF;
  END IF;

  SELECT *
  INTO v_share
  FROM document_shares
  WHERE share_token = p_share_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Share link not found'
    );
  END IF;

  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'expired',
      'message', 'Share link has expired'
    );
  END IF;

  IF v_share.password IS NOT NULL THEN
    IF p_password IS NULL OR v_share.password != p_password THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_password',
        'message', 'Invalid password',
        'requires_password', true
      );
    END IF;
  END IF;

  SELECT *
  INTO v_document
  FROM documents
  WHERE id = v_share.document_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'document_not_found',
      'message', 'Document not found'
    );
  END IF;

  IF p_ip_address IS NOT NULL THEN
    PERFORM record_share_access_attempt(
      p_share_token,
      p_ip_address,
      true,
      p_user_agent,
      p_password IS NOT NULL
    );
  END IF;

  UPDATE document_shares
  SET
    access_count = access_count + 1,
    last_accessed_at = now()
  WHERE share_token = p_share_token;

  RETURN jsonb_build_object(
    'success', true,
    'share', jsonb_build_object(
      'id', v_share.id,
      'access_type', v_share.access_type,
      'shared_by', v_share.shared_by,
      'access_count', v_share.access_count + 1
    ),
    'document', jsonb_build_object(
      'id', v_document.id,
      'title', v_document.title,
      'description', v_document.description,
      'file_name', v_document.file_name,
      'file_type', v_document.file_type,
      'file_size', v_document.file_size,
      'file_path', v_document.file_path,
      'uploaded_at', v_document.uploaded_at
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Cleanup function to remove old access attempts and expired blocks
CREATE OR REPLACE FUNCTION cleanup_share_security_data()
RETURNS void AS $$
BEGIN
  DELETE FROM share_access_attempts
  WHERE attempt_timestamp < now() - interval '30 days';

  DELETE FROM rate_limit_blocks
  WHERE blocked_until < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT FUNCTIONS
-- ============================================================================

-- Function to create audit log
CREATE OR REPLACE FUNCTION create_audit_log(
  p_action text,
  p_resource_type text,
  p_resource_id uuid,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PROOF SYSTEM FUNCTIONS
-- ============================================================================

-- Function to generate HMAC signature
CREATE OR REPLACE FUNCTION generate_hmac_signature(
  p_proof_hash text,
  p_proof_timestamp timestamptz,
  p_document_id uuid,
  p_previous_hash text DEFAULT NULL
)
RETURNS text AS $$
DECLARE
  v_secret_key text;
  v_data_to_sign text;
BEGIN
  v_secret_key := encode(gen_random_bytes(32), 'hex');

  v_data_to_sign := p_proof_hash || '::' ||
                    extract(epoch from p_proof_timestamp)::text || '::' ||
                    p_document_id::text || '::' ||
                    COALESCE(p_previous_hash, 'genesis');

  RETURN encode(
    hmac(v_data_to_sign::bytea, v_secret_key::bytea, 'sha256'),
    'hex'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create timestamp proof
CREATE OR REPLACE FUNCTION create_timestamp_proof(
  p_document_id uuid,
  p_proof_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_previous_hash text;
  v_hmac_signature text;
  v_proof_id uuid;
  v_proof_timestamp timestamptz;
BEGIN
  v_proof_timestamp := now();

  SELECT proof_hash INTO v_previous_hash
  FROM timestamp_proofs
  ORDER BY proof_timestamp DESC
  LIMIT 1;

  v_hmac_signature := generate_hmac_signature(
    p_proof_hash,
    v_proof_timestamp,
    p_document_id,
    v_previous_hash
  );

  INSERT INTO timestamp_proofs (
    document_id,
    proof_hash,
    proof_timestamp,
    hmac_signature,
    previous_proof_hash,
    metadata
  ) VALUES (
    p_document_id,
    p_proof_hash,
    v_proof_timestamp,
    v_hmac_signature,
    v_previous_hash,
    p_metadata
  ) RETURNING id INTO v_proof_id;

  RETURN v_proof_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify timestamp proof
CREATE OR REPLACE FUNCTION verify_timestamp_proof(
  p_proof_id uuid,
  p_current_document_hash text
)
RETURNS jsonb AS $$
DECLARE
  v_proof record;
  v_verification_result boolean;
  v_details jsonb;
BEGIN
  SELECT * INTO v_proof
  FROM timestamp_proofs
  WHERE id = p_proof_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Proof not found'
    );
  END IF;

  v_verification_result := (v_proof.proof_hash = p_current_document_hash);

  v_details := jsonb_build_object(
    'valid', v_verification_result,
    'proof_hash', v_proof.proof_hash,
    'current_hash', p_current_document_hash,
    'proof_timestamp', v_proof.proof_timestamp,
    'hmac_signature', v_proof.hmac_signature,
    'has_chain', v_proof.previous_proof_hash IS NOT NULL,
    'message', CASE
      WHEN v_verification_result THEN 'Document integrity verified'
      ELSE 'Document has been modified since timestamp'
    END
  );

  INSERT INTO proof_verification_logs (
    timestamp_proof_id,
    verified_by,
    verification_result,
    verification_method,
    details
  ) VALUES (
    p_proof_id,
    auth.uid(),
    v_verification_result,
    'hmac_hash_comparison',
    v_details
  );

  RETURN v_details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get proof chain for a document
CREATE OR REPLACE FUNCTION get_proof_chain(p_document_id uuid)
RETURNS TABLE (
  proof_id uuid,
  proof_hash text,
  proof_timestamp timestamptz,
  hmac_signature text,
  previous_proof_hash text,
  metadata jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    timestamp_proofs.proof_hash,
    timestamp_proofs.proof_timestamp,
    hmac_signature,
    previous_proof_hash,
    timestamp_proofs.metadata
  FROM timestamp_proofs
  WHERE document_id = p_document_id
  ORDER BY proof_timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate Merkle root hash
CREATE OR REPLACE FUNCTION calculate_merkle_root(leaf_hashes text[])
RETURNS text AS $$
DECLARE
  v_current_level text[];
  v_next_level text[];
  v_i integer;
  v_left text;
  v_right text;
  v_combined text;
BEGIN
  v_current_level := leaf_hashes;

  WHILE array_length(v_current_level, 1) > 1 LOOP
    v_next_level := ARRAY[]::text[];

    FOR v_i IN 1..array_length(v_current_level, 1) BY 2 LOOP
      v_left := v_current_level[v_i];

      IF v_i + 1 <= array_length(v_current_level, 1) THEN
        v_right := v_current_level[v_i + 1];
      ELSE
        v_right := v_left;
      END IF;

      v_combined := encode(
        digest(v_left || v_right, 'sha256'),
        'hex'
      );

      v_next_level := array_append(v_next_level, v_combined);
    END LOOP;

    v_current_level := v_next_level;
  END LOOP;

  RETURN v_current_level[1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate tree height
CREATE OR REPLACE FUNCTION calculate_tree_height(leaf_count integer)
RETURNS integer AS $$
BEGIN
  RETURN CASE
    WHEN leaf_count <= 1 THEN 0
    ELSE ceil(log(2, leaf_count))::integer
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate Merkle proof path for a specific leaf
CREATE OR REPLACE FUNCTION generate_merkle_proof(
  all_leaf_hashes text[],
  target_index integer
)
RETURNS jsonb AS $$
DECLARE
  v_proof_path jsonb;
  v_current_level text[];
  v_current_index integer;
  v_sibling_index integer;
  v_sibling_hash text;
  v_next_level text[];
  v_i integer;
BEGIN
  v_proof_path := '[]'::jsonb;
  v_current_level := all_leaf_hashes;
  v_current_index := target_index;

  WHILE array_length(v_current_level, 1) > 1 LOOP
    IF v_current_index % 2 = 0 THEN
      v_sibling_index := v_current_index + 1;
      IF v_sibling_index <= array_length(v_current_level, 1) THEN
        v_sibling_hash := v_current_level[v_sibling_index];
      ELSE
        v_sibling_hash := v_current_level[v_current_index];
      END IF;

      v_proof_path := v_proof_path || jsonb_build_object(
        'hash', v_sibling_hash,
        'position', 'right'
      );
    ELSE
      v_sibling_index := v_current_index - 1;
      v_sibling_hash := v_current_level[v_sibling_index];

      v_proof_path := v_proof_path || jsonb_build_object(
        'hash', v_sibling_hash,
        'position', 'left'
      );
    END IF;

    v_next_level := ARRAY[]::text[];
    FOR v_i IN 1..array_length(v_current_level, 1) BY 2 LOOP
      IF v_i + 1 <= array_length(v_current_level, 1) THEN
        v_next_level := array_append(
          v_next_level,
          encode(
            digest(v_current_level[v_i] || v_current_level[v_i + 1], 'sha256'),
            'hex'
          )
        );
      ELSE
        v_next_level := array_append(
          v_next_level,
          encode(
            digest(v_current_level[v_i] || v_current_level[v_i], 'sha256'),
            'hex'
          )
        );
      END IF;
    END LOOP;

    v_current_level := v_next_level;
    v_current_index := v_current_index / 2;
  END LOOP;

  RETURN v_proof_path;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to create a Merkle batch for multiple documents
CREATE OR REPLACE FUNCTION create_merkle_batch(
  p_document_ids uuid[],
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  v_batch_id uuid;
  v_leaf_hashes text[];
  v_root_hash text;
  v_tree_height integer;
  v_batch_signature text;
  v_batch_timestamp timestamptz;
  v_doc_id uuid;
  v_doc_hash text;
  v_leaf_index integer;
  v_proof_path jsonb;
  v_timestamp_proof_id uuid;
BEGIN
  v_batch_timestamp := now();

  v_leaf_hashes := ARRAY[]::text[];
  FOREACH v_doc_id IN ARRAY p_document_ids LOOP
    SELECT file_hash INTO v_doc_hash
    FROM documents
    WHERE id = v_doc_id;

    IF v_doc_hash IS NOT NULL THEN
      v_leaf_hashes := array_append(v_leaf_hashes, v_doc_hash);
    END IF;
  END LOOP;

  v_root_hash := calculate_merkle_root(v_leaf_hashes);
  v_tree_height := calculate_tree_height(array_length(v_leaf_hashes, 1));

  v_batch_signature := encode(
    hmac(
      (v_root_hash || '::' || extract(epoch from v_batch_timestamp)::text)::bytea,
      encode(gen_random_bytes(32), 'hex')::bytea,
      'sha256'
    ),
    'hex'
  );

  INSERT INTO merkle_tree_batches (
    batch_timestamp,
    root_hash,
    leaf_count,
    tree_height,
    batch_signature,
    metadata
  ) VALUES (
    v_batch_timestamp,
    v_root_hash,
    array_length(v_leaf_hashes, 1),
    v_tree_height,
    v_batch_signature,
    p_metadata
  ) RETURNING id INTO v_batch_id;

  v_leaf_index := 0;
  FOREACH v_doc_id IN ARRAY p_document_ids LOOP
    SELECT file_hash INTO v_doc_hash
    FROM documents
    WHERE id = v_doc_id;

    IF v_doc_hash IS NOT NULL THEN
      v_proof_path := generate_merkle_proof(v_leaf_hashes, v_leaf_index + 1);

      SELECT id INTO v_timestamp_proof_id
      FROM timestamp_proofs
      WHERE document_id = v_doc_id
      ORDER BY proof_timestamp DESC
      LIMIT 1;

      INSERT INTO merkle_tree_leaves (
        batch_id,
        document_id,
        leaf_hash,
        leaf_index,
        proof_path,
        timestamp_proof_id
      ) VALUES (
        v_batch_id,
        v_doc_id,
        v_doc_hash,
        v_leaf_index,
        v_proof_path,
        v_timestamp_proof_id
      );

      v_leaf_index := v_leaf_index + 1;
    END IF;
  END LOOP;

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a document's Merkle proof
CREATE OR REPLACE FUNCTION verify_merkle_proof(
  p_document_id uuid,
  p_current_hash text
)
RETURNS jsonb AS $$
DECLARE
  v_leaf record;
  v_batch record;
  v_computed_hash text;
  v_proof_element jsonb;
  v_verification_result boolean;
BEGIN
  SELECT * INTO v_leaf
  FROM merkle_tree_leaves
  WHERE document_id = p_document_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'No Merkle proof found for document'
    );
  END IF;

  SELECT * INTO v_batch
  FROM merkle_tree_batches
  WHERE id = v_leaf.batch_id;

  IF v_leaf.leaf_hash != p_current_hash THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Document has been modified since batch proof',
      'batch_id', v_batch.id,
      'batch_timestamp', v_batch.batch_timestamp,
      'leaf_hash', v_leaf.leaf_hash,
      'current_hash', p_current_hash
    );
  END IF;

  v_computed_hash := v_leaf.leaf_hash;

  FOR v_proof_element IN SELECT * FROM jsonb_array_elements(v_leaf.proof_path) LOOP
    IF v_proof_element->>'position' = 'left' THEN
      v_computed_hash := encode(
        digest((v_proof_element->>'hash') || v_computed_hash, 'sha256'),
        'hex'
      );
    ELSE
      v_computed_hash := encode(
        digest(v_computed_hash || (v_proof_element->>'hash'), 'sha256'),
        'hex'
      );
    END IF;
  END LOOP;

  v_verification_result := (v_computed_hash = v_batch.root_hash);

  INSERT INTO batch_verification_logs (
    batch_id,
    verified_by,
    verification_result,
    documents_verified,
    verification_method,
    details
  ) VALUES (
    v_batch.id,
    auth.uid(),
    v_verification_result,
    1,
    'merkle_proof_path',
    jsonb_build_object(
      'document_id', p_document_id,
      'leaf_index', v_leaf.leaf_index,
      'computed_root', v_computed_hash,
      'expected_root', v_batch.root_hash
    )
  );

  RETURN jsonb_build_object(
    'valid', v_verification_result,
    'batch_id', v_batch.id,
    'batch_timestamp', v_batch.batch_timestamp,
    'root_hash', v_batch.root_hash,
    'leaf_count', v_batch.leaf_count,
    'leaf_index', v_leaf.leaf_index,
    'computed_root', v_computed_hash,
    'message', CASE
      WHEN v_verification_result THEN 'Document integrity verified via Merkle proof'
      ELSE 'Merkle proof verification failed'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all documents in a batch
CREATE OR REPLACE FUNCTION get_batch_documents(p_batch_id uuid)
RETURNS TABLE (
  document_id uuid,
  file_name text,
  leaf_hash text,
  leaf_index integer,
  proof_path jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mtl.document_id,
    d.file_name,
    mtl.leaf_hash,
    mtl.leaf_index,
    mtl.proof_path
  FROM merkle_tree_leaves mtl
  JOIN documents d ON d.id = mtl.document_id
  WHERE mtl.batch_id = p_batch_id
  ORDER BY mtl.leaf_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get batch statistics
CREATE OR REPLACE FUNCTION get_batch_statistics()
RETURNS jsonb AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_batches', COUNT(*),
    'total_documents_batched', COALESCE(SUM(leaf_count), 0),
    'average_batch_size', COALESCE(AVG(leaf_count), 0),
    'latest_batch_timestamp', MAX(batch_timestamp)
  ) INTO v_stats
  FROM merkle_tree_batches;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance metrics cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_performance_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_performance_metrics IS 'Removes performance metrics older than 7 days to prevent table bloat';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_annotations_updated_at ON document_annotations;
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON user_roles;
DROP TRIGGER IF EXISTS validate_document_before_insert ON documents;
DROP TRIGGER IF EXISTS trigger_auto_create_timestamp_proof ON documents;

-- Apply auto-update trigger to documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-update trigger to categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-update trigger to annotations
CREATE TRIGGER update_annotations_updated_at
  BEFORE UPDATE ON document_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply auto-update trigger to user roles
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to validate and sanitize document metadata before insert
CREATE OR REPLACE FUNCTION validate_document_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_validation_result jsonb;
BEGIN
  v_validation_result := validate_file_metadata(
    NEW.file_size,
    NEW.file_type,
    NEW.file_name
  );

  IF NOT (v_validation_result->>'valid')::boolean THEN
    PERFORM log_security_event(
      'document.validation_failed',
      'document',
      NEW.id::text,
      'warning',
      jsonb_build_object(
        'error', v_validation_result->>'error',
        'message', v_validation_result->>'message',
        'file_name', NEW.file_name,
        'file_type', NEW.file_type,
        'file_size', NEW.file_size
      )
    );

    RAISE EXCEPTION 'File validation failed: %', v_validation_result->>'message';
  END IF;

  NEW.title := sanitize_text_input(NEW.title);
  NEW.description := sanitize_text_input(NEW.description);
  NEW.file_name := sanitize_text_input(NEW.file_name);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply validation trigger to documents
CREATE TRIGGER validate_document_before_insert
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION validate_document_insert();

-- Trigger to automatically create timestamp proof on document insert
CREATE OR REPLACE FUNCTION auto_create_timestamp_proof()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_timestamp_proof(
    NEW.id,
    NEW.file_hash,
    jsonb_build_object(
      'file_name', NEW.file_name,
      'file_size', NEW.file_size,
      'uploaded_by', NEW.uploaded_by,
      'uploaded_at', NEW.uploaded_at
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_create_timestamp_proof
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_timestamp_proof();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Create view for security dashboard
CREATE OR REPLACE VIEW user_security_summary AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE security_event = true) as security_events_count,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_events_count,
  MAX(created_at) FILTER (WHERE security_event = true) as last_security_event,
  jsonb_agg(
    jsonb_build_object(
      'action', action,
      'severity', severity,
      'created_at', created_at
    ) ORDER BY created_at DESC
  ) FILTER (WHERE security_event = true AND created_at > now() - interval '7 days') as recent_events
FROM audit_logs
GROUP BY user_id;

GRANT SELECT ON user_security_summary TO authenticated;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to functions
GRANT EXECUTE ON FUNCTION sanitize_text_input TO authenticated;
GRANT EXECUTE ON FUNCTION validate_file_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION hash_share_password TO authenticated;
GRANT EXECUTE ON FUNCTION verify_share_password TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION detect_suspicious_activity TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_security_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION record_share_access_attempt TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_shared_document TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_share_security_data TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_performance_metrics TO service_role;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Seed default categories
INSERT INTO categories (name, icon, color) VALUES
  ('Financial Reports', 'DollarSign', '#10B981'),
  ('HR Documents', 'Users', '#8B5CF6'),
  ('Marketing Materials', 'Megaphone', '#F59E0B'),
  ('Legal Documents', 'Scale', '#EF4444'),
  ('Technical Documentation', 'Code', '#3B82F6')
ON CONFLICT DO NOTHING;
