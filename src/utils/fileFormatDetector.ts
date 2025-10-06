export type DocumentFormat =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'tiff'
  | 'video'
  | 'audio'
  | 'cad'
  | 'unsupported';

export interface FormatInfo {
  format: DocumentFormat;
  mimeType: string;
  canPreview: boolean;
  category: string;
}

const FORMAT_MAP: Record<string, FormatInfo> = {
  'pdf': {
    format: 'pdf',
    mimeType: 'application/pdf',
    canPreview: true,
    category: 'document',
  },
  'doc': {
    format: 'word',
    mimeType: 'application/msword',
    canPreview: true,
    category: 'document',
  },
  'docx': {
    format: 'word',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    canPreview: true,
    category: 'document',
  },
  'xls': {
    format: 'excel',
    mimeType: 'application/vnd.ms-excel',
    canPreview: true,
    category: 'spreadsheet',
  },
  'xlsx': {
    format: 'excel',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    canPreview: true,
    category: 'spreadsheet',
  },
  'ppt': {
    format: 'powerpoint',
    mimeType: 'application/vnd.ms-powerpoint',
    canPreview: false,
    category: 'presentation',
  },
  'pptx': {
    format: 'powerpoint',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    canPreview: false,
    category: 'presentation',
  },
  'jpg': {
    format: 'image',
    mimeType: 'image/jpeg',
    canPreview: true,
    category: 'image',
  },
  'jpeg': {
    format: 'image',
    mimeType: 'image/jpeg',
    canPreview: true,
    category: 'image',
  },
  'png': {
    format: 'image',
    mimeType: 'image/png',
    canPreview: true,
    category: 'image',
  },
  'gif': {
    format: 'image',
    mimeType: 'image/gif',
    canPreview: true,
    category: 'image',
  },
  'bmp': {
    format: 'image',
    mimeType: 'image/bmp',
    canPreview: true,
    category: 'image',
  },
  'webp': {
    format: 'image',
    mimeType: 'image/webp',
    canPreview: true,
    category: 'image',
  },
  'svg': {
    format: 'image',
    mimeType: 'image/svg+xml',
    canPreview: true,
    category: 'image',
  },
  'tiff': {
    format: 'tiff',
    mimeType: 'image/tiff',
    canPreview: true,
    category: 'image',
  },
  'tif': {
    format: 'tiff',
    mimeType: 'image/tiff',
    canPreview: true,
    category: 'image',
  },
  'mp4': {
    format: 'video',
    mimeType: 'video/mp4',
    canPreview: true,
    category: 'video',
  },
  'webm': {
    format: 'video',
    mimeType: 'video/webm',
    canPreview: true,
    category: 'video',
  },
  'ogg': {
    format: 'video',
    mimeType: 'video/ogg',
    canPreview: true,
    category: 'video',
  },
  'avi': {
    format: 'video',
    mimeType: 'video/x-msvideo',
    canPreview: true,
    category: 'video',
  },
  'mov': {
    format: 'video',
    mimeType: 'video/quicktime',
    canPreview: true,
    category: 'video',
  },
  'mp3': {
    format: 'audio',
    mimeType: 'audio/mpeg',
    canPreview: true,
    category: 'audio',
  },
  'wav': {
    format: 'audio',
    mimeType: 'audio/wav',
    canPreview: true,
    category: 'audio',
  },
  'ogg-audio': {
    format: 'audio',
    mimeType: 'audio/ogg',
    canPreview: true,
    category: 'audio',
  },
  'flac': {
    format: 'audio',
    mimeType: 'audio/flac',
    canPreview: true,
    category: 'audio',
  },
  'aac': {
    format: 'audio',
    mimeType: 'audio/aac',
    canPreview: true,
    category: 'audio',
  },
  'dwg': {
    format: 'cad',
    mimeType: 'application/acad',
    canPreview: false,
    category: 'cad',
  },
  'dxf': {
    format: 'cad',
    mimeType: 'application/dxf',
    canPreview: false,
    category: 'cad',
  },
};

export function detectFileFormat(fileName: string, fileType?: string): FormatInfo {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const formatInfo = FORMAT_MAP[extension];

  if (formatInfo) {
    return formatInfo;
  }

  if (fileType) {
    const foundEntry = Object.values(FORMAT_MAP).find(
      (info) => info.mimeType === fileType.toLowerCase()
    );
    if (foundEntry) {
      return foundEntry;
    }
  }

  return {
    format: 'unsupported',
    mimeType: fileType || 'application/octet-stream',
    canPreview: false,
    category: 'unknown',
  };
}

export function isPreviewSupported(fileName: string, fileType?: string): boolean {
  const formatInfo = detectFileFormat(fileName, fileType);
  return formatInfo.canPreview;
}

export function getFormatCategory(fileName: string, fileType?: string): string {
  const formatInfo = detectFileFormat(fileName, fileType);
  return formatInfo.category;
}
