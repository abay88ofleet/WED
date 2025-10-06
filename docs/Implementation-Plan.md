# Implementation Plan: Document Archival System Improvements

**Project:** Document Management System Optimization
**Duration:** 8-12 Weeks
**Team Size:** 2-3 Developers
**Expected Outcome:** 75% cost reduction, 10x performance improvement, cryptographic proof-of-time

---

## Table of Contents

1. [Implementation Phases Overview](#implementation-phases-overview)
2. [Phase 1: Quick Wins (Week 1-2)](#phase-1-quick-wins-week-1-2)
3. [Phase 2: Core Performance (Week 3-5)](#phase-2-core-performance-week-3-5)
4. [Phase 3: Security Hardening (Week 6-7)](#phase-3-security-hardening-week-6-7)
5. [Phase 4: Proof-of-Time System (Week 8-10)](#phase-4-proof-of-time-system-week-8-10)
6. [Phase 5: Advanced Features (Week 11-12)](#phase-5-advanced-features-week-11-12)
7. [Testing Strategy](#testing-strategy)
8. [Rollback Plans](#rollback-plans)
9. [Success Metrics](#success-metrics)
10. [Resource Requirements](#resource-requirements)

---

## Implementation Phases Overview

### Phase Summary

| Phase | Duration | Focus | Risk | Cost Impact | Performance Impact |
|-------|----------|-------|------|-------------|-------------------|
| **Phase 1** | 2 weeks | Quick wins, security fixes | Low | -$200/mo | +30% |
| **Phase 2** | 3 weeks | Performance optimization | Medium | -$450/mo | +500% |
| **Phase 3** | 2 weeks | Security hardening | Low | $0 | +10% |
| **Phase 4** | 3 weeks | Proof-of-time | Medium | +$30/mo | 0% |
| **Phase 5** | 2 weeks | Advanced features | Low | -$20/mo | +20% |

**Total Timeline:** 12 weeks
**Total Cost Savings:** $640/month
**Performance Improvement:** 10x faster load times

---

## Phase 1: Quick Wins (Week 1-2)

**Goal:** Implement high-impact, low-risk improvements that provide immediate value.

### Week 1: Security Fixes & Foundation

#### Task 1.1: Remove Public URL Fallback (Priority: CRITICAL)
- **Assignee:** Senior Developer
- **Duration:** 2 hours
- **Dependencies:** None

**Subtasks:**
1. Update `src/services/documentService.ts:194-208`
2. Remove public URL fallback logic
3. Add proper error handling
4. Implement SignedUrlCache class
5. Add unit tests for URL generation
6. Test with expired signed URLs

**Implementation Steps:**
```typescript
// Step 1: Update getDocumentUrl function
export async function getDocumentUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('Failed to generate signed URL:', error);
    throw new Error('Unable to access document. Please try again.');
  }

  if (!data?.signedUrl) {
    throw new Error('Invalid document URL generated');
  }

  return data.signedUrl;
}

// Step 2: Create URL cache
export class SignedUrlCache {
  private cache = new Map<string, { url: string; expiresAt: number }>();

  async getUrl(filePath: string): Promise<string> {
    const cached = this.cache.get(filePath);
    if (cached && cached.expiresAt > Date.now() + 300000) {
      return cached.url;
    }

    const url = await getDocumentUrl(filePath);
    this.cache.set(filePath, {
      url,
      expiresAt: Date.now() + 3600000
    });

    return url;
  }

  clear() {
    this.cache.clear();
  }
}

// Step 3: Update components to use cache
const urlCache = new SignedUrlCache();
```

**Testing:**
- [ ] Test document loading with valid signed URLs
- [ ] Test error handling when URL generation fails
- [ ] Test cache expiration and refresh
- [ ] Verify no public URLs are generated
- [ ] Load test with 100 concurrent users

**Success Criteria:**
- ✅ No public URLs in network traffic
- ✅ All documents load correctly
- ✅ Error messages are user-friendly
- ✅ Cache reduces API calls by 80%

**Rollback Plan:**
- Revert commit if errors > 1% of requests
- Monitor error rates for 24 hours post-deployment

---

#### Task 1.2: Add Input Validation for Search
- **Assignee:** Mid-level Developer
- **Duration:** 4 hours
- **Dependencies:** None

**Subtasks:**
1. Create validation utility functions
2. Update `src/services/searchService.ts`
3. Add sanitization for user input
4. Implement rate limiting for search queries
5. Add unit tests for validation
6. Update frontend to show validation errors

**Implementation Steps:**
```typescript
// Step 1: Create validation utility
export function validateSearchInput(query: string): {
  valid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query must be a non-empty string' };
  }

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  if (trimmed.length > 200) {
    return { valid: false, error: 'Query too long (max 200 characters)' };
  }

  const dangerousPatterns = [
    /--/,
    /;.*drop/i,
    /;.*delete/i,
    /;.*update/i,
    /union.*select/i,
    /exec\s*\(/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Query contains invalid characters' };
    }
  }

  const sanitized = trimmed.replace(/[;'"\\]/g, '');
  return { valid: true, sanitized };
}

// Step 2: Update search service
export async function advancedSearch(filters: SearchFilters) {
  if (filters.query) {
    const validation = validateSearchInput(filters.query);

    if (!validation.valid) {
      return {
        results: [],
        totalCount: 0,
        error: validation.error
      };
    }

    filters.query = validation.sanitized;
  }

  // Rest of search implementation...
}
```

**Testing:**
- [ ] Test with SQL injection patterns
- [ ] Test with XSS attempts
- [ ] Test with various special characters
- [ ] Test with empty/null queries
- [ ] Test with very long queries (>200 chars)

**Success Criteria:**
- ✅ All SQL injection patterns blocked
- ✅ Search functionality works normally
- ✅ User-friendly error messages
- ✅ No security vulnerabilities

---

#### Task 1.3: Optimize Counter Updates (Batching)
- **Assignee:** Database Specialist
- **Duration:** 6 hours
- **Dependencies:** None

**Subtasks:**
1. Create migration for counter staging table
2. Implement `record_counter_increment` function
3. Create `aggregate_counter_increments` function
4. Set up pg_cron job (or external cron)
5. Update client-side counter calls
6. Monitor aggregation performance

**Implementation Steps:**

**Step 1: Create Migration**
```sql
-- supabase/migrations/TIMESTAMP_optimize_counter_updates.sql

/*
  # Optimize Counter Updates with Batching

  ## Summary
  Implements batched counter updates to reduce database load and eliminate lock contention.

  ## Changes
  1. New Tables
    - `document_counter_staging` - Temporary storage for counter increments

  2. Functions
    - `record_counter_increment` - Fast insert for counter tracking
    - `aggregate_counter_increments` - Batch process all pending increments

  3. Performance Impact
    - Reduces database write operations by 90%
    - Eliminates row-level lock contention
    - Counters updated within 5 minutes
*/

-- Create staging table
CREATE TABLE IF NOT EXISTS document_counter_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  counter_type text NOT NULL CHECK (counter_type IN ('view', 'download')),
  increment_value int DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counter_staging_doc
  ON document_counter_staging(document_id, counter_type);

CREATE INDEX IF NOT EXISTS idx_counter_staging_created
  ON document_counter_staging(created_at);

-- Function to record counter increment (fast insert)
CREATE OR REPLACE FUNCTION record_counter_increment(
  p_document_id uuid,
  p_counter_type text
)
RETURNS void AS $$
BEGIN
  INSERT INTO document_counter_staging (document_id, counter_type)
  VALUES (p_document_id, p_counter_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to aggregate counters (run periodically)
CREATE OR REPLACE FUNCTION aggregate_counter_increments()
RETURNS TABLE (
  view_updates int,
  download_updates int,
  total_processed int
) AS $$
DECLARE
  v_view_updates int := 0;
  v_download_updates int := 0;
  v_total int := 0;
BEGIN
  -- Aggregate view counts
  WITH aggregated AS (
    SELECT document_id, SUM(increment_value) as total
    FROM document_counter_staging
    WHERE counter_type = 'view'
    GROUP BY document_id
  )
  UPDATE documents d
  SET view_count = d.view_count + a.total
  FROM aggregated a
  WHERE d.id = a.document_id;

  GET DIAGNOSTICS v_view_updates = ROW_COUNT;

  -- Aggregate download counts
  WITH aggregated AS (
    SELECT document_id, SUM(increment_value) as total
    FROM document_counter_staging
    WHERE counter_type = 'download'
    GROUP BY document_id
  )
  UPDATE documents d
  SET download_count = d.download_count + a.total
  FROM aggregated a
  WHERE d.id = a.document_id;

  GET DIAGNOSTICS v_download_updates = ROW_COUNT;

  -- Get total records to delete
  SELECT COUNT(*) INTO v_total FROM document_counter_staging;

  -- Clear processed records
  DELETE FROM document_counter_staging;

  RETURN QUERY SELECT v_view_updates, v_download_updates, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_counter_increment TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_counter_increments TO service_role;
```

**Step 2: Set up Cron Job**
```sql
-- If pg_cron is available
SELECT cron.schedule(
  'aggregate-document-counters',
  '*/5 * * * *', -- Every 5 minutes
  'SELECT aggregate_counter_increments()'
);
```

**Alternative: External Cron via Edge Function**
```typescript
// supabase/functions/aggregate-counters/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data, error } = await supabase.rpc('aggregate_counter_increments')

    if (error) throw error

    console.log('Aggregation complete:', data)

    return new Response(
      JSON.stringify({
        success: true,
        stats: data[0]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Aggregation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

**Step 3: Update Client-Side Code**
```typescript
// src/services/documentService.ts

export async function incrementViewCount(documentId: string) {
  const { error } = await supabase.rpc('record_counter_increment', {
    p_document_id: documentId,
    p_counter_type: 'view'
  });

  return { error };
}

export async function incrementDownloadCount(documentId: string) {
  const { error } = await supabase.rpc('record_counter_increment', {
    p_document_id: documentId,
    p_counter_type: 'download'
  });

  return { error };
}
```

**Testing:**
- [ ] Record 1000 view increments and verify aggregation
- [ ] Test concurrent increments (100 simultaneous)
- [ ] Verify no counter loss during aggregation
- [ ] Test aggregation with empty staging table
- [ ] Monitor database CPU during aggregation
- [ ] Verify counters update within 5 minutes

**Success Criteria:**
- ✅ Counter updates 10x faster
- ✅ Zero lock contention
- ✅ 100% accuracy (no lost counts)
- ✅ Database CPU reduced by 30%

**Rollback Plan:**
- Keep old functions (`increment_view_count`, `increment_download_count`)
- Can switch back with feature flag
- Monitor for 48 hours before removing old functions

---

### Week 2: Database Optimizations

#### Task 1.4: Implement Query Pagination
- **Assignee:** Senior Developer
- **Duration:** 8 hours
- **Dependencies:** None

**Subtasks:**
1. Update `getDocuments()` to support pagination
2. Implement cursor-based pagination
3. Update Zustand store for paginated data
4. Add infinite scroll to DocumentGrid
5. Add loading indicators
6. Test with 10,000+ documents

**Implementation Steps:**

**Step 1: Update Document Service**
```typescript
// src/services/documentService.ts

export interface PaginationOptions {
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
}

export interface PaginatedResponse<T> {
  data: T[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  totalCount?: number;
}

export async function getDocuments(
  options: PaginationOptions = {}
): Promise<{ data: PaginatedResponse<Document> | null; error: any }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const {
      limit = 50,
      cursor,
      direction = 'forward'
    } = options;

    // Build base query
    let query = supabase
      .from('documents')
      .select(`
        *,
        category:categories(*)
      `, { count: 'exact' })
      .eq('uploaded_by', user.id)
      .order('uploaded_at', { ascending: false })
      .limit(limit + 1); // Fetch one extra to check if more exists

    // Apply cursor-based pagination
    if (cursor) {
      const { data: cursorDoc } = await supabase
        .from('documents')
        .select('uploaded_at')
        .eq('id', cursor)
        .single();

      if (cursorDoc) {
        if (direction === 'forward') {
          query = query.lt('uploaded_at', cursorDoc.uploaded_at);
        } else {
          query = query.gt('uploaded_at', cursorDoc.uploaded_at);
        }
      }
    }

    const { data, error, count } = await query;

    if (error) {
      return { data: null, error };
    }

    const hasMore = data.length > limit;
    const documents = hasMore ? data.slice(0, limit) : data;

    return {
      data: {
        data: documents.map(mapDocument),
        hasMore,
        nextCursor: hasMore ? documents[documents.length - 1].id : undefined,
        prevCursor: documents[0]?.id,
        totalCount: count || 0
      },
      error: null
    };
  } catch (err) {
    console.error('Error fetching documents:', err);
    return { data: null, error: err };
  }
}

function mapDocument(doc: any): Document {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description || '',
    fileName: doc.file_name,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    categoryId: doc.category_id || '',
    tags: doc.tags || [],
    uploadedBy: doc.uploaded_by,
    uploadedAt: new Date(doc.uploaded_at),
    updatedAt: new Date(doc.updated_at),
    fileUrl: doc.file_path,
    isFavorite: doc.is_favorite || false,
    downloadCount: doc.download_count || 0,
    viewCount: doc.view_count || 0,
  };
}
```

**Step 2: Update Zustand Store**
```typescript
// src/store/useDocumentStore.ts

interface DocumentStore {
  // ... existing fields
  hasMoreDocuments: boolean;
  nextCursor?: string;
  totalDocumentCount: number;
  isLoadingMore: boolean;

  // ... existing methods
  loadMoreDocuments: () => Promise<void>;
  resetPagination: () => void;
}

export const useDocumentStore = create<DocumentStore>()(persist(
  (set, get) => ({
    // ... existing state
    hasMoreDocuments: false,
    nextCursor: undefined,
    totalDocumentCount: 0,
    isLoadingMore: false,

    refreshDocuments: async () => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await getDocuments({ limit: 50 });

        if (error) {
          set({
            error: typeof error === 'string' ? error : error.message,
            isLoading: false,
            documents: []
          });
        } else if (data) {
          set({
            documents: data.data,
            hasMoreDocuments: data.hasMore,
            nextCursor: data.nextCursor,
            totalDocumentCount: data.totalCount || 0,
            isLoading: false
          });
        }
      } catch (err) {
        console.error('Error refreshing documents:', err);
        set({
          error: 'An unexpected error occurred',
          isLoading: false,
          documents: []
        });
      }
    },

    loadMoreDocuments: async () => {
      const { nextCursor, hasMoreDocuments, isLoadingMore } = get();

      if (!hasMoreDocuments || isLoadingMore) return;

      set({ isLoadingMore: true });

      try {
        const { data, error } = await getDocuments({
          limit: 50,
          cursor: nextCursor
        });

        if (error) {
          console.error('Error loading more documents:', error);
        } else if (data) {
          set((state) => ({
            documents: [...state.documents, ...data.data],
            hasMoreDocuments: data.hasMore,
            nextCursor: data.nextCursor,
            isLoadingMore: false
          }));
        }
      } catch (err) {
        console.error('Error loading more documents:', err);
        set({ isLoadingMore: false });
      }
    },

    resetPagination: () => {
      set({
        documents: [],
        hasMoreDocuments: false,
        nextCursor: undefined,
        isLoadingMore: false
      });
    },

    // ... rest of implementation
  }),
  {
    name: 'document-library-storage',
    partialize: (state) => ({
      isSidebarCollapsed: state.isSidebarCollapsed,
      isPreviewPanelCollapsed: state.isPreviewPanelCollapsed,
      savedFilters: state.savedFilters,
      searchHistory: state.searchHistory,
      expandedSections: state.expandedSections,
    }),
  }
));
```

**Step 3: Add Infinite Scroll to DocumentGrid**
```typescript
// src/components/DocumentGrid.tsx

import { useEffect, useRef } from 'react';
import { useDocumentStore } from '../store/useDocumentStore';

export const DocumentGrid: React.FC = () => {
  const {
    documents,
    hasMoreDocuments,
    isLoadingMore,
    loadMoreDocuments
  } = useDocumentStore();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreDocuments && !isLoadingMore) {
          loadMoreDocuments();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreDocuments, isLoadingMore, loadMoreDocuments]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} />
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMoreDocuments && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              <span className="text-gray-600">Loading more documents...</span>
            </div>
          )}
        </div>
      )}

      {!hasMoreDocuments && documents.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          No more documents to load
        </div>
      )}
    </div>
  );
};
```

**Testing:**
- [ ] Test with empty document list
- [ ] Test with exactly 50 documents (one page)
- [ ] Test with 10,000+ documents
- [ ] Test scroll performance (no jank)
- [ ] Test loading indicators appear correctly
- [ ] Test cursor-based pagination accuracy
- [ ] Test realtime updates with pagination

**Success Criteria:**
- ✅ Initial load time < 500ms
- ✅ Smooth infinite scroll (60fps)
- ✅ Memory usage stable (< 100MB for 1000 docs)
- ✅ Accurate document count
- ✅ No duplicate documents

**Rollback Plan:**
- Feature flag: `ENABLE_PAGINATION`
- Can revert to full list fetch
- Monitor performance for 72 hours

---

#### Task 1.5: Add Comprehensive Audit Logging
- **Assignee:** Database Specialist
- **Duration:** 4 hours
- **Dependencies:** None

**Implementation Steps:**

**Step 1: Create Migration**
```sql
-- supabase/migrations/TIMESTAMP_comprehensive_audit_logging.sql

/*
  # Comprehensive Audit Logging

  ## Summary
  Implements database triggers for complete audit trail of all sensitive operations.

  ## Changes
  1. Audit Triggers
    - Documents table (INSERT, UPDATE, DELETE)
    - Document shares (access tracking)
    - Annotations (modifications)
    - Version control

  2. Functions
    - `audit_document_changes` - Automatic document audit logging
    - `audit_share_access` - Track share link access
*/

-- Create audit trigger function for documents
CREATE OR REPLACE FUNCTION audit_document_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'document_delete',
      'document',
      OLD.id,
      jsonb_build_object(
        'file_name', OLD.file_name,
        'file_size', OLD.file_size,
        'category_id', OLD.category_id,
        'file_hash', OLD.file_hash
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'document_update',
      'document',
      NEW.id,
      jsonb_build_object(
        'changes', jsonb_build_object(
          'title', jsonb_build_object('old', OLD.title, 'new', NEW.title),
          'description', jsonb_build_object('old', OLD.description, 'new', NEW.description),
          'category_id', jsonb_build_object('old', OLD.category_id, 'new', NEW.category_id),
          'tags', jsonb_build_object('old', OLD.tags, 'new', NEW.tags)
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'document_insert',
      'document',
      NEW.id,
      jsonb_build_object(
        'file_name', NEW.file_name,
        'file_size', NEW.file_size,
        'file_type', NEW.file_type,
        'category_id', NEW.category_id
      )
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to documents table
DROP TRIGGER IF EXISTS audit_documents_trigger ON documents;
CREATE TRIGGER audit_documents_trigger
  AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION audit_document_changes();

-- Audit share access
CREATE OR REPLACE FUNCTION audit_share_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_accessed_at IS DISTINCT FROM OLD.last_accessed_at THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      NEW.shared_by,
      'share_accessed',
      'document_share',
      NEW.id,
      jsonb_build_object(
        'document_id', NEW.document_id,
        'access_count', NEW.access_count,
        'access_type', NEW.access_type,
        'shared_with', NEW.shared_with_email
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_share_access_trigger ON document_shares;
CREATE TRIGGER audit_share_access_trigger
  AFTER UPDATE OF last_accessed_at ON document_shares
  FOR EACH ROW EXECUTE FUNCTION audit_share_access();

-- Audit annotation changes
CREATE OR REPLACE FUNCTION audit_annotation_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'annotation_delete',
      'annotation',
      OLD.id,
      jsonb_build_object(
        'document_id', OLD.document_id,
        'annotation_type', OLD.annotation_type,
        'page_number', OLD.page_number
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'annotation_update',
      'annotation',
      NEW.id,
      jsonb_build_object(
        'document_id', NEW.document_id,
        'changes', jsonb_build_object(
          'content', jsonb_build_object('old', OLD.content, 'new', NEW.content),
          'position', jsonb_build_object('old', OLD.position, 'new', NEW.position)
        )
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (
      auth.uid(),
      'annotation_insert',
      'annotation',
      NEW.id,
      jsonb_build_object(
        'document_id', NEW.document_id,
        'annotation_type', NEW.annotation_type,
        'page_number', NEW.page_number
      )
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS audit_annotations_trigger ON document_annotations;
CREATE TRIGGER audit_annotations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON document_annotations
  FOR EACH ROW EXECUTE FUNCTION audit_annotation_changes();
```

**Testing:**
- [ ] Upload document → verify INSERT audit log
- [ ] Update document → verify UPDATE audit log with changes
- [ ] Delete document → verify DELETE audit log
- [ ] Access share link → verify access audit log
- [ ] Create annotation → verify annotation INSERT
- [ ] Query audit logs for specific user
- [ ] Test audit log RLS policies

**Success Criteria:**
- ✅ 100% coverage of sensitive operations
- ✅ Audit logs cannot be bypassed
- ✅ Performance impact < 5ms per operation
- ✅ Audit logs queryable by admins

---

### Phase 1 Deliverables Checklist

**Week 1:**
- [ ] Public URL fallback removed
- [ ] SignedUrlCache implemented
- [ ] Search input validation deployed
- [ ] Counter batching system live
- [ ] All Phase 1 Week 1 tests passed

**Week 2:**
- [ ] Pagination implemented and tested
- [ ] Infinite scroll working
- [ ] Audit logging triggers deployed
- [ ] All Phase 1 tests passed
- [ ] Performance baselines recorded

**Success Metrics:**
- [ ] Page load time reduced by 30%
- [ ] Database CPU reduced by 30%
- [ ] Zero SQL injection vulnerabilities
- [ ] 100% audit coverage
- [ ] Cost savings: ~$200/month

---

## Phase 2: Core Performance (Week 3-5)

**Goal:** Implement high-impact performance optimizations for scalability.

### Week 3: Edge Function Processing

#### Task 2.1: Create Document Processing Edge Function
- **Assignee:** Senior Developer + DevOps
- **Duration:** 16 hours
- **Dependencies:** None

**Subtasks:**
1. Create `process-document-upload` Edge Function
2. Implement hash calculation
3. Add duplicate detection
4. Implement thumbnail generation
5. Add text extraction (PDF, Word)
6. Deploy and test Edge Function
7. Update client upload flow

**Implementation Steps:**

**Step 1: Create Edge Function**
```typescript
// supabase/functions/process-document-upload/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { filePath, documentId, userId } = await req.json()

    console.log(`Processing document: ${filePath}`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Download file from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError) {
      throw new Error(`Download failed: ${downloadError.message}`)
    }

    // Calculate SHA-256 hash
    console.log('Calculating hash...')
    const arrayBuffer = await fileData.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    console.log(`File hash: ${fileHash}`)

    // Check for duplicates
    const { data: existing } = await supabase
      .from('documents')
      .select('id, file_name')
      .eq('file_hash', fileHash)
      .eq('uploaded_by', userId)
      .maybeSingle()

    if (existing) {
      // Delete uploaded file if duplicate
      console.log('Duplicate detected, removing file...')
      await supabase.storage.from('documents').remove([filePath])

      return new Response(
        JSON.stringify({
          success: false,
          isDuplicate: true,
          existingDocId: existing.id,
          fileName: existing.file_name
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Update document with hash
    const { error: updateError } = await supabase
      .from('documents')
      .update({ file_hash: fileHash })
      .eq('id', documentId)

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`)
    }

    // Extract text (basic implementation - can be enhanced)
    let ocrText = ''
    const fileName = filePath.toLowerCase()

    if (fileName.endsWith('.pdf')) {
      console.log('Extracting PDF text...')
      // PDF text extraction would go here
      // For now, return placeholder
      ocrText = 'PDF text extraction placeholder'
    } else if (fileName.endsWith('.txt')) {
      console.log('Extracting plain text...')
      const text = await fileData.text()
      ocrText = text.substring(0, 10000) // Limit to 10KB
    }

    // Update document with OCR text if available
    if (ocrText) {
      await supabase
        .from('documents')
        .update({ ocr_text: ocrText })
        .eq('id', documentId)
    }

    console.log('Processing complete')

    return new Response(
      JSON.stringify({
        success: true,
        fileHash,
        ocrText: ocrText ? 'extracted' : 'not_available',
        fileSize: arrayBuffer.byteLength
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

**Step 2: Deploy Edge Function**
```bash
# Use the mcp__supabase__deploy_edge_function tool
```

**Step 3: Update Client Upload Flow**
```typescript
// src/services/documentService.ts

export async function uploadDocument(params: UploadDocumentParams) {
  try {
    const { file, categoryId, tags, description = '' } = params;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Generate temporary file path
    const tempPath = `${user.id}/temp-${Date.now()}-${file.name}`;

    // Upload file first
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(tempPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    // Create document record (without hash initially)
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        title: file.name.replace(/\.[^/.]+$/, ''),
        description,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        file_size: file.size,
        file_path: tempPath,
        file_hash: 'pending',
        category_id: categoryId || null,
        tags,
        uploaded_by: user.id
      })
      .select('id')
      .single();

    if (insertError) {
      await supabase.storage.from('documents').remove([tempPath]);
      return { success: false, error: insertError.message };
    }

    // Call Edge Function to process document
    const processingResponse = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document-upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath: tempPath,
          documentId: document.id,
          userId: user.id
        }),
      }
    );

    const processingResult = await processingResponse.json();

    if (!processingResult.success) {
      // If duplicate, delete the document record
      if (processingResult.isDuplicate) {
        await supabase.from('documents').delete().eq('id', document.id);
        return {
          success: false,
          error: `Document with identical content already exists as "${processingResult.fileName}"`,
          existingDocId: processingResult.existingDocId
        };
      }

      // If other error, clean up
      await supabase.from('documents').delete().eq('id', document.id);
      return { success: false, error: processingResult.error };
    }

    return { success: true, documentId: document.id };
  } catch (error) {
    console.error('Error uploading document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

**Testing:**
- [ ] Upload small file (< 1MB) → verify processing
- [ ] Upload large file (100MB) → verify no timeout
- [ ] Upload duplicate → verify detection
- [ ] Upload PDF → verify hash calculation
- [ ] Upload 10 files concurrently → verify all process
- [ ] Test error handling (invalid file, storage failure)
- [ ] Monitor Edge Function logs

**Success Criteria:**
- ✅ Processing completes in < 5 seconds for 10MB files
- ✅ 100% duplicate detection accuracy
- ✅ Zero client-side processing delay
- ✅ Edge Function error rate < 0.1%

---

#### Task 2.2: Implement Thumbnail Generation
- **Assignee:** Senior Developer
- **Duration:** 12 hours
- **Dependencies:** Task 2.1

**Implementation:**

Continue in next section due to length...

**Success Metrics for Phase 2:**
- [ ] Upload processing 90% faster
- [ ] Thumbnail generation working for all file types
- [ ] Full-text search 40x faster
- [ ] Cost savings: ~$450/month

---

## Phase 3: Security Hardening 

### : Comprehensive Security Implementation

#### Task 3.1: Secure Document Sharing
- **Duration:** 
- **Implementation:** RLS policies for anonymous share access

#### Task 3.2: Rate Limiting
- **Duration:** 
- **Implementation:** Share link brute force protection

#### Task 3.3: Security Audit
- **Duration:** 
- **Implementation:** Third-party security review

**Success Metrics:**
- [ ] Zero security vulnerabilities
- [ ] Share links tamper-proof
- [ ] Rate limiting working

---

## Phase 4: Proof-of-Time System

### : Trusted Timestamps (Phase 1)

#### Task 4.1: Implement Timestamp Proofs
- **Duration:** 
- **Implementation:** Database tables + HMAC signatures

#### Task 4.2: Verification System
- **Duration:** 
- **Implementation:** Frontend verification UI

### : Merkle Tree Batching (Phase 2)

#### Task 4.3: Merkle Tree Implementation
- **Duration:** 
- **Implementation:** Edge Function + hourly batching

**Success Metrics:**
- [ ] Timestamp proofs for all documents
- [ ] Verification working
- [ ] Merkle tree batches generated hourly

---

## Phase 5: Advanced Features 

### : Polish & Optimization

#### Task 5.1: CDN Integration

#### Task 5.2: Monitoring & Observability
-
#### Task 5.3: Performance Testing


---

## Testing Strategy

### Unit Testing
- All new functions have >= 80% code coverage
- Database functions tested with pgTAP

### Integration Testing
- End-to-end upload flow
- Search functionality
- Pagination and infinite scroll
- Realtime updates

### Performance Testing
- Load test with 1000 concurrent users
- Stress test document uploads
- Database query performance

### Security Testing
- SQL injection attempts
- XSS testing
- Share link security
- RLS policy validation

---

## Rollback Plans

### Immediate Rollback (< 5 minutes)
- Feature flags for all major changes
- Database migrations are reversible
- Edge Functions can be un-deployed

### Partial Rollback
- Each phase can be rolled back independently
- Old code paths maintained for 30 days

### Emergency Procedures
- On-call engineer for first 48 hours post-deployment
- Automated monitoring alerts
- Rollback playbook documented

---

## Success Metrics

### Performance Metrics
- Page load time: < 500ms (from 5s)
- Search response: < 20ms (from 800ms)
- Upload processing: < 5s (from 30s)
- Thumbnail generation: < 3s

### Cost Metrics
- Storage egress: -90% ($675 → $67/mo)
- Database compute: -25% ($200 → $150/mo)
- Realtime connections: -60% ($20 → $8/mo)
- **Total savings: $670/month**

### Reliability Metrics
- Uptime: > 99.9%
- Error rate: < 0.1%
- Duplicate detection: 100% accuracy
- Audit log coverage: 100%

### Security Metrics
- Zero SQL injection vulnerabilities
- Zero XSS vulnerabilities
- 100% signed URLs (no public fallbacks)
- Complete audit trail

---

## Resource Requirements

### Development Team
- 1 Senior Full-Stack Developer (12 weeks)
- 1 Mid-Level Developer (8 weeks)
- 1 Database Specialist (4 weeks)
- 1 DevOps Engineer (2 weeks)

### Infrastructure
- Supabase Pro plan: $25/month
- Additional storage: ~$50/month
- Edge Function compute: ~$20/month
- Monitoring tools: $50/month

### Total Budget
- Development: ~$40,000 (12 weeks × $3,333/week)
- Infrastructure: ~$145/month ongoing
- ROI: Payback in 2 months from cost savings

---

## Appendix A: Migration Checklist

- [ ] All migrations tested in staging
- [ ] Rollback scripts prepared
- [ ] Database backups verified
- [ ] RLS policies reviewed
- [ ] Performance benchmarks recorded

## Appendix B: Deployment Schedule

**Week 1-2:** Deploy to staging, test Phase 1
**Week 3:** Deploy Phase 1 to production
**Week 4-5:** Deploy Phase 2 to staging
**Week 6:** Deploy Phase 2 to production
**Week 7-8:** Deploy Phase 3 & 4 to staging
**Week 9:** Deploy Phase 3 & 4 to production
**Week 10-12:** Final testing and Phase 5

## Appendix C: Contact Information

**Project Manager:** [Name]
**Technical Lead:** [Name]
**Database Admin:** [Name]
**DevOps Lead:** [Name]

---

**Document Version:** 1.0
**Last Updated:** October 4, 2025
**Next Review:** After Phase 1 completion
