import { supabase } from '../lib/supabase';

export interface MerkleBatch {
  id: string;
  batchTimestamp: string;
  rootHash: string;
  leafCount: number;
  treeHeight: number;
  batchSignature: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface MerkleLeaf {
  id: string;
  batchId: string;
  documentId: string;
  leafHash: string;
  leafIndex: number;
  proofPath: ProofPathElement[];
  timestampProofId: string | null;
  createdAt: string;
}

export interface ProofPathElement {
  hash: string;
  position: 'left' | 'right';
}

export interface MerkleVerificationResult {
  valid: boolean;
  batchId?: string;
  batchTimestamp?: string;
  rootHash?: string;
  leafCount?: number;
  leafIndex?: number;
  computedRoot?: string;
  message: string;
  error?: string;
}

export interface BatchStatistics {
  totalBatches: number;
  totalDocumentsBatched: number;
  averageBatchSize: number;
  latestBatchTimestamp: string | null;
}

export async function createMerkleBatch(
  documentIds: string[],
  metadata?: Record<string, any>
): Promise<{ data: string | null; error: string | null }> {
  try {
    if (documentIds.length === 0) {
      return { data: null, error: 'No documents provided for batch' };
    }

    const { data, error } = await supabase.rpc('create_merkle_batch', {
      p_document_ids: documentIds,
      p_metadata: metadata || {},
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as string, error: null };
  } catch (error) {
    console.error('Error creating Merkle batch:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getMerkleBatch(batchId: string): Promise<{ data: MerkleBatch | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('merkle_tree_batches')
      .select('*')
      .eq('id', batchId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: data.id,
        batchTimestamp: data.batch_timestamp,
        rootHash: data.root_hash,
        leafCount: data.leaf_count,
        treeHeight: data.tree_height,
        batchSignature: data.batch_signature,
        metadata: data.metadata,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching Merkle batch:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getDocumentMerkleLeaf(
  documentId: string
): Promise<{ data: MerkleLeaf | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('merkle_tree_leaves')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: data.id,
        batchId: data.batch_id,
        documentId: data.document_id,
        leafHash: data.leaf_hash,
        leafIndex: data.leaf_index,
        proofPath: data.proof_path as ProofPathElement[],
        timestampProofId: data.timestamp_proof_id,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching Merkle leaf:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyMerkleProof(
  documentId: string,
  currentHash: string
): Promise<{ data: MerkleVerificationResult | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('verify_merkle_proof', {
      p_document_id: documentId,
      p_current_hash: currentHash,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as MerkleVerificationResult, error: null };
  } catch (error) {
    console.error('Error verifying Merkle proof:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getBatchDocuments(
  batchId: string
): Promise<{
  data: Array<{
    documentId: string;
    fileName: string;
    leafHash: string;
    leafIndex: number;
    proofPath: ProofPathElement[];
  }> | null;
  error: string | null;
}> {
  try {
    const { data, error } = await supabase.rpc('get_batch_documents', {
      p_batch_id: batchId,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    const documents = (data || []).map((doc: any) => ({
      documentId: doc.document_id,
      fileName: doc.file_name,
      leafHash: doc.leaf_hash,
      leafIndex: doc.leaf_index,
      proofPath: doc.proof_path as ProofPathElement[],
    }));

    return { data: documents, error: null };
  } catch (error) {
    console.error('Error fetching batch documents:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getBatchStatistics(): Promise<{ data: BatchStatistics | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_batch_statistics');

    if (error) {
      return { data: null, error: error.message };
    }

    return {
      data: {
        totalBatches: data.total_batches,
        totalDocumentsBatched: data.total_documents_batched,
        averageBatchSize: data.average_batch_size,
        latestBatchTimestamp: data.latest_batch_timestamp,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getRecentBatches(limit: number = 10): Promise<{ data: MerkleBatch[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('merkle_tree_batches')
      .select('*')
      .order('batch_timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    const batches: MerkleBatch[] = (data || []).map((batch: any) => ({
      id: batch.id,
      batchTimestamp: batch.batch_timestamp,
      rootHash: batch.root_hash,
      leafCount: batch.leaf_count,
      treeHeight: batch.tree_height,
      batchSignature: batch.batch_signature,
      metadata: batch.metadata,
      createdAt: batch.created_at,
    }));

    return { data: batches, error: null };
  } catch (error) {
    console.error('Error fetching recent batches:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function calculateMerkleRoot(leafHashes: string[]): string {
  if (leafHashes.length === 0) {
    throw new Error('Cannot calculate Merkle root with no leaves');
  }

  let currentLevel = [...leafHashes];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

      const combined = left + right;
      const hash = hashString(combined);
      nextLevel.push(hash);
    }

    currentLevel = nextLevel;
  }

  return currentLevel[0];
}

export function verifyMerkleProofPath(leafHash: string, proofPath: ProofPathElement[], rootHash: string): boolean {
  let computedHash = leafHash;

  for (const element of proofPath) {
    if (element.position === 'left') {
      computedHash = hashString(element.hash + computedHash);
    } else {
      computedHash = hashString(computedHash + element.hash);
    }
  }

  return computedHash === rootHash;
}

function hashString(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export function formatBatchTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

export function getBatchStatus(batch: MerkleBatch): 'active' | 'complete' | 'verified' {
  const age = Date.now() - new Date(batch.batchTimestamp).getTime();
  const oneHour = 60 * 60 * 1000;

  if (age < oneHour) {
    return 'active';
  }

  return 'complete';
}

export async function createBatchForPendingDocuments(
  maxBatchSize: number = 100
): Promise<{ data: string | null; error: string | null }> {
  try {
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id')
      .not('id', 'in', supabase.from('merkle_tree_leaves').select('document_id'))
      .limit(maxBatchSize);

    if (fetchError) {
      return { data: null, error: fetchError.message };
    }

    if (!documents || documents.length === 0) {
      return { data: null, error: 'No pending documents to batch' };
    }

    const documentIds = documents.map((doc) => doc.id);

    return await createMerkleBatch(documentIds, {
      trigger: 'auto_batch',
      documentCount: documentIds.length,
      createdBy: 'system',
    });
  } catch (error) {
    console.error('Error creating batch for pending documents:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
