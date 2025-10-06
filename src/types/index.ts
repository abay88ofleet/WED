export interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  categoryId: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: Date;
  updatedAt: Date;
  thumbnailUrl?: string;
  fileUrl?: string;
  isFavorite: boolean;
  downloadCount: number;
  viewCount: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  parentId: string | null;
  documentCount: number;
  color: string;
  isPinned?: boolean;
  sortOrder?: number;
  updatedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'user';
}

export type ViewMode = 'list' | 'grid';

export type SortBy = 'name' | 'date' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  categoryId: string | null;
  fileTypes: string[];
  tags: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: SortBy;
  sortOrder: SortOrder;
}

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
