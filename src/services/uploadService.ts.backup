import { supabase } from '../lib/supabase';
import {
  validateFile,
  validateFileMetadataOnServer,
  sanitizeFileName,
  detectSuspiciousContent
} from './securityValidationService';
import { logSecurityEvent, SECURITY_EVENTS } from './securityAuditService';
import { createMerkleBatch } from './merkleTreeService';

export interface AutoTagResult {
  tags: string[];
  keywords: string[];
}

export interface UploadMetadata {
  fileType: string;
  fileSize: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  pageCount?: number;
  wordCount?: number;
  createdDate?: string;
  modifiedDate?: string;
  author?: string;
  title?: string;
  subject?: string;
}

async function extractTextFromFile(file: File): Promise<string> {
  const type = file.type;

  if (type === 'application/pdf') {
    return await extractTextFromPDF(file);
  } else if (type.includes('word') || type.includes('document')) {
    return await extractTextFromWord(file);
  } else if (type === 'text/plain') {
    return await file.text();
  }

  return '';
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 20);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + ' ';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return '';
  }
}

async function extractTextFromWord(file: File): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word:', error);
    return '';
  }
}

function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
    'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
    'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
    'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
    'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
    'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
    'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did',
    'may', 'should', 'could', 'would', 'page', 'document', 'file'
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordFrequency: { [key: string]: number } = {};
  words.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  const sortedWords = Object.entries(wordFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15)
    .map(([word]) => word);

  return sortedWords;
}

function generateAutoTags(file: File, text: string, keywords: string[]): string[] {
  const tags: string[] = [];

  const fileType = file.type.toLowerCase();
  if (fileType.includes('pdf')) tags.push('PDF');
  else if (fileType.includes('word') || fileType.includes('document')) tags.push('Document');
  else if (fileType.includes('spreadsheet') || fileType.includes('excel')) tags.push('Spreadsheet');
  else if (fileType.includes('presentation') || fileType.includes('powerpoint')) tags.push('Presentation');
  else if (fileType.includes('image')) tags.push('Image');
  else if (fileType.includes('video')) tags.push('Video');
  else if (fileType.includes('audio')) tags.push('Audio');

  const sizeInMB = file.size / (1024 * 1024);
  if (sizeInMB < 1) tags.push('Small');
  else if (sizeInMB < 10) tags.push('Medium');
  else tags.push('Large');

  const fileName = file.name.toLowerCase();
  if (fileName.includes('report')) tags.push('Report');
  if (fileName.includes('invoice')) tags.push('Invoice');
  if (fileName.includes('contract')) tags.push('Contract');
  if (fileName.includes('proposal')) tags.push('Proposal');
  if (fileName.includes('presentation')) tags.push('Presentation');
  if (fileName.includes('financial') || fileName.includes('finance')) tags.push('Financial');
  if (fileName.includes('legal')) tags.push('Legal');
  if (fileName.includes('hr') || fileName.includes('human-resource')) tags.push('HR');
  if (fileName.includes('marketing')) tags.push('Marketing');
  if (fileName.includes('sales')) tags.push('Sales');

  const textLower = text.toLowerCase();
  const contentKeywords = [
    { term: 'confidential', tag: 'Confidential' },
    { term: 'draft', tag: 'Draft' },
    { term: 'final', tag: 'Final' },
    { term: 'urgent', tag: 'Urgent' },
    { term: 'quarterly', tag: 'Quarterly' },
    { term: 'annual', tag: 'Annual' },
    { term: 'monthly', tag: 'Monthly' },
    { term: 'budget', tag: 'Budget' },
    { term: 'strategy', tag: 'Strategy' },
    { term: 'analysis', tag: 'Analysis' },
    { term: 'summary', tag: 'Summary' },
    { term: 'guideline', tag: 'Guidelines' },
    { term: 'policy', tag: 'Policy' },
    { term: 'procedure', tag: 'Procedure' },
  ];

  contentKeywords.forEach(({ term, tag }) => {
    if (textLower.includes(term) && !tags.includes(tag)) {
      tags.push(tag);
    }
  });

  const topKeywords = keywords.slice(0, 5).map(k =>
    k.charAt(0).toUpperCase() + k.slice(1)
  );

  topKeywords.forEach(keyword => {
    if (!tags.includes(keyword) && tags.length < 10) {
      tags.push(keyword);
    }
  });

  const year = new Date().getFullYear();
  const month = new Date().toLocaleString('default', { month: 'long' });
  if (fileName.includes(year.toString())) tags.push(year.toString());
  if (fileName.includes(month.toLowerCase())) tags.push(month);

  return [...new Set(tags)].slice(0, 10);
}

export async function extractMetadataAndTags(file: File): Promise<{
  metadata: UploadMetadata;
  autoTags: string[];
  keywords: string[];
  ocrText: string;
}> {
  const clientValidation = validateFile(file);
  if (!clientValidation.valid) {
    await logSecurityEvent({
      action: SECURITY_EVENTS.VALIDATION_FAILED,
      resourceType: 'file',
      resourceId: file.name,
      severity: 'warning',
      metadata: {
        error: clientValidation.error,
        message: clientValidation.message,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    throw new Error(clientValidation.message || 'File validation failed');
  }

  const serverValidation = await validateFileMetadataOnServer(
    file.size,
    file.type,
    file.name
  );

  if (!serverValidation.valid) {
    await logSecurityEvent({
      action: SECURITY_EVENTS.VALIDATION_FAILED,
      resourceType: 'file',
      resourceId: file.name,
      severity: 'warning',
      metadata: {
        error: serverValidation.error,
        message: serverValidation.message,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });

    throw new Error(serverValidation.message || 'File validation failed');
  }

  const metadata: UploadMetadata = {
    fileType: file.type || 'application/octet-stream',
    fileSize: file.size,
    mimeType: file.type,
    modifiedDate: new Date(file.lastModified).toISOString(),
  };

  let extractedText = '';
  let keywords: string[] = [];
  let autoTags: string[] = [];

  if (file.type.startsWith('image/')) {
    try {
      const img = await createImageBitmap(file);
      metadata.dimensions = {
        width: img.width,
        height: img.height,
      };
      img.close();
    } catch (error) {
      console.error('Error extracting image metadata:', error);
    }
  }

  if (file.type === 'application/pdf' || file.type.includes('word') || file.type.includes('text')) {
    extractedText = await extractTextFromFile(file);

    if (extractedText) {
      if (detectSuspiciousContent(extractedText)) {
        await logSecurityEvent({
          action: SECURITY_EVENTS.MALICIOUS_CONTENT_DETECTED,
          resourceType: 'file',
          resourceId: file.name,
          severity: 'critical',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            reason: 'Suspicious content detected in text extraction',
          },
        });

        throw new Error('File contains potentially malicious content');
      }

      const words = extractedText.split(/\s+/).length;
      metadata.wordCount = words;

      keywords = extractKeywords(extractedText);
    }
  }

  autoTags = generateAutoTags(file, extractedText, keywords);

  return {
    metadata,
    autoTags,
    keywords,
    ocrText: extractedText,
  };
}

export async function generateFileHash(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generating file hash:', error);
    throw new Error('Failed to generate file hash');
  }
}

// Import the fixed version from the fixed file
export { checkDuplicateFile } from './uploadService.fixed';

export async function createBatchProofForDocuments(documentIds: string[]): Promise<{ batchId: string | null; error: string | null }> {
  try {
    const { data: batchId, error } = await createMerkleBatch(documentIds, {
      trigger: 'manual_batch',
      documentCount: documentIds.length,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error creating batch proof:', error);
      return { batchId: null, error };
    }

    return { batchId, error: null };
  } catch (error) {
    console.error('Error creating batch proof:', error);
    return { batchId: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function scheduleAutoBatchProof(checkIntervalMs: number = 5 * 60 * 1000): Promise<void> {
  const MIN_BATCH_SIZE = 10;
  const MAX_BATCH_SIZE = 100;

  const checkAndBatch = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) return;

      const { data: batchedDocIds, error: batchedError } = await supabase
        .from('merkle_tree_leaves')
        .select('document_id');

      if (batchedError) {
        console.error('Error fetching batched documents:', batchedError);
        return;
      }

      const batchedIds = (batchedDocIds || []).map(item => item.document_id);

      let query = supabase
        .from('documents')
        .select('id')
        .limit(MAX_BATCH_SIZE);

      if (batchedIds.length > 0) {
        query = query.not('id', 'in', `(${batchedIds.join(',')})`);
      }

      const { data: unbatchedDocs, error } = await query;

      if (error) {
        console.error('Error fetching unbatched documents:', error);
        return;
      }

      if (unbatchedDocs && unbatchedDocs.length >= MIN_BATCH_SIZE) {
        const docIds = unbatchedDocs.map((doc) => doc.id);
        await createBatchProofForDocuments(docIds);
        console.log(`Auto-batched ${docIds.length} documents`);
      }
    } catch (error) {
      console.error('Error in auto-batch scheduler:', error);
    }
  };

  checkAndBatch();
  setInterval(checkAndBatch, checkIntervalMs);
}
