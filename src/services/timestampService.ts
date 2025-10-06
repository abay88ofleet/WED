import { supabase } from '../lib/supabase';
import { verifyMerkleProof, getDocumentMerkleLeaf, MerkleVerificationResult } from './merkleTreeService';

export interface TimestampProof {
  id: string;
  documentId: string;
  proofHash: string;
  proofTimestamp: string;
  hmacSignature: string;
  previousProofHash: string | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface ProofVerificationResult {
  valid: boolean;
  proofHash: string;
  currentHash: string;
  proofTimestamp: string;
  hmacSignature: string;
  hasChain: boolean;
  message: string;
  error?: string;
}

export interface VerificationLog {
  id: string;
  timestampProofId: string;
  verifiedAt: string;
  verifiedBy: string | null;
  verificationResult: boolean;
  verificationMethod: string;
  details: Record<string, any>;
}

export async function getDocumentTimestampProof(documentId: string): Promise<{ data: TimestampProof | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('timestamp_proofs')
      .select('*')
      .eq('document_id', documentId)
      .order('proof_timestamp', { ascending: false })
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
        documentId: data.document_id,
        proofHash: data.proof_hash,
        proofTimestamp: data.proof_timestamp,
        hmacSignature: data.hmac_signature,
        previousProofHash: data.previous_proof_hash,
        metadata: data.metadata,
        createdAt: data.created_at,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching timestamp proof:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getProofChain(documentId: string): Promise<{ data: TimestampProof[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('get_proof_chain', {
      p_document_id: documentId,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const proofs: TimestampProof[] = data.map((proof: any) => ({
      id: proof.proof_id,
      documentId: documentId,
      proofHash: proof.proof_hash,
      proofTimestamp: proof.proof_timestamp,
      hmacSignature: proof.hmac_signature,
      previousProofHash: proof.previous_proof_hash,
      metadata: proof.metadata,
      createdAt: proof.proof_timestamp,
    }));

    return { data: proofs, error: null };
  } catch (error) {
    console.error('Error fetching proof chain:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function verifyDocumentIntegrity(
  proofId: string,
  currentDocumentHash: string
): Promise<{ data: ProofVerificationResult | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('verify_timestamp_proof', {
      p_proof_id: proofId,
      p_current_document_hash: currentDocumentHash,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as ProofVerificationResult, error: null };
  } catch (error) {
    console.error('Error verifying document integrity:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getVerificationLogs(proofId: string): Promise<{ data: VerificationLog[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('proof_verification_logs')
      .select('*')
      .eq('timestamp_proof_id', proofId)
      .order('verified_at', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    const logs: VerificationLog[] = (data || []).map((log: any) => ({
      id: log.id,
      timestampProofId: log.timestamp_proof_id,
      verifiedAt: log.verified_at,
      verifiedBy: log.verified_by,
      verificationResult: log.verification_result,
      verificationMethod: log.verification_method,
      details: log.details,
    }));

    return { data: logs, error: null };
  } catch (error) {
    console.error('Error fetching verification logs:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function createManualTimestampProof(
  documentId: string,
  proofHash: string,
  metadata?: Record<string, any>
): Promise<{ data: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase.rpc('create_timestamp_proof', {
      p_document_id: documentId,
      p_proof_hash: proofHash,
      p_metadata: metadata || {},
    });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as string, error: null };
  } catch (error) {
    console.error('Error creating timestamp proof:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export function formatProofTimestamp(timestamp: string): string {
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

export function getProofStatus(proof: TimestampProof): 'verified' | 'pending' | 'chained' {
  if (proof.previousProofHash) {
    return 'chained';
  }
  return 'verified';
}

export async function generateDocumentHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyDocumentWithBatch(
  documentId: string,
  currentDocumentHash: string
): Promise<{ data: MerkleVerificationResult | ProofVerificationResult | null; error: string | null; proofType: 'merkle' | 'timestamp' | null }> {
  try {
    const { data: merkleLeaf } = await getDocumentMerkleLeaf(documentId);

    if (merkleLeaf) {
      const { data: merkleResult, error: merkleError } = await verifyMerkleProof(documentId, currentDocumentHash);

      if (merkleError) {
        return { data: null, error: merkleError, proofType: null };
      }

      return { data: merkleResult, error: null, proofType: 'merkle' };
    }

    const { data: timestampProof } = await getDocumentTimestampProof(documentId);

    if (timestampProof) {
      const { data: timestampResult, error: timestampError } = await verifyDocumentIntegrity(
        timestampProof.id,
        currentDocumentHash
      );

      if (timestampError) {
        return { data: null, error: timestampError, proofType: null };
      }

      return { data: timestampResult, error: null, proofType: 'timestamp' };
    }

    return { data: null, error: 'No proof found for document', proofType: null };
  } catch (error) {
    console.error('Error verifying document:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error', proofType: null };
  }
}

export async function getDocumentProofInfo(documentId: string): Promise<{
  data: {
    hasTimestampProof: boolean;
    hasMerkleProof: boolean;
    timestampProofId?: string;
    timestampProofDate?: string;
    merkleBatchId?: string;
    merkleBatchDate?: string;
    leafIndex?: number;
  } | null;
  error: string | null;
}> {
  try {
    const { data: timestampProof } = await getDocumentTimestampProof(documentId);
    const { data: merkleLeaf } = await getDocumentMerkleLeaf(documentId);

    const proofInfo = {
      hasTimestampProof: !!timestampProof,
      hasMerkleProof: !!merkleLeaf,
      timestampProofId: timestampProof?.id,
      timestampProofDate: timestampProof?.proofTimestamp,
      merkleBatchId: merkleLeaf?.batchId,
      merkleBatchDate: merkleLeaf?.createdAt,
      leafIndex: merkleLeaf?.leafIndex,
    };

    return { data: proofInfo, error: null };
  } catch (error) {
    console.error('Error fetching document proof info:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
