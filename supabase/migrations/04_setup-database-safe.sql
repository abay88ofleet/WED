-- ============================================================================
-- SAFE DATABASE SETUP - HANDLES EXISTING OBJECTS
-- ============================================================================
-- This script safely creates objects only if they don't exist

-- First, enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES (CREATE IF NOT EXISTS)
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

-- ============================================================================
-- STORAGE BUCKET (SAFE INSERT)
-- ============================================================================

-- Create storage bucket for documents (only if it doesn't exist)
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

-- ============================================================================
-- ENABLE RLS (SAFE)
-- ============================================================================

-- Enable RLS on tables (will not error if already enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP AND RECREATE POLICIES (SAFE APPROACH)
-- ============================================================================

-- Categories policies - Drop existing and recreate
DROP POLICY IF EXISTS "Allow authenticated users to view categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON categories;

CREATE POLICY "Allow authenticated users to view categories" ON categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert categories" ON categories
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update categories" ON categories
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete categories" ON categories
    FOR DELETE USING (auth.role() = 'authenticated');

-- Documents policies - Drop existing and recreate
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;

CREATE POLICY "Users can view their own documents" ON documents
    FOR SELECT USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert their own documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Storage policies - Drop existing and recreate
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow users to view their own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Allow users to delete their own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================================================
-- FUNCTIONS (CREATE OR REPLACE - SAFE)
-- ============================================================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(document_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE documents 
    SET view_count = view_count + 1 
    WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_download_count(document_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE documents 
    SET download_count = download_count + 1 
    WHERE id = document_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SAMPLE DATA (SAFE INSERT)
-- ============================================================================

-- Insert some sample categories (only if they don't exist)
INSERT INTO categories (name, icon, color, is_pinned) 
SELECT 'Documents', 'FileText', '#3B82F6', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Documents');

INSERT INTO categories (name, icon, color, is_pinned) 
SELECT 'Images', 'Image', '#10B981', true
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Images');

INSERT INTO categories (name, icon, color, is_pinned) 
SELECT 'Archives', 'Archive', '#F59E0B', false
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Archives');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if everything is set up correctly
DO $$
DECLARE
    categories_count INTEGER;
    bucket_exists BOOLEAN;
    rls_enabled_categories BOOLEAN;
    rls_enabled_documents BOOLEAN;
BEGIN
    -- Count categories
    SELECT COUNT(*) INTO categories_count FROM categories;
    
    -- Check if bucket exists
    SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'documents') INTO bucket_exists;
    
    -- Check RLS status
    SELECT relrowsecurity INTO rls_enabled_categories FROM pg_class WHERE relname = 'categories';
    SELECT relrowsecurity INTO rls_enabled_documents FROM pg_class WHERE relname = 'documents';
    
    -- Output results
    RAISE NOTICE 'Setup verification:';
    RAISE NOTICE '- Categories created: %', categories_count;
    RAISE NOTICE '- Storage bucket exists: %', bucket_exists;
    RAISE NOTICE '- RLS enabled on categories: %', rls_enabled_categories;
    RAISE NOTICE '- RLS enabled on documents: %', rls_enabled_documents;
    
    IF categories_count > 0 AND bucket_exists AND rls_enabled_categories AND rls_enabled_documents THEN
        RAISE NOTICE 'SUCCESS: Database setup completed successfully!';
    ELSE
        RAISE WARNING 'WARNING: Some components may not be set up correctly';
    END IF;
END $$;
