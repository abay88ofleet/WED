import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, Link2, AlertTriangle, Layers } from 'lucide-react';
import {
  getDocumentTimestampProof,
  verifyDocumentIntegrity,
  getProofChain,
  formatProofTimestamp,
  verifyDocumentWithBatch,
  getDocumentProofInfo,
  type TimestampProof,
  type ProofVerificationResult
} from '../services/timestampService';
import { getDocumentMerkleLeaf } from '../services/merkleTreeService';
import { MerkleBatchViewer } from './MerkleBatchViewer';

interface TimestampProofVerificationProps {
  documentId: string;
  documentHash: string;
}

export default function TimestampProofVerification({ documentId, documentHash }: TimestampProofVerificationProps) {
  const [proof, setProof] = useState<TimestampProof | null>(null);
  const [proofChain, setProofChain] = useState<TimestampProof[]>([]);
  const [verificationResult, setVerificationResult] = useState<ProofVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showChain, setShowChain] = useState(false);
  const [proofInfo, setProofInfo] = useState<any>(null);
  const [showBatchViewer, setShowBatchViewer] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    loadProof();
  }, [documentId]);

  async function loadProof() {
    setLoading(true);
    try {
      const { data, error } = await getDocumentTimestampProof(documentId);
      if (error) {
        console.error('Error loading timestamp proof:', error);
      } else {
        setProof(data);
      }

      const chainResult = await getProofChain(documentId);
      if (!chainResult.error && chainResult.data) {
        setProofChain(chainResult.data);
      }

      const { data: info } = await getDocumentProofInfo(documentId);
      setProofInfo(info);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    try {
      const { data, error, proofType } = await verifyDocumentWithBatch(documentId, documentHash);
      if (error) {
        console.error('Error verifying document:', error);
      } else {
        setVerificationResult(data as ProofVerificationResult);
      }
    } finally {
      setVerifying(false);
    }
  }

  function handleViewBatch(batchId: string) {
    setSelectedBatchId(batchId);
    setShowBatchViewer(true);
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-400 animate-pulse" />
          <h3 className="text-lg font-semibold text-gray-900">Timestamp Proof</h3>
        </div>
        <p className="text-sm text-gray-500">Loading proof data...</p>
      </div>
    );
  }

  if (!proof && !proofInfo?.hasMerkleProof) {
    return (
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">No Proof Available</h3>
        </div>
        <p className="text-sm text-yellow-700">
          This document does not have a timestamp or batch proof. Proofs are automatically created on upload.
        </p>
      </div>
    );
  }

  return (
    <>
      {showBatchViewer && selectedBatchId && (
        <MerkleBatchViewer batchId={selectedBatchId} onClose={() => setShowBatchViewer(false)} />
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {proofInfo?.hasMerkleProof ? 'Merkle Batch Proof' : 'Trusted Timestamp Proof'}
              </h3>
            </div>
          {proof.previousProofHash && (
            <button
              onClick={() => setShowChain(!showChain)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Link2 className="w-4 h-4" />
              {showChain ? 'Hide' : 'Show'} Proof Chain
            </button>
          )}
        </div>

        {proofInfo?.hasMerkleProof && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Merkle Tree Batch Proof</p>
                  <p className="text-xs text-blue-700">
                    This document is part of a Merkle tree batch (Leaf Index: {proofInfo.leafIndex})
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleViewBatch(proofInfo.merkleBatchId)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                View Batch
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Proof Timestamp</p>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-sm text-gray-900">{formatProofTimestamp(proof.proofTimestamp)}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Chain Status</p>
            <div className="flex items-center gap-2">
              {proof.previousProofHash ? (
                <>
                  <Link2 className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700 font-medium">Chained ({proofChain.length} proofs)</p>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-blue-600" />
                  <p className="text-sm text-blue-700 font-medium">Genesis Proof</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3 mb-4">
          <p className="text-xs font-medium text-gray-500 mb-1">Document Hash (SHA-256)</p>
          <p className="text-xs font-mono text-gray-700 break-all">{proof.proofHash}</p>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">HMAC Signature</p>
          <p className="text-xs font-mono text-gray-700 break-all">{proof.hmacSignature}</p>
        </div>
      </div>

      {showChain && proofChain.length > 0 && (
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Proof Chain History</h4>
          <div className="space-y-2">
            {proofChain.map((chainProof, index) => (
              <div key={chainProof.id} className="bg-white rounded p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">Proof {proofChain.length - index}</span>
                  <span className="text-xs text-gray-400">{formatProofTimestamp(chainProof.proofTimestamp)}</span>
                </div>
                <p className="text-xs font-mono text-gray-600 break-all">{chainProof.proofHash}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6">
        {!verificationResult ? (
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Shield className="w-5 h-5" />
            {verifying ? 'Verifying...' : 'Verify Document Integrity'}
          </button>
        ) : (
          <div className={`rounded-lg p-4 ${verificationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {verificationResult.valid ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-green-900">Document Integrity Verified</h4>
                    <p className="text-sm text-green-700">{verificationResult.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900">Verification Failed</h4>
                    <p className="text-sm text-red-700">{verificationResult.message}</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Verify Again
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
