import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Clock, Hash, FileText, Shield } from 'lucide-react';
import {
  getMerkleBatch,
  getBatchDocuments,
  MerkleBatch,
  formatBatchTimestamp,
  getBatchStatus,
} from '../services/merkleTreeService';

interface MerkleBatchViewerProps {
  batchId: string;
  onClose: () => void;
}

export function MerkleBatchViewer({ batchId, onClose }: MerkleBatchViewerProps) {
  const [batch, setBatch] = useState<MerkleBatch | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    documents: true,
    proofPath: false,
  });

  useEffect(() => {
    loadBatchData();
  }, [batchId]);

  async function loadBatchData() {
    try {
      setLoading(true);
      setError(null);

      const { data: batchData, error: batchError } = await getMerkleBatch(batchId);
      if (batchError) throw new Error(batchError);

      const { data: docsData, error: docsError } = await getBatchDocuments(batchId);
      if (docsError) throw new Error(docsError);

      setBatch(batchData);
      setDocuments(docsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load batch data');
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(section: keyof typeof expandedSections) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-xl font-semibold">Error Loading Batch</h2>
          </div>
          <p className="text-gray-700 mb-6">{error || 'Batch not found'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const status = getBatchStatus(batch);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Merkle Batch Proof</h2>
              <p className="text-sm text-gray-500">Batch ID: {batchId.slice(0, 8)}...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-6 ${
            status === 'active'
              ? 'bg-green-100 text-green-800'
              : status === 'complete'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          {status === 'active' ? 'Active Batch' : status === 'complete' ? 'Complete' : 'Verified'}
        </div>

        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <button
              onClick={() => toggleSection('details')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.details ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <h3 className="text-lg font-semibold text-gray-900">Batch Details</h3>
            </button>

            {expandedSections.details && (
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Timestamp</p>
                    <p className="text-sm text-gray-600">{formatBatchTimestamp(batch.batchTimestamp)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Root Hash</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded mt-1">
                      {batch.rootHash}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documents in Batch</p>
                    <p className="text-sm text-gray-600">{batch.leafCount} documents</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Tree Height</p>
                    <p className="text-sm text-gray-600">{batch.treeHeight} levels</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Batch Signature</p>
                    <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded mt-1">
                      {batch.batchSignature}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-b border-gray-200 pb-4">
            <button
              onClick={() => toggleSection('documents')}
              className="flex items-center gap-2 w-full text-left"
            >
              {expandedSections.documents ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              <h3 className="text-lg font-semibold text-gray-900">Documents ({documents.length})</h3>
            </button>

            {expandedSections.documents && (
              <div className="mt-4 space-y-2">
                {documents.map((doc, index) => (
                  <div key={doc.documentId} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {doc.leafIndex}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500 font-mono">{doc.leafHash.slice(0, 32)}...</p>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {batch.metadata && Object.keys(batch.metadata).length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Additional Metadata</h4>
              <div className="space-y-1">
                {Object.entries(batch.metadata).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="text-gray-900 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
